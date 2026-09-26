/**
 * StoreHome.jsx — Store home page (/store): pending count and the Department Access table where
 * Store staff manage who may open this section.
 * Store waits for the student's HOD and Warden. When putting on hold, Store may choose to also reset the HOD and/or Warden on reapply.
 */

// import { useOutletContext } from "react-router-dom";
// import DepartmentHome from "../../Home/DepartmentHome";

// export default function StoreHome() {
//   const { pending } = useOutletContext();
//   return <DepartmentHome deptName="Store" pendingCount={pending.length} />;
// }
import { useOutletContext } from "react-router-dom";
import DepartmentHome from "../../Home/DepartmentHome";
import DepartmentAccessManager from "../../Home/DepartmentAccessManager";

export default function StoreHome() {
  const { pending } = useOutletContext();

  return (
    <DepartmentHome deptName="Store" pendingCount={pending.length}>
      <DepartmentAccessManager currentRoute="/store" />
    </DepartmentHome>
  );
}