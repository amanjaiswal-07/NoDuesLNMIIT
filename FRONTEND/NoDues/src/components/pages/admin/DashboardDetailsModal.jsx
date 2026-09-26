/**
 * DashboardDetailsModal.jsx — the list behind a dashboard card (who, roll number, branch, when…),
 * with search and a shortcut to the Applications page. CARD_CONFIG defines the columns per card.
 */

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import api from "../../../api/client";

const fmt = (d) => (d ? format(new Date(d), "dd MMM yyyy, hh:mm a") : "—");

const APP_STATUS = {
  approved: { label: "Completed", className: "text-green-400" },
  action_required: { label: "On Hold", className: "text-red-400" },
  in_progress: { label: "In Progress", className: "text-yellow-400" },
  submitted: { label: "Submitted", className: "text-blue-400" },
};

const StudentCell = ({ r }) => (
  <>
    <p className="font-medium text-white">{r.name || r.studentName}</p>
    <p className="text-xs text-white/50">{r.rollNo} · {r.branch}</p>
    <p className="text-xs text-white/40">{r.email || r.studentEmail}</p>
  </>
);

const ApplicationStatusCell = ({ r }) => {
  if (!r.applicationStatus) return <span className="text-xs text-white/40">Not applied</span>;
  const s = APP_STATUS[r.applicationStatus] || { label: r.applicationStatus, className: "text-white/60" };
  return (
    <>
      <p className={`text-xs font-medium ${s.className}`}>{s.label}</p>
      <p className="text-xs text-white/40">Applied {fmt(r.appliedAt)}</p>
    </>
  );
};

const Badges = ({ items, className }) => (
  <div className="flex max-w-sm flex-wrap gap-1.5">
    {items.map((name) => (
      <span key={name} className={`rounded-lg px-2 py-0.5 text-xs ${className}`}>{name}</span>
    ))}
  </div>
);

const Progress = ({ r }) => (
  <p className="text-xs text-white/70">{r.approvedSteps} / {r.totalSteps} approved</p>
);

// Columns + search fields for each dashboard card
const CARD_CONFIG = {
  users: {
    title: "Authorized Department Users",
    searchKeys: ["name", "email"],
    columns: [
      { label: "User", render: (r) => (<><p className="font-medium text-white">{r.name}</p><p className="text-xs text-white/40">{r.email}</p></>) },
      { label: "Departments / Roles", render: (r) => <Badges items={r.roles} className="bg-blue-500/10 text-blue-300" /> },
      { label: "Added On", render: (r) => fmt(r.addedAt) },
    ],
  },
  eligible: {
    title: "Eligible Students",
    searchKeys: ["name", "email", "rollNo", "branch"],
    columns: [
      { label: "Student", render: (r) => <StudentCell r={r} /> },
      { label: "Profile", render: (r) => r.profileCompleted ? <span className="text-xs text-green-400">Complete</span> : <span className="text-xs text-white/40">Incomplete</span> },
      { label: "Application", render: (r) => <ApplicationStatusCell r={r} /> },
      { label: "Added On", render: (r) => fmt(r.addedAt) },
    ],
  },
  profiles: {
    title: "Profiles Completed",
    searchKeys: ["name", "email", "rollNo", "branch"],
    columns: [
      { label: "Student", render: (r) => <StudentCell r={r} /> },
      { label: "Profile Last Saved", render: (r) => fmt(r.profileSavedAt) },
      { label: "Application", render: (r) => <ApplicationStatusCell r={r} /> },
    ],
  },
  active: {
    title: "Active Applications",
    searchKeys: ["studentName", "studentEmail", "rollNo", "branch"],
    columns: [
      { label: "Student", render: (r) => <StudentCell r={r} /> },
      { label: "Applied On", render: (r) => fmt(r.submittedAt || r.createdAt) },
      { label: "Progress", render: (r) => <Progress r={r} /> },
      {
        label: "Waiting At / On Hold", render: (r) => (
          <div className="space-y-1.5">
            <Badges items={r.onHoldAt.map((h) => h.name)} className="bg-red-500/10 text-red-300" />
            <Badges items={r.pendingAt} className="bg-blue-500/10 text-blue-300" />
          </div>
        ),
      },
    ],
  },
  onhold: {
    title: "Applications On Hold",
    searchKeys: ["studentName", "studentEmail", "rollNo", "branch"],
    columns: [
      { label: "Student", render: (r) => <StudentCell r={r} /> },
      {
        label: "On Hold By / Reason", render: (r) => (
          <div className="space-y-1">
            {r.onHoldAt.map((h) => (
              <p key={h.name} className="text-xs">
                <span className="font-medium text-red-300">{h.name}</span>
                {h.reason && <span className="text-white/60"> — {h.reason}</span>}
              </p>
            ))}
          </div>
        ),
      },
      { label: "On Hold Since", render: (r) => fmt(r.onHoldSince) },
      { label: "Progress", render: (r) => <Progress r={r} /> },
    ],
  },
  completed: {
    title: "Completed No Dues",
    searchKeys: ["studentName", "studentEmail", "rollNo", "branch"],
    columns: [
      { label: "Student", render: (r) => <StudentCell r={r} /> },
      { label: "Applied On", render: (r) => fmt(r.submittedAt || r.createdAt) },
      { label: "Completed On", render: (r) => fmt(r.completedAt) },
    ],
  },
};

