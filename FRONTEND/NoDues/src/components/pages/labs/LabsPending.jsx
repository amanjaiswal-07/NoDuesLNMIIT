import { useState } from "react";
import { useOutletContext } from "react-router-dom";

import PendingRequests from "../../Request/PendingRequests";
import ConfirmModal from "../../Modal/ConfirmModal";
import RejectModal from "../../Modal/RejectModal";
import ViewDetailsModal from "../../Modal/ViewDetailsModal";

const LAB_REASONS = [
  { value: "equipment_not_returned", label: "Lab equipment / issued item has not been returned" },
  { value: "records_not_verified", label: "Lab usage / issue records could not be verified" },
  { value: "pending_dues", label: "Pending lab dues remain unsettled" },
  { value: "misc", label: "Miscellaneous" },
];

export default function LabsPending() {
  const {
    selectedLab,
    pending,
    approveStudent,
    rejectStudent,
  } = useOutletContext();

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [approveTarget, setApproveTarget] = useState(null);

  const [bulkApproveOpen, setBulkApproveOpen] = useState(false);
  const [bulkApproveTargets, setBulkApproveTargets] = useState([]);

  const [rejectOpen, setRejectOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);

  const [viewOpen, setViewOpen] = useState(false);
  const [viewStudent, setViewStudent] = useState(null);

  if (!selectedLab) {
    return <EmptyLabGuard />;
  }

  return (
    <>
      {pending.length === 0 ? (
        <EmptyLabState lab={selectedLab} type="pending" />
      ) : (
        <>
          <PendingRequests
            title={`Labs - ${selectedLab} | Pending Requests`}
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
            title="Approve Lab Clearance?"
            message={
              approveTarget
                ? `Approve ${approveTarget.name} (${approveTarget.roll}) for ${selectedLab}?`
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
            title="Approve Selected Lab Requests?"
            message={
              bulkApproveTargets.length > 0
                ? `Approve ${bulkApproveTargets.length} selected students for ${selectedLab}?`
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
            reasons={LAB_REASONS}
            title="Put Lab Clearance"
            confirmText="Confirm Hold"
            placeholder="Specify the issued item, register entry, amount, or any remarks…"
          />

          <ViewDetailsModal
            open={viewOpen}
            student={viewStudent}
            currentDepartment="labs"
            onClose={() => {
              setViewOpen(false);
              setViewStudent(null);
            }}
          />
        </>
      )}
    </>
  );
}

function EmptyLabGuard() {
  return (
    <div className="rounded-2xl border border-white/15 bg-white/5 p-10 text-center text-white">
      <p className="text-lg font-semibold">No lab selected</p>
      <p className="mt-1 text-sm text-white/60">
        Please go to the dashboard and select a lab first.
      </p>
    </div>
  );
}

function EmptyLabState({ lab, type }) {
  return (
    <div className="rounded-2xl border border-white/15 bg-white/5 p-10 text-center text-white">
      <p className="text-lg font-semibold">No requests in this lab</p>
      <p className="mt-1 text-sm text-white/60">
        No {type} requests found for{" "}
        <span className="font-semibold text-white">{lab}</span>.
      </p>
    </div>
  );
}