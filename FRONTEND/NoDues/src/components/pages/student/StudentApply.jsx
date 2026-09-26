/**
 * StudentApply.jsx — submit the No Dues application (/student/apply) once the profile is complete.
 * The backend then creates one clearance step per department for this student's branch.
 */

import { useOutletContext } from "react-router-dom";
import ConfirmModal from "../../Modal/ConfirmModal";
import { useState, useEffect } from "react";
import api from "../../../api/client";

export default function StudentApply() {
  const {
    email,
    profileComplete,
    currentApplication,
    refreshStudentData,
  } = useOutletContext();

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [justApplied, setJustApplied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const hasOngoingApplication = Boolean(currentApplication);

  const [overallStatus, setOverallStatus] = useState(currentApplication?.status || "pending");

  useEffect(() => {
    if (!currentApplication) return;
    const fetchStatus = async () => {
      try {
        const { data } = await api.get(`/student/request/${currentApplication._id}/steps`);
        const steps = data.steps || [];
        const allApproved = steps.every(s => s.status === 'approved');
        const anyRejected = steps.some(s => s.status === 'rejected');

        if (allApproved && steps.length > 0) setOverallStatus("All Steps Completed");
        else if (anyRejected) setOverallStatus("Action Required");
        else setOverallStatus("In Progress");
      } catch (err) {
        console.error(err);
      }
    };
    fetchStatus();
  }, [currentApplication]);

  const handleApply = async () => {
    try {
      setIsSubmitting(true);
      setErrorMsg("");
      await api.post('/student/apply');
      setJustApplied(true);
      refreshStudentData(); // Refresh layout context
    } catch (err) {
      console.error("Failed to apply:", err);
      setErrorMsg(err.response?.data?.error || "Failed to submit application");
    } finally {
      setIsSubmitting(false);
      setConfirmOpen(false);
    }
  };

  return (
    <>
      <div className="space-y-6">
        <div className="rounded-2xl bg-white/10 p-5 sm:p-8 text-white shadow-lg backdrop-blur">
          <h1 className="text-2xl font-semibold sm:text-3xl">Apply for No Dues</h1>
          <p className="mt-2 text-white/70">
            Submit your No Dues application after completing your profile.
          </p>
        </div>

        <div className="rounded-2xl border border-white/15 bg-white/5 p-6">
          <h2 className="text-lg font-semibold text-white">Application Readiness</h2>

          {errorMsg && (
            <div className="mt-5 rounded-xl border border-red-400/30 bg-red-500/10 p-4">
              <p className="text-sm font-medium text-red-200">
                {errorMsg}
              </p>
            </div>
          )}

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-white/10 bg-black/20 p-4">
              <p className="text-sm text-white/60">Logged in as</p>
              <p className="mt-1 text-sm font-medium text-white">
                {email || "Not available"}
              </p>
            </div>

            <div className="rounded-xl border border-white/10 bg-black/20 p-4">
              <p className="text-sm text-white/60">Profile Status</p>
              <p className="mt-1 text-sm font-medium text-white">
                {profileComplete ? "Complete" : "Incomplete"}
              </p>
            </div>
          </div>

          {!profileComplete && (
            <div className="mt-5 rounded-xl border border-amber-400/30 bg-amber-500/10 p-4">
              <p className="text-sm font-medium text-amber-200">
                Your profile is currently incomplete. Please navigate to the Profile tab, fill out all required attributes, and upload the mandatory documents before initiating a No Dues application.
              </p>
            </div>
          )}

          {hasOngoingApplication && (
            <div className="mt-5 rounded-xl border border-blue-400/30 bg-blue-500/10 p-4">
              <p className="text-sm font-medium text-blue-200">
                You already have an ongoing or completed application.
              </p>
              <p className="mt-1 text-sm text-blue-100/80">
                Current Status: {overallStatus}
              </p>
            </div>
          )}

          {justApplied && (
            <div className="mt-5 rounded-xl border border-emerald-400/30 bg-emerald-500/10 p-4">
              <p className="text-sm font-medium text-emerald-200">
                Your No Dues application has been created successfully.
              </p>
              <p className="mt-1 text-sm text-emerald-100/80">
                Your request has been routed to the pending departments.
              </p>
            </div>
          )}

          <div className="mt-6 flex items-center gap-4">
            <button
              type="button"
              disabled={!profileComplete || hasOngoingApplication || isSubmitting}
              onClick={() => setConfirmOpen(true)}
              className={`rounded-xl px-5 py-3 text-sm font-semibold text-white ${!profileComplete || hasOngoingApplication || isSubmitting
                ? "cursor-not-allowed bg-blue-600/40"
                : "bg-blue-600 hover:bg-blue-700"
                }`}
            >
              {isSubmitting ? "Submitting..." : "Apply for No Dues"}
            </button>
          </div>
        </div>
      </div>

      <ConfirmModal
        open={confirmOpen}
        title="Submit No Dues Application?"
        message="Are you sure you want to apply for No Dues? Have you returned all library books, cleared lab dues, etc.?"
        confirmText="Yes, apply"
        cancelText="Cancel"
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleApply}
      />
    </>
  );
}