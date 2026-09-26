// Valid student branches and the HOD each one goes to.
// Must match BRANCH_TO_HOD in BACKEND/config/workflowConfig.js.
export const BRANCH_TO_HOD = {
  CSE: { value: "hod_cse", label: "HOD - CSE" },
  ECE: { value: "hod_ece", label: "HOD - ECE" },
  CCE: { value: "hod_cce", label: "HOD - CCE" },
  MECH: { value: "hod_mech", label: "HOD - MECH" },
};

export const BRANCHES = Object.keys(BRANCH_TO_HOD);
