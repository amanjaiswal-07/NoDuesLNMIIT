/**
 * SportsHome.jsx — Sports Officer home page (/sports): pending count and the Department Access table where
 * Sports Officer staff manage who may open this section.
 */

// import { useOutletContext } from "react-router-dom";
// import DepartmentHome from "../../Home/DepartmentHome";

// export default function SportsHome() {
//   const { pending } = useOutletContext();
//   return <DepartmentHome deptName="Sports" pendingCount={pending.length} />;
// }
import { useOutletContext } from "react-router-dom";
import DepartmentHome from "../../Home/DepartmentHome";
import DepartmentAccessManager from "../../Home/DepartmentAccessManager";

export default function SportsHome() {
  const { pending } = useOutletContext();

  return (
    <DepartmentHome deptName="Sports" pendingCount={pending.length}>
      <DepartmentAccessManager currentRoute="/sports" />
    </DepartmentHome>
  );
}
