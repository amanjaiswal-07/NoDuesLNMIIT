/**
 * LabsLayout — handles all four lab groups (cse-cce, ece-cce, mech, physics).
 * The URL param :department determines which unit codes to fetch.
 *
 * Each individual lab step (e.g. cse_lab_1) appears as a separate row in Pending.
 * The shared useDepartmentData hook fetches all of them in parallel.
 *
 * Route: /labs/:department  (e.g. /labs/cse-cce, /labs/mech)
 */
import { useState } from "react";
import { useParams, Outlet } from "react-router-dom";
import DepartmentLayout from "../../shared/DepartmentLayout";

const LABS_BY_DEPARTMENT = {
  "cse-cce": [
    "Computer Lab-1 (Mr. Shivam Maheshwari)",
    "Computer Lab-2 (Mrs. Shivangee Singh)",
    "Computer Lab-3 (Mr. Dinesh Kumar Sharma)",
    "CMLBDA Lab (Mr. Manish Kumar Mittal)",
  ],
  "ece-cce": [
    "Microwave Lab (Mr. Kamta Sharma)",
    "ADC Lab (Mr. Dharam Pal Yadav)",
    "TI Lab (Mr. Vinod Kumar)",
    "DSP Lab (Mr. Kushmakar Sharma)",
    "E-CAD Lab (Mr. Ajay Naresh)",
    "BE Lab (Mr. Pavan Sharma)",
    "Final Approval ECE (Mr. Kundan Shahi)"
  ],
  mech: [
    "Mechanical Workshop (Mr. Bhagwan Singh)",
    "Mechatronics Lab (Mr. Udayveer Singh)",
    "Robotics Lab (Mr. Udayveer Singh)",
    "CIM Lab (Mr. Satish Yadav)",
    "CAD Lab (Mr. Satyanarayan Prajapat)",
    "K&D Lab (Mr. Satyanarayan Prajapat)",
    "Material Characterization Lab (Mr. Satyanarayan Prajapat)",
    "Measurement Lab (Mr. Bhagwan Singh & Mr. Udayveer Singh)",
    "FMM Lab (Mr. Sandeep Kumar Saxena)",
    "IC Engine Lab (Mr. Sandeep Kumar Saxena)",
    "Thermodynamics Lab (Mr. Sandeep Kumar Saxena)",
    "Heat Transfer Lab (Mr. Sandeep Kumar Saxena)",
    "Engineering Graphics Lab (Mr. Satyanarayan Prajapat)",
    "Automotive Lab (Mr. Tej Bahadur Yadav)",
    "CRIA Lab (Mr. Tej Bahadur Yadav)",
  ],
  physics: [
    "UG Physics Lab (Mr. Laxmi Narayan Sharma)",
    "UG Physics Optics Lab (Mr. Laxmi Narayan Sharma)",
  ],
};

const DEPARTMENT_CONFIG = {
  "cse-cce": {
    unitCodes: ["cse_lab_1", "cse_lab_2", "cse_lab_3", "cse_lab_cmlbda"],
    title: "CSE / CCE Labs",
    role: "labs",
  },
  "ece-cce": {
    unitCodes: [
      "ece_lab_microwave", "ece_lab_adc", "ece_lab_ti",
      "ece_lab_dsp", "ece_lab_ecad", "ece_lab_be", "ece_lab_kundan",
    ],
    title: "ECE / CCE Labs",
    role: "labs",
  },
  mech: {
    unitCodes: [
      "mech_lab_workshop", "mech_lab_mechatronics", "mech_lab_robotics",
      "mech_lab_cim", "mech_lab_cad", "mech_lab_kd", "mech_lab_material",
      "mech_lab_measurement", "mech_lab_fmm", "mech_lab_ic_engine",
      "mech_lab_thermodynamics", "mech_lab_heat_transfer",
      "mech_lab_eng_graphics", "mech_lab_automotive", "mech_lab_cria",
    ],
    title: "MECH Labs",
    role: "labs",
  },
  physics: {
    unitCodes: ["physics_lab_ug", "physics_lab_optics"],
    title: "Physics Labs",
    role: "labs",
  },
};

export default function LabsLayout() {
  const { department } = useParams();
  const config = DEPARTMENT_CONFIG[department] || DEPARTMENT_CONFIG["cse-cce"];
  const LABS = LABS_BY_DEPARTMENT[department] || [];

  // The picked lab belongs to one lab group; switching group in the URL starts with none selected
  const [pick, setPick] = useState({ department, lab: "" });
  const selectedLab = pick.department === department ? pick.lab : "";
  const setSelectedLab = (lab) => setPick({ department, lab });

  return (
    <DepartmentLayout
      role={config.role}
      unitCodes={config.unitCodes}
      title={config.title}
      basePath={`/labs/${department}`}
      // Header badge shows the selected lab's pending count only (none until a lab is picked)
      pendingCountFilter={(req) => Boolean(selectedLab) && req.unitLabel === selectedLab}
    >
      {(contextData) => {
        // Filter tasks by the selected lab (matches unitLabel exactly)
        const filterFn = (req) => req.unitLabel === selectedLab;

        const filteredPending = selectedLab ? contextData.pending.filter(filterFn) : contextData.pending;
        const filteredApproved = selectedLab ? contextData.approved.filter(filterFn) : contextData.approved;
        const filteredRejected = selectedLab ? contextData.rejected.filter(filterFn) : contextData.rejected;

        return (
          <Outlet
            context={{
              ...contextData,
              pending: filteredPending,
              approved: filteredApproved,
              rejected: filteredRejected,

              // Extra state needed by LabsHome, LabsPending, etc.
              department,
              LABS,
              // Pending count per lab, for the lab dropdown
              pendingByLab: contextData.pending.reduce((acc, r) => {
                acc[r.unitLabel] = (acc[r.unitLabel] || 0) + 1;
                return acc;
              }, {}),
              selectedLab,
              setSelectedLab,
              labSelected: Boolean(selectedLab),
            }}
          />
        );
      }}
    </DepartmentLayout>
  );
}