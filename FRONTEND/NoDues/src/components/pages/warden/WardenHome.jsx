// import { useOutletContext, useNavigate } from "react-router-dom";

// export default function WardenHome() {
//   const navigate = useNavigate();

//   const {
//     HOSTELS,
//     selectedHostel,
//     setSelectedHostel,
//     hostelSelected,
//     pending,
//   } = useOutletContext();

//   const handleChange = (e) => {
//     const hostel = e.target.value;
//     setSelectedHostel(hostel);

//     // optional: after selecting hostel, directly take user to pending page
//     // comment this if you don't want auto navigation
//     // if (hostel) navigate("/warden/pending");
//   };

//   return (
//     <div className="rounded-2xl bg-white/10 p-5 sm:p-10 text-white shadow-lg backdrop-blur">
//       <h1 className="text-2xl font-semibold sm:text-3xl">Warden In Charge Dashboard</h1>
//       <p className="mt-2 text-white/70">
//         Select a hostel to view and manage clearance requests.
//       </p>

//       {/* Hostel Filter - ONLY on dashboard */}
//       <div className="mt-6 max-w-md">
//         <label className="text-sm text-white/80">Select Hostel</label>
//         <select
//           value={selectedHostel}
//           onChange={handleChange}
//           className="mt-2 w-full rounded-xl border border-white/15 bg-neutral-950 px-4 py-3 text-sm text-white outline-none focus:border-blue-500"
//         >
//           <option value="">-- Select Hostel --</option>
//           {HOSTELS.map((h) => (
//             <option key={h} value={h}>
//               {h}
//             </option>
//           ))}
//         </select>
//       </div>

//       {/* Pending count card */}
//       <div className="mt-8 rounded-xl border border-white/15 bg-white/5 p-5 max-w-md">
//         {!hostelSelected ? (
//           <>
//             <p className="text-sm text-white/70">Pending requests</p>
//             <p className="mt-1 text-base text-white/60">
//               Select a hostel to view pending requests.
//             </p>
//           </>
//         ) : (
//           <>
//             <p className="text-sm text-white/70">
//               Pending requests for <span className="font-semibold text-white">{selectedHostel}</span>
//             </p>
//             <p className="mt-1 text-3xl font-bold">{pending.length}</p>

//             <button
//               onClick={() => navigate("/warden/pending")}
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

export default function WardenHome() {
  const navigate = useNavigate();

  const {
    HOSTELS,
    selectedHostel,
    setSelectedHostel,
    hostelSelected,
    pending,
    pendingByHostel = {},
  } = useOutletContext();

  const handleChange = (e) => {
    const hostel = e.target.value;
    setSelectedHostel(hostel);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-white/10 p-5 sm:p-10 text-white shadow-lg backdrop-blur">
        <h1 className="text-2xl font-semibold sm:text-3xl">Warden In Charge Dashboard</h1>
        <p className="mt-2 text-white/70">
          Select a hostel to view and manage clearance requests.
        </p>

        <div className="mt-6 max-w-md">
          <label className="text-sm text-white/80">Select Hostel</label>
          <select
            value={selectedHostel}
            onChange={handleChange}
            className="mt-2 w-full rounded-xl border border-white/15 bg-neutral-950 px-4 py-3 text-sm text-white outline-none focus:border-blue-500"
          >
            <option value="">-- Select Hostel --</option>
            {HOSTELS.map((h) => (
              <option key={h} value={h}>
                {h}{pendingByHostel[h] ? ` — ${pendingByHostel[h]} pending` : ""}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-8 max-w-md rounded-xl border border-white/15 bg-white/5 p-5">
          {!hostelSelected ? (
            <>
              <p className="text-sm text-white/70">Pending requests</p>
              <p className="mt-1 text-base text-white/60">
                Select a hostel to view pending requests.
              </p>
            </>
          ) : (
            <>
              <p className="text-sm text-white/70">
                Pending requests for{" "}
                <span className="font-semibold text-white">{selectedHostel}</span>
              </p>
              <p className="mt-1 text-3xl font-bold">{pending.length}</p>

              <button
                onClick={() => navigate("/warden/pending")}
                className="mt-4 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Go to Pending Requests
              </button>
            </>
          )}
        </div>
      </div>

      <DepartmentAccessManager currentRoute="/warden" />
    </div>
  );
}