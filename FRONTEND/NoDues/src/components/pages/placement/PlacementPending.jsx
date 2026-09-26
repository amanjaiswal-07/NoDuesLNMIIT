import { useState } from "react";
import { useOutletContext } from "react-router-dom";

import PendingRequests from "../../Request/PendingRequests";
import ConfirmModal from "../../Modal/ConfirmModal";
import RejectModal from "../../Modal/RejectModal";
import ViewDetailsModal from "../../Modal/ViewDetailsModal";

const PLACEMENT_REASONS = [
  {
    value: "idcard_missing",
    label: "Student ID card not submitted / not readable",
    requiresText: true,
  },
  {
    value: "status_missing",
    label: "Placement status not selected / unclear",
    requiresText: true,
  },
  {
    value: "email_date_missing",
    label: "Email sent date not provided / invalid",
    requiresText: true,
  },
  {
    value: "offer_letter_missing",
    label: "Offer letter missing (required for placed students)",
    requiresText: true,
  },
  {
    value: "unplaced_details_missing",
    label: "Unplaced details missing (current activity not provided)",
    requiresText: true,
  },
  {
    value: "prep_break_declaration_missing",
    label: "Preparation break self-declaration missing",
    requiresText: true,
  },
  {
    value: "admission_letter_missing",
    label: "Admission letter missing (required for higher studies)",
    requiresText: true,
  },
  {
    value: "abroad_proof_missing",
    label:
      "For higher studies abroad: exam scorecard or call letter missing",
    requiresText: true,
  },
  {
    value: "family_business_declaration_missing",
    label: "Family business declaration missing (role/position not mentioned)",
    requiresText: true,
  },
  {
    value: "misc",
    label: "Miscellaneous",
    requiresText: true,
  },
];

export default function PlacementPending() {
  const { pending, approveStudent, rejectStudent } = useOutletContext();

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [approveStudentTarget, setApproveStudentTarget] = useState(null);

  const [bulkApproveOpen, setBulkApproveOpen] = useState(false);
  const [bulkApproveTargets, setBulkApproveTargets] = useState([]);

  const [rejectOpen, setRejectOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);

  const [viewOpen, setViewOpen] = useState(false);
  const [viewStudent, setViewStudent] = useState(null);

  return (
    <>
      <PendingRequests
        title="Placement Cell - Pending Requests"
        data={pending}
        onApprove={(s) => {
          setApproveStudentTarget(s);
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
        title="Approve Placement Clearance?"
        message={
          approveStudentTarget
            ? `Send ${approveStudentTarget.name} (${approveStudentTarget.roll}) for final approval?`
            : ""
        }
        confirmText="Yes, Approve"
        cancelText="Cancel"
        onClose={() => {
          setConfirmOpen(false);
          setApproveStudentTarget(null);
        }}
        onConfirm={() => {
          if (approveStudentTarget) approveStudent(approveStudentTarget);
          setConfirmOpen(false);
          setApproveStudentTarget(null);
        }}
      />

      <ConfirmModal
        open={bulkApproveOpen}
        title="Approve Selected Placement Requests?"
        message={
          bulkApproveTargets.length > 0
            ? `Send ${bulkApproveTargets.length} selected students for final approval?`
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
        reasons={PLACEMENT_REASONS}
        title="Put Request On Hold"
        confirmText="Confirm Hold"
        placeholder="Write details (what is missing, file name, remarks)..."
      />

      <ViewDetailsModal
        open={viewOpen}
        student={viewStudent}
        currentDepartment="placement"
        onClose={() => {
          setViewOpen(false);
          setViewStudent(null);
        }}
      />
    </>
  );
}