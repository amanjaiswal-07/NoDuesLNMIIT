/**
 * WardenRejected.jsx — Warden In Charge "Requests On Hold" tab. Students Warden In Charge put on hold; they stay here until the
 * student fixes the issue and reapplies. "Move to Approved" clears them directly (only if every
 * prerequisite is already approved).
 * Lists are filtered by the hostel chosen on the Warden home page.
 */

import { useState } from "react";
import { useOutletContext } from "react-router-dom";

import RejectedRequests from "../../Request/RejectedRequests";
import ConfirmModal from "../../Modal/ConfirmModal";
import ViewDetailsModal from "../../Modal/ViewDetailsModal";
import HostelGuard from "../../common/HostelGuard";

export default function WardenRejected() {
  const { selectedHostel, rejected, moveRejectedToApproved } = useOutletContext();

  const [viewOpen, setViewOpen] = useState(false);
  const [viewStudent, setViewStudent] = useState(null);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmStudent, setConfirmStudent] = useState(null);

  const [bulkConfirmOpen, setBulkConfirmOpen] = useState(false);
  const [bulkConfirmStudents, setBulkConfirmStudents] = useState([]);

  return (
    <HostelGuard selectedHostel={selectedHostel}>
      {rejected.length === 0 ? (
        <EmptyHostelState hostel={selectedHostel} />
      ) : (
        <>
          <RejectedRequests
            title={`Warden - ${selectedHostel} | Requests On Hold`}
            data={rejected}
            onMoveToApproved={(s) => {
              setConfirmStudent(s);
              setConfirmOpen(true);
            }}
            onMoveToApprovedSelected={(students) => {
              setBulkConfirmStudents(students);
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
              confirmStudent
                ? `Move ${confirmStudent.name} (${confirmStudent.roll}) to approved?`
                : ""
            }
            confirmText="Yes, move"
            cancelText="Cancel"
            onClose={() => {
              setConfirmOpen(false);
              setConfirmStudent(null);
            }}
            onConfirm={() => {
              if (confirmStudent) moveRejectedToApproved(confirmStudent);
              setConfirmOpen(false);
              setConfirmStudent(null);
            }}
          />

          <ConfirmModal
            open={bulkConfirmOpen}
            title="Move Selected Requests On Hold to Approved?"
            message={
              bulkConfirmStudents.length > 0
                ? `Move ${bulkConfirmStudents.length} selected students to approved?`
                : ""
            }
            confirmText="Approve Selected"
            cancelText="Cancel"
            onClose={() => {
              setBulkConfirmOpen(false);
              setBulkConfirmStudents([]);
            }}
            onConfirm={() => {
              bulkConfirmStudents.forEach((student) =>
                moveRejectedToApproved(student)
              );
              setBulkConfirmOpen(false);
              setBulkConfirmStudents([]);
            }}
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

function EmptyHostelState({ hostel }) {
  return (
    <div className="rounded-2xl border border-white/15 bg-white/5 p-10 text-center text-white">
      <p className="text-lg font-semibold">No requests in this hostel</p>
      <p className="mt-1 text-sm text-white/60">
        No rejected requests found for <span className="font-semibold text-white">{hostel}</span>.
      </p>
    </div>
  );
}
