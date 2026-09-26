import { useOutletContext } from "react-router-dom";
import DepartmentHome from "../../Home/DepartmentHome";
import DepartmentAccessManager from "../../Home/DepartmentAccessManager";

export default function LibraryStaffHome() {
  const { staffPending } = useOutletContext();

  return (
    <DepartmentHome
      deptName="Central Library - Staff"
      pendingCount={staffPending.length}
    >
      <DepartmentAccessManager currentRoute="/library/staff" />
    </DepartmentHome>
  );
}