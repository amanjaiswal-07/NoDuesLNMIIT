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
    `flex shrink-0 items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition sm:px-4
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
      {/* Phones & laptops: brand + Logout on top, tabs underneath (scroll sideways). Wide screens: one row. */}
      <nav className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-4 gap-y-3 px-4 py-3 sm:px-6 xl:flex-nowrap xl:py-4">
        {/* Left */}
        <Link to={basePath} className="flex min-w-0 items-center gap-3">
          <div className="shrink-0 rounded-lg bg-white p-1.5 sm:p-2">
            <img src={logo} alt="LNMIIT" className="h-7 w-auto sm:h-8" />
          </div>
          <span className="truncate text-base font-semibold text-white sm:text-lg">
            {title}
            {subTitle ? <span className="text-white/70"> - {subTitle}</span> : null}
          </span>
        </Link>

        {/* Right */}
        <button
          onClick={handleLogout}
          aria-label="Logout"
          className="flex shrink-0 items-center gap-2 rounded-lg border border-red-400/40 px-3 py-2 text-sm font-medium text-red-400 hover:bg-red-500/10 sm:px-4 xl:order-last"
        >
          <ArrowRightOnRectangleIcon className="h-5 w-5" />
          <span className="hidden sm:inline">Logout</span>
        </button>

        {/* Tabs */}
        <div className="no-scrollbar -mx-1 flex w-full items-center gap-1 overflow-x-auto px-1 pt-2 xl:mx-0 xl:w-auto xl:gap-4 xl:overflow-visible xl:px-0 xl:pt-0">
          <NavLink to={p.pending} className={navClass}>
            <span className="relative inline-flex items-center gap-2">
              <ClockIcon className="h-5 w-5" />
              {l.pending}

              {pendingCount > 0 && (
                <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-blue-600 px-1 text-[11px] font-semibold text-white ring-2 ring-black/60 xl:absolute xl:-right-3 xl:-top-3">
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
      </nav>
    </header>
  );
}
