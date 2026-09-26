/**
 * Master list of all approval unit codes, their labels, and groupings.
 * This is the single source of truth for what permission codes exist.
 */

// ── Individual Approval Units ─────────────────────────────────────────────────
const ALL_UNIT_CODES = {
    // Simple departments
    medical: { label: 'Medical Officer' },
    sports: { label: 'Sports Officer' },
    lucs: { label: 'LUCS' },
    warden: { label: 'Warden In Charge' },
    placement: { label: 'Placement Office' },
    administration: { label: 'Administration' },
    library_staff: { label: 'Central Library - Staff' },
    library_librarian: { label: 'Central Library - Librarian' },
    store: { label: 'Store' },
    nad: { label: 'NAD Cell' },
    accounts: { label: 'Accounts' },

    // HODs (one per department)
    hod_cse: { label: 'HOD - CSE' },
    hod_ece: { label: 'HOD - ECE' },
    hod_cce: { label: 'HOD - CCE' },
    hod_mech: { label: 'HOD - MECH' },

    // CSE Labs (under /labs/cse-cce)
    cse_lab_1: { label: 'Computer Lab-1 (Mr. Shivam Maheshwari)', group: 'labs_cse_cce' },
    cse_lab_2: { label: 'Computer Lab-2 (Mrs. Shivangee Singh)', group: 'labs_cse_cce' },
    cse_lab_3: { label: 'Computer Lab-3 (Mr. Dinesh Kumar Sharma)', group: 'labs_cse_cce' },
    cse_lab_cmlbda: { label: 'CMLBDA Lab (Mr. Manish Kumar Mittal)', group: 'labs_cse_cce' },

    // ECE Labs (under /labs/ece-cce)
    ece_lab_microwave: { label: 'Microwave Lab (Mr. Kamta Sharma)', group: 'labs_ece_cce' },
    ece_lab_adc: { label: 'ADC Lab (Mr. Dharam Pal Yadav)', group: 'labs_ece_cce' },
    ece_lab_ti: { label: 'TI Lab (Mr. Vinod Kumar)', group: 'labs_ece_cce' },
    ece_lab_dsp: { label: 'DSP Lab (Mr. Kushmakar Sharma)', group: 'labs_ece_cce' },
    ece_lab_ecad: { label: 'E-CAD Lab (Mr. Ajay Naresh)', group: 'labs_ece_cce' },
    ece_lab_be: { label: 'BE Lab (Mr. Pavan Sharma)', group: 'labs_ece_cce' },
    ece_lab_kundan: { label: 'Final Approval ECE (Mr. Kundan Shahi)', group: 'labs_ece_cce' },

    // MECH Labs (under /labs/mech)
    mech_lab_workshop: { label: 'Mechanical Workshop (Mr. Bhagwan Singh)', group: 'labs_mech' },
    mech_lab_mechatronics: { label: 'Mechatronics Lab (Mr. Udayveer Singh)', group: 'labs_mech' },
    mech_lab_robotics: { label: 'Robotics Lab (Mr. Udayveer Singh)', group: 'labs_mech' },
    mech_lab_cim: { label: 'CIM Lab (Mr. Satish Yadav)', group: 'labs_mech' },
    mech_lab_cad: { label: 'CAD Lab (Mr. Satyanarayan Prajapat)', group: 'labs_mech' },
    mech_lab_kd: { label: 'K&D Lab (Mr. Satyanarayan Prajapat)', group: 'labs_mech' },
    mech_lab_material: { label: 'Material Characterization Lab (Mr. Satyanarayan Prajapat)', group: 'labs_mech' },
    mech_lab_measurement: { label: 'Measurement Lab (Mr. Bhagwan Singh & Mr. Udayveer Singh)', group: 'labs_mech' },
    mech_lab_fmm: { label: 'FMM Lab (Mr. Sandeep Kumar Saxena)', group: 'labs_mech' },
    mech_lab_ic_engine: { label: 'IC Engine Lab (Mr. Sandeep Kumar Saxena)', group: 'labs_mech' },
    mech_lab_thermodynamics: { label: 'Thermodynamics Lab (Mr. Sandeep Kumar Saxena)', group: 'labs_mech' },
    mech_lab_heat_transfer: { label: 'Heat Transfer Lab (Mr. Sandeep Kumar Saxena)', group: 'labs_mech' },
    mech_lab_eng_graphics: { label: 'Engineering Graphics Lab (Mr. Satyanarayan Prajapat)', group: 'labs_mech' },
    mech_lab_automotive: { label: 'Automotive Lab (Mr. Tej Bahadur Yadav)', group: 'labs_mech' },
    mech_lab_cria: { label: 'CRIA Lab (Mr. Tej Bahadur Yadav)', group: 'labs_mech' },

    // Physics Labs (under /labs/physics)
    physics_lab_ug: { label: 'UG Physics Lab (Mr. Laxmi Narayan Sharma)', group: 'labs_physics' },
    physics_lab_optics: { label: 'UG Physics Optics Lab (Mr. Laxmi Narayan Sharma)', group: 'labs_physics' },
};

