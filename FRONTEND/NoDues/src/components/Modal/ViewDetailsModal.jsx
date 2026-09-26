/**
 * ViewDetailsModal — Enhanced Department View Details Modal
 *
 * Sections:
 *  1. Basic Info         — name, roll, email, phone
 *  2. Current Status     — this department's approval status + rejection details
 *  3. Prerequisite Approvals — (dependent depts only) sibling step statuses
 *  4. Department-Specific Details — warden/library/store/placement/accounts
 *  5. Documents          — ID card image, PDF preview (via secure proxy)
 *  6. Reject Info        — shown prominently if this step is rejected
 *
 * Props:
 *   open             — boolean
 *   student          — the step object (from PendingRequests list), contains _id, requestId, etc.
 *   currentDepartment — short string key e.g. "warden" | "library_staff" | "library_librarian"
 *                       | "store" | "placement" | "accounts" | "hod" | "nad" | "medical" etc.
 *   onClose          — function
 */

import { useEffect, useState, useCallback } from "react";
import api from "../../api/client";

// ── In-app File Preview Modal ─────────────────────────────────────────────────
// Uses Google Docs Viewer for PDFs so Cloudinary's Content-Disposition:
// attachment header doesn't trigger a browser download.
function FilePreviewModal({ url, onClose }) {
  // Keep a stable ref to onClose so the ESC effect never stale-closes.
  const onCloseRef = { current: onClose };
  onCloseRef.current = onClose;

  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);

  // ESC to close — registered once on mount.
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onCloseRef.current(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!url) return null;

  // Detect PDF: Cloudinary raw uploads contain '/raw/' in the path, or URL ends in .pdf
  const isPdf = /\.pdf(\?|$)/i.test(url) || url.includes('/raw/');

  // Google Docs Viewer renders any public URL (including Cloudinary) without Content-Disposition issues
  const googleViewerUrl = `https://docs.google.com/gview?url=${encodeURIComponent(url)}&embedded=true`;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* Backdrop */}
      <button
        type="button"
        onClick={onClose}
        className="absolute inset-0 bg-black/85 backdrop-blur-sm"
        aria-label="Close preview"
      />
      {/* Panel */}
      <div className="relative z-10 flex flex-col w-full max-w-4xl max-h-[92vh] rounded-2xl border border-white/15 bg-neutral-900 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 shrink-0">
          <p className="text-sm font-semibold text-white/80">
            Document Preview {isPdf ? '· PDF' : '· Image'}
          </p>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-white/50 hover:bg-white/10 hover:text-white transition"
            aria-label="Close"
          >
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto bg-neutral-950 flex items-center justify-center">
          {isPdf ? (
            /* PDF → Google Docs Viewer bypasses Cloudinary's attachment header */
            <iframe
              key={url}
              src={googleViewerUrl}
              title="Document preview"
              className="w-full h-[78vh] border-0"
              allow="autoplay"
            />
          ) : imgError ? (
            <div className="flex flex-col items-center gap-3 py-12 text-white/40">
              <span className="text-4xl">🖼️</span>
              <p className="text-sm">Could not load image.</p>
            </div>
          ) : (
            <div className="relative flex items-center justify-center p-3 min-h-[40vh]">
              {!imgLoaded && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/10 border-t-white/60" />
                </div>
              )}
              <img
                src={url}
                alt="Document preview"
                className={`max-h-[75vh] max-w-full object-contain rounded-lg select-none transition-opacity duration-300 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
                onLoad={() => setImgLoaded(true)}
                onError={() => { setImgError(true); setImgLoaded(true); }}
                onContextMenu={(e) => e.preventDefault()}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Status pill ──────────────────────────────────────────────────────────
function StatusPill({ status }) {
  if (status === "approved")
    return <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/40 bg-emerald-500/15 px-3 py-1 text-xs font-bold text-emerald-300 shadow-sm shadow-emerald-900/30">✓ Approved</span>;
  if (status === "rejected")
    return <span className="inline-flex items-center gap-1 rounded-full border border-rose-400/40 bg-rose-500/15 px-3 py-1 text-xs font-bold text-rose-300 shadow-sm shadow-rose-900/30">✕ On Hold</span>;
  if (status === "locked")
    return <span className="inline-flex items-center rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold text-white/40">⏳ Waiting</span>;
  return <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/40 bg-amber-500/15 px-3 py-1 text-xs font-bold text-amber-300 shadow-sm shadow-amber-900/30">● Pending</span>;
}

// ── Info row ──────────────────────────────────────────────────────────
function InfoRow({ label, value }) {
  return (
    <div className="rounded-lg border border-white/8 bg-gradient-to-b from-white/[0.07] to-white/[0.03] px-3 py-2.5">
      <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wider text-white/40">{label}</p>
      <p className="text-sm font-medium text-white/90 break-all">{value || "—"}</p>
    </div>
  );
}

// ── Section heading ──────────────────────────────────────────────────────
function SectionHeading({ children }) {
  return (
    <div className="flex items-center gap-3 mb-3">
      <div className="h-4 w-0.5 rounded-full bg-gradient-to-b from-white/40 to-white/10" />
      <p className="text-[11px] font-bold uppercase tracking-widest text-white/50">{children}</p>
    </div>
  );
}

// ── In-modal document viewer ───────────────────────────────────────────────────
// stepId — used to call GET /clearance/:stepId/file/:fieldName (dept officer auth)
function DocPreview({ label, fieldName, isPdf = false, stepId }) {
  const [url, setUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!stepId) { setLoading(false); setError("Step ID missing."); return; }
    let objectUrl = null;
    setLoading(true);
    setError("");
    setUrl(null);

    api.get(`/clearance/${stepId}/file/${fieldName}`, { responseType: "blob" })
      .then((res) => {
        const type = isPdf
          ? "application/pdf"
          : (res.data.type && res.data.type !== "application/octet-stream" ? res.data.type : "image/jpeg");
        const blob = new Blob([res.data], { type });
        objectUrl = URL.createObjectURL(blob);
        setUrl(objectUrl);
      })
      .catch((err) => setError(err.response?.data?.error || "Could not load document."))
      .finally(() => setLoading(false));

    return () => { if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [fieldName, isPdf, stepId]);

  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-white/5">
      {/* Card header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/10">
        <p className="text-sm font-semibold text-white/80">{label}</p>
        {url && (
          <a href={url} target="_blank" rel="noreferrer"
            className="text-xs text-white/40 hover:text-white/70 underline transition-colors">
            Open ↗
          </a>
        )}
      </div>

      {/* Content */}
      <div className="p-3">
        {loading && (
          <div className="flex items-center gap-2 py-4">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/10 border-t-white/60" />
            <p className="text-xs text-white/40">Loading…</p>
          </div>
        )}
        {!loading && error && (
          <p className="py-3 text-xs text-rose-400">{error}</p>
        )}
        {url && !isPdf && (
          <img src={url} alt={label}
            className="max-h-64 w-full rounded-lg object-contain border border-white/10 bg-black" />
        )}
        {url && isPdf && (
          <iframe
            title={label}
            src={`${url}#toolbar=1&navpanes=0`}
            className="w-full rounded-lg border border-white/10 bg-white"
            style={{ height: "360px", minHeight: "300px" }}
            allow="fullscreen"
          />
        )}
      </div>
    </div>
  );
}
// ── Reapply evidence viewer (proxied via /clearance/reapply/proof/:stepId/0) ───
// Uses the same clearance-side auth as DocPreview but hits the reapply proof route.
function ReapplyProofPreview({ stepId }) {
  const [url, setUrl] = useState(null);
  const [isPdf, setIsPdf] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!stepId) { setLoading(false); return; }
    let objectUrl = null;
    setLoading(true);
    setError("");
    setUrl(null);

    api.get(`/clearance/reapply/proof/${stepId}/0`, { responseType: "blob" })
      .then((res) => {
        const ct = res.data.type || "";
        const pdf = ct === "application/pdf" || ct.includes("pdf");
        setIsPdf(pdf);
        const blob = new Blob([res.data], { type: pdf ? "application/pdf" : ct || "image/jpeg" });
        objectUrl = URL.createObjectURL(blob);
        setUrl(objectUrl);
      })
      .catch((err) => {
        const msg = err.response?.data?.error || "Could not load document.";
        setError(msg);
      })
      .finally(() => setLoading(false));

    return () => { if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [stepId]);

  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-white/5">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/10">
        <p className="text-sm font-semibold text-white/80">Supporting Document</p>
        {url && (
          <a href={url} target="_blank" rel="noreferrer"
            className="text-xs text-white/40 hover:text-white/70 underline transition-colors">
            Open ↗
          </a>
        )}
      </div>
      <div className="p-3">
        {loading && (
          <div className="flex items-center gap-2 py-4">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/10 border-t-white/60" />
            <p className="text-xs text-white/40">Loading…</p>
          </div>
        )}
        {!loading && error && <p className="py-3 text-xs text-rose-400">{error}</p>}
        {url && !isPdf && (
          <img src={url} alt="Reapply proof"
            className="max-h-64 w-full rounded-lg object-contain border border-white/10 bg-black" />
        )}
        {url && isPdf && (
          <iframe
            title="Reapply proof"
            src={`${url}#toolbar=1&navpanes=0`}
            className="w-full rounded-lg border border-white/10 bg-white"
            style={{ height: "340px", minHeight: "280px" }}
            allow="fullscreen"
          />
        )}
      </div>
    </div>
  );
}

