/**
 * AdministrationLayout.jsx — route frame for Administration (/administration). Uses DepartmentLayout, which draws the header and
 * loads this section's Pending / Approved / On Hold lists (useDepartmentData), and passes them plus the
 * approve / hold actions to the tab pages through the router Outlet context.
 */

import DepartmentLayout from "../../shared/DepartmentLayout";
export default function AdministrationLayout() {
  return <DepartmentLayout role="administration" unitCodes={["administration"]} title="Administration" />;
}
