/**
 * Dependency graph for the clearance workflow.
 * unitCode → array of unitCodes that must be 'approved' BEFORE this step unlocks.
 *
 * ANY code NOT listed here is "independent" (starts as 'pending' immediately).
 *
 * HOD dependencies are computed DYNAMICALLY at request creation time
 * using student.branch — see workflowService.js.
 */

// All CSE lab codes
const CSE_LABS = [
    'cse_lab_1', 'cse_lab_2', 'cse_lab_3', 'cse_lab_cmlbda',
];

// All ECE lab codes
const ECE_LABS = [
    'ece_lab_microwave', 'ece_lab_adc', 'ece_lab_ti', 'ece_lab_dsp',
    'ece_lab_ecad', 'ece_lab_be', 'ece_lab_kundan',
];

// All MECH lab codes
const MECH_LABS = [
    'mech_lab_workshop', 'mech_lab_mechatronics', 'mech_lab_robotics',
    'mech_lab_cim', 'mech_lab_cad', 'mech_lab_kd', 'mech_lab_material',
    'mech_lab_measurement', 'mech_lab_fmm', 'mech_lab_ic_engine',
    'mech_lab_thermodynamics', 'mech_lab_heat_transfer',
    'mech_lab_eng_graphics', 'mech_lab_automotive', 'mech_lab_cria',
];

// All Physics lab codes
const PHYSICS_LABS = [
    'physics_lab_ug', 'physics_lab_optics',
];

// All lab codes (for HOD dependencies)
const ALL_LAB_CODES = [...CSE_LABS, ...ECE_LABS, ...MECH_LABS, ...PHYSICS_LABS];

// Common HOD prerequisites (same for all branches)
const HOD_PREREQUISITES = [...ALL_LAB_CODES, 'lucs', 'library_librarian'];

/**
 * Static dependency graph (for non-dynamic steps).
 * Dynamic steps (nad, store, accounts, hod_*) are computed per-student in workflowService.
 */
const STATIC_STEP_DEPENDENCIES = {
    // Library: librarian waits for staff
    library_librarian: ['library_staff'],
};

/**
 * Returns dynamic dependencies for a given unit code + student branch.
 * Called at request creation time.
 *
 * @param {string} unitCode
 * @param {string} branch  - "CSE" | "ECE" | "CCE" | "MECH"
 * @returns {string[]} array of dependency unit codes
 */
function getDependenciesForUnit(unitCode, branch) {
    // Map branch to its HOD code
    const HOD_CODE = {
        CSE: 'hod_cse',
        CCE: 'hod_cce',
        ECE: 'hod_ece',
        MECH: 'hod_mech',
    }[branch.toUpperCase()] || 'hod_cse'; // fallback

    switch (unitCode) {
        case 'library_librarian':
            return ['library_staff'];

        case 'hod_cse':
        case 'hod_ece':
        case 'hod_cce':
        case 'hod_mech': {
            // HOD waits for all labs the student actually has + lucs + library done.
            // Filtered against the student's applicable units so branch-specific labs
            // (e.g. ece_lab_kundan, ECE only) never leave HOD waiting on a missing step.
            const applicable = new Set(getApplicableUnitCodes(branch));
            return HOD_PREREQUISITES.filter(code => applicable.has(code));
        }

        case 'nad':
            // NAD waits for the student's HOD
            return [HOD_CODE];

        case 'store':
            // Store waits for the student's HOD + warden
            return [HOD_CODE, 'warden'];

        case 'accounts':
            // Accounts is the final step — waits for everything relevant
            return [
                'medical', 'sports', 'lucs', 'warden', 'placement',
                'library_librarian', 'administration',
                HOD_CODE,
                'nad', 'store',
            ];

        default:
            // Independent unit — no dependencies
            return STATIC_STEP_DEPENDENCIES[unitCode] || [];
    }
}

/**
 * Returns the full list of unit codes that apply to a given student branch.
 * Some units are universal, others depend on branch.
 *
 * @param {string} branch
 * @returns {string[]}
 */
function getApplicableUnitCodes(branch) {
    const b = branch.toUpperCase();

    // Universal departments — every student regardless of branch
    const universal = [
        'medical', 'sports', 'lucs', 'warden', 'placement',
        'administration', 'library_staff', 'library_librarian',
        'store', 'nad', 'accounts',
    ];

    // ALL lab groups are required for ALL students.
    // The only branch-specific difference: ece_lab_kundan is ONLY for ECE students.
    const ECE_LABS_WITHOUT_KUNDAN = ECE_LABS.filter(code => code !== 'ece_lab_kundan');

    const allLabs = [
        ...CSE_LABS,
        ...ECE_LABS_WITHOUT_KUNDAN, // ECE labs (minus kundan) — all branches
        ...(b === 'ECE' ? ['ece_lab_kundan'] : []), // kundan ONLY for ECE
        ...MECH_LABS,
        ...PHYSICS_LABS,
    ];

    // HOD is branch-specific — student only goes to their own HOD
    const HOD_CODE = {
        CSE: 'hod_cse',
        CCE: 'hod_cce',
        ECE: 'hod_ece',
        MECH: 'hod_mech',
    }[b] || 'hod_cse';

    return [...universal, ...allLabs, HOD_CODE];
}

module.exports = {
    CSE_LABS, ECE_LABS, MECH_LABS, PHYSICS_LABS, ALL_LAB_CODES,
    HOD_PREREQUISITES,
    getDependenciesForUnit,
    getApplicableUnitCodes,
};
