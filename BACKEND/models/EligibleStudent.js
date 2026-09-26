/**
 * EligibleStudent.js — the admin-managed list of students allowed to apply, plus each student's
 * profile (contact, hostel, placement, library, club/fest role, bank/refund details) and the
 * Cloudinary URLs of their uploaded documents. Only students on this list can sign in.
 */

const mongoose = require('mongoose');

const eligibleStudentSchema = new mongoose.Schema(
    {
        // ── Identity (Static - set by admin, not editable by student) ──────────
        name: { type: String, required: true, trim: true },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        rollNo: { type: String, required: true, unique: true, trim: true },
        // CSE | ECE | MECH | CCE  — determines HOD and lab dependencies
        branch: { type: String, required: true, uppercase: true, trim: true },
        graduation: { type: String, trim: true }, // "UG" or "PG" — derived from rollNo
        addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

        // ── Student Profile (filled by student during profile completion) ──────
        profileCompleted: { type: Boolean, default: false },
        submittedAt: { type: Date },

        // Personal
        phone: { type: String, trim: true },
        hostel: { type: String, trim: true },

        // Club / Fest Role
        clubRoleType: { type: String, trim: true },
        clubRoleDetail: { type: String, trim: true },
        festRoleDetail: { type: String, trim: true },

        // Placement
        placementStatus: { type: String, trim: true },
        placementDetailsText: { type: String, trim: true },

        // Library / TPC dates
        libraryEmailDate: { type: String },
        tpcEmailDate: { type: String },

        // Bank / Declaration
        accountHolderName: { type: String, trim: true },
        bankAccountNumber: { type: String, trim: true },
        bankName: { type: String, trim: true },
        bankBranch: { type: String, trim: true },
        bankCity: { type: String, trim: true },
        ifscCode: { type: String, uppercase: true, trim: true },
        donationAmount: { type: String, trim: true },
        studentContactNumber: { type: String, trim: true },
        fatherName: { type: String, trim: true },
        fatherMobileNumber: { type: String, trim: true },
        correspondenceAddress: { type: String, trim: true },
        declarationAccepted: { type: Boolean, default: false },

        // ── Cloudinary File URLs ──────────────────────────────────────────────
        idCardFileUrl: { type: String },
        btpReportFileUrl: { type: String },
        offerLetterFileUrl: { type: String },
        placementDeclarationFileUrl: { type: String },
        admissionLetterFileUrl: { type: String },
        examScorecardFileUrl: { type: String },
        cancelledChequeFileUrl: { type: String },
    },
    { timestamps: true }
);

module.exports = mongoose.model('EligibleStudent', eligibleStudentSchema);
