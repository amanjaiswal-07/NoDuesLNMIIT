/**
 * StudentProfile.jsx — the student's profile form (/student/profile): personal details, ID card,
 * club/fest role, placement details and documents, library details, and refund / bank details.
 * Editable only before applying or while On Hold (the backend enforces this too). Once every
 * department has approved, it shows the "Download No Dues Certificate" card.
 */

import { useMemo, useState, useCallback } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import api from "../../../api/client";
import ConfirmModal from "../../Modal/ConfirmModal";
import FileViewerModal from "../../Modal/FileViewerModal";

// ── No Dues certificate (shown once every department has approved) ─────────────
function CertificateCard() {
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState("");

  const download = async () => {
    setDownloading(true);
    setError("");
    try {
      const res = await api.get("/student/certificate", { responseType: "blob" });
      // Never save a cut-off file (e.g. if the server restarted mid-download)
      const tail = await res.data.slice(-1024).text();
      if (!tail.includes("%%EOF")) throw new Error("incomplete");
      const name = /filename="([^"]+)"/.exec(res.headers["content-disposition"] || "")?.[1] || "No-Dues-Certificate.pdf";
      const url = URL.createObjectURL(res.data);
      const a = document.createElement("a");
      a.href = url;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (err) {
      let msg = "Could not download the certificate. Please try again.";
      try { msg = JSON.parse(await err.response.data.text()).error || msg; } catch { /* keep default */ }
      setError(msg);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="mt-6 flex flex-col gap-4 rounded-xl border border-emerald-400/30 bg-emerald-500/10 p-5 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-base font-semibold text-emerald-200">🎓 All departments have cleared your No Dues</p>
        <p className="mt-1 text-sm text-emerald-100/70">
          Download your filled No Dues form with every department's clearance and the Registrar's approval.
        </p>
        {error && <p className="mt-2 text-sm text-rose-300">{error}</p>}
      </div>
      <button
        type="button"
        onClick={download}
        disabled={downloading}
        className="shrink-0 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
      >
        {downloading ? "Preparing…" : "⬇ Download No Dues Certificate"}
      </button>
    </div>
  );
}

// ── Validation Alert Popup ──────────────────────────────────────────────────────
function ValidationAlertModal({ errors, onClose }) {
  if (!errors || errors.length === 0) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="w-full max-w-md rounded-2xl border border-red-400/30 bg-neutral-900 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div className="flex items-center gap-2">
            <span className="text-lg">⚠️</span>
            <h2 className="text-base font-semibold text-red-300">Please fix the following errors</h2>
          </div>
          <button
            onClick={onClose}
            className="text-white/40 hover:text-white/80 text-xl leading-none"
          >&times;</button>
        </div>
        {/* Error List */}
        <div className="px-5 py-4 space-y-2">
          {errors.map((err, i) => (
            <div
              key={i}
              className="flex items-start gap-2.5 rounded-lg border border-red-400/20 bg-red-500/10 px-3 py-2.5"
            >
              <span className="mt-0.5 shrink-0 text-red-400 text-sm">✕</span>
              <p className="text-sm text-red-200">{err}</p>
            </div>
          ))}
        </div>
        {/* Footer */}
        <div className="flex justify-end border-t border-white/10 px-5 py-3">
          <button
            onClick={onClose}
            className="rounded-xl bg-red-500/20 border border-red-400/30 px-5 py-2 text-sm font-semibold text-red-300 hover:bg-red-500/30 transition"
          >
            Fix Errors
          </button>
        </div>
      </div>
    </div>
  );
}

const HOSTELS = ["BH1", "BH2", "BH3", "BH4", "BH5", "GH"];

const PLACEMENT_STATUSES = [
  "Placed",
  "Unplaced",
  "Preparation Break",
  "Higher Studies India",
  "Higher Studies Abroad",
  "Family Business",
];

const CLUB_ROLE_OPTIONS = [
  "None",
  "Club Coordinator",
  "Fest Organizing Committee",
  "Both",
];

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function WarningText({ children }) {
  return <p className="mt-2 text-xs font-medium text-red-300">{children}</p>;
}

