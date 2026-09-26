import { useState } from "react";
import { useOutletContext } from "react-router-dom";

import PendingRequests from "../../Request/PendingRequests";
import ConfirmModal from "../../Modal/ConfirmModal";
import RejectModal from "../../Modal/RejectModal";
import ViewDetailsModal from "../../Modal/ViewDetailsModal";
import { BRANCH_TO_HOD } from "../../../config/branches";

const ACCOUNTS_REASONS = [
  { value: "fees_pending", label: "Institute fee payment pending" },
  { value: "other_dues", label: "Pending dues reported by other departments" },
  { value: "fine_pending", label: "Fine/penalty pending" },
  { value: "misc", label: "Miscellaneous" },
];

// ── Lab options by branch ─────────────────────────────────────────────────────
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
// Kundan is ECE-only
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

/**
 * Returns fully dynamic dep options for Accounts.
 *
 * Always includes: Medical, Sports, LUCS, Placement, Administration, Library,
 *                  branch-matched HOD, hostel-named Warden.
 *
 * Labs included by branch:
 *   CSE  → CSE labs + Physics labs
 *   ECE  → ECE labs (incl. Kundan) + Physics labs
 *   CCE  → CSE labs + ECE labs (excl. Kundan) + Physics labs
 *   MECH → MECH labs + Physics labs
 *   Unknown → all labs (safe fallback)
 */
function getAccountsDepOptions(student) {
  const branch = (student?.branch || "").toUpperCase();
  const hostel = student?.hostel || "";

  // HOD — branch-specific, fallback to all if unknown
  const hodOption = BRANCH_TO_HOD[branch];
  const hodOptions = hodOption ? [hodOption] : Object.values(BRANCH_TO_HOD);

  // Warden — hostel-specific label, single 'warden' unit code
  const wardenLabel = hostel ? `Warden Incharge (${hostel})` : "Warden Incharge";
  const wardenOption = { value: "warden", label: wardenLabel };

  // Labs — always show all types; only Kundan is ECE-branch-specific
  // Accounts is the final dept — any lab type could have a pending issue
  const labOptions = [
    ...CSE_LAB_OPTIONS,
    ...ECE_LAB_OPTIONS,
    ...(branch === "ECE" ? [ECE_LAB_KUNDAN] : []), // Kundan only for ECE
    ...MECH_LAB_OPTIONS,
    ...PHYSICS_LAB_OPTIONS,
  ];

  return [
    // Independent departments (always shown)
    { value: "medical", label: "Medical" },
    { value: "sports", label: "Sports" },
    { value: "lucs", label: "LUCS" },
    { value: "placement", label: "Placement" },
    { value: "administration", label: "Administration" },
    // Library — value is library_staff so reapply resets full chain (staff → pending, librarian → locked)
    { value: "library_staff", label: "Library" },
    // Dynamic: HOD (branch-based) + Warden (hostel-based)
    ...hodOptions,
    wardenOption,
    // Labs (branch-based)
    ...labOptions,
  ];
}

export default function AccountsPending() {
  const { pending, approveStudent, rejectStudent } = useOutletContext();

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
        title="Accounts - Pending Requests"
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
        title="Approve Accounts Clearance?"
        message={
          approveTarget
            ? `Approve Accounts clearance for ${approveTarget.name} (${approveTarget.roll})?`
            : ""
        }
        confirmText="Approve"
        cancelText="Cancel"
        onClose={() => { setConfirmOpen(false); setApproveTarget(null); }}
        onConfirm={() => {
          if (approveTarget) approveStudent(approveTarget);
          setConfirmOpen(false);
          setApproveTarget(null);
        }}
      />

      <ConfirmModal
        open={bulkApproveOpen}
        title="Approve Selected Accounts Requests?"
        message={
          bulkApproveTargets.length > 0
            ? `Approve Accounts clearance for ${bulkApproveTargets.length} selected students?`
            : ""
        }
        confirmText="Approve Selected"
        cancelText="Cancel"
        onClose={() => { setBulkApproveOpen(false); setBulkApproveTargets([]); }}
        onConfirm={() => {
          bulkApproveTargets.forEach((student) => approveStudent(student));
          setBulkApproveOpen(false);
          setBulkApproveTargets([]);
        }}
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
        reasons={ACCOUNTS_REASONS}
        title="Put Accounts Request"
        confirmText="Confirm Hold"
        placeholder="Specify amount due, reference number, department name, or remarks…"
        dependencyOptions={getAccountsDepOptions(selectedStudent)}
        dependenciesRequired={false}
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
