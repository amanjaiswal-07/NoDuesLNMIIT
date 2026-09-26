/**
 * HODHome.jsx — Head of Department home page (/hod/:department): pending count and the Department Access table where
 * Head of Department staff manage who may open this section.
 * A student's request goes only to their own branch HOD, after all their labs, LUCS and the Librarian approved. When putting on hold the HOD may reset specific labs, LUCS or Library on reapply.
 */

import { useOutletContext, useParams } from "react-router-dom";
import DepartmentHome from "../../Home/DepartmentHome";
import DepartmentAccessManager from "../../Home/DepartmentAccessManager";

export default function HODHome() {
  const { department } = useParams();
  const { departmentLabel, pending } = useOutletContext();

  return (
    <DepartmentHome
      deptName={`${departmentLabel} HOD`}
      pendingCount={pending.length}
    >
      <DepartmentAccessManager currentRoute={`/hod/${department}`} />
    </DepartmentHome>
  );
}