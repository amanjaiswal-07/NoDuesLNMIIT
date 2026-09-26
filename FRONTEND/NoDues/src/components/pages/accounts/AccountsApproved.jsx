import { useState } from "react";
import { useOutletContext } from "react-router-dom";

import ApprovedRequests from "../../Request/ApprovedRequests";
import RejectModal from "../../Modal/RejectModal";
import ViewDetailsModal from "../../Modal/ViewDetailsModal";
import { BRANCH_TO_HOD } from "../../../config/branches";

const ACCOUNTS_REASONS = [
  { value: "fees_pending", label: "Institute fee payment pending (fees not fully deposited)", requiresText: true },
  { value: "other_dues", label: "Pending dues reported by other departments", requiresText: true },
  { value: "fine_pending", label: "Fine/penalty pending", requiresText: true },
  { value: "approval_was_mistake", label: "Approval was made in error", requiresText: true },
  { value: "misc", label: "Miscellaneous", requiresText: true },
];

const CSE_LAB_OPTIONS = [
  { value: "cse_lab_1", label: "CSE Lab-1" },
  { value: "cse_lab_2", label: "CSE Lab-2" },
  { value: "cse_lab_3", label: "CSE Lab-3" },
  { value: "cse_lab_cmlbda", label: "CMLBDA Lab" },
];
const ECE_LAB_OPTIONS = [
  { value: "ece_lab_microwave", label: "Microwave Lab" },
  { value: "ece_lab_adc", label: "ADC Lab" },
  { value: "ece_lab_ti", label: "TI Lab" },
  { value: "ece_lab_dsp", label: "DSP Lab" },
  { value: "ece_lab_ecad", label: "E-CAD Lab" },
  { value: "ece_lab_be", label: "BE Lab" },
];
const ECE_LAB_KUNDAN = { value: "ece_lab_kundan", label: "Final Approval ECE (Kundan)" };

const MECH_LAB_OPTIONS = [
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
];
const PHYSICS_LAB_OPTIONS = [
  { value: "physics_lab_ug", label: "UG Physics Lab" },
  { value: "physics_lab_optics", label: "Physics Optics Lab" },
];

function getAccountsDepOptions(student) {
  const branch = (student?.branch || "").toUpperCase();
  const hostel = student?.hostel || "";

  const hodOption = BRANCH_TO_HOD[branch];
  const hodOptions = hodOption ? [hodOption] : Object.values(BRANCH_TO_HOD);

  const wardenLabel = hostel ? `Warden Incharge (${hostel})` : "Warden Incharge";
  const wardenOption = { value: "warden", label: wardenLabel };

  // Labs — always show all types; only Kundan is ECE-branch-specific
  const labOptions = [
    ...CSE_LAB_OPTIONS,
    ...ECE_LAB_OPTIONS,
    ...(branch === "ECE" ? [ECE_LAB_KUNDAN] : []),
    ...MECH_LAB_OPTIONS,
    ...PHYSICS_LAB_OPTIONS,
  ];

  return [
    { value: "medical", label: "Medical" },
    { value: "sports", label: "Sports" },
    { value: "lucs", label: "LUCS" },
    { value: "placement", label: "Placement" },
    { value: "administration", label: "Administration" },
    // Library: value=library_staff ensures full chain resets on reapply
    { value: "library_staff", label: "Library" },
    ...hodOptions,
    wardenOption,
    ...labOptions,
  ];
}

export default function AccountsApproved() {
  const { approved, moveApprovedToRejected } = useOutletContext();

  const [rejectOpen, setRejectOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);

  const [viewOpen, setViewOpen] = useState(false);
  const [viewStudent, setViewStudent] = useState(null);

  return (
    <>
      <ApprovedRequests
        title="Accounts - Approved Requests"
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
        reasons={ACCOUNTS_REASONS}
        dependencyOptions={getAccountsDepOptions(selectedStudent)}
        dependenciesRequired={false}
        title="Move to On Hold"
        confirmText="Move to On Hold"
        placeholder="Write details (amount due, reference, department name, remarks)..."
      />

      <ViewDetailsModal
        open={viewOpen}
        student={viewStudent}
        currentDepartment="accounts"
        onClose={() => { setViewOpen(false); setViewStudent(null); }}
      />
    </>
  );
}
