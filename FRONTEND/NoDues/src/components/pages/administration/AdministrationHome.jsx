/**
 * AdministrationHome.jsx — Administration home page (/administration): pending count and the Department Access table where
 * Administration staff manage who may open this section.
 */

// import { useOutletContext } from "react-router-dom";
// import DepartmentHome from "../../Home/DepartmentHome";

// export default function AdministrationHome() {
//   const { pending } = useOutletContext();
//   return <DepartmentHome deptName="Administration" pendingCount={pending.length} />;
// }
import { useOutletContext } from "react-router-dom";
import DepartmentHome from "../../Home/DepartmentHome";
import DepartmentAccessManager from "../../Home/DepartmentAccessManager";

export default function AdministrationHome() {
  const { pending } = useOutletContext();

  return (
    <DepartmentHome deptName="Administration" pendingCount={pending.length}>
      <DepartmentAccessManager currentRoute="/administration" />
    </DepartmentHome>
  );
}