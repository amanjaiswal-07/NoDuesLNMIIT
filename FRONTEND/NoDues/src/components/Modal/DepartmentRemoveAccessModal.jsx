/**
 * DepartmentRemoveAccessModal.jsx — confirmation before removing someone from this department's access list.
 */

export default function DepartmentRemoveAccessModal({
  isOpen,
  user,
  onClose,
  onConfirm,
}) {
  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-neutral-900 p-6 shadow-2xl">
        <h3 className="text-xl font-semibold text-white">Remove Access</h3>

        <p className="mt-3 text-sm leading-6 text-white/65">
          Are you sure you want to remove access for{" "}
          <span className="font-medium text-white">{user.name}</span>
          {" "}({user.email})?
        </p>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-white/10 px-4 py-2 text-sm text-white/75 hover:bg-white/10"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onConfirm}
            className="rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-400 hover:bg-red-500/20"
          >
            Remove
          </button>
        </div>
      </div>
    </div>
  );
}