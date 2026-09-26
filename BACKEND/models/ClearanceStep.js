/**
 * ClearanceStep.js — one department's part of an application (e.g. Medical, CSE Lab-1, HOD - ECE).
 * status: 'locked' (waiting for prerequisites) → 'pending' → 'approved' or 'rejected' (on hold).
 * dependsOn is fixed when the application is created (from config/workflowConfig.js).
 * restartFrom holds the departments a hold asked to reset; after a reapply it also lists what the
 * re-locked step is still waiting for (see services/dependencyEngine.js).
 */

const mongoose = require('mongoose');

const clearanceStepSchema = new mongoose.Schema(
    {
        requestId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'NoDuesRequest',
            required: true,
        },
        // Approval unit this step belongs to, e.g. "medical", "cse_lab_1", "library_librarian"
        unitCode: { type: String, required: true },
        // Human-readable label shown in UI
        unitLabel: { type: String, required: true },
        // Lab group code (e.g. 'labs_cse_cce') — null for non-lab steps
        unitGroup: { type: String, default: null },

        // ── Status Machine ────────────────────────────────────────────────────────
        // locked   → waiting for dependsOn steps to be approved
        // pending  → ready for department staff to act
        // approved → cleared
        // rejected → department rejected; student must reply before it goes back to pending
        status: {
            type: String,
            enum: ['locked', 'pending', 'approved', 'rejected'],
            default: 'locked',
        },

        // List of unitCodes that must be 'approved' before this step unlocks
        dependsOn: { type: [String], default: [] },

        // ── Staff Action ──────────────────────────────────────────────────────────
        actionBy: { type: String, default: '' },        // staff email
        actionAt: { type: Date },
        rejectionReason: { type: String, default: '' },      // e.g. "Instrument issued"
        rejectionDescription: { type: String, default: '' }, // free-text officer explanation
        rejectedAt: { type: Date },                          // when rejection happened

        // For HOD/NAD/Store/Accounts: which upstream units should reset on reapply
        // e.g. ['cse_lab_1', 'library_librarian'] — chosen by the officer at reject time
        restartFrom: { type: [String], default: [] },

        // ── Student Reply (after rejection) ───────────────────────────────────────
        studentReply: { type: String, default: '' },
        studentProofUrls: { type: [String], default: [] },  // Cloudinary URLs
        repliedAt: { type: Date },
    },
    { timestamps: true }
);

// Fast queries: "all pending steps for unitCode=medical"
clearanceStepSchema.index({ unitCode: 1, status: 1 });
// Fast queries: "all steps for a request"
clearanceStepSchema.index({ requestId: 1 });

module.exports = mongoose.model('ClearanceStep', clearanceStepSchema);
