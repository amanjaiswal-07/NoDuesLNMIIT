import { useOutletContext } from "react-router-dom";
import { useState } from "react";
import { EyeIcon, XCircleIcon } from "@heroicons/react/24/outline";
import RejectModal from "../../Modal/RejectModal";
import ViewDetailsModal from "../../Modal/ViewDetailsModal";
import StudentRow from "../../Request/StudentRow";
import { rowButton } from "../../Request/rowButton";

export default function LibraryLibrarianApproved() {
  const { librarianApproved, librarianMoveApprovedToRejected } = useOutletContext();

  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectSelected, setRejectSelected] = useState(null);

  const [viewOpen, setViewOpen] = useState(false);
  const [viewStudent, setViewStudent] = useState(null);

  const LIB_REJECT_REASONS = [
    { value: "rfid_missing", label: "Student RFID missing", requiresText: true },
    { value: "fine_pending", label: "Pending fine", requiresText: true },
    { value: "books_not_returned", label: "Issued books not returned", requiresText: true },
    { value: "btp_report_unsigned", label: "BTP report not signed by supervisor", requiresText: true },
    { value: "misc", label: "Miscellaneous", requiresText: true },
  ];

  return (
    <div className="mx-auto w-full max-w-7xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-white">
          Central Library - Librarian | Approved Requests
        </h1>
        <p className="mt-1 text-sm text-white/60">Final approvals done by Librarian.</p>
      </div>

      <div className="space-y-4">
        {librarianApproved.length === 0 ? (
          <div className="rounded-2xl border border-white/15 bg-white/5 p-8 text-center text-white">
            <p className="text-lg font-semibold">No approved requests</p>
            <p className="mt-1 text-sm text-white/60">Nothing here right now.</p>
          </div>
        ) : (
          librarianApproved.map((s, idx) => (
            <StudentRow key={s.id ?? s.roll} idx={idx} s={s}>
              <button
                type="button"
                onClick={() => {
                  setRejectSelected(s);
                  setRejectOpen(true);
                }}
                className={rowButton("red")}
              >
                <XCircleIcon className="h-5 w-5" />
                Move to Rejected
              </button>

              <button
                type="button"
                onClick={() => {
                  setViewStudent(s);
                  setViewOpen(true);
                }}
                className={rowButton("neutral")}
              >
                <EyeIcon className="h-5 w-5" />
                View details
              </button>
            </StudentRow>
          ))
        )}
      </div>

      <RejectModal
        open={rejectOpen}
        student={rejectSelected}
        onClose={() => {
          setRejectOpen(false);
          setRejectSelected(null);
        }}
        onConfirm={(reason, description, restartFrom) => {
          if (!rejectSelected) return;
          librarianMoveApprovedToRejected(rejectSelected, reason, description, restartFrom);
          setRejectOpen(false);
          setRejectSelected(null);
        }}
        title="Move to On Hold"
        confirmText="Confirm Hold"
        reasons={LIB_REJECT_REASONS}
        placeholder="Write details (mandatory)..."
      />

      <ViewDetailsModal
        currentDepartment="library_librarian"
        open={viewOpen}
        student={viewStudent}
        onClose={() => {
          setViewOpen(false);
          setViewStudent(null);
        }}
      />
    </div>
  );
}