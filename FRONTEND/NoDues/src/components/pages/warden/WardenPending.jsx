/**
 * WardenPending.jsx — Warden In Charge "Pending Requests" tab. Students waiting for Warden In Charge's clearance.
 * Approve (one or selected), Put On Hold (reason + mandatory details, shown to the student) or open
 * View details (student info, timeline, prerequisites and the documents Warden In Charge needs).
 * Lists are filtered by the hostel chosen on the Warden home page.
 */

import { useState } from "react";
import { useOutletContext } from "react-router-dom";

import PendingRequests from "../../Request/PendingRequests";
import ConfirmModal from "../../Modal/ConfirmModal";
import RejectModal from "../../Modal/RejectModal";
import ViewDetailsModal from "../../Modal/ViewDetailsModal";
import HostelGuard from "../../common/HostelGuard";

const WARDEN_REASONS = [
  { value: "inventory", label: "Hostel inventory dues pending", requiresText: true },
  { value: "misc", label: "Miscellaneous", requiresText: true },
];

export default function WardenPending() {
  const { selectedHostel, pending, approveStudent, rejectStudent } = useOutletContext();

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [approveTarget, setApproveTarget] = useState(null);

  const [bulkApproveOpen, setBulkApproveOpen] = useState(false);
  const [bulkApproveTargets, setBulkApproveTargets] = useState([]);

  const [rejectOpen, setRejectOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);

  const [viewOpen, setViewOpen] = useState(false);
  const [viewStudent, setViewStudent] = useState(null);

  return (
    <HostelGuard selectedHostel={selectedHostel}>
      {pending.length === 0 ? (
        <EmptyHostelState hostel={selectedHostel} />
      ) : (
        <>
          <PendingRequests
            title={`Warden - ${selectedHostel} | Pending Requests`}
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
            title="Approve Hostel Clearance?"
            message={
              approveTarget
                ? `Approve hostel clearance for ${approveTarget.name} (${approveTarget.roll})?`
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
            title="Approve Selected Hostel Requests?"
            message={
              bulkApproveTargets.length > 0
                ? `Approve hostel clearance for ${bulkApproveTargets.length} selected students?`
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
            reasons={WARDEN_REASONS}
            title="Put Request On Hold"
            confirmText="Confirm Hold"
            placeholder="Write details (item name, quantity, remarks)..."
          />

          <ViewDetailsModal
            open={viewOpen}
            student={viewStudent}
            currentDepartment="warden"
            onClose={() => {
              setViewOpen(false);
              setViewStudent(null);
            }}
          />
        </>
      )}
    </HostelGuard>
  );
}

function EmptyHostelState({ hostel }) {
  return (
    <div className="rounded-2xl border border-white/15 bg-white/5 p-10 text-center text-white">
      <p className="text-lg font-semibold">No requests in this hostel</p>
      <p className="mt-1 text-sm text-white/60">
        No pending requests found for <span className="font-semibold text-white">{hostel}</span>.
      </p>
    </div>
  );
}
