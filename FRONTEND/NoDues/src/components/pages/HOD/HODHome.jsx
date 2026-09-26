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