// ── Department-specific detail tables ───────────────────────────────────────
function WardenSection({ profile }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <InfoRow label="Last Stayed Hostel" value={profile?.hostel} />
    </div>
  );
}

function LibrarySection({ profile, hasDoc, stepId }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <InfoRow label="Library Email Sent Date" value={profile?.libraryEmailDate} />
      </div>
      {hasDoc
        ? <DocPreview label="BTP Report" fieldName="btpReportFile" isPdf stepId={stepId} />
        : <p className="text-sm text-white/40">BTP Report not uploaded yet.</p>
      }
    </div>
  );
}

function StoreSection({ profile }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <InfoRow label="Club / Fest Role" value={profile?.clubRoleType} />
      {(profile?.clubRoleType === "Club Coordinator" || profile?.clubRoleType === "Both") && (
        <InfoRow label="Club / Role Detail" value={profile?.clubRoleDetail} />
      )}
      {(profile?.clubRoleType === "Fest Organizing Committee" || profile?.clubRoleType === "Both") && (
        <InfoRow label="Fest Role Detail" value={profile?.festRoleDetail} />
      )}
    </div>
  );
}

function PlacementSection({ profile, stepId }) {
  const ps = profile?.placementStatus;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <InfoRow label="Placement Status" value={ps} />
        <InfoRow label="TPC Email Sent Date" value={profile?.tpcEmailDate} />
        {ps === "Unplaced" && <InfoRow label="Current Activity" value={profile?.placementDetailsText} />}
      </div>
      <div className="grid grid-cols-1 gap-3">
        {ps === "Placed" && profile?.hasOfferLetter && (
          <DocPreview label="Offer Letter" fieldName="offerLetterFile" isPdf stepId={stepId} />
        )}
        {(ps === "Unplaced" || ps === "Preparation Break" || ps === "Family Business") && profile?.hasPlacementDeclaration && (
          <DocPreview label="Placement Declaration" fieldName="placementDeclarationFile" isPdf stepId={stepId} />
        )}
        {(ps === "Higher Studies India" || ps === "Higher Studies Abroad") && (
          <>
            {profile?.hasAdmissionLetter && <DocPreview label="Admission Letter" fieldName="admissionLetterFile" isPdf stepId={stepId} />}
            {profile?.hasExamScorecard && <DocPreview label="Exam Scorecard" fieldName="examScorecardFile" isPdf stepId={stepId} />}
          </>
        )}
      </div>
    </div>
  );
}

