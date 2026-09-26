/**
 * RejectedRequests.jsx — shared "Requests On Hold" list: search, select, View details and
 * "Move to Approved" (the backend only allows it once the step's prerequisites are approved).
 */

import { useMemo, useState } from "react";
import { EyeIcon, ArrowUturnLeftIcon } from "@heroicons/react/24/outline";
import StudentRow from "./StudentRow";
import { rowButton } from "./rowButton";

export default function RejectedRequests({
  title = "Requests On Hold",
  data = [],
  onMoveToApproved,
  onMoveToApprovedSelected,
  onView,
}) {
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  const canMoveToApproved = !!onMoveToApproved || !!onMoveToApprovedSelected;
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

    if (onMoveToApprovedSelected) {
      onMoveToApprovedSelected(selectedStudents);
    } else {
      selectedStudents.forEach((student) => onMoveToApproved?.(student));
    }

    setSelectedIds([]);
  };

  return (
    <div className="mx-auto w-full max-w-7xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-white">{title}</h1>
        <p className="mt-1 text-sm text-white/60">Rejected students list.</p>
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

              {canMoveToApproved && (
                <button
                  type="button"
                  onClick={handleApproveSelected}
                  disabled={selectedIds.length === 0}
                  className="inline-flex items-center gap-2 rounded-xl border border-sky-400/40 px-4 py-2 text-sm font-medium text-sky-300 hover:bg-sky-500/10 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ArrowUturnLeftIcon className="h-5 w-5" />
                  Approve Selected
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="space-y-4">
        {filteredData.length === 0 ? (
          <EmptyState
            text={validData.length === 0 ? "No requests on hold" : "No matching students found"}
          />
        ) : (
          filteredData.map((s, idx) => (
            <Row
              key={s.id || `${s.roll}-${idx}`}
              idx={idx}
              s={s}
              isSelected={selectedIds.includes(s.id)}
              onToggleSelect={toggleSelectOne}
              onMoveToApproved={onMoveToApproved}
              onView={onView}
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
  onMoveToApproved,
  onView,
}) {
  return (
    <StudentRow idx={idx} s={s} isSelected={isSelected} onToggleSelect={onToggleSelect}>
      <button type="button" onClick={() => onView?.(s)} className={rowButton("neutral")}>
        <EyeIcon className="h-5 w-5" />
        View details
      </button>

      {onMoveToApproved && (
        <button type="button" onClick={() => onMoveToApproved?.(s)} className={rowButton("sky")}>
          <ArrowUturnLeftIcon className="h-5 w-5" />
          Move to Approved
        </button>
      )}
    </StudentRow>
  );
}

function EmptyState({ text }) {
  return (
    <div className="rounded-2xl border border-white/15 bg-white/5 p-8 text-center text-white">
      <p className="text-lg font-semibold">{text}</p>
      <p className="mt-1 text-sm text-white/60">Nothing here yet.</p>
    </div>
  );
}