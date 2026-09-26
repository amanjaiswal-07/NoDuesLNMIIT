/**
 * NadLayout.jsx — route frame for NAD Cell (/nad). Uses DepartmentLayout, which draws the header and
 * loads this section's Pending / Approved / On Hold lists (useDepartmentData), and passes them plus the
 * approve / hold actions to the tab pages through the router Outlet context.
 * NAD waits for the student's HOD. Putting a request on hold requires choosing the HOD to reset on reapply.
 */

import DepartmentLayout from "../../shared/DepartmentLayout";
export default function NadLayout() {
  return <DepartmentLayout role="nad" unitCodes={["nad"]} title="NAD Cell" />;
}
