// import { useState } from "react";
// import { useOutletContext } from "react-router-dom";

// import PendingRequests from "../../Request/PendingRequests";
// import RejectModal from "../../Modal/RejectModal";
// import ViewDetailsModal from "../../Modal/ViewDetailsModal";

import { useState } from "react";
import { useOutletContext } from "react-router-dom";

import PendingRequests from "../../Request/PendingRequests";
import ConfirmModal from "../../Modal/ConfirmModal";
import RejectModal from "../../Modal/RejectModal";
import ViewDetailsModal from "../../Modal/ViewDetailsModal";

const MEDICAL_REASONS = [
  { value: "instrument_issued", label: "Instrument issued — not returned / not cleared", requiresText: true },
  { value: "wheelchair_issued", label: "Wheelchair issued — not returned / not cleared", requiresText: true },
  { value: "idcard_missing", label: "Student ID card not submitted / not readable", requiresText: true },
  { value: "doc_incomplete", label: "Medical documents incomplete or missing", requiresText: true },
  { value: "misc", label: "Miscellaneous", requiresText: true },
];

export default function MedicalPending() {
  const { pending, approveStudent, rejectStudent } = useOutletContext();

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [approveTarget, setApproveTarget] = useState(null);

  const [bulkApproveOpen, setBulkApproveOpen] = useState(false);
  const [bulkApproveTargets, setBulkApproveTargets] = useState([]);

  const [rejectOpen, setRejectOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);

  const [viewOpen, setViewOpen] = useState(false);
  const [viewStudent, setViewStudent] = useState(null);

  const openReject = (student) => {
    setSelectedStudent(student);
    setRejectOpen(true);
  };

  const closeReject = () => {
    setRejectOpen(false);
    setSelectedStudent(null);
  };

  const confirmReject = (reason, description, restartFrom) => {
    if (!selectedStudent) return;
    rejectStudent(selectedStudent, reason, description, restartFrom);
    closeReject();
  };

  const openView = (student) => {
    setViewStudent(student);
    setViewOpen(true);
  };

  const closeView = () => {
    setViewOpen(false);
    setViewStudent(null);
  };

  return (
    <>
      <PendingRequests
        title="Medical - Pending Requests"
        data={pending}
        onApprove={(s) => {
          setApproveTarget(s);
          setConfirmOpen(true);
        }}
        onApproveSelected={(students) => {
          setBulkApproveTargets(students);
          setBulkApproveOpen(true);
        }}
        onReject={openReject}
        onView={openView}
      />

      <ConfirmModal
        open={confirmOpen}
        title="Approve Medical Clearance?"
        message={
          approveTarget
            ? `Approve Medical clearance for ${approveTarget.name} (${approveTarget.roll})?`
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
        title="Approve Selected Medical Requests?"
        message={
          bulkApproveTargets.length > 0
            ? `Approve Medical clearance for ${bulkApproveTargets.length} selected students?`
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
        onClose={closeReject}
        onConfirm={confirmReject}
        reasons={MEDICAL_REASONS}
        title="Put Medical Clearance"
        confirmText="Confirm Hold"
        placeholder="Describe the issue (item name, quantity, remarks)..."
      />

      <ViewDetailsModal
        open={viewOpen}
        student={viewStudent}
        currentDepartment="medical"
        onClose={closeView}
      />
    </>
  );
}