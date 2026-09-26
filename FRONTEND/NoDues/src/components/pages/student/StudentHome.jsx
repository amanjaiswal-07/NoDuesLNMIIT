import { useNavigate, useOutletContext } from "react-router-dom";
import HowToApply from "./HowToApply";

export default function StudentHome() {
  const navigate = useNavigate();
  const { email, profileComplete, currentApplication } = useOutletContext();

  const APPLICATION_LABELS = {
    in_progress: "In Progress",
    action_required: "On Hold — action required",
    approved: "Completed — No Dues cleared",
    submitted: "Submitted",
  };
  const isOnHold = currentApplication?.status === "action_required";

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-white/10 p-8 text-white shadow-lg backdrop-blur">
        <h1 className="text-3xl font-semibold">Student Dashboard</h1>
        <p className="mt-2 text-white/70">
          Welcome{email ? `, ${email}` : ""}. Manage your profile and track No
          Dues progress.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-4">
        <div className="rounded-2xl border border-white/15 bg-white/5 p-6 text-white">
          <p className="text-sm text-white/60">Profile Status</p>
          <p className="mt-2 text-lg font-semibold">
            {profileComplete ? "Complete" : "Incomplete"}
          </p>
          <button
            type="button"
            onClick={() => navigate("/student/profile")}
            className="mt-4 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Open Profile
          </button>
        </div>

        <div className="rounded-2xl border border-white/15 bg-white/5 p-6 text-white">
          <p className="text-sm text-white/60">Apply for No Dues</p>
          <p className="mt-2 text-lg font-semibold">
            {currentApplication ? "Already applied" : profileComplete ? "Ready" : "Complete profile first"}
          </p>
          <button
            type="button"
            disabled={!profileComplete || Boolean(currentApplication)}
            onClick={() => navigate("/student/apply")}
            className={`mt-4 rounded-xl px-4 py-2 text-sm font-medium text-white ${profileComplete && !currentApplication
                ? "bg-blue-600 hover:bg-blue-700"
                : "cursor-not-allowed bg-blue-600/40"
              }`}
          >
            Go to Apply
          </button>
        </div>

        <div className="rounded-2xl border border-white/15 bg-white/5 p-6 text-white">
          <p className="text-sm text-white/60">Current Application</p>
          <p className="mt-2 text-lg font-semibold">
            {currentApplication
              ? APPLICATION_LABELS[currentApplication.status] || currentApplication.status
              : "No ongoing application"}
          </p>
          <button
            type="button"
            onClick={() => navigate("/student/track")}
            className="mt-4 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Track Application
          </button>
        </div>

        <div className="rounded-2xl border border-white/15 bg-white/5 p-6 text-white">
          <p className="text-sm text-white/60">Application On Hold</p>
          <p className={`mt-2 text-lg font-semibold ${isOnHold ? "text-red-300" : ""}`}>
            {isOnHold ? "Yes — please reapply" : "No"}
          </p>
          <button
            type="button"
            onClick={() => navigate(isOnHold ? "/student/track" : "/student/history")}
            className={`mt-4 rounded-xl px-4 py-2 text-sm font-medium text-white ${isOnHold ? "bg-red-600 hover:bg-red-700" : "bg-blue-600 hover:bg-blue-700"}`}
          >
            {isOnHold ? "Go to Reapply" : "View History"}
          </button>
        </div>
      </div>

      {/* ── How to Apply Guide ── */}
      <HowToApply />
    </div>
  );
}