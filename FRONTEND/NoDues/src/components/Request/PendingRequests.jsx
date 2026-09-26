/**
 * PendingRequests.jsx — shared "Pending" list used by every department.
 * Search, select-all + "Approve Selected", and one StudentRow per student with Approve / Put On Hold /
 * View details (labels and extra buttons are configurable, e.g. Library Staff's "Move to Librarian").
 */

import { useMemo, useState } from "react";
import {
  CheckCircleIcon,
  EyeIcon,
  XCircleIcon,
  AdjustmentsHorizontalIcon,
  ArrowUpRightIcon,
} from "@heroicons/react/24/outline";
import StudentRow from "./StudentRow";
import { rowButton } from "./rowButton";

export default function PendingRequests({
  title = "Pending Requests",
  data = [],
  onApprove,
  onApproveSelected,
  onReject,
  onView,

  approveLabel = "Approve",
  approveIcon = "check",
  showApprove = true,

  rejectLabel = "Put On Hold",
  showReject = true,

  extraActionLabel = "",
  extraActionIcon = "partial",
  onExtraAction,
}) {
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);

  const validData = data.filter((s) => s && s.id && s.name && s.roll);

  const filteredData = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return validData;

    return validData.filter((s) => {
      const name = s.name?.toLowerCase() || "";
      const email = s.email?.toLowerCase() || "";
      const roll = s.roll?.toLowerCase() || "";

      return (
        name.includes(query) ||
        email.includes(query) ||
        roll.includes(query)
      );
    });
  }, [validData, search]);

  const visibleIds = filteredData.map((s) => s.id);
  const allVisibleSelected =
    visibleIds.length > 0 && visibleIds.every((id) => selectedIds.includes(id));

  const toggleSelectAll = () => {
    if (allVisibleSelected) {
      setSelectedIds((prev) => prev.filter((id) => !visibleIds.includes(id)));
      return;
    }

    setSelectedIds((prev) => [...new Set([...prev, ...visibleIds])]);
  };

  const toggleSelectOne = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleApproveSelected = () => {
    const selectedStudents = filteredData.filter((s) => selectedIds.includes(s.id));

    if (onApproveSelected) {
      onApproveSelected(selectedStudents);
    } else {
      selectedStudents.forEach((student) => onApprove?.(student));
    }

    setSelectedIds([]);
  };

  return (
    <div className="mx-auto w-full max-w-7xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-white">{title}</h1>
        <p className="mt-1 text-sm text-white/60">
          Review and take action on pending student clearance requests.
        </p>
      </div>

      <div className="mb-6 space-y-4">
        <input
          type="text"
          placeholder="Search by name, email or roll number"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setSelectedIds([]);
          }}
          className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white placeholder:text-white/35 outline-none focus:border-blue-500"
        />

        {filteredData.length > 0 && (
          <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-4 md:flex-row md:items-center md:justify-between">
            <label className="inline-flex items-center gap-3 text-sm text-white/80">
              <input
                type="checkbox"
                checked={allVisibleSelected}
                onChange={toggleSelectAll}
                className="h-4 w-4 rounded border-white/20 bg-transparent"
              />
              Select all visible students
            </label>

            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm text-white/60">
                {selectedIds.length} selected
              </span>

              {showApprove && (
                <button
                  type="button"
                  onClick={handleApproveSelected}
                  disabled={selectedIds.length === 0}
                  className="inline-flex items-center gap-2 rounded-xl border border-emerald-400/40 px-4 py-2 text-sm font-medium text-emerald-300 hover:bg-emerald-500/10 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <CheckCircleIcon className="h-5 w-5" />
                  Approve Selected
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="space-y-4">
        {filteredData.length === 0 ? (
          <EmptyState text={validData.length === 0 ? "No pending requests" : "No matching students found"} />
        ) : (
          filteredData.map((s, idx) => (
            <Row
              key={s.id || `${s.roll}-${idx}`}
              idx={idx}
              s={s}
              isSelected={selectedIds.includes(s.id)}
              onToggleSelect={toggleSelectOne}
              onApprove={onApprove}
              onReject={onReject}
              onView={onView}
              approveLabel={approveLabel}
              approveIcon={approveIcon}
              showApprove={showApprove}
              rejectLabel={rejectLabel}
              showReject={showReject}
              extraActionLabel={extraActionLabel}
              extraActionIcon={extraActionIcon}
              onExtraAction={onExtraAction}
            />
          ))
        )}
      </div>
    </div>
  );
}

function Row({
  idx,
  s,
  isSelected,
  onToggleSelect,
  onApprove,
  onReject,
  onView,
  approveLabel,
  approveIcon,
  showApprove,
  rejectLabel,
  showReject,
  extraActionLabel,
  extraActionIcon,
  onExtraAction,
}) {
  const ApproveIcon = approveIcon === "send" ? ArrowUpRightIcon : CheckCircleIcon;
  const ExtraIcon =
    extraActionIcon === "partial"
      ? AdjustmentsHorizontalIcon
      : AdjustmentsHorizontalIcon;

  return (
    <StudentRow idx={idx} s={s} isSelected={isSelected} onToggleSelect={onToggleSelect} wide>
      {showApprove && (
        <button type="button" onClick={() => onApprove?.(s)} className={rowButton("green")}>
          <ApproveIcon className="h-5 w-5" />
          {approveLabel}
        </button>
      )}

      {extraActionLabel && (
        <button type="button" onClick={() => onExtraAction?.(s)} className={rowButton("neutral")}>
          <ExtraIcon className="h-5 w-5" />
          {extraActionLabel}
        </button>
      )}

      {showReject && (
        <button type="button" onClick={() => onReject?.(s)} className={rowButton("red")}>
          <XCircleIcon className="h-5 w-5" />
          {rejectLabel}
        </button>
      )}

      <button type="button" onClick={() => onView?.(s)} className={rowButton("neutral")}>
        <EyeIcon className="h-5 w-5" />
        View details
      </button>
    </StudentRow>
  );
}

function EmptyState({ text }) {
  return (
    <div className="rounded-2xl border border-white/15 bg-white/5 p-8 text-center text-white">
      <p className="text-lg font-semibold">{text}</p>
      <p className="mt-1 text-sm text-white/60">You are all caught up.</p>
    </div>
  );
}
