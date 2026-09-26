/**
 * AccountsLayout.jsx — route frame for Accounts (/accounts). Uses DepartmentLayout, which draws the header and
 * loads this section's Pending / Approved / On Hold lists (useDepartmentData), and passes them plus the
 * approve / hold actions to the tab pages through the router Outlet context.
 * Accounts is the final step and sees the refund / bank details and cancelled cheque. When putting on hold it may reset any earlier department (labs included); on reapply Accounts waits until all of them approve again.
 */

import DepartmentLayout from "../../shared/DepartmentLayout";
export default function AccountsLayout() {
  return <DepartmentLayout role="accounts" unitCodes={["accounts"]} title="Accounts" />;
}
