import { useState, useLayoutEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import GoogleSignInButton from './GoogleSignInButton';
import axios from 'axios';
import { ExclamationTriangleIcon } from '@heroicons/react/24/solid';
import logo from '../assets/LNMIIT_logo.png';
import bgImage from '../assets/center-plaza.png';

axios.defaults.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
axios.defaults.withCredentials = true;

const ROLES = [
  { label: "Student", value: "student" },
  { label: "Admin", value: "admin" },
  { label: "Medical Officer", value: "medical" },
  { label: "HOD - CSE", value: "hod_cse" },
  { label: "HOD - ECE", value: "hod_ece" },
  { label: "HOD - CCE", value: "hod_cce" },
  { label: "HOD - MECH", value: "hod_mech" },
  { label: "Labs - CSE/CCE", value: "labs_cse_cce" },
  { label: "Labs - ECE/CCE", value: "labs_ece_cce" },
  { label: "Labs - MECH", value: "labs_mech" },
  { label: "Labs - PHYSICS", value: "labs_physics" },
  { label: "Central Library - Staff", value: "library_staff" },
  { label: "Central Library - Librarian", value: "library_librarian" },
  { label: "Sports Officer", value: "sports" },
  { label: "LUCS", value: "lucs" },
  { label: "Warden In Charge", value: "warden" },
  { label: "Placement Office", value: "placement" },
  { label: "Administration", value: "administration" },
  { label: "Store", value: "store" },
  { label: "NAD Cell", value: "nad" },
  { label: "Accounts", value: "accounts" }
];

const Login = () => {
  const navigate = useNavigate();
  const [role, setRole] = useState("student");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Google's button only accepts a pixel width (max 400), so match it to the card's width.
  // It is rendered once the width is known, and re-created only when the width really changes,
  // so Google's script is initialised once per page instead of on every tiny resize.
  const buttonBoxRef = useRef(null);
  const [buttonWidth, setButtonWidth] = useState(null);
  useLayoutEffect(() => {
    const box = buttonBoxRef.current;
    if (!box) return;
    const update = () => {
      const next = Math.min(400, Math.max(200, Math.floor(box.clientWidth)));
      setButtonWidth((prev) => (prev && Math.abs(prev - next) < 24 ? prev : next));
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(box);
    return () => observer.disconnect();
  }, []);

  const handleGoogleSuccess = async (credentialResponse) => {
    setIsLoading(true);
    setError("");
    try {
      const res = await axios.post("/auth/google", {
        credential: credentialResponse.credential,
        selectedRole: role,
      });

      const { token, user } = res.data;

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

      // Redirect precisely where the backend tells us
      navigate(user.redirectRoute || "/");
    } catch (err) {
      console.error("Login error:", err);
      // Determine if it's an authorization error from the google prompt itself
      if (err.response?.status === 403) {
        setError(err.response?.data?.error || "Access denied. Not found in system.");
      } else {
        setError(err.response?.data?.error || "Authentication failed. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleError = () => {
    setError("Google login failed. Please try again.");
  };

  return (
    <div
      className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden bg-cover bg-center"
      style={{ backgroundImage: `url(${bgImage})` }}
    >
      {/* Subtle fade/blur to make the card shadow and logo distinctly readable against the plaza building */}
      <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px]"></div>

      {/* Floating Login Card */}
      <div className="relative z-10 w-full max-w-[440px] bg-white rounded-[28px] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.15)] py-11 px-10 flex flex-col items-center border border-white/80">

        {/* Centered Logo Container */}
        <div className="mb-6 rounded-2xl border border-slate-100 bg-white p-4 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] flex items-center justify-center">
          <img src={logo} alt="LNMIIT Logo" className="h-10 w-auto object-contain" />
        </div>

        {/* Titles */}
        <h2 className="text-[22px] font-bold text-slate-800 mb-1">No Dues Portal</h2>
        <p className="text-slate-400 text-[13px] tracking-wide mb-8">Sign in to continue</p>

        {/* Dynamic Error State Notification */}
        {error && (
          <div className="w-full mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center justify-center gap-2">
            <ExclamationTriangleIcon className="h-5 w-5 shrink-0 text-red-500" />
            <span className="text-sm text-red-600 font-medium">{error}</span>
          </div>
        )}

        {/* Dropdown Container */}
        <div className="w-full flex flex-col gap-6">
          <div className="relative w-full">
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full appearance-none cursor-pointer rounded-full border border-slate-200 bg-white px-5 py-[14px] text-sm text-slate-600 outline-none transition-all hover:border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-sm"
            >
              {ROLES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
            {/* Custom chevron */}
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-5">
              <svg className="h-[18px] w-[18px] text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          {/* Core Interactive Login Button */}
          <div ref={buttonBoxRef} className="flex min-h-[44px] w-full items-center justify-center">
            {isLoading ? (
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
            ) : buttonWidth && (
              <GoogleSignInButton
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                width={buttonWidth}
              />
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Login;