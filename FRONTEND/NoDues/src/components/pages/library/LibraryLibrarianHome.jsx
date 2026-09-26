/**
 * LibraryLibrarianHome.jsx — Central Library - Librarian home page (/library/librarian): pending count and the Department Access table where
 * Central Library - Librarian staff manage who may open this section.
 * Second library step (after Library Staff). A Librarian hold restarts the library chain from Library Staff on reapply.
 */

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