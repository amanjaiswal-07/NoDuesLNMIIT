/**
 * NadApproved.jsx — NAD Cell "Approved Requests" tab. Students NAD Cell has cleared; one can be moved back
 * to On Hold with a reason (not once the whole application is complete — the backend refuses).
 * NAD waits for the student's HOD. Putting a request on hold requires choosing the HOD to reset on reapply.
 */

import { useState } from "react";
import { useOutletContext } from "react-router-dom";

import ApprovedRequests from "../../Request/ApprovedRequests";
import RejectModal from "../../Modal/RejectModal";
import ViewDetailsModal from "../../Modal/ViewDetailsModal";
import { BRANCH_TO_HOD } from "../../../config/branches";

const NAD_REASONS = [
  { value: "apaar", label: "APAAR ID not submitted / verified", requiresText: true },
  { value: "abc", label: "ABC ID not submitted / verified", requiresText: true },
  { value: "digilocker", label: "DigiLocker marksheets not fetched / verified", requiresText: true },
  { value: "admission_docs", label: "Required admission documents pending / incomplete", requiresText: true },
  { value: "approval_was_mistake", label: "Approval was made in error", requiresText: true },
  { value: "misc", label: "Miscellaneous", requiresText: true },
];


function getHodOptionForStudent(student) {
  const branch = (student?.branch || "").toUpperCase();
  const hod = BRANCH_TO_HOD[branch];
  return hod ? [hod] : Object.values(BRANCH_TO_HOD);
}

export default function NadApproved() {
  const { approved, moveApprovedToRejected } = useOutletContext();

  const [rejectOpen, setRejectOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);

  const [viewOpen, setViewOpen] = useState(false);
  const [viewStudent, setViewStudent] = useState(null);

  return (
    <>
      <ApprovedRequests
        title="NAD Cell - Approved Requests"
        data={approved}
        onMoveToRejected={(s) => { setSelectedStudent(s); setRejectOpen(true); }}
        onView={(s) => { setViewStudent(s); setViewOpen(true); }}
      />

      <RejectModal
        open={rejectOpen}
        student={selectedStudent}
        onClose={() => { setRejectOpen(false); setSelectedStudent(null); }}
        onConfirm={(reason, description, restartFrom) => {
          if (!selectedStudent) return;
          moveApprovedToRejected(selectedStudent, reason, description, restartFrom);
          setRejectOpen(false);
          setSelectedStudent(null);
        }}
        reasons={NAD_REASONS}
        dependencyOptions={getHodOptionForStudent(selectedStudent)}
        title="Move to On Hold"
        confirmText="Move to On Hold"
        placeholder="Write details (what is missing, reference number, remarks)..."
      />

      <ViewDetailsModal
        open={viewOpen}
        student={viewStudent}
        currentDepartment="nad"
        onClose={() => { setViewOpen(false); setViewStudent(null); }}
      />
    </>
  );
}
