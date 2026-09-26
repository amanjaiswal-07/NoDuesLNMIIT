/**
 * HODRejected.jsx — Head of Department "Requests On Hold" tab. Students Head of Department put on hold; they stay here until the
 * student fixes the issue and reapplies. "Move to Approved" clears them directly (only if every
 * prerequisite is already approved).
 * A student's request goes only to their own branch HOD, after all their labs, LUCS and the Librarian approved. When putting on hold the HOD may reset specific labs, LUCS or Library on reapply.
 */

import { useState } from "react";
import { useOutletContext } from "react-router-dom";

import RejectedRequests from "../../Request/RejectedRequests";
import ConfirmModal from "../../Modal/ConfirmModal";
import ViewDetailsModal from "../../Modal/ViewDetailsModal";

export default function HODRejected() {
  const { departmentLabel, rejected, moveRejectedToApproved } = useOutletContext();

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [approveTarget, setApproveTarget] = useState(null);

  const [bulkConfirmOpen, setBulkConfirmOpen] = useState(false);
  const [bulkApproveTargets, setBulkApproveTargets] = useState([]);

  const [viewOpen, setViewOpen] = useState(false);
  const [viewStudent, setViewStudent] = useState(null);

  return (
    <>
      <RejectedRequests
        title={`${departmentLabel} HOD - Requests On Hold`}
        data={rejected}
        onMoveToApproved={(s) => {
          setApproveTarget(s);
          setConfirmOpen(true);
        }}
        onMoveToApprovedSelected={(students) => {
          setBulkApproveTargets(students);
          setBulkConfirmOpen(true);
        }}
        onView={(s) => {
          setViewStudent(s);
          setViewOpen(true);
        }}
      />

      <ConfirmModal
        open={confirmOpen}
        title="Move to Approved?"
        message={
          approveTarget
            ? `Move ${approveTarget.name} (${approveTarget.roll}) to approved?`
            : ""
        }
        confirmText="Move to Approved"
        cancelText="Cancel"
        onClose={() => {
          setConfirmOpen(false);
          setApproveTarget(null);
        }}
        onConfirm={() => {
          if (approveTarget) moveRejectedToApproved(approveTarget);
          setConfirmOpen(false);
          setApproveTarget(null);
        }}
      />

      <ConfirmModal
        open={bulkConfirmOpen}
        title="Move Selected Requests On Hold to Approved?"
        message={
          bulkApproveTargets.length > 0
            ? `Move ${bulkApproveTargets.length} selected students to approved?`
            : ""
        }
        confirmText="Approve Selected"
        cancelText="Cancel"
        onClose={() => {
          setBulkConfirmOpen(false);
          setBulkApproveTargets([]);
        }}
        onConfirm={() => {
          bulkApproveTargets.forEach((student) => moveRejectedToApproved(student));
          setBulkConfirmOpen(false);
          setBulkApproveTargets([]);
        }}
      />

      <ViewDetailsModal
        open={viewOpen}
        student={viewStudent}
        currentDepartment="hod"
        onClose={() => {
          setViewOpen(false);
          setViewStudent(null);
        }}
      />
    </>
  );
}
