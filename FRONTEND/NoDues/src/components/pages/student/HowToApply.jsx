// import { useState, useEffect } from "react";

// ── Images via glob — avoids apostrophe/quote filename parse errors ───────────
const _raw = import.meta.glob(
  "../../../assets/tutorial/student/*.png",
  { eager: true, import: "default" }
);
const imgs = Object.entries(_raw)
  .sort(([a], [b]) => {
    const n = (p) => parseInt(p.match(/\/(\d+)\./)?.[1] ?? "0", 10);
    return n(a) - n(b);
  })
  .map(([, mod]) => mod);

// ── Step definitions ──────────────────────────────────────────────────────────
const STEPS = [
  {
    title: "Login & Verify Your Email",
    points: [
      "After logging in, the Student Dashboard is displayed.",
      "Your registered email ID is shown at the top of the navigation bar.",
      "Verify that your email is correct before proceeding.",
      "If you find any discrepancy in your email, contact the Admin / Academic Section immediately.",
    ],
  },
  {
    title: "Check Profile Status",
    points: [
      "On first login, your profile status will be shown as Incomplete.",
      "You must complete your profile before you can apply for No Dues.",
      "Without a complete profile, the Apply option is disabled and greyed out.",
      "Complete your profile to unlock the application.",
    ],
  },
  {
    title: "Navigate to Profile → Edit Profile",
    points: [
      "Click on Profile in the top navigation bar.",
      "Click the Edit Profile button to start filling your details.",
      "The form will become editable immediately.",
    ],
  },
  {
    title: "Fill Personal Details",
    points: [
      "Fill in your Phone Number and Last Stayed Hostel.",
      "The following fields are auto-filled and non-editable: Name, Roll Number, Email, Department, Graduation Year and Level of degree.",
      "If any of the auto-filled fields are incorrect, contact the Admin or Academic Section — do not attempt to change them yourself.",
    ],
  },
  {
    title: "Upload Documents",
    points: [
      "Upload your Student ID Card (image format).",
      "Upload your BTP Report — it must be signed by your supervisor.",
      "The BTP Report is required for Library & HOD clearance.",
      "Email your signed BTP report to: circulation.library@lnmiit.ac.in",
      "After sending the email, enter the Library Email Sent Date in the form.",
    ],
  },
  {
    title: "Select Club / Fest Role",
    points: [
      "Select your role if you hold an official position:",
      "None — if you have no club/fest role.",
      "Club Coordinator — if you are a coordinator of any official club.",
      "Fest Organizing Committee — if you are part of the fest organizing team.",
      "Both — if you hold roles in both a club and the fest.",
      "This only applies to official positions — not general participation.",
    ],
  },
  {
    title: "Select Placement Status",
    points: [
      "Select your current placement status from the dropdown.",
      "Send any required documents to: info.tpc@lnmiit.ac.in",
      "Enter the TPC Email Sent Date after sending the email.",
      "The documents required depend on your specific status — see the steps below.",
    ],
  },
  {
    title: "If Placed",
    points: [
      "Upload your Offer Letter.",
      "Email the offer letter to TPC at info.tpc@lnmiit.ac.in",
      "Enter the email sent date in the form.",
    ],
  },
  {
    title: "If Unplaced",
    points: [
      "Upload a Declaration (PDF) clearly stating your current status (unplaced) and what you are doing currently.",
      "Enter the details in the form.",
      "Email the declaration to TPC and enter the email sent date.",
    ],
  },
  {
    title: "If on Preparation Break",
    points: [
      "Upload a declaration clearly stating that you are on a Preparation Break.",
      "Email the declaration to TPC at info.tpc@lnmiit.ac.in",
      "Enter the email sent date in the form.",
    ],
  },
  {
    title: "If Going for Higher Studies",
    points: [
      "Upload any one of the following supporting documents: Admission Letter from the institution you are joining, or Exam Scorecard (e.g. GATE, GRE, GMAT, CAT).",
      "Email the documents to TPC and enter the email sent date.",
    ],
  },
  {
    title: "If Joining Family Business",
    points: [
      "Upload a declaration stating that you are joining your family business and your role or position in the business (if applicable).",
      "Email the declaration to TPC and enter the email sent date.",
    ],
  },
  {
    title: "Enter Refund / Donation Details",
    points: [
      "Fill in the following bank details for your caution money refund: Account Holder Name, Bank Account Number, Bank Name, Branch, IFSC Code, City.",
      "Enter Father's Name and Father's Contact Number.",
      "If you wish to donate any part of your caution money, enter the donation amount. Otherwise leave it as 0.",
    ],
  },
  {
    title: "Upload Cancelled Cheque & Accept Declaration",
    points: [
      "Upload a clear image or scan of your Cancelled Cheque.",
      "Accept the declaration confirming: the donation amount is correct and all information provided is accurate.",
      "Click Save Profile to submit your completed profile.",
    ],
  },
  {
    title: "Profile Complete → Apply for No Dues",
    points: [
      "After saving your profile, your status will change to Complete.",
      "The Apply for No Dues button will become active.",
      'Click "Go to Apply for No Dues" to submit your application.',
    ],
  },
  {
    title: "Application Submitted",
    points: [
      "Once submitted, your No Dues application is sent to all relevant departments simultaneously.",
      "The Track Application section will become active.",
      "You can now monitor the progress of your clearance department-wise.",
    ],
  },
  {
    title: "Track Your Application Status",
    points: [
      "Go to Track Application to see the real-time status of your No Dues request.",
      "You can view the overall status: In Progress, Approved, or On Hold.",
      "See department-wise status — which departments have approved, which are pending or on hold.",
      "Click Timeline on any department card to view the full event history for that step.",
      "Use the Refresh button to get the latest updates without reloading the page.",
    ],
  },
  {
    title: "If Application is On Hold",
    points: [
      'If a department places your application on hold, you will see an "Action Required" banner.',
      "You will see the department name, the reason for the hold, and who placed it — along with the date and time.",
      'Click "Reapply Now" to resume your application.',
      "Reapply resumes the process from the same stage — it does not restart from the beginning.",
    ],
  },
  {
    title: "Add Clarification on Reapply",
    points: [
      "When reapplying, you can add a comment to explain what was fixed or what action you have taken.",
      "You can also upload a supporting document (PDF / Image) as proof.",
      "Adding a comment or document is optional but strongly recommended — it helps the department review your request faster.",
      "Once submitted, the application resumes and the department is notified.",
    ],
  },
  {
    title: "Logout",
    points: [
      "After all departments approve your request, your No Dues is granted.",
      "You can log out safely using the Logout button in the top navigation.",
      "Your session is cleared on logout. You can log back in anytime to check your status.",
    ],
  },
];

