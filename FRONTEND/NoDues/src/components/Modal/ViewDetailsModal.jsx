/**
 * ViewDetailsModal — department "View Details" modal
 *
 * Every department sees:
 *  1. Basic Info            — name, roll, email, phone, branch
 *  2. Status                — overall application status + this department's status
 *  3. Timeline              — this department's events (holds with reasons, reapplies, approvals)
 *  4. On Hold / Reapply History
 *  5. Prerequisite Approvals — status of the departments this step depends on
 *  6. ID Card
 * Plus only its own section (backend sends only that department's fields):
 *  placement → placement details + documents · library → BTP report + email date
 *  accounts → refund / declaration details + cancelled cheque · store → club/fest role
 *  warden → last stayed hostel
 *
 * Props:
 *   open, student (row from the department list: stepId/id), onClose
 *   currentDepartment — fallback only; the step's own unitCode from the backend is used
 */

import { useEffect, useState, useCallback, useRef } from "react";
import api from "../../api/client";

// ── Blob preview for proof files (served through the auth-gated proxy) ────────
function FilePreviewModal({ file, onClose }) {
  const onCloseRef = useRef(onClose);
  useEffect(() => { onCloseRef.current = onClose; }, [onClose]);

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onCloseRef.current(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (!file) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <button type="button" onClick={onClose} className="absolute inset-0 bg-black/85 backdrop-blur-sm" aria-label="Close preview" />
      <div className="relative z-10 flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-white/15 bg-neutral-900 shadow-2xl">
        <div className="flex shrink-0 items-center justify-between border-b border-white/10 px-4 py-3">
          <p className="text-sm font-semibold text-white/80">Document Preview {file.isPdf ? "· PDF" : "· Image"}</p>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-white/50 transition hover:bg-white/10 hover:text-white" aria-label="Close">✕</button>
        </div>
        <div className="flex flex-1 items-center justify-center overflow-auto bg-neutral-950">
          {file.isPdf ? (
            <iframe src={file.url} title="Document preview" className="h-[78vh] w-full border-0 bg-white" />
          ) : (
            <img src={file.url} alt="Document preview" className="max-h-[75vh] max-w-full rounded-lg object-contain p-3" />
          )}
        </div>
      </div>
    </div>
  );
}

// ── Small building blocks ──────────────────────────────────────────────────────
function StatusPill({ status }) {
  if (status === "approved")
    return <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/40 bg-emerald-500/15 px-3 py-1 text-xs font-bold text-emerald-300">✓ Approved</span>;
  if (status === "rejected")
    return <span className="inline-flex items-center gap-1 rounded-full border border-rose-400/40 bg-rose-500/15 px-3 py-1 text-xs font-bold text-rose-300">✕ On Hold</span>;
  if (status === "locked")
    return <span className="inline-flex items-center rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold text-white/40">⏳ Waiting</span>;
  return <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/40 bg-amber-500/15 px-3 py-1 text-xs font-bold text-amber-300">● Pending</span>;
}

const APPLICATION_STATUS = {
  in_progress: { label: "In Progress", className: "text-amber-300" },
  action_required: { label: "On Hold", className: "text-rose-300" },
  approved: { label: "Completed", className: "text-emerald-300" },
  submitted: { label: "Submitted", className: "text-blue-300" },
};

function InfoRow({ label, value }) {
  return (
    <div className="rounded-lg border border-white/8 bg-gradient-to-b from-white/[0.07] to-white/[0.03] px-3 py-2.5">
      <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wider text-white/40">{label}</p>
      <p className="break-all text-sm font-medium text-white/90">{value || "—"}</p>
    </div>
  );
}

function SectionHeading({ children }) {
  return (
    <div className="mb-3 flex items-center gap-3">
      <div className="h-4 w-0.5 rounded-full bg-gradient-to-b from-white/40 to-white/10" />
      <p className="text-[11px] font-bold uppercase tracking-widest text-white/50">{children}</p>
    </div>
  );
}

const fmt = (d) => (d ? new Date(d).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "");

// Backend stores hold notes as "[reason] description"
function parseHoldNote(note = "") {
  const m = note.match(/^\[(.+?)\]\s*([\s\S]*)$/);
  return m ? { reason: m[1].trim(), description: m[2].trim() } : { reason: note, description: "" };
}

