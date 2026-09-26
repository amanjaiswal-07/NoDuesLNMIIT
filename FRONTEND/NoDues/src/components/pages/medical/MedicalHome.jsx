/**
 * MedicalHome.jsx — Medical Officer home page (/medical): pending count and the Department Access table where
 * Medical Officer staff manage who may open this section.
 */

// import DepartmentHome from "../../Home/DepartmentHome.jsx";
// import { useOutletContext } from "react-router-dom";

// export default function MedicalHome() {
//   const { pending } = useOutletContext();
//   return <DepartmentHome deptName="Medical Unit" pendingCount={pending.length}/>;
// }
import DepartmentHome from "../../Home/DepartmentHome.jsx";
import DepartmentAccessManager from "../../Home/DepartmentAccessManager";
import { useOutletContext } from "react-router-dom";

export default function MedicalHome() {
  const { pending } = useOutletContext();

  return (
    <DepartmentHome deptName="Medical Unit" pendingCount={pending.length}>
      <DepartmentAccessManager currentRoute="/medical" />
    </DepartmentHome>
  );
}