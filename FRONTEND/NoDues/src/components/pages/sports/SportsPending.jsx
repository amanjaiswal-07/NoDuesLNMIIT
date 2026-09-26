import { useState } from "react";
import { useOutletContext } from "react-router-dom";

import PendingRequests from "../../Request/PendingRequests";
import ConfirmModal from "../../Modal/ConfirmModal";
import RejectModal from "../../Modal/RejectModal";
import ViewDetailsModal from "../../Modal/ViewDetailsModal";

const SPORTS_REASONS = [
  { value: "sports_equipment", label: "Sports equipment issued", requiresText: false },
  { value: "misc", label: "Miscellaneous", requiresText: true },
];

export default function SportsPending() {
  const { pending, approveStudent, rejectStudent } = useOutletContext();

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [approveTarget, setApproveTarget] = useState(null);

  const [bulkApproveOpen, setBulkApproveOpen] = useState(false);
  const [bulkApproveTargets, setBulkApproveTargets] = useState([]);

  const [rejectOpen, setRejectOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);

  const [viewOpen, setViewOpen] = useState(false);
  const [viewStudent, setViewStudent] = useState(null);

  return (
    <>
      <PendingRequests
        title="Sports - Pending Requests"
        data={pending}
        onApprove={(s) => {
          setApproveTarget(s);
          setConfirmOpen(true);
        }}
        onApproveSelected={(students) => {
          setBulkApproveTargets(students);
          setBulkApproveOpen(true);
        }}
        onReject={(s) => {
          setSelectedStudent(s);
          setRejectOpen(true);
        }}
        onView={(s) => {
          setViewStudent(s);
          setViewOpen(true);
        }}
      />

      <ConfirmModal
        open={confirmOpen}
        title="Approve Sports Clearance?"
        message={
          approveTarget
            ? `Approve Sports clearance for ${approveTarget.name} (${approveTarget.roll})?`
            : ""
        }
        confirmText="Approve"
        cancelText="Cancel"
        onClose={() => {
          setConfirmOpen(false);
          setApproveTarget(null);
        }}
        onConfirm={() => {
          if (approveTarget) approveStudent(approveTarget);
          setConfirmOpen(false);
          setApproveTarget(null);
        }}
      />

      <ConfirmModal
        open={bulkApproveOpen}
        title="Approve Selected Sports Requests?"
        message={
          bulkApproveTargets.length > 0
            ? `Approve Sports clearance for ${bulkApproveTargets.length} selected students?`
            : ""
        }
        confirmText="Approve Selected"
        cancelText="Cancel"
        onClose={() => {
          setBulkApproveOpen(false);
          setBulkApproveTargets([]);
        }}
        onConfirm={() => {
          bulkApproveTargets.forEach((student) => approveStudent(student));
          setBulkApproveOpen(false);
          setBulkApproveTargets([]);
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
          rejectStudent(selectedStudent, reason, description, restartFrom);
          setRejectOpen(false);
          setSelectedStudent(null);
        }}
        reasons={SPORTS_REASONS}
        title="Put Request On Hold"
        confirmText="Confirm Hold"
        placeholder="Write miscellaneous reason..."
      />

      <ViewDetailsModal
        open={viewOpen}
        student={viewStudent}
        currentDepartment="sports"
        onClose={() => {
          setViewOpen(false);
          setViewStudent(null);
        }}
      />
    </>
  );
}