// ── Student document (proxied by step, only the department's own documents) ───
function DocPreview({ label, fieldName, isPdf = false, stepId }) {
  const [url, setUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let objectUrl = null;
    let cancelled = false;
    api.get(`/clearance/${stepId}/file/${fieldName}`, { responseType: "blob" })
      .then((res) => {
        if (cancelled) return;
        const type = isPdf
          ? "application/pdf"
          : (res.data.type && res.data.type !== "application/octet-stream" ? res.data.type : "image/jpeg");
        objectUrl = URL.createObjectURL(new Blob([res.data], { type }));
        setUrl(objectUrl);
      })
      .catch((err) => { if (!cancelled) setError(err.response?.status === 404 ? "Not uploaded." : "Could not load document."); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [fieldName, isPdf, stepId]);

  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-white/5">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-2.5">
        <p className="text-sm font-semibold text-white/80">{label}</p>
        {url && <a href={url} target="_blank" rel="noreferrer" className="text-xs text-white/40 underline transition-colors hover:text-white/70">Open ↗</a>}
      </div>
      <div className="p-3">
        {loading && <p className="py-3 text-xs text-white/40">Loading…</p>}
        {!loading && error && <p className="py-3 text-xs text-rose-400">{error}</p>}
        {url && !isPdf && <img src={url} alt={label} className="max-h-96 w-full rounded-lg border border-white/10 bg-black object-contain" />}
        {url && isPdf && (
          <iframe title={label} src={`${url}#toolbar=1&navpanes=0`} className="w-full rounded-lg border border-white/10 bg-white" style={{ height: "480px", minHeight: "320px" }} />
        )}
      </div>
    </div>
  );
}

// Button that loads a timeline proof file through the proxy and opens the preview
function ProofButton({ stepId, logId, index, label, onOpen }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const open = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get(`/clearance/${stepId}/logs/${logId}/proof/${index}`, { responseType: "blob" });
      const type = res.data.type || "application/octet-stream";
      const isPdf = type.includes("pdf");
      onOpen({ url: URL.createObjectURL(new Blob([res.data], { type: isPdf ? "application/pdf" : type })), isPdf });
    } catch {
      setError("Could not load file");
    } finally {
      setLoading(false);
    }
  };

  return (
    <span className="inline-flex items-center gap-2">
      <button type="button" onClick={open} disabled={loading}
        className="inline-flex items-center gap-1.5 rounded-lg border border-blue-400/25 bg-blue-500/10 px-3 py-1.5 text-xs text-blue-200 transition hover:bg-blue-500/20 disabled:opacity-50">
        📎 {loading ? "Loading…" : label}
      </button>
      {error && <span className="text-xs text-rose-400">{error}</span>}
    </span>
  );
}

// ── Timeline (this department's step) ─────────────────────────────────────────
const EVENT_CFG = {
  created: { icon: "＋", label: "Application received", tone: "text-white/40" },
  unlocked: { icon: "🔓", label: "Unlocked — prerequisites approved", tone: "text-white/40" },
  relocked: { icon: "🔒", label: "Locked again — a prerequisite is no longer approved", tone: "text-white/40" },
  approved: { icon: "✓", label: "Approved", tone: "text-emerald-300" },
  rejected: { icon: "⊘", label: "Put On Hold", tone: "text-rose-300" },
  reapply: { icon: "↩", label: "Student reapplied", tone: "text-blue-300" },
  student_replied: { icon: "💬", label: "Student replied", tone: "text-blue-300" },
  reopened: { icon: "⟳", label: "Back in review", tone: "text-white/50" },
};

