/**
 * StoreLayout.jsx — route frame for Store (/store). Uses DepartmentLayout, which draws the header and
 * loads this section's Pending / Approved / On Hold lists (useDepartmentData), and passes them plus the
 * approve / hold actions to the tab pages through the router Outlet context.
 * Store waits for the student's HOD and Warden. When putting on hold, Store may choose to also reset the HOD and/or Warden on reapply.
 */

import DepartmentLayout from "../../shared/DepartmentLayout";
export default function StoreLayout() {
  return <DepartmentLayout role="store" unitCodes={["store"]} title="Store" />;
}