function AccountsSection({ profile, stepId }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <InfoRow label="Account Holder Name" value={profile?.accountHolderName} />
        <InfoRow label="Bank Account Number" value={profile?.bankAccountNumber} />
        <InfoRow label="Bank Name" value={profile?.bankName} />
        <InfoRow label="Bank Branch" value={profile?.bankBranch} />
        <InfoRow label="Bank City" value={profile?.bankCity} />
        <InfoRow label="IFSC Code" value={profile?.ifscCode} />
        <InfoRow label="Donation Amount" value={profile?.donationAmount ? `₹${profile.donationAmount}` : "—"} />
        <InfoRow label="Father's Name" value={profile?.fatherName} />
        <InfoRow label="Father's Mobile" value={profile?.fatherMobileNumber} />
      </div>
      <InfoRow label="Correspondence Address" value={profile?.correspondenceAddress} />
      {profile?.hasCancelledCheque && (
        <DocPreview label="Cancelled Cheque" fieldName="cancelledChequeFile" isPdf={false} stepId={stepId} />
      )}
    </div>
  );
}

// ── Prerequisite Approvals ─────────────────────────────────────────────────────
// Which steps to show per department type
const PREREQ_MAP = {
  library_librarian: ["library_staff"],
  nad: ["hod_cse", "hod_ece", "hod_cce", "hod_mech"],
  store: ["hod_cse", "hod_ece", "hod_cce", "hod_mech", "warden"],
  hod: [
    "lucs", "library_librarian",
    "cse_lab_1", "cse_lab_2", "cse_lab_3", "cse_lab_cmlbda",
    "ece_lab_microwave", "ece_lab_adc", "ece_lab_ti", "ece_lab_dsp", "ece_lab_ecad", "ece_lab_be", "ece_lab_kundan",
    "mech_lab_workshop", "mech_lab_mechatronics", "mech_lab_robotics", "mech_lab_cim", "mech_lab_cad",
    "mech_lab_kd", "mech_lab_material", "mech_lab_measurement", "mech_lab_fmm", "mech_lab_ic_engine",
    "mech_lab_thermodynamics", "mech_lab_heat_transfer", "mech_lab_eng_graphics", "mech_lab_automotive", "mech_lab_cria",
    "physics_lab_ug", "physics_lab_optics",
  ],
  accounts: null, // show everything
};

