/**
 * ConfirmModal.jsx — generic "Are you sure?" dialog (title, message, confirm/cancel) used before
 * approvals and other actions.
 */

import { XMarkIcon } from "@heroicons/react/24/outline";

export default function ConfirmModal({
  open,
  title = "Confirm action",
  message = "Are you sure you want to continue?",
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onClose,
}) {
  if (!open) return null;

  const handleBackdrop = (e) => {
    // close when clicking backdrop
    if (e.target === e.currentTarget) onClose?.();
  };

  return (
    <div
      onClick={handleBackdrop}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4"
    >
      <div className="w-full max-w-md rounded-2xl border border-white/15 bg-neutral-900 text-white shadow-xl">
        <div className="flex items-start justify-between border-b border-white/10 p-5">
          <div>
            <h3 className="text-lg font-semibold">{title}</h3>
            <p className="mt-1 text-sm text-white/70">{message}</p>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-2 text-white/70 hover:bg-white/10 hover:text-white"
            aria-label="Close"
            type="button"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="flex items-center justify-end gap-3 p-5">
          <button
            onClick={onClose}
            type="button"
            className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-white hover:bg-white/10"
          >
            {cancelText}
          </button>

          <button
            onClick={onConfirm}
            type="button"
            className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
