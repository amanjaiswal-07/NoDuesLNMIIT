/**
 * StudentHistory.jsx — list of the student's applications with their outcome (/student/history).
 */

import { useState, useEffect } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import api from "../../../api/client";
import { applicationNo } from "../../../config/applicationNo";

function StatusBadge({ status }) {
  const base =
    "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase";

  if (status === "pending") {
    return (
      <span className={`${base} border-amber-400/40 bg-amber-500/10 text-amber-300`}>
        ONGOING
      </span>
    );
  }

  if (status === "rejected") {
    return (
      <span className={`${base} border-rose-400/40 bg-rose-500/10 text-rose-300`}>
        REJECTED
      </span>
    );
  }

  if (status === "approved") {
    return (
      <span className={`${base} border-emerald-400/40 bg-emerald-500/10 text-emerald-300`}>
        COMPLETED
      </span>
    );
  }

  return (
    <span className={`${base} border-white/40 bg-white/10 text-white/80`}>
      {status}
    </span>
  );
}

function HistoryCard({ item }) {
  const navigate = useNavigate();
  const [steps, setSteps] = useState([]);
  const [overallStatus, setOverallStatus] = useState(item.status || "pending");

  useEffect(() => {
    const fetchSteps = async () => {
      try {
        const { data } = await api.get(`/student/request/${item._id || item.id}/steps`);
        const itemSteps = data.steps || [];
        setSteps(itemSteps);

        const allApproved = itemSteps.every(s => s.status === "approved");
        const anyRejected = itemSteps.some(s => s.status === "rejected");

        if (allApproved && itemSteps.length > 0) setOverallStatus("approved");
        else if (anyRejected) setOverallStatus("rejected");
        else setOverallStatus("pending");
      } catch (err) {
        console.error(err);
      }
    };
    fetchSteps();
  }, [item._id, item.id]);

  const rejectedStep = steps.find(s => s.status === "rejected");
  const finalApproveDate = overallStatus === "approved" && steps.length > 0
    ? new Date(Math.max(...steps.map(s => s.actionAt ? new Date(s.actionAt).getTime() : 0)))
    : null;

  return (
    <div className="rounded-2xl border border-white/15 bg-white/5 p-6 text-white">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="mb-1 text-base font-semibold tracking-wide text-white/90">{applicationNo(item)}</h2>
          <p className="text-sm text-white/80">
            Applied on {new Date(item.createdAt).toLocaleDateString()}
          </p>
        </div>

        <StatusBadge status={overallStatus} />
      </div>

      {overallStatus === "pending" && (
        <div className="mt-5 rounded-xl border border-amber-400/20 bg-amber-500/10 p-4">
          <p className="text-sm text-amber-100">
            Current Application is pending approvals. Check the Track section for details.
          </p>
        </div>
      )}

      {overallStatus === "rejected" && rejectedStep && (
        <div className="mt-5 rounded-xl border border-rose-400/20 bg-rose-500/10 p-4">
          <p className="text-sm font-medium text-rose-200">
            Placed on hold by: {rejectedStep.unitLabel || rejectedStep.unitCode}
          </p>
          <p className="mt-2 text-sm text-rose-100/90">
            Reason: {rejectedStep.rejectionReason || "No reason provided"}
          </p>
          {rejectedStep.rejectionDescription && (
            <p className="mt-1 text-sm text-rose-100/70">
              Details: {rejectedStep.rejectionDescription}
            </p>
          )}
        </div>
      )}

      {overallStatus === "rejected" && (
        <div className="mt-4">
          <button
            type="button"
            onClick={() => navigate("/student/track")}
            className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Go to Track to Reapply
          </button>
        </div>
      )}

      {overallStatus === "approved" && (
        <div className="mt-5 rounded-xl border border-emerald-400/20 bg-emerald-500/10 p-4">
          <p className="text-sm text-emerald-100 font-medium">
            Application completed successfully. All dues are cleared!
          </p>
          {finalApproveDate && finalApproveDate.getTime() > 0 && (
            <p className="mt-2 text-xs text-emerald-200/70 block">
              Completed on: {finalApproveDate.toLocaleString("en-IN", { dateStyle: "long", timeStyle: "short" })}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default function StudentHistory() {
  const { applications } = useOutletContext();
  const displayApplications = applications || [];

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-white/10 p-5 sm:p-8 text-white shadow-lg backdrop-blur">
        <h1 className="text-2xl font-semibold sm:text-3xl">Application History</h1>
        <p className="mt-2 text-white/70">
          View all your previous No Dues applications and their status.
        </p>
      </div>

      <div className="grid gap-5">
        {displayApplications.length === 0 && (
          <div className="rounded-2xl border border-white/15 bg-white/5 p-8 text-center text-white">
            <p className="text-lg font-semibold">No applications found</p>
            <p className="mt-2 text-sm text-white/60">
              You haven't submitted any No Dues requests yet.
            </p>
          </div>
        )}

        {displayApplications.map((item) => (
          <HistoryCard key={item._id || item.id} item={item} />
        ))}
      </div>
    </div>
  );
}