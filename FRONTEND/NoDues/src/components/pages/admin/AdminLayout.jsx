import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  HomeIcon,
  ShieldCheckIcon,
  UsersIcon,
  ClipboardDocumentListIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { useState } from "react";
import logo from "../../../assets/LNMIIT_logo.png";

const navItems = [
  {
    label: "Dashboard",
    path: "/admin",
    icon: HomeIcon,
    end: true,
  },
  {
    label: "Department Access",
    path: "/admin/department-access",
    icon: ShieldCheckIcon,
  },
  {
    label: "Eligible Students",
    path: "/admin/eligible-students",
    icon: UsersIcon,
  },
  {
    label: "Applications",
    path: "/admin/applications",
    icon: ClipboardDocumentListIcon,
  },
];

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true); // desktop: wide or icons-only
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false); // phones: slide-in menu

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  const getPageTitle = () => {
    if (location.pathname === "/admin") return "Admin Dashboard";
    if (location.pathname.includes("department-access")) return "Department Access";
    if (location.pathname.includes("eligible-students")) return "Eligible Students";
    if (location.pathname.includes("applications")) return "Applications";
    return "Admin";
  };

  const getPageSubtitle = () => {
    if (location.pathname === "/admin") {
      return "Manage the No Dues system from one place.";
    }
    if (location.pathname.includes("department-access")) {
      return "Control which email IDs can access department portals.";
    }
    if (location.pathname.includes("eligible-students")) {
      return "Manage who can apply for No Dues.";
    }
    if (location.pathname.includes("applications")) {
      return "View all student applications across departments.";
    }
    return "Admin control panel";
  };

  const navClass = ({ isActive }) =>
    `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${isActive
      ? "bg-blue-600 text-white"
      : "text-white/75 hover:bg-white/10 hover:text-white"
    }`;

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <div className="flex min-h-screen">
        {/* Phones: dim the page behind the open menu */}
        {mobileMenuOpen && (
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          />
        )}

        {/* Sidebar — slide-in menu on phones, collapsible column on desktop */}
        <aside
          className={`fixed inset-y-0 left-0 z-50 w-72 border-r border-white/10 bg-neutral-950 transition-all duration-300 lg:static lg:z-auto lg:translate-x-0 lg:bg-black/40 lg:backdrop-blur ${
            mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
          } ${sidebarOpen ? "lg:w-72" : "lg:w-24"}`}
        >
          <div className={`flex h-20 items-center justify-between border-b border-white/10 px-4 ${sidebarOpen ? "" : "lg:justify-center"}`}>
            <NavLink to="/admin" onClick={() => setMobileMenuOpen(false)} className={`flex items-center gap-3 overflow-hidden ${sidebarOpen ? "" : "lg:hidden"}`}>
              <div className="shrink-0 rounded-lg bg-white p-2">
                <img src={logo} alt="LNMIIT" className="h-8 w-auto" />
              </div>
              <div className={sidebarOpen ? "" : "lg:hidden"}>
                <p className="text-base font-semibold text-white">Admin Panel</p>
                <p className="text-xs text-white/60">No Dues Control</p>
              </div>
            </NavLink>

            <button
              onClick={() => setSidebarOpen((prev) => !prev)}
              aria-label="Collapse sidebar"
              className="hidden rounded-lg p-2 text-white/70 hover:bg-white/10 hover:text-white lg:block"
            >
              <Bars3Icon className="h-6 w-6" />
            </button>
            <button
              onClick={() => setMobileMenuOpen(false)}
              aria-label="Close menu"
              className="rounded-lg p-2 text-white/70 hover:bg-white/10 hover:text-white lg:hidden"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <nav className="space-y-2 p-4">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.end}
                  onClick={() => setMobileMenuOpen(false)}
                  className={navClass}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  <span className={sidebarOpen ? "" : "lg:hidden"}>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </aside>

        {/* Main content */}
        <div className="flex min-h-screen min-w-0 flex-1 flex-col">
          {/* Topbar */}
          <header className="sticky top-0 z-30 border-b border-white/10 bg-neutral-950/80 backdrop-blur">
            <div className="flex items-center justify-between gap-3 px-4 py-4 sm:px-6 sm:py-5">
              <div className="flex min-w-0 items-center gap-3">
                <button
                  onClick={() => setMobileMenuOpen(true)}
                  aria-label="Open menu"
                  className="shrink-0 rounded-lg p-2 text-white/70 hover:bg-white/10 hover:text-white lg:hidden"
                >
                  <Bars3Icon className="h-6 w-6" />
                </button>
                <div className="min-w-0">
                  <h1 className="truncate text-lg font-semibold text-white sm:text-2xl">{getPageTitle()}</h1>
                  <p className="mt-1 hidden text-sm text-white/60 sm:block">{getPageSubtitle()}</p>
                </div>
              </div>

              <button
                onClick={handleLogout}
                aria-label="Logout"
                className="flex shrink-0 items-center gap-2 rounded-lg border border-red-400/30 px-3 py-2 text-sm font-medium text-red-400 transition hover:bg-red-500/10 sm:px-4"
              >
                <ArrowRightOnRectangleIcon className="h-5 w-5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </header>

          <main className="flex-1 px-4 py-6 sm:px-6 sm:py-8">
            <div className="mx-auto max-w-7xl">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}