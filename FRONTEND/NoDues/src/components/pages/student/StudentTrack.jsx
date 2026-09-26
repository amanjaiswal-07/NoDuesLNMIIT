import { useState, useEffect, useCallback, useRef } from "react";
import { useOutletContext } from "react-router-dom";
import api from "../../../api/client";

// ── Reapply Modal ─────────────────────────────────────────────────────────────

function ReapplyModal({ onSubmit, onCancel, submitting }) {
  const [comment, setComment] = useState("");
  const [file, setFile] = useState(null);
  const fileInputRef = useRef(null);

  const ACCEPTED = ".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg";
  const MAX_MB = 10;

  const handleFile = (e) => {
    const picked = e.target.files?.[0];
    if (!picked) return;
    if (picked.size > MAX_MB * 1024 * 1024) {
      alert(`File is too large. Maximum allowed size is ${MAX_MB} MB.`);
      e.target.value = "";
      return;
    }
    setFile(picked);
  };

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center p-4">
      {/* Backdrop */}
      <button
        type="button"
        onClick={onCancel}
        className="absolute inset-0 bg-black/70 backdrop-blur-[2px]"
        aria-label="Close modal"
      />
      {/* Panel */}
      <div className="relative w-full max-w-lg rounded-2xl border border-white/15 bg-neutral-900 text-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div>
            <h2 className="text-base font-semibold">Reapply for Clearance</h2>
            <p className="mt-0.5 text-xs text-white/50">Provide context to help the department review your request faster.</p>
          </div>
          <button type="button" onClick={onCancel} className="rounded-lg p-1.5 hover:bg-white/10">
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="space-y-5 px-5 py-5">
          {/* Info banner */}
          <div className="rounded-xl border border-blue-400/30 bg-blue-500/10 p-3">
            <p className="text-xs text-blue-200">
              Adding a comment or uploading proof is <strong>optional but recommended</strong>. It helps departments understand the changes you've made.
            </p>
          </div>

          {/* Comment */}
          <div>
            <label className="block text-sm font-medium text-white/80">
              Add Comment <span className="text-white/40 font-normal">(Optional but recommended)</span>
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Explain what changes you have made or what issue was resolved…"
              rows={4}
              className="mt-2 w-full rounded-xl border border-white/15 bg-neutral-950 px-4 py-3 text-sm text-white outline-none focus:border-blue-500 resize-none"
            />
          </div>

          {/* File upload */}
          <div>
            <label className="block text-sm font-medium text-white/80">
              Upload Supporting Document <span className="text-white/40 font-normal">(Optional)</span>
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED}
              onChange={handleFile}
              className="mt-2 block w-full rounded-xl border border-white/15 bg-neutral-950 px-4 py-3 text-sm text-white file:mr-4 file:rounded-lg file:border-0 file:bg-blue-600 file:px-3 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-blue-700"
            />
            <p className="mt-1.5 text-xs text-white/40">PDF / PNG / JPG — max 10 MB</p>
            {file && (
              <div className="mt-2 flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2">
                <span className="text-xs text-emerald-300">✓</span>
                <p className="text-xs text-white/70 truncate">{file.name}</p>
                <p className="ml-auto shrink-0 text-xs text-white/40">{(file.size / 1024).toFixed(0)} KB</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-white/10 px-5 py-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="rounded-xl border border-white/15 px-4 py-2 text-sm font-medium text-white/80 hover:bg-white/10 disabled:opacity-40"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={submitting}
            onClick={() => onSubmit({ comment, file })}
            className={`rounded-xl px-5 py-2 text-sm font-semibold transition ${submitting
                ? "cursor-not-allowed bg-red-600/30 text-red-300/50"
                : "bg-red-600/80 text-white hover:bg-red-600"
              }`}
          >
            {submitting ? "Submitting…" : "Submit Reapply"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Status helpers ────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  approved: {
    dot: "bg-emerald-400",
    card: "border-emerald-400/40 bg-emerald-500/10",
    text: "text-emerald-200",
    badge: "bg-emerald-500/20 text-emerald-300",
    label: "Approved",
  },
  rejected: {
    dot: "bg-red-400",
    card: "border-red-400/40 bg-red-500/10",
    text: "text-red-200",
    badge: "bg-red-500/20 text-red-300",
    label: "On Hold",
  },
  pending: {
    dot: "bg-amber-400",
    card: "border-amber-400/40 bg-amber-500/10",
    text: "text-amber-200",
    badge: "bg-amber-500/20 text-amber-300",
    label: "Pending",
  },
  locked: {
    dot: "bg-white/20",
    card: "border-white/10 bg-white/5",
    text: "text-white/50",
    badge: "bg-white/10 text-white/40",
    label: "Waiting",
  },
};

const cfg = (status) => STATUS_CONFIG[status] || STATUS_CONFIG.locked;

const fmt = (date) =>
  date
    ? new Date(date).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })
    : "";

