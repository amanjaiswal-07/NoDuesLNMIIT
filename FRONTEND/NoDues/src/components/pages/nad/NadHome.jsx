/**
 * NadHome.jsx — NAD Cell home page (/nad): pending count and the Department Access table where
 * NAD Cell staff manage who may open this section.
 * NAD waits for the student's HOD. Putting a request on hold requires choosing the HOD to reset on reapply.
 */

// import { useOutletContext } from "react-router-dom";
// import DepartmentHome from "../../Home/DepartmentHome";

// export default function NadHome() {
//   const { pending } = useOutletContext();
//   return <DepartmentHome deptName="NAD Cell" pendingCount={pending.length} />;
// }
import { useOutletContext } from "react-router-dom";
import DepartmentHome from "../../Home/DepartmentHome";
import DepartmentAccessManager from "../../Home/DepartmentAccessManager";

export default function NadHome() {
  const { pending } = useOutletContext();

  return (
    <DepartmentHome deptName="NAD Cell" pendingCount={pending.length}>
      <DepartmentAccessManager currentRoute="/nad" />
    </DepartmentHome>
  );
}