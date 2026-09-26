/**
 * AdminHome.jsx — admin dashboard (/admin). Six clickable cards (authorised users, eligible students,
 * profiles completed, active / on-hold / completed applications) that open DashboardDetailsModal,
 * plus quick links and a per-department overview of pending and on-hold counts.
 */

import { useEffect, useState } from "react";
import api from "../../../api/client";
import DashboardDetailsModal from "./DashboardDetailsModal";

export default function AdminHome() {
  const [statsData, setStatsData] = useState({
    authorizedUsers: 0,
    eligibleStudents: 0,
    profilesCompleted: 0,
    activeApplications: 0,
    onHoldApplications: 0,
    completedApplications: 0,
  });
  const [departmentOverview, setDepartmentOverview] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [detailsType, setDetailsType] = useState(null);

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        setIsLoading(true);
        // We'll design the backend to return exactly these aggregates
        const res = await api.get('/admin/dashboard-stats');
        if (res.data) {
          setStatsData({
            authorizedUsers: res.data.authorizedUsers || 0,
            eligibleStudents: res.data.eligibleStudents || 0,
            profilesCompleted: res.data.profilesCompleted || 0,
            activeApplications: res.data.activeApplications || 0,
            onHoldApplications: res.data.onHoldApplications || 0,
            completedApplications: res.data.completedApplications || 0,
          });
          setDepartmentOverview(res.data.departmentOverview || []);
        }
      } catch (err) {
        console.error("Failed to fetch admin dashboard stats", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardStats();
  }, []);

  const stats = [
    { type: "users", label: "Authorized Department Users", value: statsData.authorizedUsers },
    { type: "eligible", label: "Eligible Students", value: statsData.eligibleStudents },
    { type: "profiles", label: "Profiles Completed", value: statsData.profilesCompleted },
    { type: "active", label: "Active Applications", value: statsData.activeApplications },
    { type: "onhold", label: "Applications On Hold", value: statsData.onHoldApplications },
    { type: "completed", label: "Completed No Dues", value: statsData.completedApplications },
  ];

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center text-white/50 text-sm">
        Loading admin dashboard...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl">
        <h2 className="text-2xl font-semibold sm:text-3xl text-white">Welcome to Admin Control</h2>
        <p className="mt-2 max-w-3xl text-sm text-white/65">
          This section is used to control department login access, eligible
          students, and overall No Dues operations.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
        {stats.map((item) => (
          <button
            key={item.label}
            type="button"
            onClick={() => setDetailsType(item.type)}
            className="rounded-2xl border border-white/10 bg-white/5 p-5 text-left transition hover:border-blue-500/50 hover:bg-white/10"
          >
            <p className="text-sm text-white/60">{item.label}</p>
            <p className="mt-3 text-3xl font-semibold text-white">{item.value}</p>
            <p className="mt-2 text-xs text-white/35">Click to view details</p>
          </button>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h3 className="text-lg font-semibold text-white">Quick Actions</h3>
          <div className="mt-4 space-y-3">
            <div className="rounded-xl border border-white/10 bg-black/20 p-4 text-sm text-white/75">
              Add or remove department login access
            </div>
            <div className="rounded-xl border border-white/10 bg-black/20 p-4 text-sm text-white/75">
              Upload eligible student list
            </div>
            <div className="rounded-xl border border-white/10 bg-black/20 p-4 text-sm text-white/75">
              Track application progress department-wise
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h3 className="text-lg font-semibold text-white">Department Overview</h3>
          <div className="mt-4 space-y-3 text-sm text-white/75">
            {departmentOverview.length > 0 ? (
              departmentOverview.map((dept, index) => (
                <div key={dept.code || index} className="flex items-center justify-between rounded-xl border border-white/10 bg-black/20 px-4 py-3">
                  <span>{dept.name}</span>
                  <span className="flex gap-3">
                    <span className="text-amber-300">{dept.pendingCount} pending</span>
                    {dept.onHoldCount > 0 && (
                      <span className="text-rose-300">{dept.onHoldCount} on hold</span>
                    )}
                  </span>
                </div>
              ))
            ) : (
              <div className="flex items-center justify-center rounded-xl border border-white/10 bg-black/20 px-4 py-8 text-white/40">
                No pending applications.
              </div>
            )}
          </div>
        </div>
      </section>

      {detailsType && (
        <DashboardDetailsModal key={detailsType} type={detailsType} onClose={() => setDetailsType(null)} />
      )}
    </div>
  );
}