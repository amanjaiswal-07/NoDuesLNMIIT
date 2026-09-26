/**
 * One-time cleanup script: deletes all non-approved NoDuesRequests
 * and their associated ClearanceSteps for a given student email.
 * Run: node scripts/deleteStudentRequest.js
 */

require('dotenv').config();
const mongoose = require('mongoose');

const STUDENT_EMAIL = '23ucs719@lnmiit.ac.in';

/**
 * Connects, deletes the student's unfinished requests and their steps, then disconnects.
 */
async function main() {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const NoDuesRequest = mongoose.model(
        'NoDuesRequest',
        new mongoose.Schema({}, { strict: false }),
        'noduesrequests'
    );
    const ClearanceStep = mongoose.model(
        'ClearanceStep',
        new mongoose.Schema({}, { strict: false }),
        'clearancesteps'
    );

    // Find all non-approved requests for this student
    const requests = await NoDuesRequest.find({
        studentEmail: STUDENT_EMAIL,
        status: { $ne: 'approved' },
    });

    if (requests.length === 0) {
        console.log('ℹ️  No active/in-progress requests found for', STUDENT_EMAIL);
        await mongoose.disconnect();
        return;
    }

    for (const req of requests) {
        const stepsDel = await ClearanceStep.deleteMany({ requestId: req._id });
        await NoDuesRequest.deleteOne({ _id: req._id });
        console.log(`🗑  Deleted request ${req._id} (${req.status}) + ${stepsDel.deletedCount} clearance steps`);
    }

    console.log('✅ Cleanup complete. Student can now apply fresh.');
    await mongoose.disconnect();
}

main().catch((err) => { console.error(err); process.exit(1); });
