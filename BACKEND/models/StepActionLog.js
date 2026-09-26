/**
 * StepActionLog.js — the timeline. One entry per event on a step: created, unlocked, approved,
 * rejected (on hold, with "[reason] details"), reapply / student_replied (with the student's comment
 * and proof files), reopened, relocked. Shown on the student's Track page and in "View details".
 */

const mongoose = require('mongoose');

// Append-only audit trail for every state change on a ClearanceStep.
// Never update a log — only insert new ones.
const stepActionLogSchema = new mongoose.Schema({
    stepId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ClearanceStep',
        required: true,
    },
    requestId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'NoDuesRequest',
        required: true,
    },
    // What happened
    action: {
        type: String,
        enum: [
            'created',          // step first created (by system on request submit)
            'unlocked',         // dependency engine unlocked this step
            'approved',         // staff approved
            'rejected',         // staff rejected
            'student_replied',  // student replied with comment/proof after rejection (reply flow)
            'reapply',          // student submitted global reapply (with optional comment/proof)
            'reopened',         // step moved back to pending (system, after student reply / reapply)
            'relocked',         // step re-locked by dependency engine
        ],
        required: true,
    },
    actorEmail: { type: String, default: 'system' },
    actorRole: {
        type: String,
        enum: ['system', 'staff', 'admin', 'student'],
        default: 'system',
    },
    note: { type: String, default: '' },           // rejection reason or reply comment
    proofUrls: { type: [String], default: [] },    // uploaded proof files (student replies)
    timestamp: { type: Date, default: Date.now },
});

stepActionLogSchema.index({ stepId: 1, timestamp: 1 });
stepActionLogSchema.index({ requestId: 1 });

module.exports = mongoose.model('StepActionLog', stepActionLogSchema);
