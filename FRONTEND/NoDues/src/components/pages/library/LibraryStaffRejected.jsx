import { useOutletContext } from "react-router-dom";
import { useState } from "react";
import RejectedRequests from "../../Request/RejectedRequests";
import ViewDetailsModal from "../../Modal/ViewDetailsModal";
import ConfirmModal from "../../Modal/ConfirmModal";

export default function LibraryStaffRejected() {
  const { staffRejected, moveRejectedToApproved } = useOutletContext();

  const [viewOpen, setViewOpen] = useState(false);
  const [viewStudent, setViewStudent] = useState(null);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmStudent, setConfirmStudent] = useState(null);

  const [bulkConfirmOpen, setBulkConfirmOpen] = useState(false);
  const [bulkConfirmStudents, setBulkConfirmStudents] = useState([]);

  return (
    <>
      <RejectedRequests
        title="Central Library - Staff | Requests On Hold"
        data={staffRejected}
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

      {/* Single approve confirm */}
      <ConfirmModal
        open={confirmOpen}
        title="Move to Approved?"
        message={
          confirmStudent
            ? `Move ${confirmStudent.name} (${confirmStudent.roll}) back to approved?`
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

      {/* Bulk approve confirm */}
      <ConfirmModal
        open={bulkConfirmOpen}
        title="Move Selected to Approved?"
        message={
          bulkConfirmStudents.length > 0
            ? `Move ${bulkConfirmStudents.length} selected students back to approved?`
            : ""
        }
        confirmText="Yes, move all"
        cancelText="Cancel"
        onClose={() => {
          setBulkConfirmOpen(false);
          setBulkConfirmStudents([]);
        }}
        onConfirm={() => {
          bulkConfirmStudents.forEach((student) => moveRejectedToApproved(student));
          setBulkConfirmOpen(false);
          setBulkConfirmStudents([]);
        }}
      />

      <ViewDetailsModal
        currentDepartment="library_staff"
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
