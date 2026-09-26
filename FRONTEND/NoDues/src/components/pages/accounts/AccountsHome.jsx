/**
 * AccountsHome.jsx — Accounts home page (/accounts): pending count and the Department Access table where
 * Accounts staff manage who may open this section.
 * Accounts is the final step and sees the refund / bank details and cancelled cheque. When putting on hold it may reset any earlier department (labs included); on reapply Accounts waits until all of them approve again.
 */

// import { useOutletContext } from "react-router-dom";
// import DepartmentHome from "../../Home/DepartmentHome";

// export default function AccountsHome() {
//   const { pending } = useOutletContext();
//   return <DepartmentHome deptName="Accounts" pendingCount={pending.length} />;
// }
import { useOutletContext } from "react-router-dom";
import DepartmentHome from "../../Home/DepartmentHome";
import DepartmentAccessManager from "../../Home/DepartmentAccessManager";

export default function AccountsHome() {
  const { pending } = useOutletContext();

  return (
    <DepartmentHome deptName="Accounts" pendingCount={pending.length}>
      <DepartmentAccessManager currentRoute="/accounts" />
    </DepartmentHome>
  );
}