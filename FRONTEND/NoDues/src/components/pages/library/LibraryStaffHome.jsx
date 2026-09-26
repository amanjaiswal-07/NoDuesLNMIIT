/**
 * LibraryStaffHome.jsx — Central Library - Staff home page (/library/staff): pending count and the Department Access table where
 * Central Library - Staff staff manage who may open this section.
 * First library step. Approving here is "Move to Librarian".
 */

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