// ── Main export ───────────────────────────────────────────────────────────────
export default function HowToApply() {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 text-white overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-white/10">
        <h2 className="text-base font-semibold text-white">How to Apply for No Dues?</h2>
        <p className="text-xs text-white/40 mt-0.5">Step-by-step guide with screenshots</p>
      </div>

      {/* Steps */}
      <div className="divide-y divide-white/[0.07]">
        {STEPS.map((step, i) => (
          <div key={i} className="px-5 py-5 space-y-3">
            {/* Step number + title */}
            <div className="flex items-center gap-3">
              <span className="shrink-0 h-6 w-6 rounded-full bg-white/10 border border-white/15 flex items-center justify-center text-[11px] font-bold text-white/60">
                {i + 1}
              </span>
              <p className="text-sm font-semibold text-white/85">{step.title}</p>
            </div>

            {/* Screenshot — full width, natural height */}
            {imgs[i] && (
              <img
                src={imgs[i]}
                alt={`Step ${i + 1}`}
                className="w-full rounded-lg border border-white/10"
              />
            )}

            {/* Bullet points */}
            <ul className="space-y-1.5">
              {step.points.map((pt, j) => (
                <li key={j} className="flex items-start gap-2.5 text-sm text-white/60 leading-relaxed">
                  <span className="mt-2 shrink-0 h-1 w-1 rounded-full bg-white/25" />
                  {pt}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
