/**
 * DepartmentHome.jsx — shared landing card for department dashboards: title, short description
 * and pending count, with room for extra content (usually DepartmentAccessManager).
 */

export default function DepartmentHome({
  deptName,
  pendingCount = 0,
  children,
}) {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-white/10 p-5 sm:p-10 text-white shadow-lg backdrop-blur">
        <h1 className="text-2xl font-semibold sm:text-3xl">{deptName} Dashboard</h1>
        <p className="mt-2 text-white/70">
          View and manage {deptName.toLowerCase()} clearance requests.
        </p>

        <div className="mt-6 rounded-xl border border-white/15 bg-white/5 p-5">
          <p className="text-sm text-white/70">Pending requests</p>
          <p className="mt-1 text-3xl font-bold">{pendingCount}</p>
        </div>
      </div>

      {children}
    </div>
  );
}
