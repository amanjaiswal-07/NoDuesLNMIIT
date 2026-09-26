import { useState } from "react";
import { useOutletContext } from "react-router-dom";

import ApprovedRequests from "../../Request/ApprovedRequests";
import RejectModal from "../../Modal/RejectModal";
import ViewDetailsModal from "../../Modal/ViewDetailsModal";

const HOD_REASONS = [
  { value: "department_clearance_incomplete", label: "Departmental clearance requirements are not yet complete", requiresText: true },
  { value: "lab_clearance_pending", label: "Relevant lab clearance is still pending", requiresText: true },
  { value: "supporting_verification_pending", label: "Required verification is still pending", requiresText: true },
  { value: "approval_was_mistake", label: "Approval was made in error", requiresText: true },
  { value: "misc", label: "Miscellaneous", requiresText: true },
];

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

export default function HODApproved() {
  const { departmentLabel, approved, moveApprovedToRejected } = useOutletContext();

  const [rejectOpen, setRejectOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);

  const [viewOpen, setViewOpen] = useState(false);
  const [viewStudent, setViewStudent] = useState(null);

  return (
    <>
      <ApprovedRequests
        title={`${departmentLabel} HOD - Approved Requests`}
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
        reasons={HOD_REASONS}
        dependencyOptions={hodDepOptionsFor(selectedStudent)}
        dependenciesRequired={false}
        title="Move to On Hold"
        confirmText="Move to On Hold"
        placeholder="Specify which clearance was incorrectly approved and why..."
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