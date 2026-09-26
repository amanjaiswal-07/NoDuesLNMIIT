/**
 * StoreApproved.jsx — Store "Approved Requests" tab. Students Store has cleared; one can be moved back
 * to On Hold with a reason (not once the whole application is complete — the backend refuses).
 * Store waits for the student's HOD and Warden. When putting on hold, Store may choose to also reset the HOD and/or Warden on reapply.
 */

import { useState } from "react";
import { useOutletContext } from "react-router-dom";

import ApprovedRequests from "../../Request/ApprovedRequests";
import RejectModal from "../../Modal/RejectModal";
import ViewDetailsModal from "../../Modal/ViewDetailsModal";
import { BRANCH_TO_HOD } from "../../../config/branches";

const STORE_REASONS = [
  { value: "general_equipment", label: "Institute equipment issued to the student", requiresText: true },
  { value: "club_equipment", label: "Club inventory issued on behalf of the student", requiresText: true },
  { value: "approval_was_mistake", label: "Approval was made in error", requiresText: true },
  { value: "misc", label: "Miscellaneous", requiresText: true },
];

/**
 * Returns dynamic dep options for Store based on student's branch and hostel.
 * Shows only the relevant HOD and the student's specific warden.
 */
function getStoreDepOptions(student) {
  const branch = (student?.branch || "").toUpperCase();
  const hostel = student?.hostel || "";

  const hodOption = BRANCH_TO_HOD[branch] || null;
  const allHods = Object.values(BRANCH_TO_HOD);
  const hodOptions = hodOption ? [hodOption] : allHods;

  const wardenLabel = hostel ? `Warden Incharge (${hostel})` : "Warden Incharge";
  const wardenOption = { value: "warden", label: wardenLabel };

  return [...hodOptions, wardenOption];
}

export default function StoreApproved() {
  const { approved, moveApprovedToRejected } = useOutletContext();

  const [rejectOpen, setRejectOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);

  const [viewOpen, setViewOpen] = useState(false);
  const [viewStudent, setViewStudent] = useState(null);

  return (
    <>
      <ApprovedRequests
        title="Store - Approved Requests"
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
        reasons={STORE_REASONS}
        dependencyOptions={getStoreDepOptions(selectedStudent)}
        dependenciesRequired={false}
        title="Move to On Hold"
        confirmText="Move to On Hold"
        placeholder="Write details (item name, quantity, issue date, club name if any)..."
      />

      <ViewDetailsModal
        open={viewOpen}
        student={viewStudent}
        currentDepartment="store"
        onClose={() => { setViewOpen(false); setViewStudent(null); }}
      />
    </>
  );
}
