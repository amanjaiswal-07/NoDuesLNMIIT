/**
 * HostelGuard.jsx — shows "select a hostel first" instead of a list until the Warden has picked
 * a hostel on their dashboard.
 */

export default function HostelGuard({ selectedHostel, children }) {
  if (!selectedHostel) {
    return (
      <div className="rounded-2xl border border-white/15 bg-white/5 p-10 text-center text-white">
        <p className="text-lg font-semibold">Select hostel first</p>
        <p className="mt-1 text-sm text-white/60">
          Please select a hostel from the Warden dashboard to view requests.
        </p>
      </div>
    );
  }

  return children;
}
