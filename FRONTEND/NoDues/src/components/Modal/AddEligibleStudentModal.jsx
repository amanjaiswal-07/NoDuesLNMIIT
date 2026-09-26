/**
 * AddEligibleStudentModal.jsx — admin dialog to add one student to the eligible list (name, email,
 * roll number, branch from the fixed CSE / ECE / CCE / MECH list).
 */

import { BRANCHES } from "../../config/branches";

export default function AddEligibleStudentModal({
  isOpen,
  formData,
  onChange,
  onClose,
  onSubmit,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
      <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-neutral-900 p-6 shadow-2xl">
        <div className="mb-6">
          <h3 className="text-xl font-semibold text-white">Add Eligible Student</h3>
          <p className="mt-1 text-sm text-white/55">
            Add a student who is allowed to apply for No Dues.
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="mb-2 block text-sm text-white/70">Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={onChange}
              placeholder="Enter student name"
              className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white placeholder:text-white/35 outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm text-white/70">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={onChange}
              placeholder="Enter LNMIIT email"
              className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white placeholder:text-white/35 outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm text-white/70">Roll No</label>
            <input
              type="text"
              name="rollNo"
              value={formData.rollNo}
              onChange={onChange}
              placeholder="Enter roll number"
              className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white placeholder:text-white/35 outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm text-white/70">Branch</label>
            <select
              name="branch"
              value={formData.branch}
              onChange={onChange}
              className="w-full rounded-xl border border-white/10 bg-neutral-900 px-4 py-3 text-sm text-white outline-none focus:border-blue-500"
            >
              <option value="">Select branch</option>
              {BRANCHES.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-white/10 px-4 py-2 text-sm text-white/75 hover:bg-white/10"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500"
            >
              Save Student
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}