export default function DashboardDetailsModal({ type, onClose }) {
  const navigate = useNavigate();
  const [rows, setRows] = useState(null);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const config = CARD_CONFIG[type];

  // Parent mounts a fresh modal per card (key={type}), so state starts empty here
  useEffect(() => {
    if (!type) return;
    api.get(`/admin/dashboard-details/${type}`)
      .then((res) => setRows(res.data.rows || []))
      .catch((err) => setError(err.response?.data?.error || "Failed to load details."));
  }, [type]);

  useEffect(() => {
    if (!type) return;
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [type, onClose]);

  if (!type || !config) return null;

  const query = search.trim().toLowerCase();
  const visible = (rows || []).filter((r) =>
    !query || config.searchKeys.some((k) => String(r[k] || "").toLowerCase().includes(query))
  );
  const isApplicationList = ["active", "onhold", "completed"].includes(type);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div
        className="flex max-h-[88vh] w-full max-w-5xl flex-col rounded-2xl border border-white/10 bg-neutral-900 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-white/10 px-6 py-4">
          <div>
            <h3 className="text-xl font-semibold text-white">{config.title}</h3>
            <p className="mt-1 text-sm text-white/55">
              {rows ? `${visible.length} of ${rows.length} shown` : "Loading…"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isApplicationList && (
              <button
                onClick={() => navigate("/admin/applications")}
                className="rounded-xl border border-white/10 px-3 py-2 text-sm text-white/80 hover:bg-white/10"
              >
                Open Applications page
              </button>
            )}
            <button onClick={onClose} className="rounded-xl border border-white/10 px-3 py-2 text-sm text-white/80 hover:bg-white/10">
              Close
            </button>
          </div>
        </div>

        <div className="px-6 pt-4">
          <input
            type="text"
            placeholder="Search…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-2.5 text-sm text-white placeholder:text-white/35 outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex-1 overflow-auto px-6 py-4">
          {error ? (
            <p className="text-sm text-red-400">{error}</p>
          ) : !rows ? (
            <p className="py-8 text-center text-sm text-white/50">Loading…</p>
          ) : visible.length === 0 ? (
            <p className="py-8 text-center text-sm text-white/50">Nothing to show.</p>
          ) : (
            <table className="w-full min-w-[600px] text-left text-sm text-white/80">
              <thead className="sticky top-0 bg-neutral-900 text-xs uppercase tracking-wide text-white/50">
                <tr>
                  {config.columns.map((c) => <th key={c.label} className="px-3 py-3">{c.label}</th>)}
                </tr>
              </thead>
              <tbody>
                {visible.map((r) => (
                  <tr key={r._id} className="border-t border-white/10 align-top">
                    {config.columns.map((c) => <td key={c.label} className="px-3 py-3">{c.render(r)}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
