/**
 * RejectModal.jsx — the "Put On Hold" dialog used by every department: reason, mandatory details
 * (shown to the student) and, for HOD / NAD / Store / Accounts, which departments to reset on reapply.
 */

import { useState } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";

/**
 * RejectModal — enhanced with:
 *   1. A mandatory description textarea (always shown)
 *   2. An optional dependency multi-select for HOD / NAD / Store / Accounts
 *
 * Props:
 *   open              — boolean
 *   student           — { name, roll } from the list
 *   onClose           — () => void
 *   onConfirm         — (reason, description, restartFrom[]) => void
 *   reasons           — [{ value, label, requiresText? }]  (department-specific)
 *   placeholder       — string for the description textarea
 *   title             — modal title string
 *   confirmText       — confirm button label
 *   dependencyOptions — null | [{ value: unitCode, label: string }]
 *                       When non-null, shows a multi-select panel for HOD / NAD / etc.
 */
export default function RejectModal(props) {
  if (!props.open) return null;
  // Mounted fresh each time it opens (or the student changes), so the form always starts empty
  return <RejectModalBody key={props.student?.id ?? props.student?.stepId ?? "none"} {...props} />;
}

function RejectModalBody({
  student,
  onClose,
  onConfirm,
  reasons = [
    { value: "misc", label: "Miscellaneous" },
  ],
  placeholder = "Describe the issue in detail (mandatory)…",
  title = "Put Request On Hold",
  confirmText = "Confirm Hold",
  dependencyOptions = null,   // e.g. [{ value: 'cse_lab_1', label: 'CSE Lab 1' }, ...]
  dependenciesRequired = true, // set false to make dep selection optional (e.g. HOD)
}) {
  const [selected, setSelected] = useState("");
  const [description, setDescription] = useState("");
  const [restartFrom, setRestartFrom] = useState([]);
  const [error, setError] = useState("");


  const hasDepOptions = dependencyOptions && dependencyOptions.length > 0;
  const canConfirm = selected !== "" && description.trim().length > 0
    && (!hasDepOptions || !dependenciesRequired || restartFrom.length > 0);

  const toggleDep = (value) => {
    setRestartFrom(prev =>
      prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]
    );
  };

  const handleConfirm = () => {
    if (!selected) {
      setError("Please select a reason.");
      return;
    }
    if (!description.trim()) {
      setError("Please provide a description.");
      return;
    }
    const reasonLabel = reasons.find(r => r.value === selected)?.label || selected;
    onConfirm(reasonLabel, description.trim(), restartFrom);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop — no click-to-close */}
      <div className="absolute inset-0 bg-black/70" />

      <div className="relative w-[92%] max-w-lg rounded-2xl border border-white/15 bg-neutral-900 p-6 text-white shadow-xl">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">{title}</h2>
            {student && (
              <p className="mt-1 text-sm text-white/60">
                {student.name} ({student.roll})
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 hover:bg-white/10"
            aria-label="Close"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-5 space-y-4">
          {/* Reason dropdown */}
          <div>
            <label className="block text-sm text-white/80">Reason <span className="text-rose-400">*</span></label>
            <select
              value={selected}
              onChange={(e) => { setSelected(e.target.value); setError(""); }}
              className="mt-2 w-full rounded-xl border border-white/15 bg-neutral-950 px-4 py-3 text-sm text-white outline-none focus:border-blue-500"
            >
              <option value="">Select reason…</option>
              {reasons.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>

          {/* Description — always mandatory */}
          <div>
            <label className="block text-sm text-white/80">Description <span className="text-rose-400">*</span></label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => { setDescription(e.target.value); setError(""); }}
              placeholder={placeholder}
              className="mt-2 w-full resize-none rounded-xl border border-white/15 bg-neutral-950 px-4 py-3 text-sm text-white outline-none focus:border-blue-500"
            />
          </div>

          {dependencyOptions && dependencyOptions.length > 0 && (
            <div>
              <label className="block text-sm text-white/80">
                Select department(s) to reset on reapply{" "}
                {dependenciesRequired
                  ? <span className="text-rose-400">*</span>
                  : <span className="text-white/40">(optional)</span>
                }
              </label>
              <div className="mt-2 max-h-44 space-y-1 overflow-y-auto rounded-xl border border-white/15 bg-neutral-950 p-3">
                {dependencyOptions.map((dep) => (
                  <label
                    key={dep.value}
                    className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-white/5"
                  >
                    <input
                      type="checkbox"
                      checked={restartFrom.includes(dep.value)}
                      onChange={() => toggleDep(dep.value)}
                      className="h-4 w-4 accent-rose-500"
                    />
                    <span className="text-sm text-white/80">{dep.label}</span>
                  </label>
                ))}
              </div>
              {restartFrom.length === 0 ? (
                dependenciesRequired
                  ? <p className="mt-1.5 text-xs text-rose-300">⚠ You must select at least one department to reset.</p>
                  : <p className="mt-1.5 text-xs text-white/40">No departments selected — HOD will go directly back to pending on reapply.</p>
              ) : (
                <p className="mt-1.5 text-xs text-amber-300">
                  {restartFrom.length} department(s) will be reset to pending on reapply.
                </p>
              )}
            </div>
          )}

          {error && <p className="text-sm text-rose-300">{error}</p>}
        </div>

        {/* Actions */}
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-white/15 px-4 py-2 text-sm text-white/90 hover:bg-white/10"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!canConfirm}
            className={`rounded-xl border px-4 py-2 text-sm font-medium transition ${canConfirm
              ? "border-rose-400/40 text-rose-300 hover:bg-rose-500/10"
              : "cursor-not-allowed border-white/10 text-white/30"
              }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