// ── Single timeline event ─────────────────────────────────────────────────────

function TimelineEvent({ log }) {
  const { action, actorEmail, timestamp, note, proofUrls } = log;

  // Visual config per action type
  const EVENT_CFG = {
    approved:  { icon: "✓", bg: "bg-emerald-500/20 border-emerald-400/30", text: "text-emerald-200", label: "Approved" },
    rejected:  { icon: "⊘", bg: "bg-red-500/20 border-red-400/30",     text: "text-red-200",     label: "Placed On Hold" },
    reapply:   { icon: "↩", bg: "bg-blue-500/20 border-blue-400/30",   text: "text-blue-200",   label: "Reapplied" },
    student_replied: { icon: "💬", bg: "bg-blue-500/15 border-blue-400/25", text: "text-blue-200", label: "Student Replied" },
    reopened:  { icon: "⟳", bg: "bg-white/5 border-white/10",          text: "text-white/40",   label: "Reopened" },
    relocked:  { icon: "🔒", bg: "bg-white/5 border-white/10",          text: "text-white/35",   label: "Re-locked" },
    unlocked:  { icon: "🔓", bg: "bg-white/5 border-white/10",          text: "text-white/35",   label: "Unlocked" },
    created:   { icon: "＋", bg: "bg-white/5 border-white/10",          text: "text-white/30",   label: "Created" },
  };
  const ec = EVENT_CFG[action] || { icon: "·", bg: "bg-white/5 border-white/10", text: "text-white/30", label: action };

  // Skip pure noise events (system re-locks/unlocks/created by default — hidden unless needed)
  const isSystemNoise = ["created", "unlocked", "relocked"].includes(action);

  return (
    <div className={`rounded-lg border px-3 py-2.5 ${ec.bg} ${isSystemNoise ? "opacity-50" : ""}`}>
      <div className="flex items-start gap-2">
        <span className="mt-0.5 shrink-0 text-xs">{ec.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <span className={`text-xs font-semibold ${ec.text}`}>{ec.label}</span>
            {actorEmail && actorEmail !== "system" && (
              <span className="text-[10px] text-white/40 truncate">by {actorEmail}</span>
            )}
            {timestamp && (
              <span className="text-[10px] text-white/30 ml-auto shrink-0">{fmt(timestamp)}</span>
            )}
          </div>
          {note && (
            <p className="mt-1 text-[11px] text-white/60 leading-relaxed break-words">{note}</p>
          )}
          {proofUrls && proofUrls.length > 0 && (
            <p className="mt-1 text-[10px] text-blue-300/70">📎 Supporting document uploaded</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Step Card with Timeline ───────────────────────────────────────────────────

function StepCard({ step, logs, isLast }) {
  const c = cfg(step.status);
  const [showTimeline, setShowTimeline] = useState(false);

  // Relevant events for this step — filter system noise for the toggle count
  const stepLogs = logs.filter((l) => String(l.stepId) === String(step._id));
  const significantLogs = stepLogs.filter((l) => !["created", "unlocked", "relocked"].includes(l.action));

  return (
    <div className="relative flex gap-4">
      <div className="flex w-8 flex-col items-center">
        <div className={`mt-1 h-3 w-3 shrink-0 rounded-full ${c.dot} ring-2 ring-neutral-900`} />
        {!isLast && <div className="mt-2 w-0.5 flex-1 bg-white/10" />}
      </div>
      <div className={`mb-4 flex-1 rounded-xl border p-4 ${c.card}`}>
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <p className={`text-sm font-semibold ${c.text}`}>{step.unitLabel}</p>
            {(step.status === "approved" || step.status === "rejected") && step.actionBy && (
              <p className="mt-1 text-xs text-white/50">
                Processed by: <span className="font-medium text-white/70">{step.actionBy}</span>
                {step.actionAt ? ` on ${fmt(step.actionAt)}` : ""}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${c.badge}`}>
              {c.label}
            </span>
            {significantLogs.length > 0 && (
              <button
                onClick={() => setShowTimeline((p) => !p)}
                className="rounded-full border border-white/15 px-2 py-0.5 text-[10px] text-white/50 hover:bg-white/10 hover:text-white/80 transition"
              >
                {showTimeline ? "Hide" : `Timeline (${significantLogs.length})`}
              </button>
            )}
          </div>
        </div>

        {step.status === "locked" && (
          <p className="mt-1.5 text-xs text-white/35">Awaiting prerequisite approvals</p>
        )}

        {step.status === "rejected" && (
          <div className="mt-3 rounded-lg border border-red-400/20 bg-red-500/10 p-3 space-y-1">
            {step.rejectionReason && (
              <p className="text-xs font-semibold text-red-300">
                Reason: {step.rejectionReason}
              </p>
            )}
            {step.rejectionDescription && (
              <p className="text-xs text-red-200/80">{step.rejectionDescription}</p>
            )}
            {!step.rejectionReason && !step.rejectionDescription && (
              <p className="text-xs text-red-300/70 italic">No details provided</p>
            )}
          </div>
        )}

        {/* Timeline */}
        {showTimeline && stepLogs.length > 0 && (
          <div className="mt-3 border-t border-white/10 pt-3 space-y-2">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-white/30">Event History</p>
            {stepLogs.map((log, i) => (
              <TimelineEvent key={i} log={log} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Lab Step Row (inside GroupCard) — needs own state so hooks rule is satisfied ──

function LabStepRow({ step, logs }) {
  const sc = cfg(step.status);
  const stepLogs = logs.filter((l) => String(l.stepId) === String(step._id));
  const [showTl, setShowTl] = useState(false);
  const significantLogs = stepLogs.filter((l) => !["created", "unlocked", "relocked"].includes(l.action));
  return (
    <div key={step._id} className="flex flex-col gap-1 border-b border-white/5 pb-2 last:border-0 last:pb-0">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-white/70">{step.unitLabel}</p>
        <div className="flex items-center gap-1.5">
          <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${sc.badge}`}>{sc.label}</span>
          {significantLogs.length > 0 && (
            <button
              onClick={() => setShowTl((p) => !p)}
              className="rounded-full border border-white/15 px-2 py-0.5 text-[9px] text-white/40 hover:bg-white/10 transition"
            >
              {showTl ? "Hide" : `▸ ${significantLogs.length}`}
            </button>
          )}
        </div>
      </div>
      {(step.status === "approved" || step.status === "rejected") && step.actionBy && (
        <p className="text-[10px] text-white/40">
          Processed by: <span className="font-medium text-white/60">{step.actionBy}</span>
          {step.actionAt ? ` on ${fmt(step.actionAt)}` : ""}
        </p>
      )}
      {showTl && stepLogs.length > 0 && (
        <div className="mt-1.5 space-y-1.5">
          {stepLogs.map((log, i) => <TimelineEvent key={i} log={log} />)}
        </div>
      )}
    </div>
  );
}

// ── Group Card (for lab groups) ───────────────────────────────────────────────

function GroupCard({ groupLabel, steps, logs, isLast }) {
  const [expanded, setExpanded] = useState(false);
  const allApproved = steps.every((s) => s.status === "approved");
  const anyRejected = steps.some((s) => s.status === "rejected");
  const groupStatus = allApproved ? "approved" : anyRejected ? "rejected" : steps.some((s) => s.status === "pending") ? "pending" : "locked";
  const c = cfg(groupStatus);
  const approvedCount = steps.filter((s) => s.status === "approved").length;

  return (
    <div className="relative flex gap-4">
      <div className="flex w-8 flex-col items-center">
        <div className={`mt-1 h-3 w-3 shrink-0 rounded-full ${c.dot} ring-2 ring-neutral-900`} />
        {!isLast && <div className="mt-2 w-0.5 flex-1 bg-white/10" />}
      </div>
      <div className={`mb-4 flex-1 rounded-xl border ${c.card}`}>
        <button
          onClick={() => setExpanded((p) => !p)}
          className="flex w-full flex-wrap items-center justify-between gap-2 p-4 text-left"
        >
          <div>
            <p className={`text-sm font-semibold ${c.text}`}>{groupLabel}</p>
            <p className="mt-0.5 text-xs text-white/40">{approvedCount}/{steps.length} labs approved</p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${c.badge}`}>{c.label}</span>
            <span className="text-white/40 text-xs">{expanded ? "▲" : "▼"}</span>
          </div>
        </button>
        {expanded && (
          <div className="border-t border-white/10 px-4 py-3 space-y-3">
            {steps.map((step) => <LabStepRow key={step._id} step={step} logs={logs} />)}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Group steps by their lab group ────────────────────────────────────────────

const GROUP_LABELS = {
  labs_cse_cce: "CSE / CCE Labs",
  labs_ece_cce: "ECE / CCE Labs",
  labs_mech: "MECH Labs",
  labs_physics: "Physics Labs",
};

function organiseSteps(steps) {
  const grouped = [];
  const seenGroups = new Set();

  const groupBuckets = {};
  for (const step of steps) {
    const g = step.unitGroup;
    if (g && GROUP_LABELS[g]) {
      if (!groupBuckets[g]) groupBuckets[g] = [];
      groupBuckets[g].push(step);
    }
  }

  const ORDER = [
    "medical", "sports", "lucs", "warden", "placement", "administration",
    "library_staff", "library_librarian",
    "labs_cse_cce", "labs_ece_cce", "labs_mech", "labs_physics",
    "hod_cse", "hod_ece", "hod_cce", "hod_mech",
    "nad", "store", "accounts",
  ];

  const stepByCode = {};
  for (const s of steps) stepByCode[s.unitCode] = s;

  const used = new Set();

  for (const code of ORDER) {
    if (GROUP_LABELS[code] && groupBuckets[code]) {
      if (!seenGroups.has(code)) {
        seenGroups.add(code);
        grouped.push({ type: "group", code, label: GROUP_LABELS[code], steps: groupBuckets[code] });
        groupBuckets[code].forEach((s) => used.add(s._id));
      }
    } else if (stepByCode[code] && !used.has(stepByCode[code]._id)) {
      grouped.push({ type: "step", step: stepByCode[code] });
      used.add(stepByCode[code]._id);
    }
  }

  for (const s of steps) {
    if (!used.has(s._id)) grouped.push({ type: "step", step: s });
  }

  return grouped;
}

// ── Overall status banner ─────────────────────────────────────────────────────

function OverallStatusBanner({ status }) {
  const map = {
    approved: { bg: "border-emerald-400/30 bg-emerald-500/10", text: "text-emerald-200", label: "All Cleared" },
    action_required: { bg: "border-red-400/30 bg-red-500/10", text: "text-red-200", label: "Action Required" },
    in_progress: { bg: "border-amber-400/30 bg-amber-500/10", text: "text-amber-200", label: "In Progress" },
    submitted: { bg: "border-blue-400/30 bg-blue-500/10", text: "text-blue-200", label: "Submitted" },
  };
  const s = map[status] || map.submitted;
  return (
    <div className={`rounded-xl border p-4 ${s.bg}`}>
      <p className={`text-sm font-semibold ${s.text}`}>
        Overall Status: <span className="uppercase">{s.label}</span>
      </p>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function StudentTrack() {
  const { currentApplication, refreshStudentData } = useOutletContext();
  const [steps, setSteps] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [reapplying, setReapplying] = useState(false);
  const [reapplyMsg, setReapplyMsg] = useState("");
  const [showReapplyModal, setShowReapplyModal] = useState(false);

  const [refreshing, setRefreshing] = useState(false);

  const fetchSteps = useCallback(async () => {
    if (!currentApplication?._id) return;

    setLoading(true);
    setError("");

    // 1. Fetch steps — critical call.
    try {
      const stepsRes = await api.get(`/student/request/${currentApplication._id}/steps`);
      setSteps(stepsRes.data.steps || []);
    } catch (err) {
      const status = err.response?.status;
      if (status === 403) {
        setError("Your session token is outdated. Please log out and log back in to refresh your session.");
      } else if (status === 401) {
        // Token genuinely missing — redirect to login explicitly here (no global interceptor).
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/';
        return;
      } else {
        setError(err.response?.data?.error || "Failed to load progress. Please try again.");
      }
    }

    // 2. Fetch event logs — best-effort, never blocks steps display.
    try {
      const logsRes = await api.get(`/student/request/${currentApplication._id}/logs`);
      setLogs(logsRes.data.logs || []);
    } catch (_logErr) {
      // Silent — timeline degrades gracefully to empty, no error shown.
    }

    setLoading(false);
  }, [currentApplication?._id]);

  useEffect(() => { fetchSteps(); }, [fetchSteps]);

  if (!currentApplication) {
    return (
      <div className="space-y-6">
        <div className="rounded-2xl bg-white/10 p-8 text-white shadow-lg backdrop-blur">
          <h1 className="text-3xl font-semibold">Track Application</h1>
          <p className="mt-2 text-white/70">Monitor your No Dues request across all departments.</p>
        </div>
        <div className="rounded-2xl border border-white/15 bg-white/5 p-10 text-center">
          <p className="text-lg font-semibold text-white">No active application</p>
          <p className="mt-2 text-sm text-white/60">Apply for No Dues to start tracking.</p>
        </div>
      </div>
    );
  }

  const organised = organiseSteps(steps);
  const approvedCount = steps.filter((s) => s.status === "approved").length;
  const total = steps.length;
  const rejectedSteps = steps.filter((s) => s.status === "rejected");
  const hasRejections = rejectedSteps.length > 0;

  const overallStatus = total === 0
    ? "in_progress"
    : hasRejections
      ? "action_required"
      : approvedCount === total
        ? "approved"
        : "in_progress";

  const handleReapply = async ({ comment, file }) => {
    try {
      setReapplying(true);
      setReapplyMsg("");

      const fd = new FormData();
      if (comment) fd.append("comment", comment);
      if (file) fd.append("reapplyFile", file);

      await api.post("/student/reapply", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setShowReapplyModal(false);
      // Refresh layout data too (application status + profile lock state)
      if (refreshStudentData) await refreshStudentData();
      await fetchSteps();
    } catch (err) {
      setReapplyMsg(`❌ ${err.response?.data?.error || "Reapply failed. Please try again."}`);
    } finally {
      setReapplying(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl bg-white/10 p-8 text-white shadow-lg backdrop-blur">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-3xl font-semibold">Track Application</h1>
            <p className="mt-2 text-white/70">Monitor your No Dues request across all departments.</p>
          </div>
          <button
            onClick={async () => {
              setRefreshing(true);
              setError("");
              try {
                // Step 1: Re-fetch currentApplication from Layout (updates status, etc.)
                if (refreshStudentData) await refreshStudentData();
                // Step 2: Re-fetch steps + logs for the track timeline
                await fetchSteps();
              } catch (_) {
                // Errors handled inside fetchSteps — nothing to do here
              } finally {
                setRefreshing(false);
              }
            }}
            disabled={refreshing || loading}
            className={`self-start flex items-center gap-2 rounded-xl border border-white/15 px-4 py-2 text-sm transition
              ${refreshing || loading
                ? "cursor-not-allowed text-white/30 border-white/5"
                : "text-white/80 hover:bg-white/10 hover:text-white"
              }`}
          >
            {refreshing
              ? (<><span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/20 border-t-white/70" />Refreshing…</>)
              : "↻ Refresh"
            }
          </button>
        </div>
      </div>

      {/* Reapply Banner — shown when any step is rejected */}
      {hasRejections && (
        <div className="rounded-2xl border border-red-400/30 bg-red-500/10 p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-red-300">Action Required — Placed On Hold</p>
              <p className="mt-1 text-xs text-red-200/70">
                One or more departments have placed your request on hold. Review the details below, then reapply.
                Only the steps on hold will be reviewed again after you resubmit — approved steps remain unchanged.
              </p>
            </div>
            {/* Reapply Modal */}
            {showReapplyModal && (
              <ReapplyModal
                submitting={reapplying}
                onCancel={() => { if (!reapplying) setShowReapplyModal(false); }}
                onSubmit={handleReapply}
              />
            )}

            <button
              onClick={() => setShowReapplyModal(true)}
              disabled={reapplying}
              className={`shrink-0 rounded-xl border px-5 py-2.5 text-sm font-semibold transition ${reapplying
                ? "cursor-not-allowed border-white/10 text-white/30"
                : "border-red-400/50 text-red-300 hover:bg-red-500/20"
                }`}
            >
              {reapplying ? "Reapplying…" : "Reapply Now"}
            </button>
          </div>

          {/* List ALL rejected departments with reasons */}
          <div className="mt-4 space-y-2">
            {rejectedSteps.map((step) => (
              <div key={step._id || step.unitCode} className="rounded-lg border border-red-400/20 bg-black/20 p-3">
                <p className="text-xs font-semibold text-red-300">{step.unitLabel || step.unitCode}</p>
                {step.rejectionReason && (
                  <p className="mt-1 text-xs text-red-200/80">
                    <span className="text-red-300/60">Reason:</span> {step.rejectionReason}
                  </p>
                )}
                {step.rejectionDescription && (
                  <p className="text-xs text-red-200/70">
                    <span className="text-red-300/60">Details:</span> {step.rejectionDescription}
                  </p>
                )}
              </div>
            ))}
          </div>

          {/* Error only */}
          {reapplyMsg && !reapplyMsg.startsWith("✅") && (
            <p className="mt-3 text-xs text-red-300">{reapplyMsg}</p>
          )}
        </div>
      )}

      {/* Summary */}
      <div className="rounded-2xl border border-white/15 bg-white/5 p-6 space-y-4">
        <OverallStatusBanner status={overallStatus} />

        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-xl border border-white/10 bg-black/20 p-4">
            <p className="text-xs text-white/50">Application ID</p>
            <p className="mt-1 text-xs font-mono font-medium text-white/80 break-all">{currentApplication._id}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-black/20 p-4">
            <p className="text-xs text-white/50">Submitted</p>
            <p className="mt-1 text-sm font-medium text-white">
              {currentApplication.submittedAt
                ? new Date(currentApplication.submittedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
                : "—"}
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-black/20 p-4">
            <p className="text-xs text-white/50">Progress</p>
            <p className="mt-1 text-sm font-medium text-white">{approvedCount} / {total} approved</p>
            <div className="mt-2 h-1.5 w-full rounded-full bg-white/10">
              <div
                className="h-1.5 rounded-full bg-emerald-400 transition-all"
                style={{ width: total ? `${(approvedCount / total) * 100}%` : "0%" }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Step Timeline */}
      <div className="rounded-2xl border border-white/15 bg-white/5 p-6">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Department Clearance Timeline</h2>
          <p className="text-xs text-white/40">Click "Timeline" on each step to see full event history</p>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-10">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/20 border-t-white" />
          </div>
        )}

        {error && !loading && (
          <div className="rounded-xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-200">{error}</div>
        )}

        {!loading && !error && organised.length === 0 && (
          <p className="text-center text-sm text-white/50 py-8">No clearance steps generated yet.</p>
        )}

        {!loading && !error && organised.map((item, idx) => {
          const isLast = idx === organised.length - 1;
          if (item.type === "group") {
            return <GroupCard key={item.code} groupLabel={item.label} steps={item.steps} logs={logs} isLast={isLast} />;
          }
          return <StepCard key={item.step._id} step={item.step} logs={logs} isLast={isLast} />;
        })}
      </div>
    </div>
  );
}