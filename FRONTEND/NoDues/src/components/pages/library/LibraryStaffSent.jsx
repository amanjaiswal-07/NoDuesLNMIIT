/**
 * LibraryStaffSent.jsx — Library Staff's "Sent Requests" tab: students passed to the Librarian with
 * the Librarian's current status (Pending / Approved / On Hold, with the reason on hover).
 */

import { useOutletContext } from "react-router-dom";
import { useState } from "react";
import { EyeIcon } from "@heroicons/react/24/outline";
import ViewDetailsModal from "../../Modal/ViewDetailsModal";
import StudentRow from "../../Request/StudentRow";
import { rowButton } from "../../Request/rowButton";

export default function LibraryStaffSent() {
  const { staffSent } = useOutletContext();
  const [viewOpen, setViewOpen] = useState(false);
  const [viewStudent, setViewStudent] = useState(null);

  const badgeClass = (status) => {
    if (status === "Approved by Librarian")
      return "border-emerald-400/40 text-emerald-300 bg-emerald-500/10";
    if (status === "On Hold by Librarian")
      return "border-rose-400/40 text-rose-300 bg-rose-500/10";
    return "border-white/20 text-white/80 bg-white/5"; // Pending with Librarian
  };

  const getStatus = (s) => {
    if (s?.librarianStatus === "approved") return "Approved by Librarian";
    if (s?.librarianStatus === "rejected") return "On Hold by Librarian";
    return "Pending with Librarian";
  };

  return (
    <div className="mx-auto w-full max-w-7xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-white">
          Central Library - Staff | Move to Librarian
        </h1>
        <p className="mt-1 text-sm text-white/60">
          Requests forwarded to Librarian for final approval.
        </p>
      </div>

      <div className="space-y-4">
        {staffSent.length === 0 ? (
          <div className="rounded-2xl border border-white/15 bg-white/5 p-8 text-center text-white">
            <p className="text-lg font-semibold">No requests sent</p>
            <p className="mt-1 text-sm text-white/60">Nothing to track right now.</p>
          </div>
        ) : (
          staffSent.map((s, idx) => (
            <StudentRow key={s.id ?? s.roll} idx={idx} s={s}>
              {/* Status badge */}
              <span
                title={s.librarianReason || undefined}
                className={`whitespace-nowrap rounded-xl border px-3 py-2 text-xs font-semibold ${badgeClass(
                  getStatus(s)
                )}`}
              >
                {getStatus(s)}
              </span>

              <button
                type="button"
                onClick={() => {
                  setViewStudent(s);
                  setViewOpen(true);
                }}
                className={rowButton("neutral")}
              >
                <EyeIcon className="h-5 w-5" />
                View details
              </button>
            </StudentRow>
          ))
        )}
      </div>

      <ViewDetailsModal
        open={viewOpen}
        student={viewStudent}
        currentDepartment="library_staff"
        onClose={() => {
          setViewOpen(false);
          setViewStudent(null);
        }}
      />
    </div>
  );
}