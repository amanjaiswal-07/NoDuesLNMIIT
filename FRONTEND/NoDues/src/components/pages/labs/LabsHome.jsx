// import { useOutletContext, useNavigate } from "react-router-dom";

// function prettyDepartmentName(department) {
//   const map = {
//     "cse-cce": "CSE / CCE Labs",
//     "ece-cce": "ECE / CCE Labs",
//     mech: "Mechanical Labs",
//     physics: "Physics Labs",
//   };

//   return map[department] || "Labs";
// }

// export default function LabsHome() {
//   const navigate = useNavigate();

//   const {
//     department,
//     LABS,
//     selectedLab,
//     setSelectedLab,
//     labSelected,
//     pending,
//   } = useOutletContext();

//   const handleChange = (e) => {
//     const lab = e.target.value;
//     setSelectedLab(lab);
//   };

//   return (
//     <div className="rounded-2xl bg-white/10 p-5 sm:p-10 text-white shadow-lg backdrop-blur">
//       <h1 className="text-2xl font-semibold sm:text-3xl">
//         {prettyDepartmentName(department)} Dashboard
//       </h1>
//       <p className="mt-2 text-white/70">
//         Select a lab to view and manage clearance requests.
//       </p>

//       {/* Lab Filter */}
//       <div className="mt-6 max-w-xl">
//         <label className="text-sm text-white/80">Select Lab</label>
//         <select
//           value={selectedLab}
//           onChange={handleChange}
//           className="mt-2 w-full rounded-xl border border-white/15 bg-neutral-950 px-4 py-3 text-sm text-white outline-none focus:border-blue-500"
//         >
//           <option value="">-- Select Lab --</option>
//           {LABS.map((lab) => (
//             <option key={lab} value={lab}>
//               {lab}
//             </option>
//           ))}
//         </select>
//       </div>

//       {/* Pending count card */}
//       <div className="mt-8 rounded-xl border border-white/15 bg-white/5 p-5 max-w-xl">
//         {!labSelected ? (
//           <>
//             <p className="text-sm text-white/70">Pending requests</p>
//             <p className="mt-1 text-base text-white/60">
//               Select a lab to view pending requests.
//             </p>
//           </>
//         ) : (
//           <>
//             <p className="text-sm text-white/70">
//               Pending requests for{" "}
//               <span className="font-semibold text-white">{selectedLab}</span>
//             </p>
//             <p className="mt-1 text-3xl font-bold">{pending.length}</p>

//             <button
//               onClick={() => navigate(`/labs/${department}/pending`)}
//               className="mt-4 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
//             >
//               Go to Pending Requests
//             </button>
//           </>
//         )}
//       </div>
//     </div>
//   );
// }
import { useOutletContext, useNavigate } from "react-router-dom";
import DepartmentAccessManager from "../../Home/DepartmentAccessManager";

function prettyDepartmentName(department) {
  const map = {
    "cse-cce": "CSE / CCE Labs",
    "ece-cce": "ECE / CCE Labs",
    mech: "Mechanical Labs",
    physics: "Physics Labs",
  };

  return map[department] || "Labs";
}

export default function LabsHome() {
  const navigate = useNavigate();

  const {
    department,
    LABS,
    selectedLab,
    setSelectedLab,
    labSelected,
    pending,
    pendingByLab = {},
  } = useOutletContext();

  const handleChange = (e) => {
    const lab = e.target.value;
    setSelectedLab(lab);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-white/10 p-5 sm:p-10 text-white shadow-lg backdrop-blur">
        <h1 className="text-2xl font-semibold sm:text-3xl">
          {prettyDepartmentName(department)} Dashboard
        </h1>
        <p className="mt-2 text-white/70">
          Select a lab to view and manage clearance requests.
        </p>

        <div className="mt-6 max-w-xl">
          <label className="text-sm text-white/80">Select Lab</label>
          <select
            value={selectedLab}
            onChange={handleChange}
            className="mt-2 w-full rounded-xl border border-white/15 bg-neutral-950 px-4 py-3 text-sm text-white outline-none focus:border-blue-500"
          >
            <option value="">-- Select Lab --</option>
            {LABS.map((lab) => (
              <option key={lab} value={lab}>
                {lab}{pendingByLab[lab] ? ` — ${pendingByLab[lab]} pending` : ""}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-8 max-w-xl rounded-xl border border-white/15 bg-white/5 p-5">
          {!labSelected ? (
            <>
              <p className="text-sm text-white/70">Pending requests</p>
              <p className="mt-1 text-base text-white/60">
                Select a lab to view pending requests.
              </p>
            </>
          ) : (
            <>
              <p className="text-sm text-white/70">
                Pending requests for{" "}
                <span className="font-semibold text-white">{selectedLab}</span>
              </p>
              <p className="mt-1 text-3xl font-bold">{pending.length}</p>

              <button
                onClick={() => navigate(`/labs/${department}/pending`)}
                className="mt-4 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Go to Pending Requests
              </button>
            </>
          )}
        </div>
      </div>

      <DepartmentAccessManager currentRoute={`/labs/${department}`} />
    </div>
  );
}