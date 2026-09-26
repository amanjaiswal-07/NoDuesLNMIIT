/**
 * LUCSApproved.jsx — LUCS "Approved Requests" tab. Students LUCS has cleared; one can be moved back
 * to On Hold with a reason (not once the whole application is complete — the backend refuses).
 */

import { useState } from "react";
import { useOutletContext } from "react-router-dom";

import ApprovedRequests from "../../Request/ApprovedRequests";
import RejectModal from "../../Modal/RejectModal";
import ViewDetailsModal from "../../Modal/ViewDetailsModal";

const LUCS_REASONS = [
  {
    value: "gpu_account_not_issued",
    label: "GPU account has not been issued / activated for the student",
    requiresText: true,
  },
  {
    value: "gpu_account_not_verified",
    label: "GPU account details could not be verified",
    requiresText: true,
  },
];

export default function LUCSApproved() {
  const { approved, moveApprovedToRejected } = useOutletContext();

  const [rejectOpen, setRejectOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);

  const [viewOpen, setViewOpen] = useState(false);
  const [viewStudent, setViewStudent] = useState(null);

  return (
    <>
      <ApprovedRequests
        title="LUCS - Approved Requests"
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
        reasons={LUCS_REASONS}
        title="Move to On Hold"
        confirmText="Move"
        placeholder="Write details (GPU username, issue, remarks)..."
      />

      <ViewDetailsModal
        currentDepartment="lucs"
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