function Timeline({ logs, stepId, onOpenFile }) {
  if (logs.length === 0) return <p className="text-sm text-white/40">No events yet.</p>;
  return (
    <div className="space-y-2">
      {logs.map((log) => {
        const cfg = EVENT_CFG[log.action] || { icon: "·", label: log.action, tone: "text-white/50" };
        const hold = log.action === "rejected" ? parseHoldNote(log.note) : null;
        const isStudentNote = log.action === "reapply" || log.action === "student_replied";
        return (
          <div key={log._id} className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2.5">
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
              <span className={`text-xs font-semibold ${cfg.tone}`}>{cfg.icon} {cfg.label}</span>
              {log.actorEmail && log.actorEmail !== "system" && <span className="text-[10px] text-white/40">by {log.actorEmail}</span>}
              <span className="ml-auto text-[10px] text-white/30">{fmt(log.timestamp)}</span>
            </div>
            {hold && (
              <div className="mt-1.5 space-y-0.5">
                {hold.reason && <p className="text-xs text-rose-200"><span className="text-rose-300/60">Reason:</span> {hold.reason}</p>}
                {hold.description && <p className="text-xs text-rose-200/80"><span className="text-rose-300/60">Details:</span> {hold.description}</p>}
              </div>
            )}
            {isStudentNote && (
              <p className="mt-1.5 whitespace-pre-wrap text-xs text-blue-100/90">
                {log.note?.trim() ? log.note : <span className="italic text-white/30">No comment provided.</span>}
              </p>
            )}
            {log.action === "reopened" && log.note && log.note !== "Reset by student reapply" && (
              <p className="mt-1.5 whitespace-pre-wrap text-xs text-amber-100/80">{log.note}</p>
            )}
            {log.proofCount > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {Array.from({ length: log.proofCount }, (_, i) => (
                  <ProofButton key={i} stepId={stepId} logId={log._id} index={i}
                    label={log.proofCount > 1 ? `View document ${i + 1}` : "View document"} onOpen={onOpenFile} />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Department-specific sections ──────────────────────────────────────────────
function PlacementSection({ profile, stepId }) {
  const ps = profile.placementStatus;
  const docs = profile.documents || {};
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <InfoRow label="Placement Status" value={ps} />
        <InfoRow label="TPC Email Sent Date" value={profile.tpcEmailDate} />
        {ps === "Unplaced" && <InfoRow label="Current Activity" value={profile.placementDetailsText} />}
      </div>
      <div className="grid grid-cols-1 gap-3">
        {ps === "Placed" && docs.offerLetterFile && <DocPreview label="Offer Letter" fieldName="offerLetterFile" isPdf stepId={stepId} />}
        {["Unplaced", "Preparation Break", "Family Business"].includes(ps) && docs.placementDeclarationFile && (
          <DocPreview label="Placement Declaration" fieldName="placementDeclarationFile" isPdf stepId={stepId} />
        )}
        {(ps === "Higher Studies India" || ps === "Higher Studies Abroad") && (
          <>
            {docs.admissionLetterFile && <DocPreview label="Admission Letter" fieldName="admissionLetterFile" isPdf stepId={stepId} />}
            {docs.examScorecardFile && <DocPreview label="Exam Scorecard" fieldName="examScorecardFile" isPdf stepId={stepId} />}
          </>
        )}
      </div>
    </div>
  );
}

function LibrarySection({ profile, stepId }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <InfoRow label="Library Email Sent Date" value={profile.libraryEmailDate} />
      </div>
      {profile.documents?.btpReportFile
        ? <DocPreview label="BTP Report" fieldName="btpReportFile" isPdf stepId={stepId} />
        : <p className="text-sm text-white/40">BTP Report not uploaded.</p>}
    </div>
  );
}

function AccountsSection({ profile, stepId }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <InfoRow label="Account Holder Name" value={profile.accountHolderName} />
        <InfoRow label="Bank Account Number" value={profile.bankAccountNumber} />
        <InfoRow label="Bank Name" value={profile.bankName} />
        <InfoRow label="Bank Branch" value={profile.bankBranch} />
        <InfoRow label="Bank City" value={profile.bankCity} />
        <InfoRow label="IFSC Code" value={profile.ifscCode} />
        <InfoRow label="Donation Amount" value={profile.donationAmount ? `₹${profile.donationAmount}` : "—"} />
        <InfoRow label="Student Contact Number" value={profile.studentContactNumber} />
        <InfoRow label="Father's Name" value={profile.fatherName} />
        <InfoRow label="Father's Mobile" value={profile.fatherMobileNumber} />
      </div>
      <InfoRow label="Correspondence Address" value={profile.correspondenceAddress} />
      <InfoRow label="Declaration" value={profile.declarationAccepted ? "✓ Accepted by student" : "Not accepted"} />
      {profile.documents?.cancelledChequeFile
        ? <DocPreview label="Cancelled Cheque" fieldName="cancelledChequeFile" stepId={stepId} />
        : <p className="text-sm text-white/40">Cancelled cheque not uploaded.</p>}
    </div>
  );
}

function StoreSection({ profile }) {
  const t = profile.clubRoleType;
  return (
    <div className="grid grid-cols-2 gap-3">
      <InfoRow label="Club / Fest Role" value={t} />
      {(t === "Club Coordinator" || t === "Both") && <InfoRow label="Club / Role Detail" value={profile.clubRoleDetail} />}
      {(t === "Fest Organizing Committee" || t === "Both") && <InfoRow label="Fest Role Detail" value={profile.festRoleDetail} />}
    </div>
  );
}

function WardenSection({ profile }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <InfoRow label="Last Stayed Hostel" value={profile.hostel} />
    </div>
  );
}

const DEPT_SECTIONS = {
  placement: { title: "Placement Details", Component: PlacementSection },
  library_staff: { title: "Library Details", Component: LibrarySection },
  library_librarian: { title: "Library Details", Component: LibrarySection },
  accounts: { title: "Refund / Declaration Details", Component: AccountsSection },
  store: { title: "Club / Fest Role", Component: StoreSection },
  warden: { title: "Hostel Details", Component: WardenSection },
};

// ── Main modal ─────────────────────────────────────────────────────────────────
export default function ViewDetailsModal({ open, student, currentDepartment, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState("");
  const [previewFile, setPreviewFile] = useState(null);

  // useDepartmentData flattens step._id into both `stepId` and `id` fields
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
    const onKey = (e) => { if (e.key === "Escape" && !previewFile) onClose?.(); };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose, previewFile]);

  const closePreview = useCallback(() => {
    setPreviewFile((f) => { if (f) URL.revokeObjectURL(f.url); return null; });
  }, []);

  if (!open || !student) return null;

  const step = data?.step;
  const profile = data?.profile;
  const allSteps = data?.allSteps || [];
  const stepLogs = data?.stepLogs || [];
  const requestInfo = data?.requestInfo;
  const department = step?.unitCode || currentDepartment;

  const name = requestInfo?.studentName || student?.studentName || student?.name || "—";
  const roll = requestInfo?.rollNo || student?.rollNo || student?.roll || "—";
  const email = requestInfo?.studentEmail || student?.studentEmail || student?.email || "—";
  const currentStatus = step?.status || student?.status || "pending";
  const appStatus = APPLICATION_STATUS[requestInfo?.status];

  // Direct prerequisites, plus any departments this step asked to reset and is waiting on
  const waitingCodes = [...(step?.dependsOn || []), ...(step?.restartFrom || [])];
  const prerequisites = allSteps.filter((s) => waitingCodes.includes(s.unitCode));
  const holdLogs = stepLogs.filter((l) => l.action === "rejected");
  const reapplyLogs = stepLogs.filter((l) => l.action === "reapply" || l.action === "student_replied");
  const deptSection = DEPT_SECTIONS[department];

  const initials = name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase() || "?";
  const approvedCount = allSteps.filter((s) => s.status === "approved").length;
  const progressPct = allSteps.length ? Math.round((approvedCount / allSteps.length) * 100) : 0;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-2 sm:p-4">
      <button type="button" onClick={onClose} className="absolute inset-0 bg-black/80 backdrop-blur-sm" aria-label="Close modal backdrop" />

      <div className="relative flex h-[94vh] w-full max-w-6xl flex-col overflow-hidden rounded-3xl border border-white/15 bg-neutral-900 text-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 border-b border-white/10 bg-gradient-to-r from-white/[0.06] to-transparent px-6 py-5">
          <div className="flex min-w-0 items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/15 bg-gradient-to-br from-blue-500/30 to-violet-500/20 text-lg font-bold">
              {initials}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2.5">
                <h2 className="truncate text-xl font-semibold">{name}</h2>
                <StatusPill status={currentStatus} />
              </div>
              <p className="mt-1 truncate text-sm text-white/55">
                {roll} · {email}{step?.unitLabel ? ` · ${step.unitLabel}` : ""}
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="shrink-0 rounded-xl p-2 text-lg text-white/60 hover:bg-white/10 hover:text-white" aria-label="Close">✕</button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {loading && (
            <div className="flex h-full items-center justify-center py-16">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/10 border-t-white/60" />
              <p className="ml-3 text-sm text-white/50">Loading details…</p>
            </div>
          )}

          {fetchError && !loading && (
            <div className="rounded-xl border border-rose-400/30 bg-rose-500/10 p-4">
              <p className="text-sm text-rose-300">{fetchError}</p>
            </div>
          )}

          {!loading && !fetchError && data && (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
              {/* Left column: who the student is and where the application stands */}
              <div className="space-y-6 lg:col-span-2">
                <div>
                  <SectionHeading>Basic Information</SectionHeading>
                  <div className="grid grid-cols-2 gap-2.5">
                    <InfoRow label="Name" value={name} />
                    <InfoRow label="Roll Number" value={roll} />
                    <div className="col-span-2"><InfoRow label="Email" value={email} /></div>
                    <InfoRow label="Phone" value={profile?.phone} />
                    <InfoRow label="Branch" value={profile?.branch || requestInfo?.branch} />
                    <InfoRow label="Graduation" value={profile?.graduation} />
                  </div>
                </div>

                <div>
                  <SectionHeading>Application Status</SectionHeading>
                  <div className="space-y-3 rounded-xl border border-white/10 bg-white/5 px-4 py-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-white/70">Overall Application</p>
                      <span className={`text-sm font-semibold ${appStatus?.className || "text-white/60"}`}>{appStatus?.label || requestInfo?.status || "—"}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-white/70">This Department</p>
                      <StatusPill status={currentStatus} />
                    </div>
                    {allSteps.length > 0 && (
                      <div>
                        <div className="mb-1.5 flex justify-between text-xs text-white/50">
                          <span>Departments cleared</span>
                          <span>{approvedCount} / {allSteps.length}</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-white/10">
                          <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-300" style={{ width: `${progressPct}%` }} />
                        </div>
                      </div>
                    )}
                    {requestInfo?.submittedAt && <p className="text-xs text-white/40">Applied on {fmt(requestInfo.submittedAt)}</p>}
                    {step?.actionBy && <p className="text-xs text-white/40">Last action by {step.actionBy} on {fmt(step.actionAt)}</p>}
                  </div>
                </div>

                {prerequisites.length > 0 && (
                  <div>
                    <SectionHeading>Prerequisite Approvals</SectionHeading>
                    <div className="space-y-2">
                      {prerequisites.map((s) => (
                        <div key={s.unitCode} className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/5 px-3 py-2.5">
                          <p className="text-sm text-white/80">{s.unitLabel}</p>
                          <StatusPill status={s.status} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {(holdLogs.length > 0 || reapplyLogs.length > 0) && (
                  <div>
                    <SectionHeading>Application History</SectionHeading>
                    <div className="grid grid-cols-2 gap-2.5">
                      <InfoRow label="Times Put On Hold" value={String(holdLogs.length)} />
                      <InfoRow label="Times Student Reapplied" value={String(reapplyLogs.length)} />
                    </div>
                  </div>
                )}
              </div>

              {/* Right column: timeline, department-specific details, documents */}
              <div className="space-y-6 lg:col-span-3">
                <div>
                  <SectionHeading>Application Timeline</SectionHeading>
                  <Timeline logs={stepLogs} stepId={stepId} onOpenFile={setPreviewFile} />
                </div>

                {deptSection && profile && (
                  <div>
                    <SectionHeading>{deptSection.title}</SectionHeading>
                    <deptSection.Component profile={profile} stepId={stepId} />
                  </div>
                )}

                <div>
                  <SectionHeading>Documents</SectionHeading>
                  {profile?.documents?.idCardFile
                    ? <DocPreview label="Student ID Card" fieldName="idCardFile" stepId={stepId} />
                    : <p className="text-sm text-white/40">ID Card not uploaded.</p>}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end border-t border-white/10 px-6 py-3.5">
          <button type="button" onClick={onClose} className="rounded-xl border border-white/15 px-5 py-2 text-sm font-medium text-white/90 hover:bg-white/10">
            Close
          </button>
        </div>
      </div>

      {previewFile && <FilePreviewModal file={previewFile} onClose={closePreview} />}
    </div>
  );
}
