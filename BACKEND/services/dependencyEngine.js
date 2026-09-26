/**
 * dependencyEngine.js
 *
 * After any clearance step is approved, this engine checks if any
 * currently 'locked' steps for the same request can now be unlocked
 * (i.e., all their dependencies are now 'approved').
 *
 * Also handles updating the overall NoDuesRequest status.
 */

const ClearanceStep = require('../models/ClearanceStep');
const NoDuesRequest = require('../models/NoDuesRequest');
const StepActionLog = require('../models/StepActionLog');

/**
 * Checks locked steps for a request and unlocks any whose dependencies are all approved.
 * Should be called immediately after a step is approved.
 *
 * @param {string|ObjectId} requestId
 * @returns {Promise<string[]>} - list of unitCodes that were unlocked
 */
async function unlockDependents(requestId) {
    // Get all steps for this request in one query
    const allSteps = await ClearanceStep.find({ requestId });

    // Build a quick lookup: unitCode → status
    const statusMap = {};
    for (const step of allSteps) {
        statusMap[step.unitCode] = step.status;
    }

    // Find locked steps whose dependencies are ALL approved
    const stepsToUnlock = allSteps.filter(step => {
        if (step.status !== 'locked') return false;
        return step.dependsOn.every(dep => statusMap[dep] === 'approved');
    });

    if (stepsToUnlock.length === 0) {
        // Nothing to unlock — check if request is fully approved
        await syncRequestStatus(requestId, allSteps);
        return [];
    }

    const unlockedIds = stepsToUnlock.map(s => s._id);
    const unlockedCodes = stepsToUnlock.map(s => s.unitCode);

    // Unlock them all at once
    await ClearanceStep.updateMany(
        { _id: { $in: unlockedIds } },
        { $set: { status: 'pending' } }
    );

    // Log the unlocking events
    const logs = stepsToUnlock.map(step => ({
        stepId: step._id,
        requestId,
        action: 'unlocked',
        actorEmail: 'system',
        actorRole: 'system',
        note: `Unlocked because dependencies satisfied: [${step.dependsOn.join(', ')}]`,
    }));
    await StepActionLog.insertMany(logs);

    // Re-fetch updated steps to sync request status
    const updatedSteps = await ClearanceStep.find({ requestId });
    await syncRequestStatus(requestId, updatedSteps);

    return unlockedCodes;
}

/**
 * Computes and saves the overall NoDuesRequest status based on step statuses.
 *
 * Rules:
 *   - Any step 'rejected'      → 'action_required'
 *   - All steps 'approved'     → 'approved'  (and set completedAt)
 *   - Otherwise               → 'in_progress'
 *
 * @param {string|ObjectId} requestId
 * @param {ClearanceStep[]} [steps] - optionally pass pre-fetched steps
 */
async function syncRequestStatus(requestId, steps) {
    const allSteps = steps || await ClearanceStep.find({ requestId });

    const hasRejected = allSteps.some(s => s.status === 'rejected');
    const allApproved = allSteps.every(s => s.status === 'approved');

    let newStatus;
    const update = {};

    if (hasRejected) {
        newStatus = 'action_required';
    } else if (allApproved) {
        newStatus = 'approved';
        update.completedAt = new Date();
    } else {
        newStatus = 'in_progress';
    }

    update.status = newStatus;
    await NoDuesRequest.findByIdAndUpdate(requestId, { $set: update });

    return newStatus;
}

/**
 * Re-locks any pending or previously-approved steps whose dependencies are
 * no longer fully satisfied.  Should be called after a step is un-approved
 * (rejected from approved, or reset via reapply).
 *
 * Cascades: if re-locking step A causes step B (which depends on A) to also
 * become invalid, B is re-locked too.
 *
 * @param {string|ObjectId} requestId
 * @returns {Promise<string[]>} - list of unitCodes that were re-locked
 */
async function relockDependents(requestId) {
    const allSteps = await ClearanceStep.find({ requestId });

    // Build a mutable status map so we can track cascading locks
    const statusMap = {};
    for (const s of allSteps) {
        statusMap[s.unitCode] = s.status;
    }

    const toRelock = new Set();
    let changed = true;

    // Keep iterating until no more steps need locking (cascade)
    while (changed) {
        changed = false;
        for (const step of allSteps) {
            if (step.status === 'approved') continue; // approved stays approved
            if (step.status === 'locked') continue;   // already locked
            if (step.status === 'rejected') continue; // keep an existing hold (and its reason) — reapply resets it
            if (toRelock.has(step.unitCode)) continue; // already queued
            if (step.dependsOn.length === 0) continue; // no deps, never lock from here

            // If ANY dependency is not approved (pending / locked / rejected / being relocked)
            const depsAllApproved = step.dependsOn.every(
                dep => statusMap[dep] === 'approved' && !toRelock.has(dep)
            );

            if (!depsAllApproved) {
                toRelock.add(step.unitCode);
                statusMap[step.unitCode] = 'locked'; // update map so cascade picks this up
                changed = true;
            }
        }
    }

    if (toRelock.size === 0) return [];

    // Re-lock them in DB
    await ClearanceStep.updateMany(
        { requestId, unitCode: { $in: [...toRelock] } },
        {
            $set: {
                status: 'locked',
                rejectionReason: '',
                rejectionDescription: '',
                rejectedAt: null,
                restartFrom: [],
                actionBy: '',
                actionAt: null,
            }
        }
    );

    // Log re-lock events
    const logs = allSteps
        .filter(s => toRelock.has(s.unitCode))
        .map(s => ({
            stepId: s._id,
            requestId,
            action: 'relocked',
            actorEmail: 'system',
            actorRole: 'system',
            note: `Re-locked because prerequisite(s) are no longer approved: [${s.dependsOn.join(', ')}]`,
        }));

    if (logs.length > 0) await StepActionLog.insertMany(logs);

    return [...toRelock];
}

module.exports = { unlockDependents, relockDependents, syncRequestStatus };
