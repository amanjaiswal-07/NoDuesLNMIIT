import { useState } from "react";
import { useOutletContext } from "react-router-dom";

import RejectedRequests from "../../Request/RejectedRequests";
import ViewDetailsModal from "../../Modal/ViewDetailsModal";
import ConfirmModal from "../../Modal/ConfirmModal";

export default function LUCSRejected() {
  const { rejected, moveRejectedToApproved } = useOutletContext();

  const [viewOpen, setViewOpen] = useState(false);
  const [viewStudent, setViewStudent] = useState(null);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmStudent, setConfirmStudent] = useState(null);

  const [bulkConfirmOpen, setBulkConfirmOpen] = useState(false);
  const [bulkConfirmStudents, setBulkConfirmStudents] = useState([]);

  return (
    <>
      <RejectedRequests
        title="LUCS - Requests On Hold"
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
        currentDepartment="lucs"
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
