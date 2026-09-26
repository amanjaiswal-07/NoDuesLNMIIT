/**
 * SportsLayout.jsx — route frame for Sports Officer (/sports). Uses DepartmentLayout, which draws the header and
 * loads this section's Pending / Approved / On Hold lists (useDepartmentData), and passes them plus the
 * approve / hold actions to the tab pages through the router Outlet context.
 */

import DepartmentLayout from "../../shared/DepartmentLayout";
export default function SportsLayout() {
  return <DepartmentLayout role="sports" unitCodes={["sports"]} title="Sports Officer" />;
}