// ── Group Permissions (for staff who manage a whole department's labs) ─────────
// A staff member with permissionCode "labs_cse_cce" can act on any of these unit codes:
const GROUP_PERMISSION_MAP = {
    labs_cse_cce: ['cse_lab_1', 'cse_lab_2', 'cse_lab_3', 'cse_lab_cmlbda'],
    labs_ece_cce: ['ece_lab_microwave', 'ece_lab_adc', 'ece_lab_ti', 'ece_lab_dsp',
        'ece_lab_ecad', 'ece_lab_be', 'ece_lab_kundan'],
    labs_mech: ['mech_lab_workshop', 'mech_lab_mechatronics', 'mech_lab_robotics',
        'mech_lab_cim', 'mech_lab_cad', 'mech_lab_kd', 'mech_lab_material',
        'mech_lab_measurement', 'mech_lab_fmm', 'mech_lab_ic_engine',
        'mech_lab_thermodynamics', 'mech_lab_heat_transfer',
        'mech_lab_eng_graphics', 'mech_lab_automotive', 'mech_lab_cria'],
    labs_physics: ['physics_lab_ug', 'physics_lab_optics'],
    admin: ['*'],  // admin has access to everything
};

// ── Frontend Route → Permission Code mapping ───────────────────────────────────
// Used to tell frontend what permissionCode a staff member should be assigned.
const ROUTE_TO_PERMISSION = {
    '/medical': 'medical',
    '/sports': 'sports',
    '/lucs': 'lucs',
    '/warden': 'warden',
    '/placement': 'placement',
    '/administration': 'administration',
    '/library/staff': 'library_staff',
    '/library/librarian': 'library_librarian',
    '/store': 'store',
    '/nad': 'nad',
    '/accounts': 'accounts',
    '/hod/cse': 'hod_cse',
    '/hod/ece': 'hod_ece',
    '/hod/cce': 'hod_cce',
    '/hod/mech': 'hod_mech',
    '/labs/cse-cce': 'labs_cse_cce',
    '/labs/ece-cce': 'labs_ece_cce',
    '/labs/mech': 'labs_mech',
    '/labs/physics': 'labs_physics',
    '/admin': 'admin',
};

// Reverse map: permission code → frontend route (for sending back to frontend after login)
const PERMISSION_TO_ROUTE = Object.fromEntries(
    Object.entries(ROUTE_TO_PERMISSION).map(([route, code]) => [code, route])
);

/**
 * Given a staff member's permissionCodes array, returns all individual
 * unit codes they can act on.
 */
function resolvePermittedUnitCodes(permissionCodes = []) {
    const codes = new Set();

    for (const code of permissionCodes) {
        if (code === 'admin') {
            // Admin sees everything — handled separately
            codes.add('*');
            return codes;
        }
        if (GROUP_PERMISSION_MAP[code]) {
            codes.add(code); // Retain authorizative access to the master group definition node
            GROUP_PERMISSION_MAP[code].forEach(c => codes.add(c));
        } else if (ALL_UNIT_CODES[code]) {
            codes.add(code); // direct unit code
        }
        // Anything else (e.g. 'student') grants no clearance/department access
    }

    return codes;
}

// Department codes whose staff list can be managed from a department dashboard
// (every dashboard route except /admin). 'student' and 'admin' are deliberately excluded.
const DEPARTMENT_ACCESS_CODES = Object.values(ROUTE_TO_PERMISSION).filter(code => code !== 'admin');

module.exports = {
    ALL_UNIT_CODES,
    GROUP_PERMISSION_MAP,
    ROUTE_TO_PERMISSION,
    PERMISSION_TO_ROUTE,
    DEPARTMENT_ACCESS_CODES,
    resolvePermittedUnitCodes,
};
