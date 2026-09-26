/**
 * LibraryLibrarianLayout.jsx — Central Library Librarian section (/library/librarian). Second library
 * step: a request reaches the Librarian only after Library Staff approved it.
 */

import { Outlet } from "react-router-dom";
import DepartmentLayout from "../../shared/DepartmentLayout";

export default function LibraryLibrarianLayout() {
  return (
    <DepartmentLayout role="library_librarian" unitCodes={["library_librarian"]} title="Central Library - Librarian" basePath="/library/librarian">
      {(contextData) => (
        <Outlet
          context={{
            ...contextData,
            librarianPending: contextData.pending,
            librarianApproved: contextData.approved,
            librarianRejected: contextData.rejected,
            librarianApprove: contextData.approveStudent,
            librarianReject: contextData.rejectStudent,
            librarianMoveApprovedToRejected: contextData.moveApprovedToRejected,
            librarianMoveRejectedToApproved: contextData.moveRejectedToApproved,
          }}
        />
      )}
    </DepartmentLayout>
  );
}