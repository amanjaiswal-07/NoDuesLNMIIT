/**
 * LibraryLibrarianRejected.jsx — Central Library - Librarian "Requests On Hold" tab. Students Central Library - Librarian put on hold; they stay here until the
 * student fixes the issue and reapplies. "Move to Approved" clears them directly (only if every
 * prerequisite is already approved).
 * Second library step (after Library Staff). A Librarian hold restarts the library chain from Library Staff on reapply.
 */

import { useOutletContext } from "react-router-dom";
import { useState } from "react";
import RejectedRequests from "../../Request/RejectedRequests";
import ConfirmModal from "../../Modal/ConfirmModal";
import ViewDetailsModal from "../../Modal/ViewDetailsModal";

export default function LibraryLibrarianRejected() {
  const { librarianRejected, librarianMoveRejectedToApproved } = useOutletContext();

  const [viewOpen, setViewOpen] = useState(false);
  const [viewStudent, setViewStudent] = useState(null);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmStudent, setConfirmStudent] = useState(null);

  const [bulkConfirmOpen, setBulkConfirmOpen] = useState(false);
  const [bulkConfirmStudents, setBulkConfirmStudents] = useState([]);

  return (
    <>
      <RejectedRequests
        title="Central Library - Librarian | Requests On Hold"
        data={librarianRejected}
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
          if (confirmStudent) librarianMoveRejectedToApproved(confirmStudent);
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
            librarianMoveRejectedToApproved(student)
          );
          setBulkConfirmOpen(false);
          setBulkConfirmStudents([]);
        }}
      />

      <ViewDetailsModal
        currentDepartment="library_librarian"
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