function SectionCard({ title, subtitle, children }) {
  return (
    <div className="rounded-2xl border border-white/15 bg-white/5 p-6">
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-white">{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-white/60">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

function InputField({ label, value, onChange, placeholder = "", type = "text", disabled = false }) {
  return (
    <div>
      <label className="block text-sm text-white/80">{label}</label>
      <input
        type={type}
        value={value ?? ""}
        disabled={disabled}
        onChange={onChange}
        placeholder={placeholder}
        className={`mt-2 w-full rounded-xl border border-white/15 bg-neutral-950 px-4 py-3 text-sm text-white outline-none focus:border-blue-500 ${disabled ? "opacity-70 cursor-not-allowed" : ""}`}
      />
    </div>
  );
}

function TextAreaField({ label, value, onChange, placeholder = "", disabled = false, rows = 4 }) {
  return (
    <div>
      <label className="block text-sm text-white/80">{label}</label>
      <textarea
        value={value ?? ""}
        disabled={disabled}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
        className={`mt-2 w-full rounded-xl border border-white/15 bg-neutral-950 px-4 py-3 text-sm text-white outline-none focus:border-blue-500 ${disabled ? "opacity-70 cursor-not-allowed" : ""}`}
      />
    </div>
  );
}

function SelectField({ label, value, onChange, options, disabled = false }) {
  return (
    <div>
      <label className="block text-sm text-white/80">{label}</label>
      <select
        value={value ?? ""}
        disabled={disabled}
        onChange={onChange}
        className={`mt-2 w-full rounded-xl border border-white/15 bg-neutral-950 px-4 py-3 text-sm text-white outline-none focus:border-blue-500 ${disabled ? "opacity-70 cursor-not-allowed" : ""}`}
      >
        <option value="">-- Select --</option>
        {options.map((op) => <option key={op} value={op}>{op}</option>)}
      </select>
    </div>
  );
}

/**
 * FileField — shows file picker when editing, and an "already uploaded" badge
 * with an in-app "View" button when a file exists.
 */
function FileField({ label, accept, file, onChange, disabled = false, helper = "", existingUrl = "", fieldName = "", fieldLabel = "" }) {
  const [viewerOpen, setViewerOpen] = useState(false);

  return (
    <div>
      <label className="block text-sm text-white/80">{label}</label>

      {/* Existing-upload badge */}
      {existingUrl && !file && (
        <div className="mt-2 flex items-center gap-2 rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-2">
          <span className="text-xs font-medium text-emerald-300">✓ File uploaded</span>
          {fieldName && (
            <button
              type="button"
              onClick={() => setViewerOpen(true)}
              className="ml-auto rounded-lg bg-blue-600/30 px-3 py-1 text-xs font-medium text-blue-300 hover:bg-blue-600/50 transition-colors"
            >
              View
            </button>
          )}
        </div>
      )}

      {/* File picker — only shown when not locked */}
      {!disabled && (
        <>
          <input
            type="file"
            accept={accept}
            onChange={(e) => onChange(e.target.files?.[0] || null)}
            className="mt-2 block w-full rounded-xl border border-white/15 bg-neutral-950 px-4 py-3 text-sm text-white file:mr-4 file:rounded-lg file:border-0 file:bg-blue-600 file:px-3 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-blue-700"
          />
          {helper && <p className="mt-2 text-xs text-white/50">{helper}</p>}
        </>
      )}

      {/* New file selected preview */}
      {file && (
        <div className="mt-3 rounded-xl border border-white/10 bg-black/20 p-3">
          <p className="text-sm font-medium text-white/90">{file.name}</p>
          <p className="mt-1 text-xs text-white/50">
            {(file.size / 1024).toFixed(1)} KB — New file selected
          </p>
          {file.type.startsWith("image/") && (
            <img
              src={URL.createObjectURL(file)}
              alt={file.name}
              className="mt-3 max-h-48 rounded-lg border border-white/10 object-contain"
            />
          )}
        </div>
      )}

      {/* In-app file viewer modal */}
      {viewerOpen && fieldName && (
        <FileViewerModal
          fieldName={fieldName}
          label={fieldLabel || label}
          version={existingUrl}
          onClose={() => setViewerOpen(false)}
        />
      )}
    </div>
  );
}

// ── Form State Builder ─────────────────────────────────────────────────────────

function buildFormFromProfile(profile, email) {
  return {
    // Read-only (auto-filled)
    name: profile?.name || "",
    rollNo: profile?.rollNo || "",
    email: profile?.email || email || "",
    department: profile?.department || profile?.branch || "",
    graduation: profile?.graduation || "",

    // Editable
    phone: profile?.phone || "",
    hostel: profile?.hostel || "",
    idCardFile: null,
    btpReportFile: null,
    libraryEmailDate: profile?.libraryEmailDate || "",
    clubRoleType: profile?.clubRoleType || "",
    clubRoleDetail: profile?.clubRoleDetail || "",
    festRoleDetail: profile?.festRoleDetail || "",
    placementStatus: profile?.placementStatus || "",
    placementDetailsText: profile?.placementDetailsText || "",
    offerLetterFile: null,
    placementDeclarationFile: null,
    admissionLetterFile: null,
    examScorecardFile: null,
    tpcEmailDate: profile?.tpcEmailDate || "",
    accountHolderName: profile?.accountHolderName || "",
    bankAccountNumber: profile?.bankAccountNumber || "",
    bankName: profile?.bankName || "",
    bankBranch: profile?.bankBranch || "",
    bankCity: profile?.bankCity || "",
    ifscCode: profile?.ifscCode || "",
    donationAmount: profile?.donationAmount ?? "0",
    studentContactNumber: profile?.studentContactNumber || "",
    fatherName: profile?.fatherName || "",
    fatherMobileNumber: profile?.fatherMobileNumber || "",
    correspondenceAddress: profile?.correspondenceAddress || "",
    cancelledChequeFile: null,
    submittedDate: profile?.submittedAt
      ? new Date(profile.submittedAt).toISOString().split("T")[0]
      : "",
    declarationAccepted: profile?.declarationAccepted || false,
  };
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function StudentProfile() {
  const { email, studentProfile, setStudentProfile, setProfileComplete, currentApplication } = useOutletContext();
  const navigate = useNavigate();

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [profileSaved, setProfileSaved] = useState(Boolean(studentProfile?.rollNo));
  const [isLocked, setIsLocked] = useState(Boolean(studentProfile?.rollNo));
  // savedProfile holds the last server-confirmed profile (for existing file URLs)
  const [savedProfile, setSavedProfile] = useState(studentProfile || null);
  const [form, setForm] = useState(() => buildFormFromProfile(studentProfile, email));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [validationErrors, setValidationErrors] = useState([]);

  // Safe field setter — respects locked state; handles club role side-effects
  const setField = useCallback((key, value) => {
    if (isLocked) return;
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      // When club role becomes "None", clear detail fields immediately in form
      if (key === "clubRoleType" && value === "None") {
        next.clubRoleDetail = "";
        next.festRoleDetail = "";
      }
      return next;
    });
  }, [isLocked]);

  const isHigherStudies =
    form.placementStatus === "Higher Studies India" ||
    form.placementStatus === "Higher Studies Abroad";

  // Frontend-computed completeness (for UX hints only — backend is authoritative)
  const profileComplete = useMemo(() => {
    const basicOk = form.name && form.rollNo && form.email && form.department &&
      form.graduation && form.phone && form.hostel;
    const docsOk =
      (form.idCardFile || savedProfile?.idCardFileUrl) &&
      (form.btpReportFile || savedProfile?.btpReportFileUrl) &&
      form.libraryEmailDate;
    const roleOk = form.clubRoleType && (
      form.clubRoleType === "None" ||
      (form.clubRoleType === "Club Coordinator" && form.clubRoleDetail) ||
      (form.clubRoleType === "Fest Organizing Committee" && form.festRoleDetail) ||
      (form.clubRoleType === "Both" && form.clubRoleDetail && form.festRoleDetail)
    );
    let placementOk = Boolean(form.placementStatus && form.tpcEmailDate);
    if (form.placementStatus === "Placed") placementOk = placementOk && Boolean(form.offerLetterFile || savedProfile?.offerLetterFileUrl);
    if (form.placementStatus === "Unplaced") placementOk = placementOk && Boolean(form.placementDetailsText) && Boolean(form.placementDeclarationFile || savedProfile?.placementDeclarationFileUrl);
    if (form.placementStatus === "Preparation Break" || form.placementStatus === "Family Business")
      placementOk = placementOk && Boolean(form.placementDeclarationFile || savedProfile?.placementDeclarationFileUrl);
    if (isHigherStudies)
      placementOk = placementOk && Boolean(form.admissionLetterFile || form.examScorecardFile || savedProfile?.admissionLetterFileUrl || savedProfile?.examScorecardFileUrl);
    const declarationOk = form.accountHolderName && form.bankAccountNumber && form.bankName &&
      form.bankBranch && form.bankCity && form.ifscCode && form.donationAmount !== "" &&
      form.studentContactNumber && form.fatherName && form.fatherMobileNumber &&
      form.correspondenceAddress && (form.cancelledChequeFile || savedProfile?.cancelledChequeFileUrl) &&
      form.declarationAccepted;
    return Boolean(basicOk && docsOk && roleOk && placementOk && declarationOk);
  }, [form, isHigherStudies, savedProfile]);

  /**
   * Derive admission year from roll number.
   * Format: 23UCS719 → year prefix = 23 → 2023
   */
  const admissionYear = useMemo(() => {
    const roll = form.rollNo || "";
    const match = roll.match(/^(\d{2})/);
    if (match) {
      const prefix = parseInt(match[1], 10);
      return 2000 + prefix;
    }
    return 2018; // safe fallback
  }, [form.rollNo]);

  const todayStr = todayISO();

  /**
   * Client-side field validation before sending to server.
   * Collects ALL errors and returns them as an array.
   */
  const validateProfileForm = () => {
    const errors = [];
    const phoneRegex = /^\d{10}$/;
    const alphaSpaceRegex = /^[A-Za-z\s]+$/;
    const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
    const bankAccRegex = /^\d{9,18}$/;
    const minDate = `${admissionYear}-01-01`;

    if (form.phone && !phoneRegex.test(form.phone.trim()))
      errors.push("Phone number must be exactly 10 digits (numeric only).");
    if (form.studentContactNumber && !phoneRegex.test(form.studentContactNumber.trim()))
      errors.push("Student contact number must be exactly 10 digits (numeric only).");
    if (form.fatherMobileNumber && !phoneRegex.test(form.fatherMobileNumber.trim()))
      errors.push("Father's mobile number must be exactly 10 digits (numeric only).");

    if (form.libraryEmailDate && form.libraryEmailDate > todayStr)
      errors.push("Library email sent date cannot be in the future.");
    if (form.libraryEmailDate && form.libraryEmailDate < minDate)
      errors.push(`Library email sent date cannot be before your admission year (${admissionYear}).`);
    if (form.tpcEmailDate && form.tpcEmailDate > todayStr)
      errors.push("TPC email sent date cannot be in the future.");
    if (form.tpcEmailDate && form.tpcEmailDate < minDate)
      errors.push(`TPC email sent date cannot be before your admission year (${admissionYear}).`);

    if (form.accountHolderName && !alphaSpaceRegex.test(form.accountHolderName.trim()))
      errors.push("Account holder name must contain only alphabets and spaces.");
    if (form.accountHolderName && form.accountHolderName.trim().length < 2)
      errors.push("Account holder name is too short (minimum 2 characters).");

    if (form.fatherName && !alphaSpaceRegex.test(form.fatherName.trim()))
      errors.push("Father's name must contain only alphabets and spaces.");
    if (form.fatherName && form.fatherName.trim().length < 2)
      errors.push("Father's name is too short (minimum 2 characters).");

    if (form.bankAccountNumber && !bankAccRegex.test(form.bankAccountNumber.trim()))
      errors.push("Bank account number must be numeric and between 9–18 digits.");
    if (form.bankName && !alphaSpaceRegex.test(form.bankName.trim()))
      errors.push("Bank name must contain only alphabets and spaces.");
    if (form.ifscCode && !ifscRegex.test(form.ifscCode.trim().toUpperCase()))
      errors.push("IFSC code is invalid. Expected format: SBIN0001234 (4 letters + 0 + 6 alphanumeric).");

    const donation = parseFloat(form.donationAmount);
    if (form.donationAmount !== "" && (isNaN(donation) || donation < 0))
      errors.push("Donation amount must be a non-negative number (0 or more).");
    if (form.correspondenceAddress && form.correspondenceAddress.trim().length < 10)
      errors.push("Correspondence address is too short (minimum 10 characters).");

    return errors;
  };

  const handleConfirmSave = async () => {
    // Collect ALL validation errors and show popup if any exist
    const errors = validateProfileForm();
    if (errors.length > 0) {
      setValidationErrors(errors);
      setConfirmOpen(false);
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg("");
      setSuccessMsg("");

      const fd = new FormData();
      fd.append("submittedDate", form.submittedDate || todayISO());

      Object.keys(form).forEach((key) => {
        if (key === "submittedDate") return; // already appended
        if (form[key] instanceof File) {
          fd.append(key, form[key]);
        } else if (form[key] !== null && form[key] !== undefined) {
          fd.append(key, String(form[key]));
        }
      });

      const res = await api.post("/student/profile", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const updated = res.data.profile;

      // Sync state from server response
      setSavedProfile(updated);
      setStudentProfile(updated);
      setProfileComplete(updated.profileCompleted);
      setForm(buildFormFromProfile(updated, email));
      setProfileSaved(true);
      setIsLocked(true);
      setConfirmOpen(false);
      setSuccessMsg(
        updated.profileCompleted
          ? "✓ Profile saved and complete! You can now Apply for No Dues."
          : "Profile saved. Fill all required fields to unlock Apply."
      );
    } catch (err) {
      console.error("Profile save error:", err);
      setErrorMsg(err.response?.data?.error || "Failed to save profile. Please try again.");
      setConfirmOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isActuallyComplete = savedProfile?.profileCompleted === true;
  // Server decides: editable before applying and while On Hold; locked during review / after completion
  const canEdit = savedProfile?.editable !== false;
  const isOnHold = currentApplication?.status === "action_required";

  const statusLabel = isActuallyComplete && profileSaved ? "PROFILE COMPLETE" : "PROFILE INCOMPLETE";
  const statusClass = isActuallyComplete && profileSaved
    ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-300"
    : "border-amber-400/40 bg-amber-500/10 text-amber-300";

  return (
    <>
      {/* Validation popup — shown when Save Profile fails field checks */}
      <ValidationAlertModal
        errors={validationErrors}
        onClose={() => setValidationErrors([])}
      />
      <div className="space-y-6">

        {/* ── Header ── */}
        <div className="rounded-2xl bg-white/10 p-5 sm:p-8 text-white shadow-lg backdrop-blur">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <h1 className="text-2xl font-semibold sm:text-3xl">Student Profile</h1>
              <p className="mt-2 text-white/70">Complete your profile before applying for No Dues.</p>
            </div>
            <div className="flex items-center gap-3">
              <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${statusClass}`}>
                {statusLabel}
              </span>
              {profileSaved && canEdit && isLocked && (
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => { setIsLocked(false); setSuccessMsg(""); setErrorMsg(""); }}
                  className="rounded-xl border border-white/15 px-4 py-2 text-sm text-white/90 hover:bg-white/10"
                >
                  Edit Profile
                </button>
              )}
            </div>
          </div>

          {successMsg && (
            <div className={`mt-6 rounded-xl border p-4 ${isActuallyComplete ? "border-emerald-400/30 bg-emerald-500/10" : "border-amber-400/30 bg-amber-500/10"}`}>
              <p className={`text-sm font-medium ${isActuallyComplete ? "text-emerald-200" : "text-amber-200"}`}>{successMsg}</p>
            </div>
          )}
          {!profileSaved && !errorMsg && !successMsg && (
            <div className="mt-6 rounded-xl border border-amber-400/30 bg-amber-500/10 p-4">
              <p className="text-sm font-medium text-amber-200">
                Fill all required fields (*) and save your profile to unlock Apply for No Dues.
              </p>
            </div>
          )}
          {errorMsg && (
            <div className="mt-6 rounded-xl border border-red-400/30 bg-red-500/10 p-4">
              <p className="text-sm font-medium text-red-200">{errorMsg}</p>
            </div>
          )}
          {currentApplication?.status === "approved" && <CertificateCard />}
          {!canEdit && (
            <div className="mt-6 rounded-xl border border-white/15 bg-white/5 p-4">
              <p className="text-sm font-medium text-white/80">🔒 {savedProfile?.lockReason}</p>
            </div>
          )}
          {canEdit && isOnHold && (
            <div className="mt-6 rounded-xl border border-red-400/30 bg-red-500/10 p-4">
              <p className="text-sm font-medium text-red-200">
                Your application is On Hold. You can edit your profile to fix what the department asked for,
                then go to Track and click "Reapply Now".
              </p>
            </div>
          )}
          {!isLocked && profileSaved && (
            <div className="mt-6 rounded-xl border border-blue-400/30 bg-blue-500/10 p-4">
              <p className="text-sm font-medium text-blue-200">
                You may now update your profile information.
              </p>
            </div>
          )}
        </div>

        {/* ── 1. Personal Information ── */}
        <SectionCard
          title="1. Personal Information"
          subtitle="Name, Roll Number, Email, Department and Graduation are auto-filled from the Eligible Students database and cannot be edited."
        >
          <div className="grid gap-5 md:grid-cols-2">
            <InputField label="Name" value={form.name} disabled onChange={() => { }} />
            <InputField label="Roll Number" value={form.rollNo} disabled onChange={() => { }} />
            <InputField label="Email" value={form.email} disabled onChange={() => { }} />
            <InputField
              label="Phone Number *"
              value={form.phone}
              disabled={isLocked}
              onChange={(e) => setField("phone", e.target.value)}
              placeholder="Enter phone number"
            />
            <InputField label="Department" value={form.department} disabled onChange={() => { }} />
            <InputField label="Graduation" value={form.graduation} disabled onChange={() => { }} />
          </div>
          <div className="mt-5 max-w-md">
            <SelectField
              label="Last Stayed Hostel *"
              value={form.hostel}
              disabled={isLocked}
              onChange={(e) => setField("hostel", e.target.value)}
              options={HOSTELS}
            />
            <WarningText>
              Select the last hostel you stayed in before leaving campus. Incorrect data may cause request cancellation.
            </WarningText>
          </div>
        </SectionCard>

        {/* ── 2. Academic Documents ── */}
        <SectionCard
          title="2. Academic Documents"
          subtitle="Upload required documents and provide the library email date."
        >
          <div className="grid gap-5 md:grid-cols-2">
            <FileField
              label="Student ID Card / Placement Document *"
              accept=".png,.jpg,.jpeg,image/png,image/jpeg"
              file={form.idCardFile}
              disabled={isLocked}
              onChange={(f) => setField("idCardFile", f)}
              helper="PNG / JPG / JPEG only"
              existingUrl={savedProfile?.idCardFileUrl || ""}
              fieldName="idCardFile"
              fieldLabel="Student ID Card"
            />
            <FileField
              label="BTP Report *"
              accept=".pdf,application/pdf"
              file={form.btpReportFile}
              disabled={isLocked}
              onChange={(f) => setField("btpReportFile", f)}
              helper="PDF only"
              existingUrl={savedProfile?.btpReportFileUrl || ""}
              fieldName="btpReportFile"
              fieldLabel="BTP Report"
            />
          </div>
          <div className="mt-5 max-w-md">
            <div>
              <label className="block text-sm text-white/80">Library Email Sent Date *</label>
              <input
                type="date"
                value={form.libraryEmailDate}
                disabled={isLocked}
                onChange={(e) => setField("libraryEmailDate", e.target.value)}
                min={`${admissionYear}-01-01`}
                max={todayStr}
                className={`mt-2 w-full rounded-xl border border-white/15 bg-neutral-950 px-4 py-3 text-sm text-white outline-none focus:border-blue-500 ${isLocked ? "opacity-70 cursor-not-allowed" : ""
                  }`}
              />
            </div>
            <WarningText>
              Date when you emailed your BTP report to circulation.library@lnmiit.ac.in. Must be between your admission year and today.
            </WarningText>
          </div>
        </SectionCard>

        {/* ── 3. Club / Fest Role ── */}
        <SectionCard
          title="3. Club / Fest Role"
          subtitle="Selecting 'None' will clear any previously saved club/fest details."
        >
          <div className="grid gap-5 md:grid-cols-2">
            <SelectField
              label="Role Type *"
              value={form.clubRoleType}
              disabled={isLocked}
              onChange={(e) => setField("clubRoleType", e.target.value)}
              options={CLUB_ROLE_OPTIONS}
            />
            {form.clubRoleType === "Club Coordinator" && (
              <InputField
                label="Club / Role *"
                value={form.clubRoleDetail}
                disabled={isLocked}
                onChange={(e) => setField("clubRoleDetail", e.target.value)}
                placeholder="e.g. Sankalp Club — Coordinator"
              />
            )}
            {form.clubRoleType === "Fest Organizing Committee" && (
              <InputField
                label="Fest / Role *"
                value={form.festRoleDetail}
                disabled={isLocked}
                onChange={(e) => setField("festRoleDetail", e.target.value)}
                placeholder="Enter fest and role"
              />
            )}
            {form.clubRoleType === "Both" && (
              <>
                <InputField label="Club Name / Role *" value={form.clubRoleDetail} disabled={isLocked} onChange={(e) => setField("clubRoleDetail", e.target.value)} placeholder="Enter club and role" />
                <InputField label="Fest Name / Role *" value={form.festRoleDetail} disabled={isLocked} onChange={(e) => setField("festRoleDetail", e.target.value)} placeholder="Enter fest and role" />
              </>
            )}
          </div>
        </SectionCard>

        {/* ── 4. Placement Information ── */}
        <SectionCard
          title="4. Placement Information"
          subtitle="Changing placement status will automatically remove previously uploaded placement documents."
        >
          <div className="grid gap-5 md:grid-cols-2">
            <SelectField
              label="Placement Status *"
              value={form.placementStatus}
              disabled={isLocked}
              onChange={(e) => setField("placementStatus", e.target.value)}
              options={PLACEMENT_STATUSES}
            />
            <div>
              <label className="block text-sm text-white/80">TPC Email Sent Date *</label>
              <input
                type="date"
                value={form.tpcEmailDate}
                disabled={isLocked}
                onChange={(e) => setField("tpcEmailDate", e.target.value)}
                min={`${admissionYear}-01-01`}
                max={todayStr}
                className={`mt-2 w-full rounded-xl border border-white/15 bg-neutral-950 px-4 py-3 text-sm text-white outline-none focus:border-blue-500 ${isLocked ? "opacity-70 cursor-not-allowed" : ""
                  }`}
              />
            </div>
          </div>
          <WarningText>Email all placement details to info.tpc@lnmiit.ac.in. Incorrect date may cause rejection.</WarningText>

          {form.placementStatus === "Placed" && (
            <div className="mt-5 max-w-xl">
              <FileField
                label="Offer Letter *"
                accept=".pdf,.jpg,.jpeg,.png"
                file={form.offerLetterFile}
                disabled={isLocked}
                onChange={(f) => setField("offerLetterFile", f)}
                existingUrl={savedProfile?.offerLetterFileUrl || ""}
                fieldName="offerLetterFile"
                fieldLabel="Offer Letter"
              />
            </div>
          )}
          {form.placementStatus === "Unplaced" && (
            <div className="mt-5 grid gap-5 md:grid-cols-2">
              <TextAreaField
                label="What are you currently doing? *"
                value={form.placementDetailsText}
                disabled={isLocked}
                onChange={(e) => setField("placementDetailsText", e.target.value)}
                placeholder="Explain your current plan"
              />
              <FileField
                label="Placement Declaration *"
                accept=".pdf,application/pdf"
                file={form.placementDeclarationFile}
                disabled={isLocked}
                onChange={(f) => setField("placementDeclarationFile", f)}
                helper="PDF only"
                existingUrl={savedProfile?.placementDeclarationFileUrl || ""}
                fieldName="placementDeclarationFile"
                fieldLabel="Placement Declaration"
              />
            </div>
          )}
          {(form.placementStatus === "Preparation Break" || form.placementStatus === "Family Business") && (
            <div className="mt-5 max-w-xl">
              <FileField
                label="Placement Declaration *"
                accept=".pdf,application/pdf"
                file={form.placementDeclarationFile}
                disabled={isLocked}
                onChange={(f) => setField("placementDeclarationFile", f)}
                helper="PDF only"
                existingUrl={savedProfile?.placementDeclarationFileUrl || ""}
                fieldName="placementDeclarationFile"
                fieldLabel="Placement Declaration"
              />
            </div>
          )}
          {isHigherStudies && (
            <>
              <div className="mt-5 grid gap-5 md:grid-cols-2">
                <FileField
                  label="Admission Letter"
                  accept=".pdf,.jpg,.jpeg,.png"
                  file={form.admissionLetterFile}
                  disabled={isLocked}
                  onChange={(f) => setField("admissionLetterFile", f)}
                  existingUrl={savedProfile?.admissionLetterFileUrl || ""}
                  fieldName="admissionLetterFile"
                  fieldLabel="Admission Letter"
                />
                <FileField
                  label="Exam Scorecard / Call Letter"
                  accept=".pdf,.jpg,.jpeg,.png"
                  file={form.examScorecardFile}
                  disabled={isLocked}
                  onChange={(f) => setField("examScorecardFile", f)}
                  existingUrl={savedProfile?.examScorecardFileUrl || ""}
                  fieldName="examScorecardFile"
                  fieldLabel="Exam Scorecard"
                />
              </div>
              <WarningText>At least one of admission letter or exam scorecard is mandatory.</WarningText>
            </>
          )}
        </SectionCard>

        {/* ── 5. Refund / Declaration ── */}
        <SectionCard
          title="5. Refund / Declaration Details"
          subtitle="Bank and declaration information for caution money refund."
        >
          <div className="grid gap-5 md:grid-cols-2">
            <InputField label="Account Holder Name *" value={form.accountHolderName} disabled={isLocked} onChange={(e) => setField("accountHolderName", e.target.value)} />
            <InputField label="Bank Account Number *" value={form.bankAccountNumber} disabled={isLocked} onChange={(e) => setField("bankAccountNumber", e.target.value)} />
            <InputField label="Bank Name *" value={form.bankName} disabled={isLocked} onChange={(e) => setField("bankName", e.target.value)} />
            <InputField label="Branch *" value={form.bankBranch} disabled={isLocked} onChange={(e) => setField("bankBranch", e.target.value)} />
            <InputField label="City *" value={form.bankCity} disabled={isLocked} onChange={(e) => setField("bankCity", e.target.value)} />
            <InputField label="IFSC Code *" value={form.ifscCode} disabled={isLocked} onChange={(e) => setField("ifscCode", e.target.value.toUpperCase())} />
            <InputField label="Donation Amount (₹)" type="number" value={form.donationAmount} disabled={isLocked} onChange={(e) => setField("donationAmount", e.target.value)} />
            <InputField label="Student Contact Number *" value={form.studentContactNumber} disabled={isLocked} onChange={(e) => setField("studentContactNumber", e.target.value)} />
            <InputField label="Father's Name *" value={form.fatherName} disabled={isLocked} onChange={(e) => setField("fatherName", e.target.value)} />
            <InputField label="Father's Mobile Number *" value={form.fatherMobileNumber} disabled={isLocked} onChange={(e) => setField("fatherMobileNumber", e.target.value)} />
          </div>
          <div className="mt-5">
            <TextAreaField label="Correspondence Address *" value={form.correspondenceAddress} disabled={isLocked} onChange={(e) => setField("correspondenceAddress", e.target.value)} placeholder="Full correspondence address" />
          </div>
          <div className="mt-5 grid gap-5 md:grid-cols-2">
            <FileField
              label="Cancelled Cheque *"
              accept=".png,.jpg,.jpeg,image/png,image/jpeg"
              file={form.cancelledChequeFile}
              disabled={isLocked}
              onChange={(f) => setField("cancelledChequeFile", f)}
              helper="PNG / JPG / JPEG only"
              existingUrl={savedProfile?.cancelledChequeFileUrl || ""}
              fieldName="cancelledChequeFile"
              fieldLabel="Cancelled Cheque"
            />
            <div className="rounded-xl border border-white/10 bg-black/20 p-4">
              <p className="text-sm font-semibold text-white/80">Refund Declaration</p>
              <p className="mt-3 text-sm text-white/70">
                I wish to donate ₹{form.donationAmount || "0"} from my caution money refund towards the Students Welfare Fund of LNMIIT.
              </p>
              <div className="mt-4">
                <label className="flex items-start gap-3 text-sm text-white/80">
                  <input
                    type="checkbox"
                    checked={form.declarationAccepted}
                    disabled={isLocked}
                    onChange={(e) => setField("declarationAccepted", e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-white/20 bg-neutral-950"
                  />
                  <span>I declare that the above information is correct. *</span>
                </label>
              </div>
              <div className="mt-4">
                <label className="block text-sm text-white/80">Submitted Date (auto-set on save)</label>
                <input
                  type="date"
                  value={form.submittedDate}
                  disabled
                  className="mt-2 w-full rounded-xl border border-white/15 bg-neutral-950 px-4 py-3 text-sm text-white opacity-70"
                />
              </div>
            </div>
          </div>
        </SectionCard>

        {/* ── 6. Final Confirmation ── */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">6. Final Confirmation</h2>
            <p className="mt-1 text-sm text-white/60">
              {!canEdit
                ? "Profile locked."
                : isLocked
                ? "Profile locked. Click \"Edit Profile\" to make changes."
                : profileComplete
                  ? "All fields filled — ready to save."
                  : "Fill all required (*) fields to mark profile complete."}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {profileSaved && isActuallyComplete && !currentApplication && (
              <button
                type="button"
                onClick={() => navigate("/student/apply")}
                className="rounded-xl border border-emerald-400/40 bg-emerald-500/10 px-5 py-3 text-sm font-semibold text-emerald-300 hover:bg-emerald-500/20"
              >
                Go to Apply for No Dues →
              </button>
            )}
            {isOnHold && (
              <button
                type="button"
                onClick={() => navigate("/student/track")}
                className="rounded-xl border border-red-400/40 bg-red-500/10 px-5 py-3 text-sm font-semibold text-red-300 hover:bg-red-500/20"
              >
                Go to Track to Reapply →
              </button>
            )}
            <button
              type="button"
              disabled={isLocked || isSubmitting}
              onClick={() => setConfirmOpen(true)}
              className={`rounded-xl px-5 py-3 text-sm font-semibold text-white ${isLocked || isSubmitting ? "cursor-not-allowed bg-blue-600/40" : "bg-blue-600 hover:bg-blue-700"}`}
            >
              {isSubmitting ? "Saving…" : "Save Profile"}
            </button>
          </div>
        </div>
      </div>

      <ConfirmModal
        open={confirmOpen}
        title="Confirm Profile Save"
        message="Please confirm all information is correct. The profile will be locked until you click Edit Profile."
        confirmText="Yes, save"
        cancelText="Cancel"
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleConfirmSave}
      />
    </>
  );
}