function PrereqSection({ allSteps, department }) {
  if (!allSteps || allSteps.length === 0) return null;

  // Determine which unitCodes to show
  const deptKey = department?.startsWith("hod") ? "hod" : department;
  const filter = PREREQ_MAP[deptKey];

  let toShow;
  if (filter === null) {
    // accounts: show all except itself
    toShow = allSteps.filter(s => !s.unitCode.startsWith("accounts"));
  } else if (Array.isArray(filter)) {
    toShow = allSteps.filter(s => filter.includes(s.unitCode));
  } else {
    return null; // no prereqs defined for this dept
  }

  if (toShow.length === 0) return null;

  return (
    <div className="space-y-2">
      {toShow.map((s) => (
        <div key={s.unitCode} className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2">
          <p className="text-sm text-white/80">{s.unitLabel}</p>
          <StatusPill status={s.status} />
        </div>
      ))}
    </div>
  );
}

// ── Determine which dept-specific section to render ────────────────────────────
function DeptSpecificSection({ department, profile, stepId }) {
  if (!profile) return null;
  const d = (department || "").toLowerCase();

  if (d === "warden") return <WardenSection profile={profile} />;
  if (d === "library_staff" || d === "library_librarian")
    return <LibrarySection profile={profile} hasDoc={profile.hasBtpReport} stepId={stepId} />;
  if (d === "store") return <StoreSection profile={profile} />;
  if (d === "placement") return <PlacementSection profile={profile} stepId={stepId} />;
  if (d === "accounts") return <AccountsSection profile={profile} stepId={stepId} />;
  return null;
}

