/**
 * MedicalApproved.jsx — Medical Officer "Approved Requests" tab. Students Medical Officer has cleared; one can be moved back
 * to On Hold with a reason (not once the whole application is complete — the backend refuses).
 */

import { useState } from "react";
import { useOutletContext } from "react-router-dom";

import ApprovedRequests from "../../Request/ApprovedRequests";
import RejectModal from "../../Modal/RejectModal";
import ViewDetailsModal from "../../Modal/ViewDetailsModal";

const MEDICAL_REASONS = [
  { value: "instrument_issued", label: "Instrument issued — not returned / not cleared", requiresText: true },
  { value: "wheelchair_issued", label: "Wheelchair issued — not returned / not cleared", requiresText: true },
  { value: "idcard_missing", label: "Student ID card not submitted / not readable", requiresText: true },
  { value: "doc_incomplete", label: "Medical documents incomplete or missing", requiresText: true },
  { value: "approval_was_mistake", label: "Approval was made in error", requiresText: true },
  { value: "misc", label: "Miscellaneous", requiresText: true },
];

export default function MedicalApproved() {
  const { approved, moveApprovedToRejected } = useOutletContext();

  const [rejectOpen, setRejectOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);

  const [viewOpen, setViewOpen] = useState(false);
  const [viewStudent, setViewStudent] = useState(null);

  const openMoveToRejected = (student) => {
    setSelectedStudent(student);
    setRejectOpen(true);
  };

  const closeReject = () => {
    setRejectOpen(false);
    setSelectedStudent(null);
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
      <ApprovedRequests
        title="Medical - Approved Requests"
        data={approved}
        onMoveToRejected={openMoveToRejected}
        onView={openView}
      />

      <RejectModal
        open={rejectOpen}
        student={selectedStudent}
        onClose={closeReject}
        onConfirm={(reason, description, restartFrom) => {
          if (!selectedStudent) return;
          moveApprovedToRejected(selectedStudent, reason, description, restartFrom);
          setRejectOpen(false);
          setSelectedStudent(null);
        }}
        reasons={MEDICAL_REASONS}
        title="Move to On Hold"
        confirmText="Move to On Hold"
        placeholder="Describe the issue (item name, quantity, remarks)..."
      />

      <ViewDetailsModal
        currentDepartment="medical"
        open={viewOpen}
        student={viewStudent}
        onClose={closeView}
      />
    </>
  );
}
