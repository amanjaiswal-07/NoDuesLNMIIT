/**
 * AdministrationApproved.jsx — Administration "Approved Requests" tab. Students Administration has cleared; one can be moved back
 * to On Hold with a reason (not once the whole application is complete — the backend refuses).
 */

import { useState } from "react";
import { useOutletContext } from "react-router-dom";

import ApprovedRequests from "../../Request/ApprovedRequests";
import RejectModal from "../../Modal/RejectModal";
import ViewDetailsModal from "../../Modal/ViewDetailsModal";

const ADMIN_REASONS = [
  { value: "guest_house", label: "Guest House charges pending (room/stay fees)", requiresText: true },
  { value: "transport", label: "Transport dues pending (bus related)", requiresText: true },
  { value: "misc", label: "Miscellaneous", requiresText: true },
];

export default function AdministrationApproved() {
  const { approved, moveApprovedToRejected } = useOutletContext();

  const [rejectOpen, setRejectOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);

  const [viewOpen, setViewOpen] = useState(false);
  const [viewStudent, setViewStudent] = useState(null);

  return (
    <>
      <ApprovedRequests
        title="Administration - Approved Requests"
        data={approved}
        onMoveToRejected={(s) => {
          setSelectedStudent(s);
          setRejectOpen(true);
        }}
        onView={(s) => {
          setViewStudent(s);
          setViewOpen(true);
        }}
      />

      <RejectModal
        open={rejectOpen}
        student={selectedStudent}
        onClose={() => {
          setRejectOpen(false);
          setSelectedStudent(null);
        }}
        onConfirm={(reason, description, restartFrom) => {
          if (!selectedStudent) return;
          moveApprovedToRejected(selectedStudent, reason, description, restartFrom);
          setRejectOpen(false);
          setSelectedStudent(null);
        }}
        reasons={ADMIN_REASONS}
        title="Move to On Hold"
        confirmText="Move"
        placeholder="Write details (type of due, amount, reference, remarks)..."
      />

      <ViewDetailsModal
        currentDepartment="administration"
        open={viewOpen}
        student={viewStudent}
        onClose={() => {
          setViewOpen(false);
          setViewStudent(null);
        }}
      />
    </>
  );
}
