import { useState, useEffect } from "react";
import api from "../../../api/client";
import { format } from "date-fns";

const STATUS_STYLES = {
    approved: { label: "Completed", className: "bg-green-500/10 text-green-400" },
    action_required: { label: "On Hold", className: "bg-red-500/10 text-red-400" },
    in_progress: { label: "In Progress", className: "bg-yellow-500/10 text-yellow-400" },
    submitted: { label: "Submitted", className: "bg-blue-500/10 text-blue-400" },
};

const STEP_STYLES = {
    approved: { label: "Approved", className: "text-green-400" },
    pending: { label: "Pending", className: "text-yellow-400" },
    rejected: { label: "On Hold", className: "text-red-400" },
    locked: { label: "Waiting", className: "text-white/40" },
};

const FILTERS = [
    { value: "all", label: "All" },
    { value: "in_progress", label: "In Progress" },
    { value: "action_required", label: "On Hold" },
    { value: "approved", label: "Completed" },
];

function StatusBadge({ status }) {
    const s = STATUS_STYLES[status] || { label: status, className: "bg-white/10 text-white/70" };
    return <span className={`rounded-lg px-3 py-1 text-xs font-medium ${s.className}`}>{s.label}</span>;
}

// All steps of one application, loaded when the row is expanded
function ApplicationSteps({ applicationId }) {
    const [steps, setSteps] = useState(null);
    const [error, setError] = useState("");

    useEffect(() => {
        api.get(`/admin/applications/${applicationId}`)
            .then((res) => setSteps(res.data.steps || []))
            .catch((err) => setError(err.response?.data?.error || "Failed to load steps."));
    }, [applicationId]);

    if (error) return <p className="text-sm text-red-400">{error}</p>;
    if (!steps) return <p className="text-sm text-white/50">Loading steps...</p>;

    return (
        <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
            {steps.map((s) => {
                const st = STEP_STYLES[s.status] || { label: s.status, className: "text-white/60" };
                return (
                    <div key={s._id} className="rounded-lg border border-white/10 bg-black/20 px-3 py-2">
                        <div className="flex items-center justify-between gap-2">
                            <span className="text-xs text-white/80">{s.unitLabel}</span>
                            <span className={`shrink-0 text-xs font-medium ${st.className}`}>{st.label}</span>
                        </div>
                        {s.status === "rejected" && s.rejectionReason && (
                            <p className="mt-1 text-xs text-red-300/80">{s.rejectionReason}</p>
                        )}
                        {s.actionBy && (s.status === "approved" || s.status === "rejected") && (
                            <p className="mt-1 text-[11px] text-white/40">
                                by {s.actionBy}{s.actionAt ? ` · ${format(new Date(s.actionAt), "dd MMM yyyy")}` : ""}
                            </p>
                        )}
                    </div>
                );
            })}
        </div>
    );
}

