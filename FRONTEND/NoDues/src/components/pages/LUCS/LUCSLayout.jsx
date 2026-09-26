/**
 * LUCSLayout.jsx — route frame for LUCS (/lucs). Uses DepartmentLayout, which draws the header and
 * loads this section's Pending / Approved / On Hold lists (useDepartmentData), and passes them plus the
 * approve / hold actions to the tab pages through the router Outlet context.
 */

import DepartmentLayout from "../../shared/DepartmentLayout";
export default function LUCSLayout() {
  return <DepartmentLayout role="lucs" unitCodes={["lucs"]} title="LUCS" />;
}