/**
 * PlacementApproved.jsx — Placement Office "Approved Requests" tab. Students Placement Office has cleared; one can be moved back
 * to On Hold with a reason (not once the whole application is complete — the backend refuses).
 * Placement sees the student's placement status, TPC email date and placement documents.
 */

import { useState } from "react";
import { useOutletContext } from "react-router-dom";

import ApprovedRequests from "../../Request/ApprovedRequests";
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
    label: "For higher studies abroad: exam scorecard or call letter missing",
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

export default function PlacementApproved() {
  const { approved, moveApprovedToRejected } = useOutletContext();

  const [rejectOpen, setRejectOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);

  const [viewOpen, setViewOpen] = useState(false);
  const [viewStudent, setViewStudent] = useState(null);

  return (
    <>
      <ApprovedRequests
        title="Placement Cell - Approved Requests"
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
        reasons={PLACEMENT_REASONS}
        title="Move to On Hold"
        confirmText="Move"
        placeholder="Write details (what is missing, file name, remarks)..."
      />

      <ViewDetailsModal
        currentDepartment="placement"
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