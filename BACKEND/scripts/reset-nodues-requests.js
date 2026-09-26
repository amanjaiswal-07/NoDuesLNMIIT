/**
 * Resets ALL No-Dues application data so students can apply fresh.
 *
 * Deletes:  every NoDuesRequest, ClearanceStep and StepActionLog (timeline),
 *           plus reapply proof files uploaded to Cloudinary for those requests.
 * Keeps:    EligibleStudent (student list + profiles + profile documents) and
 *           User (staff/admin/student logins) — untouched.
 *
 * Before deleting, everything is backed up to BACKEND/backups/ as JSON.
 *
 * Dry run (default, no changes):  node scripts/reset-nodues-requests.js
 * Delete for real:                 node scripts/reset-nodues-requests.js --apply
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const cloudinary = require('../config/cloudinary');
const NoDuesRequest = require('../models/NoDuesRequest');
const ClearanceStep = require('../models/ClearanceStep');
const StepActionLog = require('../models/StepActionLog');
const EligibleStudent = require('../models/EligibleStudent');

const APPLY = process.argv.includes('--apply');

const PROFILE_FILE_FIELDS = [
    'idCardFileUrl', 'btpReportFileUrl', 'offerLetterFileUrl', 'placementDeclarationFileUrl',
    'admissionLetterFileUrl', 'examScorecardFileUrl', 'cancelledChequeFileUrl',
];

// Same logic as student.controller: "…/upload/v123/nodues/file.pdf" → "nodues/file"
function extractPublicId(url) {
    const match = url.match(/\/upload\/(?:v\d+\/)?(.+?)(\.[^./]+)?$/);
    return match ? match[1] : null;
}

/**
 * Backs up and (with --apply) deletes all application data; dry run by default.
 */
async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log(`Connected to MongoDB — ${APPLY ? 'APPLY mode (DELETING)' : 'DRY RUN (no changes)'}\n`);

    const requests = await NoDuesRequest.find().lean();
    const steps = await ClearanceStep.find().lean();
    const logs = await StepActionLog.find().lean();

    // Reapply proof files referenced by requests/steps/logs
    const proofUrls = new Set();
    requests.forEach(r => r.reapplyData?.proofUrl && proofUrls.add(r.reapplyData.proofUrl));
    steps.forEach(s => (s.studentProofUrls || []).forEach(u => proofUrls.add(u)));
    logs.forEach(l => (l.proofUrls || []).forEach(u => proofUrls.add(u)));

    // Safety: never delete a file that is still used as a student profile document
    const students = await EligibleStudent.find({}, PROFILE_FILE_FIELDS.join(' ')).lean();
    const profileUrls = new Set(students.flatMap(s => PROFILE_FILE_FIELDS.map(f => s[f]).filter(Boolean)));
    const filesToDelete = [...proofUrls].filter(u => u && u.startsWith('http') && !profileUrls.has(u));

    console.log(`No-Dues requests:        ${requests.length}`);
    console.log(`Clearance steps:         ${steps.length}`);
    console.log(`Timeline / action logs:  ${logs.length}`);
    console.log(`Reapply proof files:     ${filesToDelete.length} (Cloudinary)`);
    console.log(`Eligible students kept:  ${students.length} (profiles + documents untouched)`);

    if (!APPLY) {
        console.log('\nNothing deleted. Re-run with --apply to delete the above.');
        await mongoose.disconnect();
        return;
    }

    // 1. Backup
    const backupDir = path.resolve(__dirname, '../backups');
    fs.mkdirSync(backupDir, { recursive: true });
    const backupFile = path.join(backupDir, `nodues-reset-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
    fs.writeFileSync(backupFile, JSON.stringify({ requests, steps, logs, proofFiles: filesToDelete }, null, 2));
    console.log(`\nBackup written: ${backupFile}`);

    // 2. Delete database records
    const delLogs = await StepActionLog.deleteMany({});
    const delSteps = await ClearanceStep.deleteMany({});
    const delReqs = await NoDuesRequest.deleteMany({});
    console.log(`Deleted: ${delReqs.deletedCount} requests, ${delSteps.deletedCount} steps, ${delLogs.deletedCount} logs`);

    // 3. Delete reapply proof files (non-fatal if one fails)
    let filesDeleted = 0;
    for (const url of filesToDelete) {
        const publicId = extractPublicId(url);
        if (!publicId) continue;
        const resourceType = url.includes('/raw/upload/') ? 'raw' : 'image';
        try {
            const result = await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
            if (result.result === 'ok') filesDeleted++;
            else console.log(`  Cloudinary: ${publicId} → ${result.result}`);
        } catch (err) {
            console.log(`  Cloudinary delete failed for ${publicId}: ${err.message}`);
        }
    }
    console.log(`Deleted ${filesDeleted}/${filesToDelete.length} reapply proof files from Cloudinary`);

    console.log('\nDone. Students can now apply fresh.');
    await mongoose.disconnect();
}

run().catch(err => { console.error(err); process.exit(1); });
