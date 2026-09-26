/**
 * certificateService.js
 *
 * Draws the official "STUDENT NO DUES" form (same layout as the institute's paper form),
 * auto-filled from a completed request: student details, each section's approver with
 * date/time, the Registrar's sign-off at completion, and the student's refund details.
 */

const path = require('path');
const PDFDocument = require('pdfkit');

const LOGO_PATH = path.join(__dirname, '..', 'assets', 'LNMIIT_logo.png');
const REGISTRAR_NAME = 'Dr. Pawan Kumar Paras';
const TZ = 'Asia/Kolkata';

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('en-GB', { timeZone: TZ }) : '—'); // dd/mm/yyyy
const fmtDateTime = (d) =>
    d ? new Date(d).toLocaleString('en-IN', { timeZone: TZ, day: '2-digit', month: '2-digit', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true }) : '—';

/**
 * Rows of the paper form, in its order. `codes` are the portal steps behind each row —
 * the row is signed by whoever approved the last of them.
 */
function formRows(steps, request, profile) {
    const byCode = Object.fromEntries(steps.map(s => [s.unitCode, s]));
    const hod = steps.find(s => s.unitCode.startsWith('hod_'));
    const labCount = steps.filter(s => s.unitCode.includes('_lab_')).length;

    const placement = profile.placementStatus || request.placementStatus;
    const hostel = profile.hostel || request.hostel;

    return [
        { label: 'Accounts', step: byCode.accounts, remark: 'Refund details verified' },
        { label: 'Central Library', step: byCode.library_librarian, remark: 'Cleared by Library Staff & Librarian' },
        { label: 'Store', step: byCode.store, remark: 'No items outstanding' },
        { label: 'LUCS', step: byCode.lucs, remark: 'No dues' },
        { label: 'Warden In charge', step: byCode.warden, remark: hostel ? `Hostel ${hostel} vacated` : 'Hostel cleared' },
        { label: 'Administration', step: byCode.administration, remark: 'No dues' },
        { label: 'Sports', step: byCode.sports, remark: 'No equipment outstanding' },
        { label: 'Head of Department', step: hod, remark: `All ${labCount} labs and NAD Cell cleared` },
        { label: 'Medical Unit', step: byCode.medical, remark: 'No dues' },
        { label: 'Placement Office', step: byCode.placement, remark: placement ? `Status: ${placement}` : 'No dues' },
    ];
}

/**
 * Streams the certificate PDF.
 * @param {object} p
 * @param {object} p.request   NoDuesRequest (lean)
 * @param {object[]} p.steps   its ClearanceSteps (lean)
 * @param {object} p.profile   EligibleStudent (lean)
 * @param {object} p.names     approver email → display name
 * @param {Date}   p.completedAt
 * @param {string} p.applicationNo
 * @param {import('stream').Writable} out
 */