// ── Main modal ─────────────────────────────────────────────────────────────────
export default function ViewDetailsModal({ open, student, currentDepartment, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState("");
  const [previewFile, setPreviewFile] = useState(null);

  // useDepartmentData flattens step._id into both `stepId` and `id` fields (not `_id`)
  const stepId = student?.stepId || student?.id || student?._id;

  const fetchFull = useCallback(async () => {
    if (!stepId) return;
    setLoading(true);
    setFetchError("");
    setData(null);
    try {
      const res = await api.get(`/clearance/${stepId}/full`);
      setData(res.data);
    } catch (err) {
      setFetchError(err.response?.data?.error || "Failed to load details.");
    } finally {
      setLoading(false);
    }
  }, [stepId]);

  useEffect(() => {
    if (open) fetchFull();
  }, [open, fetchFull]);

  // Scroll lock + Escape to close
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e) => { if (e.key === "Escape") onClose?.(); };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open || !student) return null;

  const step = data?.step;
  const profile = data?.profile;
  const allSteps = data?.allSteps || [];
  const requestInfo = data?.requestInfo;

  // Fallback to flat student fields while data is loading
  const name = requestInfo?.studentName || student?.studentName || student?.name || "—";
  const roll = requestInfo?.rollNo || student?.rollNo || student?.roll || "—";
  const email = requestInfo?.studentEmail || student?.studentEmail || student?.email || "—";
  const phone = profile?.phone || requestInfo?.phone || student?.phone || "—";
  const currentStatus = step?.status || student?.status || "pending";

  const showPrereq = ["library_librarian", "nad", "store", "accounts",
    "hod", "hod_cse", "hod_ece", "hod_cce", "hod_mech"].includes(currentDepartment);
  const showDeptSection = ["warden", "library_staff", "library_librarian",
    "store", "placement", "accounts"].includes(currentDepartment);

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-3">
      {/* Backdrop */}
      <button
        type="button"
        onClick={onClose}
        className="absolute inset-0 bg-black/75 backdrop-blur-[2px]"
        aria-label="Close modal backdrop"
      />

      {/* Modal */}
      <div className="relative flex flex-col w-full max-w-2xl max-h-[93vh] rounded-2xl border border-white/15 bg-neutral-900 text-white shadow-2xl">

        {/* ── Header ── */}
        <div className="flex items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-base font-semibold">Student Details</h2>
              <StatusPill status={currentStatus} />
            </div>
            <p className="mt-0.5 text-sm text-white/60">{name} ({roll})</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 hover:bg-white/10">
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
            </svg>
          </button>
        </div>

        {/* ── Body (scrollable) ── */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
          {loading && (
            <div className="flex items-center justify-center py-16">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/10 border-t-white/60" />
              <p className="ml-3 text-sm text-white/50">Loading details…</p>
            </div>
          )}

          {fetchError && !loading && (
            <div className="rounded-xl border border-rose-400/30 bg-rose-500/10 p-4">
              <p className="text-sm text-rose-300">{fetchError}</p>
            </div>
          )}

          {!loading && !fetchError && (
            <>
              {/* ── 1. Basic Info ── */}
              <div>
                <SectionHeading>Basic Information</SectionHeading>
                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                  <InfoRow label="Name" value={name} />
                  <InfoRow label="Roll Number" value={roll} />
                  <InfoRow label="Email" value={email} />
                  <InfoRow label="Phone" value={phone} />
                  <InfoRow label="Branch" value={profile?.branch || requestInfo?.branch} />
                </div>
              </div>

              {/* ── 2. Current Status ── */}
              <div>
                <SectionHeading>Department Status</SectionHeading>
                <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-white/70">This Department's Status</p>
                    <StatusPill status={currentStatus} />
                  </div>
                  {step?.actionBy && (
                    <p className="mt-1.5 text-xs text-white/40">
                      Actioned by {step.actionBy} on {new Date(step.actionAt).toLocaleString()}
                    </p>
                  )}
                </div>
              </div>

              {/* ── 2b. On Hold History (all holds from stepLogs) ── */}
              {(() => {
                const stepLogs = data?.stepLogs || [];
                const holdLogs = stepLogs.filter((l) => l.action === 'rejected');
                if (holdLogs.length === 0) return null;
                return (
                  <div>
                    <SectionHeading>On Hold History</SectionHeading>
                    <div className="space-y-2.5">
                      {holdLogs.map((log, i) => {
                        // Backend stores: note = `[${reason}] ${description}`
                        const raw = log.note || '';
                        const bracketMatch = raw.match(/^\[(.+?)\]\s*([\s\S]*)$/);
                        const reason      = bracketMatch ? bracketMatch[1].trim() : raw;
                        const description = bracketMatch ? bracketMatch[2].trim() : '';

                        return (
                          <div key={i} className="rounded-xl border border-rose-400/25 bg-rose-500/[0.08] p-3.5 space-y-1.5">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-rose-400/70">
                              Hold #{i + 1}
                            </p>
                            {reason && (
                              <div>
                                <p className="text-[10px] text-rose-300/50">Reason</p>
                                <p className="text-sm text-rose-200">{reason}</p>
                              </div>
                            )}
                            {description && (
                              <div>
                                <p className="text-[10px] text-rose-300/50">Description</p>
                                <p className="text-sm text-rose-200/80">{description}</p>
                              </div>
                            )}
                            <div className="flex flex-wrap gap-3 pt-0.5">
                              {log.actorEmail && log.actorEmail !== 'system' && (
                                <p className="text-[10px] text-white/35">
                                  By: <span className="text-white/55">{log.actorEmail}</span>
                                </p>
                              )}
                              {log.timestamp && (
                                <p className="text-[10px] text-white/30">
                                  {new Date(log.timestamp).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

              {/* ── 2c. Reapply History (all reapply attempts from stepLogs) ── */}
              {(() => {
                const stepLogs = data?.stepLogs || [];
                const reapplyLogs = stepLogs.filter((l) => l.action === 'reapply');
                if (reapplyLogs.length === 0) return null;
                return (
                  <div>
                    <SectionHeading>Reapply History</SectionHeading>
                    <div className="space-y-2.5">
                      {reapplyLogs.map((log, i) => {
                        // Each log stores the comment in `note` and files in `proofUrls`
                        const comment  = log.note?.trim() || '';
                        const hasFile  = log.proofUrls?.length > 0;
                        const hasAny   = comment || hasFile;

                        return (
                          <div key={i} className="rounded-xl border border-blue-400/20 bg-blue-500/[0.06] p-3.5 space-y-2">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-blue-400/60">
                              Reapply #{i + 1}
                            </p>

                            {hasAny ? (
                              <>
                                {comment ? (
                                  <div>
                                    <p className="text-[10px] text-blue-300/50">Student Comment</p>
                                    <p className="text-sm text-blue-100 leading-relaxed whitespace-pre-wrap">{comment}</p>
                                  </div>
                                ) : (
                                  <p className="text-xs text-white/30 italic">No comment provided.</p>
                                )}

                                {hasFile && (
                                  <div className="flex flex-wrap gap-2 pt-0.5">
                                    {log.proofUrls.map((url, fi) => (
                                      <button
                                        key={fi}
                                        type="button"
                                        onClick={() => setPreviewFile(url)}
                                        className="inline-flex items-center gap-1.5 rounded-lg border border-blue-400/25 bg-blue-500/10 px-3 py-1.5 text-xs text-blue-200 hover:bg-blue-500/20 transition"
                                      >
                                        📎 View Document {log.proofUrls.length > 1 ? fi + 1 : ''}
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </>
                            ) : (
                              /* Edge case: student submitted reapply with NO comment AND NO file */
                              <p className="text-xs text-white/30 italic">
                                No clarification provided by student.
                              </p>
                            )}

                            {log.timestamp && (
                              <p className="text-[10px] text-white/25 pt-0.5">
                                {new Date(log.timestamp).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

              {/* ── 3. Prerequisite Approvals ── */}
              {showPrereq && allSteps.length > 0 && (
                <div>
                  <SectionHeading>Prerequisite Approvals</SectionHeading>
                  <PrereqSection allSteps={allSteps} department={currentDepartment} />
                </div>
              )}

              {/* ── 4. Department-Specific Details ── */}
              {showDeptSection && profile && (
                <div>
                  <SectionHeading>Department Details</SectionHeading>
                  <DeptSpecificSection department={currentDepartment} profile={profile} stepId={stepId} />
                </div>
              )}

              {/* ── 5. Documents — ID Card (all depts see it) ── */}
              <div>
                <SectionHeading>Documents</SectionHeading>
                {profile?.hasIdCard
                  ? <DocPreview label="Student ID Card" fieldName="idCardFile" isPdf={false} stepId={stepId} />
                  : <p className="text-sm text-white/40">ID Card not uploaded.</p>
                }
              </div>
            </>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="flex justify-end border-t border-white/10 px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-white/15 px-4 py-2 text-sm font-medium text-white/90 hover:bg-white/10"
          >
            Close
          </button>
        </div>
      </div>

      {/* In-app file preview — z-[200] sits above this modal (z-[120]) */}
      {previewFile && (
        <FilePreviewModal url={previewFile} onClose={() => setPreviewFile(null)} />
      )}
    </div>
  );
}