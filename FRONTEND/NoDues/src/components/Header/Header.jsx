// import { NavLink, useNavigate, Link } from "react-router-dom";
// import {
//   ClockIcon,
//   CheckCircleIcon,
//   XCircleIcon,
//   ArrowRightOnRectangleIcon,
// } from "@heroicons/react/24/outline";

// import logo from "../../assets/LNMIIT_logo.png";

// const ROLE_TITLES = {
//   medical: "Medical Unit",
//   library: "Central Library",
//   accounts: "Accounts",
//   store: "Store",
//   lucs: "LUCS",
//   warden: "Warden In Charge",
//   administration: "Administration",
//   sports: "Sports",
//   hod: "Head of Department",
//   placement: "Placement Office",
//   nad: "NAD Cell",
//   admin: "Admin",
//   student: "Student",
// };

// export default function Header({ role , pendingCount = 0 , subTitle = "" }) {
//   const navigate = useNavigate();
//   const basePath = `/${role}`;
//   const title = ROLE_TITLES[role] || role;

//   const handleLogout = () => {
//     navigate("/");
//   };

//   const navClass = ({ isActive }) =>
//     `flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition
//      ${
//        isActive
//          ? "bg-blue-600 text-white"
//          : "text-white/80 hover:bg-white/10 hover:text-white"
//      }`;

//   return (
//     <header className="sticky top-0 z-50 w-full bg-black/80 backdrop-blur">
//       <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
//         {/* Left */}
//         <Link to={basePath} className="flex items-center gap-3">
//           <div className="rounded-lg bg-white p-2">
//             <img src={logo} alt="LNMIIT" className="h-8 w-auto" />
//           </div>
//           <span className="text-lg font-semibold text-white">
//             {title}
//             {subTitle ? <span className="text-white/70"> - {subTitle}</span> : null}
//           </span>
//         </Link>

//         {/* Center */}
//         <div className="flex items-center gap-4">
//           {/* <NavLink to={`${basePath}/pending`} className={navClass}>
//             <ClockIcon className="h-5 w-5" />
//             Pending Requests
//           </NavLink> */}
//           <NavLink to={`${basePath}/pending`} className={navClass}>
//             <span className="relative inline-flex items-center gap-2">
//               <ClockIcon className="h-5 w-5" />
//               Pending Requests

//               {pendingCount > 0 && (
//                 <span className="absolute -right-3 -top-3 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-blue-600 px-1 text-[11px] font-semibold text-white">
//                   {pendingCount}
//                 </span>
//              )}
//             </span>
//           </NavLink>


//           <NavLink to={`${basePath}/approved`} className={navClass}>
//             <CheckCircleIcon className="h-5 w-5" />
//             Approved Requests
//           </NavLink>

//           <NavLink to={`${basePath}/rejected`} className={navClass}>
//             <XCircleIcon className="h-5 w-5" />
//             Rejected Requests
//           </NavLink>
//         </div>

//         {/* Right */}
//         <button
//           onClick={handleLogout}
//           className="flex items-center gap-2 rounded-lg border border-red-400/40 px-4 py-2 text-sm font-medium text-red-400 hover:bg-red-500/10"
//         >
//           <ArrowRightOnRectangleIcon className="h-5 w-5" />
//           Logout
//         </button>
//       </nav>
//     </header>
//   );
// }

import { NavLink, useNavigate, Link } from "react-router-dom";
import {
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowRightOnRectangleIcon,
} from "@heroicons/react/24/outline";

import logo from "../../assets/LNMIIT_logo.png";

const ROLE_TITLES = {
  medical: "Medical Unit",
  library: "Central Library",
  accounts: "Accounts",
  store: "Store",
  lucs: "LUCS",
  warden: "Warden In Charge",
  administration: "Administration",
  sports: "Sports",
  hod: "Head of Department",
  placement: "Placement Office",
  nad: "NAD Cell",
  admin: "Admin",
  student: "Student",
  labs: "Labs"
};

export default function Header({
  role,
  title: titleProp, // department's own display name (e.g. "Central Library - Staff")
  pendingCount = 0,
  subTitle = "",

  // ✅ NEW (optional overrides for special cases like Library)
  basePath: basePathProp,
  paths,
  labels,
}) {
  const navigate = useNavigate();

  // default basePath => "/medical", "/accounts" etc.
  const basePath = basePathProp || `/${role}`;
  const title = titleProp || ROLE_TITLES[role] || role;

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  const navClass = ({ isActive }) =>
    `flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition
     ${isActive
      ? "bg-blue-600 text-white"
      : "text-white/80 hover:bg-white/10 hover:text-white"
    }`;

  // ✅ default tab paths
  const p = {
    pending: `${basePath}/pending`,
    approved: `${basePath}/approved`,
    rejected: `${basePath}/rejected`,
    ...(paths || {}),
  };

  // ✅ default labels
  const l = {
    pending: "Pending Requests",
    approved: "Approved Requests",
    rejected: "Requests On Hold",
    ...(labels || {}),
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-black/80 backdrop-blur">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        {/* Left */}
        <Link to={basePath} className="flex items-center gap-3">
          <div className="rounded-lg bg-white p-2">
            <img src={logo} alt="LNMIIT" className="h-8 w-auto" />
          </div>
          <span className="text-lg font-semibold text-white">
            {title}
            {subTitle ? <span className="text-white/70"> - {subTitle}</span> : null}
          </span>
        </Link>

        {/* Center */}
        <div className="flex items-center gap-4">
          <NavLink to={p.pending} className={navClass}>
            <span className="relative inline-flex items-center gap-2">
              <ClockIcon className="h-5 w-5" />
              {l.pending}

              {pendingCount > 0 && (
                <span className="absolute -right-3 -top-3 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-blue-600 px-1 text-[11px] font-semibold text-white">
                  {pendingCount}
                </span>
              )}
            </span>
          </NavLink>

          <NavLink to={p.approved} className={navClass}>
            <CheckCircleIcon className="h-5 w-5" />
            {l.approved}
          </NavLink>

          <NavLink to={p.rejected} className={navClass}>
            <XCircleIcon className="h-5 w-5" />
            {l.rejected}
          </NavLink>
        </div>

        {/* Right */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 rounded-lg border border-red-400/40 px-4 py-2 text-sm font-medium text-red-400 hover:bg-red-500/10"
        >
          <ArrowRightOnRectangleIcon className="h-5 w-5" />
          Logout
        </button>
      </nav>
    </header>
  );
}