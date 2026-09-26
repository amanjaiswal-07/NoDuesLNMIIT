/**
 * PlacementLayout.jsx — route frame for Placement Office (/placement). Uses DepartmentLayout, which draws the header and
 * loads this section's Pending / Approved / On Hold lists (useDepartmentData), and passes them plus the
 * approve / hold actions to the tab pages through the router Outlet context.
 * Placement sees the student's placement status, TPC email date and placement documents.
 */

import DepartmentLayout from "../../shared/DepartmentLayout";
export default function PlacementLayout() {
  return <DepartmentLayout role="placement" unitCodes={["placement"]} title="Placement Office" />;
}