export default function AdminApplications() {
    const [applications, setApplications] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [expandedId, setExpandedId] = useState(null);

    const fetchApplications = async () => {
        try {
            setIsLoading(true);
            setError("");
            const res = await api.get("/admin/applications");
            setApplications(res.data.applications || []);
        } catch (err) {
            console.error("Failed to fetch applications:", err);
            setError(err.response?.data?.error || "Failed to load applications.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchApplications();
    }, []);

    const query = search.trim().toLowerCase();
    const filteredApplications = applications.filter((app) => {
        if (statusFilter !== "all" && app.status !== statusFilter) return false;
        if (!query) return true;
        return [app.studentName, app.rollNo, app.studentEmail, app.branch]
            .some((v) => (v || "").toLowerCase().includes(query));
    });

    const countFor = (value) =>
        value === "all" ? applications.length : applications.filter((a) => a.status === value).length;

    return (
        <div className="space-y-6">
            <section className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/5 p-6">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                    <div>
                        <h2 className="text-2xl font-semibold text-white">All Applications</h2>
                        <p className="mt-1 text-sm text-white/60">
                            View and track all student No Dues applications. Click a row to see every department's status.
                        </p>
                    </div>
                    <button
                        onClick={fetchApplications}
                        className="self-start rounded-xl border border-white/10 px-4 py-2 text-sm text-white/80 hover:bg-white/10"
                    >
                        Refresh
                    </button>
                </div>
            </section>

            <section className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/5 p-5 md:flex-row md:items-center">
                <div className="flex flex-wrap gap-2">
                    {FILTERS.map((f) => (
                        <button
                            key={f.value}
                            onClick={() => setStatusFilter(f.value)}
                            className={`rounded-xl px-4 py-2 text-sm transition ${statusFilter === f.value
                                ? "bg-blue-600 text-white"
                                : "border border-white/10 text-white/70 hover:bg-white/10"
                                }`}
                        >
                            {f.label} ({countFor(f.value)})
                        </button>
                    ))}
                </div>
                <input
                    type="text"
                    placeholder="Search by name, roll no, email or branch..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full flex-1 rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white placeholder:text-white/35 outline-none focus:border-blue-500"
                />
            </section>

            {error && (
                <div className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</div>
            )}

            <section className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
                <div className="overflow-x-auto">
                    <table className="min-w-full text-left text-sm text-white/80">
                        <thead className="bg-white/5 text-xs uppercase tracking-wide text-white/50">
                            <tr>
                                <th className="px-5 py-4">Student Details</th>
                                <th className="px-5 py-4">Applied On</th>
                                <th className="px-5 py-4">Status</th>
                                <th className="px-5 py-4">Progress</th>
                                <th className="px-5 py-4">Waiting At / On Hold</th>
                            </tr>
                        </thead>

                        <tbody>
                            {isLoading ? (
                                <tr>
                                    <td colSpan="5" className="px-5 py-8 text-center text-sm text-white/50">
                                        Loading applications...
                                    </td>
                                </tr>
                            ) : filteredApplications.length > 0 ? (
                                filteredApplications.map((app) => {
                                    const expanded = expandedId === app._id;
                                    const percent = app.totalSteps ? Math.round((app.approvedSteps / app.totalSteps) * 100) : 0;
                                    return [
                                        <tr
                                            key={app._id}
                                            onClick={() => setExpandedId(expanded ? null : app._id)}
                                            className="cursor-pointer border-t border-white/10 hover:bg-white/[0.03]"
                                        >
                                            <td className="px-5 py-4">
                                                <p className="font-medium text-white">{app.studentName}</p>
                                                <p className="text-xs text-white/50">{app.rollNo} · {app.branch}</p>
                                                <p className="text-xs text-white/50">{app.studentEmail}</p>
                                            </td>
                                            <td className="px-5 py-4">
                                                {app.submittedAt || app.createdAt
                                                    ? format(new Date(app.submittedAt || app.createdAt), "dd MMM yyyy, HH:mm")
                                                    : "N/A"}
                                                {app.completedAt && (
                                                    <p className="text-xs text-green-400/80">
                                                        Completed {format(new Date(app.completedAt), "dd MMM yyyy")}
                                                    </p>
                                                )}
                                            </td>
                                            <td className="px-5 py-4">
                                                <StatusBadge status={app.status} />
                                            </td>
                                            <td className="px-5 py-4">
                                                <p className="text-xs text-white/70">{app.approvedSteps} / {app.totalSteps} approved</p>
                                                <div className="mt-1.5 h-1.5 w-32 rounded-full bg-white/10">
                                                    <div className="h-1.5 rounded-full bg-green-400" style={{ width: `${percent}%` }} />
                                                </div>
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className="flex max-w-md flex-wrap gap-1.5">
                                                    {app.onHoldAt.map((h) => (
                                                        <span key={h.name} title={h.reason} className="rounded-lg bg-red-500/10 px-2 py-0.5 text-xs text-red-300">
                                                            {h.name}
                                                        </span>
                                                    ))}
                                                    {app.pendingAt.map((name) => (
                                                        <span key={name} className="rounded-lg bg-blue-500/10 px-2 py-0.5 text-xs text-blue-300">
                                                            {name}
                                                        </span>
                                                    ))}
                                                    {app.onHoldAt.length === 0 && app.pendingAt.length === 0 && (
                                                        <span className="text-xs text-white/40">
                                                            {app.status === "approved" ? "All cleared" : "—"}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>,
                                        expanded && (
                                            <tr key={`${app._id}-steps`} className="border-t border-white/5 bg-black/20">
                                                <td colSpan="5" className="px-5 py-4">
                                                    <ApplicationSteps applicationId={app._id} />
                                                </td>
                                            </tr>
                                        ),
                                    ];
                                })
                            ) : (
                                <tr>
                                    <td colSpan="5" className="px-5 py-8 text-center text-sm text-white/50">
                                        No applications found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
}