function writeCertificate({ request, steps, profile, names, completedAt, applicationNo }, out) {
    const doc = new PDFDocument({ size: 'A4', margins: { top: 36, bottom: 10, left: 50, right: 50 } });
    doc.pipe(out);

    const L = 50, R = doc.page.width - 50, W = R - L;
    const signer = (step) => {
        if (!step || step.status !== 'approved') return { name: '—', when: '' };
        const email = (step.actionBy || '').toLowerCase();
        return { name: names[email] || step.actionBy || '—', when: fmtDateTime(step.actionAt) };
    };
    // Inline form line: label text followed by an underlined filled-in value, laid out piece by
    // piece (pdfkit's `continued` text mis-measures when fonts change mid-line).
    const FS = 10.5, LH = 15;
    let cx = L, cy = 0;
    const newLine = (gap = LH) => { cx = L; cy += gap; };
    const put = (text, font, underline = false) => {
        doc.font(font).fontSize(FS);
        for (const word of String(text).split(/(\s+)/).filter(Boolean)) {
            const w = doc.widthOfString(word);
            if (cx + w > R && cx > L && word.trim()) newLine();
            if (cx === L && !word.trim()) continue; // no leading space on a wrapped line
            doc.text(word, cx, cy, { lineBreak: false, underline, width: w + 1 });
            cx += w;
        }
    };
    const field = (label, value) => {
        put(label + ' ', 'Times-Roman');
        put(` ${value || '—'} `, 'Times-Bold', true);
        put('   ', 'Times-Roman');
    };
    const bullet = () => {
        doc.save().translate(cx + 3.5, cy + 6).rotate(45).rect(-2.6, -2.6, 5.2, 5.2).fill('#000').restore();
        cx += 14;
    };

    // ── Header ────────────────────────────────────────────────────────────────
    doc.image(LOGO_PATH, (doc.page.width - 120) / 2, 30, { width: 120 });
    doc.font('Times-Roman').fontSize(11).text(`Date: ${fmtDate(completedAt)}`, L, 78, { width: W, align: 'right' });
    doc.font('Times-BoldItalic').fontSize(14).text('STUDENT “NO DUES”', L, 98, { width: W, align: 'center', underline: true });

    cy = 128;
    field('This is to certify that there is nothing outstanding against Mr. /Ms.', request.studentName);
    field('Roll No.', request.rollNo);
    newLine(18);
    field('Branch:', request.branch);
    doc.y = cy + LH;

    // ── Department table ──────────────────────────────────────────────────────
    const cols = [
        { title: 'Department', w: 110, align: 'left' },
        { title: 'Dues if any/ No Dues', w: 108, align: 'center' },
        { title: 'Signature of HOS', w: 157, align: 'center' },
        { title: 'Remarks', w: W - 375, align: 'center' },
    ];
    let y = doc.y + 12;
    const headerH = 22, rowH = 30;

    const drawRow = (cells, h, bold) => {
        let x = L;
        cells.forEach((cell, i) => {
            doc.rect(x, y, cols[i].w, h).lineWidth(0.7).stroke();
            const lines = Array.isArray(cell) ? cell : [cell];
            const textH = lines.length * 11;
            let ty = y + (h - textH) / 2 + 1;
            lines.forEach((line, j) => {
                doc.font(bold || (i === 2 && j === 0) ? 'Times-Bold' : 'Times-Roman')
                    .fontSize(i === 2 && j === 1 ? 8.5 : 9.5)
                    .text(line, x + 5, ty, { width: cols[i].w - 10, align: cols[i].align, lineBreak: false, ellipsis: true });
                ty += 11;
            });
            x += cols[i].w;
        });
        y += h;
    };

    drawRow(cols.map(c => c.title), headerH, true);
    for (const row of formRows(steps, request, profile)) {
        const s = signer(row.step);
        const cleared = row.step?.status === 'approved';
        drawRow([row.label, cleared ? 'No Dues' : '—', [s.name, s.when], cleared ? row.remark : ''], rowH, false);
    }

    // ── Registrar ─────────────────────────────────────────────────────────────
    y += 14;
    const regW = 190, regX = R - regW;
    doc.font('Times-Bold').fontSize(10.5).text(REGISTRAR_NAME, regX, y, { width: regW, align: 'right' });
    doc.font('Times-Roman').fontSize(9).text(`Approved on ${fmtDateTime(completedAt)}`, regX, y + 13, { width: regW, align: 'right' });
    doc.fontSize(10).text('-----------------------', regX, y + 25, { width: regW, align: 'right' });
    doc.font('Times-Bold').text('(Registrar’s Office)', regX, y + 37, { width: regW, align: 'right' });

    // ── To be filled by the Student ───────────────────────────────────────────
    doc.font('Times-Bold').fontSize(10.5).text('To be filled by the Student', L, y + 54, { width: W, align: 'center', underline: true });
    cx = L;
    cy = y + 74;
    const gap = () => newLine(21);

    bullet();
    put('Bank details for Caution Money Refund: ', 'Times-Bold');
    field('Name of Account Holder', profile.accountHolderName);
    gap();
    field('Bank Account No.', profile.bankAccountNumber);
    field('Name of Bank', profile.bankName);
    gap();
    field('Branch', profile.bankBranch);
    field('City', profile.bankCity);
    field('IFSC Code', profile.ifscCode);
    put(profile.cancelledChequeFileUrl ? '(Copy of cheque attached on portal)' : '(Please attach photo copy of a Cheque)', 'Times-Roman');
    gap();

    const donation = profile.donationAmount && Number(profile.donationAmount) > 0 ? profile.donationAmount : '0';
    bullet();
    put('I wish to donate Rs. ', 'Times-Roman');
    put(` ${donation} `, 'Times-Bold', true);
    put(' from my caution money refund due, from the Institute, towards Students’ Welfare fund of LNMIIT.', 'Times-Roman');
    gap();

    bullet();
    field('Contact No (Resi.)', profile.studentContactNumber);
    field('Mobile:', profile.phone || request.phone);
    field('E-mail:', profile.email || request.studentEmail);
    gap();
    field('Father’s Name:', profile.fatherName);
    field('Mobile no.:', profile.fatherMobileNumber);
    gap();
    field('Address for correspondence:', profile.correspondenceAddress);
    doc.y = cy + LH;

    // ── Footer: submitted date + student signature ───────────────────────────
    const fy = Math.min(Math.max(doc.y + 20, 730), 786);
    doc.font('Times-Bold').fontSize(10.5).text('Submitted Date: ', L, fy, { continued: true });
    doc.font('Times-Roman').text(fmtDate(request.submittedAt || request.createdAt));
    doc.font('Times-Bold').text('Signature of Student', R - 200, fy, { width: 200, align: 'right' });
    doc.font('Times-Roman').text(request.studentName, R - 200, fy + 13, { width: 200, align: 'right' });

    doc.font('Helvetica').fontSize(7).fillColor('#666666').text(
        `System-generated on the LNMIIT No Dues Portal  ·  Application No. ${applicationNo}  ·  Completed ${fmtDateTime(completedAt)}`,
        L, doc.page.height - 26, { width: W, align: 'center', lineBreak: false }
    );

    doc.end();
}

module.exports = { writeCertificate, REGISTRAR_NAME };
