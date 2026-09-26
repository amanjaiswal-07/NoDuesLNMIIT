// import { useState } from "react";
// import { useOutletContext } from "react-router-dom";

// import PendingRequests from "../../Request/PendingRequests";
// import RejectModal from "../../Modal/RejectModal";
// import ViewDetailsModal from "../../Modal/ViewDetailsModal";
import { BRANCH_TO_HOD } from "../../../config/branches";

import { useState } from "react";
import { useOutletContext } from "react-router-dom";

import PendingRequests from "../../Request/PendingRequests";
import ConfirmModal from "../../Modal/ConfirmModal";
import RejectModal from "../../Modal/RejectModal";
import ViewDetailsModal from "../../Modal/ViewDetailsModal";

const NAD_REASONS = [
  { value: "apaar", label: "APAAR ID not submitted / verified" },
  { value: "abc", label: "ABC ID not submitted / verified" },
  { value: "digilocker", label: "DigiLocker marksheets not fetched / verified" },
  { value: "admission_docs", label: "Required admission documents pending / incomplete" },
  { value: "misc", label: "Miscellaneous" },
];

// Returns only the relevant HOD for a student's branch
function getHodOptionForStudent(student) {
  const branch = (student?.branch || "").toUpperCase();
  const hod = BRANCH_TO_HOD[branch];
  return hod ? [hod] : Object.values(BRANCH_TO_HOD); // fallback: show all if branch unknown
}

export default function NadPending() {
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
        title="NAD Cell - Pending Requests"
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
        title="Approve NAD Clearance?"
        message={
          approveTarget
            ? `Approve NAD clearance for ${approveTarget.name} (${approveTarget.roll})?`
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
        title="Approve Selected NAD Requests?"
        message={
          bulkApproveTargets.length > 0
            ? `Approve NAD clearance for ${bulkApproveTargets.length} selected students?`
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
        onClose={() => { setRejectOpen(false); setSelectedStudent(null); }}
        onConfirm={(reason, description, restartFrom) => {
          rejectStudent(selectedStudent, reason, description, restartFrom);
          setRejectOpen(false);
          setSelectedStudent(null);
        }}
        reasons={NAD_REASONS}
        title="Put NAD Request"
        confirmText="Confirm Hold"
        placeholder="Specify what is missing, any reference numbers, or remarks…"
        dependencyOptions={getHodOptionForStudent(selectedStudent)}
      />

      <ViewDetailsModal
        open={viewOpen}
        student={viewStudent}
        currentDepartment="nad"
        onClose={() => {
          setViewOpen(false);
          setViewStudent(null);
        }}
      />
    </>
  );
}