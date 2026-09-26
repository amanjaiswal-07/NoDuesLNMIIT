/**
 * WardenApproved.jsx — Warden In Charge "Approved Requests" tab. Students Warden In Charge has cleared; one can be moved back
 * to On Hold with a reason (not once the whole application is complete — the backend refuses).
 * Lists are filtered by the hostel chosen on the Warden home page.
 */

import { useState } from "react";
import { useOutletContext } from "react-router-dom";

import ApprovedRequests from "../../Request/ApprovedRequests";
import RejectModal from "../../Modal/RejectModal";
import ViewDetailsModal from "../../Modal/ViewDetailsModal";
import HostelGuard from "../../common/HostelGuard";

const WARDEN_REASONS = [
  { value: "inventory", label: "Hostel inventory dues pending", requiresText: true },
  { value: "misc", label: "Miscellaneous", requiresText: true },
];

export default function WardenApproved() {
  const { selectedHostel, approved, moveApprovedToRejected } = useOutletContext();

  const [rejectOpen, setRejectOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);

  const [viewOpen, setViewOpen] = useState(false);
  const [viewStudent, setViewStudent] = useState(null);

  return (
    <HostelGuard selectedHostel={selectedHostel}>
      {approved.length === 0 ? (
        <EmptyHostelState hostel={selectedHostel} type="approved" />
      ) : (
        <>
          <ApprovedRequests
            title={`Warden - ${selectedHostel} | Approved Requests`}
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
            reasons={WARDEN_REASONS}
            title="Move to On Hold"
            confirmText="Move"
            placeholder="Write details (item name, quantity, remarks)..."
          />

          <ViewDetailsModal
        currentDepartment="warden"
            open={viewOpen}
            student={viewStudent}
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

function EmptyHostelState({ hostel, type }) {
  return (
    <div className="rounded-2xl border border-white/15 bg-white/5 p-10 text-center text-white">
      <p className="text-lg font-semibold">No requests in this hostel</p>
      <p className="mt-1 text-sm text-white/60">
        No {type} requests found for <span className="font-semibold text-white">{hostel}</span>.
      </p>
    </div>
  );
}
    