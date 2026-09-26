/**
 * HODPending.jsx — Head of Department "Pending Requests" tab. Students waiting for Head of Department's clearance.
 * Approve (one or selected), Put On Hold (reason + mandatory details, shown to the student) or open
 * View details (student info, timeline, prerequisites and the documents Head of Department needs).
 * A student's request goes only to their own branch HOD, after all their labs, LUCS and the Librarian approved. When putting on hold the HOD may reset specific labs, LUCS or Library on reapply.
 */

import { useState } from "react";
import { useOutletContext } from "react-router-dom";

import PendingRequests from "../../Request/PendingRequests";
import ConfirmModal from "../../Modal/ConfirmModal";
import RejectModal from "../../Modal/RejectModal";
import ViewDetailsModal from "../../Modal/ViewDetailsModal";

const HOD_REASONS = [
  { value: "lab_clearance_pending", label: "Lab clearance is still pending" },
  { value: "lucs_pending", label: "LUCS clearance is still pending" },
  { value: "library_pending", label: "Library clearance is still pending" },
  { value: "misc", label: "Miscellaneous" },
];

// All upstream dependencies HOD relies on
const HOD_DEP_OPTIONS = [
  { value: "lucs", label: "LUCS" },
  { value: "library_staff", label: "Library" },
  // CSE / CCE Labs
  { value: "cse_lab_1", label: "CSE Lab-1" },
  { value: "cse_lab_2", label: "CSE Lab-2" },
  { value: "cse_lab_3", label: "CSE Lab-3" },
  { value: "cse_lab_cmlbda", label: "CMLBDA Lab" },
  // ECE / CCE Labs
  { value: "ece_lab_microwave", label: "Microwave Lab" },
  { value: "ece_lab_adc", label: "ADC Lab" },
  { value: "ece_lab_ti", label: "TI Lab" },
  { value: "ece_lab_dsp", label: "DSP Lab" },
  { value: "ece_lab_ecad", label: "E-CAD Lab" },
  { value: "ece_lab_be", label: "BE Lab" },
  { value: "ece_lab_kundan", label: "Final Approval ECE (Kundan)" },
  // MECH Labs (all 15)
  { value: "mech_lab_workshop", label: "Mechanical Workshop" },
  { value: "mech_lab_mechatronics", label: "Mechatronics Lab" },
  { value: "mech_lab_robotics", label: "Robotics Lab" },
  { value: "mech_lab_cim", label: "CIM Lab" },
  { value: "mech_lab_cad", label: "CAD Lab" },
  { value: "mech_lab_kd", label: "K&D Lab" },
  { value: "mech_lab_material", label: "Material Characterization Lab" },
  { value: "mech_lab_measurement", label: "Measurement Lab" },
  { value: "mech_lab_fmm", label: "FMM Lab" },
  { value: "mech_lab_ic_engine", label: "IC Engine Lab" },
  { value: "mech_lab_thermodynamics", label: "Thermodynamics Lab" },
  { value: "mech_lab_heat_transfer", label: "Heat Transfer Lab" },
  { value: "mech_lab_eng_graphics", label: "Engineering Graphics Lab" },
  { value: "mech_lab_automotive", label: "Automotive Lab" },
  { value: "mech_lab_cria", label: "CRIA Lab" },
  // Physics Labs
  { value: "physics_lab_ug", label: "UG Physics Lab" },
  { value: "physics_lab_optics", label: "Physics Optics Lab" },
];

// Kundan's lab is part of ECE requests only — never offer it to reset for other branches
const hodDepOptionsFor = (student) =>
  (student?.branch || "").toUpperCase() === "ECE"
    ? HOD_DEP_OPTIONS
    : HOD_DEP_OPTIONS.filter((o) => o.value !== "ece_lab_kundan");

export default function HODPending() {
  const { departmentLabel, pending, approveStudent, rejectStudent } =
    useOutletContext();

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
        title={`${departmentLabel} HOD - Pending Requests`}
        data={pending}
        onApprove={(s) => { setApproveTarget(s); setConfirmOpen(true); }}
        onApproveSelected={(students) => { setBulkApproveTargets(students); setBulkApproveOpen(true); }}
        onReject={(s) => { setSelectedStudent(s); setRejectOpen(true); }}
        onView={(s) => { setViewStudent(s); setViewOpen(true); }}
      />

      <ConfirmModal
        open={confirmOpen}
        title="Approve HOD Clearance?"
        message={approveTarget ? `Approve no dues for ${approveTarget.name} (${approveTarget.roll})?` : ""}
        confirmText="Approve" cancelText="Cancel"
        onClose={() => { setConfirmOpen(false); setApproveTarget(null); }}
        onConfirm={() => { if (approveTarget) approveStudent(approveTarget); setConfirmOpen(false); setApproveTarget(null); }}
      />

      <ConfirmModal
        open={bulkApproveOpen}
        title={`Approve Selected ${departmentLabel} HOD Requests?`}
        message={bulkApproveTargets.length > 0 ? `Approve no dues for ${bulkApproveTargets.length} selected students?` : ""}
        confirmText="Approve Selected" cancelText="Cancel"
        onClose={() => { setBulkApproveOpen(false); setBulkApproveTargets([]); }}
        onConfirm={() => { bulkApproveTargets.forEach(s => approveStudent(s)); setBulkApproveOpen(false); setBulkApproveTargets([]); }}
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
        reasons={HOD_REASONS}
        title="Put HOD Clearance"
        confirmText="Confirm Hold"
        placeholder="Specify which clearance is pending and why the HOD cannot approve yet…"
        dependencyOptions={hodDepOptionsFor(selectedStudent)}
        dependenciesRequired={false}
      />

      <ViewDetailsModal
        open={viewOpen}
        student={viewStudent}
        currentDepartment="hod"
        onClose={() => { setViewOpen(false); setViewStudent(null); }}
      />
    </>
  );
}
