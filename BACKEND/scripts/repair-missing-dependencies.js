/**
 * One-time repair script: removes dependsOn entries that point to unit codes
 * which have NO step in the same request (e.g. hod_cse waiting on
 * ece_lab_kundan, which only ECE students get). Such steps could never unlock.
 *
 * After fixing a request it runs the dependency engine so any step whose
 * remaining prerequisites are already approved moves to 'pending'.
 *
 * Dry run (default, no writes):  node scripts/repair-missing-dependencies.js
 * Apply changes:                  node scripts/repair-missing-dependencies.js --apply
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const ClearanceStep = require('../models/ClearanceStep');
const NoDuesRequest = require('../models/NoDuesRequest');
const { unlockDependents } = require('../services/dependencyEngine');

const APPLY = process.argv.includes('--apply');

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log(`Connected to MongoDB — ${APPLY ? 'APPLY mode (writing changes)' : 'DRY RUN (no changes)'}\n`);

    const stepsWithDeps = await ClearanceStep.find({ dependsOn: { $exists: true, $not: { $size: 0 } } });

    // Group by request so sibling steps are fetched once per request
    const byRequest = {};
    for (const step of stepsWithDeps) {
        const rid = String(step.requestId);
        (byRequest[rid] = byRequest[rid] || []).push(step);
    }

    let totalFixed = 0;
    const affectedRequests = [];

    for (const [rid, steps] of Object.entries(byRequest)) {
        const siblings = await ClearanceStep.find({ requestId: rid }, 'unitCode');
        const existing = new Set(siblings.map(s => s.unitCode));

        const broken = steps
            .map(step => ({ step, missing: step.dependsOn.filter(dep => !existing.has(dep)) }))
            .filter(x => x.missing.length > 0);
        if (broken.length === 0) continue;

        const request = await NoDuesRequest.findById(rid, 'rollNo branch status');
        console.log(`Request ${rid} (${request?.rollNo || '?'}, ${request?.branch || '?'}, status: ${request?.status || '?'})`);

        for (const { step, missing } of broken) {
            console.log(`  ${step.unitCode} [${step.status}] — removing missing deps: ${missing.join(', ')}`);
            if (APPLY) {
                await ClearanceStep.updateOne({ _id: step._id }, { $pull: { dependsOn: { $in: missing } } });
            }
            totalFixed++;
        }

        if (APPLY) {
            const unlocked = await unlockDependents(rid);
            console.log(`  → dependency engine run; unlocked now: ${unlocked.length ? unlocked.join(', ') : 'none (other prerequisites still pending)'}`);
        }
        affectedRequests.push(rid);
    }

    console.log(`\n${totalFixed} step(s) in ${affectedRequests.length} request(s) ${APPLY ? 'repaired' : 'would be repaired'}.`);
    if (!APPLY && totalFixed > 0) console.log('Re-run with --apply to write these changes.');
    await mongoose.disconnect();
}

run().catch(err => { console.error(err); process.exit(1); });
