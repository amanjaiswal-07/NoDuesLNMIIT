/**
 * PlacementHome.jsx — Placement Office home page (/placement): pending count and the Department Access table where
 * Placement Office staff manage who may open this section.
 * Placement sees the student's placement status, TPC email date and placement documents.
 */

// import { useOutletContext } from "react-router-dom";
// import DepartmentHome from "../../Home/DepartmentHome";

// export default function PlacementHome() {
//   const { pending } = useOutletContext();
//   return <DepartmentHome deptName="Placement Cell" pendingCount={pending.length} />;
// }
import { useOutletContext } from "react-router-dom";
import DepartmentHome from "../../Home/DepartmentHome";
import DepartmentAccessManager from "../../Home/DepartmentAccessManager";

export default function PlacementHome() {
  const { pending } = useOutletContext();

  return (
    <DepartmentHome deptName="Placement Cell" pendingCount={pending.length}>
      <DepartmentAccessManager currentRoute="/placement" />
    </DepartmentHome>
  );
}