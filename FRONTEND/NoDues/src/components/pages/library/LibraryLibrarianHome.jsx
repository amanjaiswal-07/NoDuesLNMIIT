import { useOutletContext } from "react-router-dom";
import DepartmentHome from "../../Home/DepartmentHome";
import DepartmentAccessManager from "../../Home/DepartmentAccessManager";

export default function LibraryLibrarianHome() {
  const { librarianPending } = useOutletContext();

  return (
    <DepartmentHome
      deptName="Central Library - Librarian"
      pendingCount={librarianPending.length}
    >
      <DepartmentAccessManager currentRoute="/library/librarian" />
    </DepartmentHome>
  );
}