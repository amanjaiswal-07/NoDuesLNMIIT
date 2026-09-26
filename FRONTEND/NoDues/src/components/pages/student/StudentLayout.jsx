import { NavLink, Outlet, useNavigate, Link } from "react-router-dom";
import {
  HomeIcon,
  UserCircleIcon,
  DocumentPlusIcon,
  ClockIcon,
  XCircleIcon,
  ArrowRightOnRectangleIcon,
} from "@heroicons/react/24/outline";
import { useState, useEffect } from "react";
import logo from "../../../assets/LNMIIT_logo.png";
import api from "../../../api/client";

export default function StudentLayout() {
  const navigate = useNavigate();
  // Get user info from localStorage (set by Google Login)
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const email = user?.email || "";

  const [studentProfile, setStudentProfile] = useState(null);
  const [profileComplete, setProfileComplete] = useState(false);

  // Active / History requests from the backend
  const [applications, setApplications] = useState([]);
  const [currentApplication, setCurrentApplication] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStudentData = async () => {
    try {
      setIsLoading(true);

      // 1. Fetch profile — 401 here is the ONLY legitimate reason to redirect to login.
      let profileRes;
      try {
        profileRes = await api.get('/student/profile');
      } catch (profileErr) {
        if (profileErr.response?.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          navigate('/');
          return;
        }
        // Network error / 500 — stay on page, don't wipe state.
        console.error('Profile fetch error:', profileErr);
        return;
      }

      const profile = profileRes.data.profile;
      setStudentProfile(profile);
      setProfileComplete(profile.profileCompleted || false);

      // 2. Fetch active request — 404 = no application yet (perfectly normal).
      // NEVER clear currentApplication on failure — only update it on success.
      try {
        const reqRes = await api.get('/student/request');
        if (reqRes.data.request) {
          setCurrentApplication(reqRes.data.request);
          setApplications([reqRes.data.request]);
        }
      } catch (reqErr) {
        if (reqErr.response?.status !== 404) {
          console.error('Active request fetch error:', reqErr);
        }
        // 404 → no application → leave currentApplication as-is.
      }
    } catch (err) {
      console.error('fetchStudentData unexpected error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Guard: must have an email AND a student role token. If not, send to login.
    if (!email) {
      navigate('/');
      return;
    }
    if (user?.role && user.role !== 'student') {
      // A staff/admin token leaked into the student section — clear and redirect.
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      navigate('/');
      return;
    }
    fetchStudentData();
  }, [email, navigate]);

  // Exposed to child routes via context — awaitable so Track can chain its own refetch.
  const refreshStudentData = async () => {
    await fetchStudentData();
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  const navClass = ({ isActive }) =>
    `flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${isActive
      ? "bg-blue-600 text-white"
      : "text-white/80 hover:bg-white/10 hover:text-white"
    }`;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-900 flex items-center justify-center">
        <div className="text-white/60 animate-pulse">Loading portal...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-900">
      <header className="sticky top-0 z-50 w-full bg-black/80 backdrop-blur border-b border-white/10">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link to="/student" className="flex items-center gap-3 group">
            <div className="rounded-lg bg-white p-2 shadow-[0_0_15px_rgba(255,255,255,0.1)] group-hover:shadow-[0_0_20px_rgba(255,255,255,0.2)] transition-shadow">
              <img src={logo} alt="LNMIIT" className="h-8 w-auto" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold text-white tracking-wide">LNMIIT No Dues</span>
              <span className="text-xs font-medium text-white/50">{email}</span>
            </div>
          </Link>

          <div className="flex items-center gap-4">
            <NavLink to="/student" end className={navClass}>
              <HomeIcon className="h-5 w-5" />
              Dashboard
            </NavLink>

            {/* Profile route handled inside dashboard normally, or dedicated if exists */}
            <NavLink to="/student/profile" className={navClass}>
              <UserCircleIcon className="h-5 w-5" />
              Profile
            </NavLink>

            {profileComplete && !currentApplication ? (
              <NavLink to="/student/apply" className={navClass}>
                <DocumentPlusIcon className="h-5 w-5" />
                Apply
              </NavLink>
            ) : (
              <button
                type="button"
                disabled
                className="flex cursor-not-allowed items-center gap-2 rounded-lg bg-white/5 px-4 py-2 text-sm font-medium text-white/40"
                title={currentApplication ? "Application already in progress" : "Complete profile first"}
              >
                <DocumentPlusIcon className="h-5 w-5" />
                Apply
              </button>
            )}

            <NavLink to="/student/track" className={navClass}>
              <ClockIcon className="h-5 w-5" />
              Track
              {currentApplication ? (
                <span className="ml-1 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-blue-600 px-1 text-[11px] font-semibold text-white">
                  1
                </span>
              ) : null}
            </NavLink>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 rounded-lg border border-white/10 px-4 py-2 text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white transition-colors"
          >
            <ArrowRightOnRectangleIcon className="h-4 w-4" />
            Logout
          </button>
        </nav>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-10">
        <Outlet
          context={{
            user,
            email,
            studentProfile,
            setStudentProfile,
            profileComplete,
            setProfileComplete,
            applications,
            currentApplication,
            refreshStudentData,
          }}
        />
      </main>
    </div>
  );
}