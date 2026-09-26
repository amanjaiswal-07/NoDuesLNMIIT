/**
 * LibraryStaffPending.jsx — Central Library - Staff "Pending Requests" tab. Students waiting for Central Library - Staff's clearance.
 * Approve (one or selected), Put On Hold (reason + mandatory details, shown to the student) or open
 * View details (student info, timeline, prerequisites and the documents Central Library - Staff needs).
 * First library step. Approving here is "Move to Librarian".
 */

import { useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import PendingRequests from "../../Request/PendingRequests";
import ConfirmModal from "../../Modal/ConfirmModal";
import RejectModal from "../../Modal/RejectModal";
import ViewDetailsModal from "../../Modal/ViewDetailsModal";

export default function LibraryStaffPendingPage() {
  const {
    staffPending,
    staffMoveToLibrarian,
    staffReject,
  } = useOutletContext();

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selected, setSelected] = useState(null);

  const [bulkConfirmOpen, setBulkConfirmOpen] = useState(false);
  const [bulkSelected, setBulkSelected] = useState([]);

  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectSelected, setRejectSelected] = useState(null);

  const [viewOpen, setViewOpen] = useState(false);
  const [viewStudent, setViewStudent] = useState(null);

  const title = useMemo(() => "Central Library - Staff | Pending Requests", []);

  const handleMoveClick = (student) => {
    setSelected(student);
    setConfirmOpen(true);
  };

  const handleConfirmMove = () => {
    if (selected) staffMoveToLibrarian(selected);
    setConfirmOpen(false);
    setSelected(null);
  };

  const handleRejectClick = (student) => {
    setRejectSelected(student);
    setRejectOpen(true);
  };

  const handleConfirmReject = (reason, description, restartFrom) => {
    if (rejectSelected) staffReject(rejectSelected, reason, description, restartFrom);
    setRejectOpen(false);
    setRejectSelected(null);
  };

  const LIB_REJECT_REASONS = [
    { value: "rfid_missing", label: "Student RFID missing", requiresText: true },
    { value: "fine_pending", label: "Pending fine", requiresText: true },
    { value: "books_not_returned", label: "Issued books not returned", requiresText: true },
    { value: "btp_report_unsigned", label: "BTP report not signed by supervisor", requiresText: true },
    { value: "misc", label: "Miscellaneous", requiresText: true },
  ];

  return (
    <>
      <PendingRequests
        title={title}
        data={staffPending}
        showApprove={true}
        approveLabel="Move to Librarian"
        approveIcon="send"
        onApprove={handleMoveClick}
        onApproveSelected={(students) => {
          setBulkSelected(students);
          setBulkConfirmOpen(true);
        }}
        showReject={true}
        rejectLabel="Put On Hold"
        onReject={handleRejectClick}
        onView={(s) => {
          setViewStudent(s);
          setViewOpen(true);
        }}
      />

      <ConfirmModal
        open={confirmOpen}
        title="Send to Librarian?"
        message={
          selected
            ? `Send ${selected.name} (${selected.roll}) to Librarian for final approval?`
            : "Send this request to Librarian for final approval?"
        }
        confirmText="Yes, send"
        cancelText="Cancel"
        onClose={() => {
          setConfirmOpen(false);
          setSelected(null);
        }}
        onConfirm={handleConfirmMove}
      />

      <ConfirmModal
        open={bulkConfirmOpen}
        title="Send Selected Requests to Librarian?"
        message={
          bulkSelected.length > 0
            ? `Send ${bulkSelected.length} selected students to Librarian for final approval?`
            : ""
        }
        confirmText="Send Selected"
        cancelText="Cancel"
        onClose={() => {
          setBulkConfirmOpen(false);
          setBulkSelected([]);
        }}
        onConfirm={() => {
          bulkSelected.forEach((student) => staffMoveToLibrarian(student));
          setBulkConfirmOpen(false);
          setBulkSelected([]);
        }}
      />

      <RejectModal
        open={rejectOpen}
        student={rejectSelected}
        onClose={() => {
          setRejectOpen(false);
          setRejectSelected(null);
        }}
        onConfirm={handleConfirmReject}
        title="Put Request On Hold"
        confirmText="Confirm Hold"
        reasons={LIB_REJECT_REASONS}
        placeholder="Write details (mandatory)..."
      />

      <ViewDetailsModal
        open={viewOpen}
        student={viewStudent}
        currentDepartment="library_staff"
        onClose={() => {
          setViewOpen(false);
          setViewStudent(null);
        }}
      />
    </>
  );
}