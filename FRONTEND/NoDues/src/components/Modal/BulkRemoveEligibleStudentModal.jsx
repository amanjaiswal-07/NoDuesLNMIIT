/**
 * BulkRemoveEligibleStudentModal.jsx — confirmation before removing all selected students from the eligible list.
 */

import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";

export default function BulkRemoveEligibleStudentModal({
    isOpen,
    selectedCount,
    onClose,
    onConfirm,
}) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
            <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-neutral-900 p-6 shadow-2xl text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10">
                    <ExclamationTriangleIcon className="h-8 w-8 text-red-500" />
                </div>

                <h3 className="mb-2 text-xl font-semibold text-white">Remove Eligible Students</h3>
                <p className="mb-6 text-sm text-white/60">
                    Are you sure you want to remove the <strong>{selectedCount}</strong> selected students? They will no longer be able to log in or apply for No Dues. This action cannot be undone.
                </p>

                <div className="flex justify-center gap-3">
                    <button
                        onClick={onClose}
                        className="rounded-xl border border-white/10 px-5 py-2.5 text-sm font-medium text-white/70 hover:bg-white/10 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        className="rounded-xl bg-red-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-red-500 transition-colors"
                    >
                        Yes, Remove Them
                    </button>
                </div>
            </div>
        </div>
    );
}
