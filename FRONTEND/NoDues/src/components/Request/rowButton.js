/** Shared button look for row actions (compact on phones). */
export const rowButton = (tone) => {
  const tones = {
    green: "border-emerald-400/40 text-emerald-300 hover:bg-emerald-500/10",
    red: "border-rose-400/40 text-rose-300 hover:bg-rose-500/10",
    amber: "border-amber-400/40 text-amber-300 hover:bg-amber-500/10",
    sky: "border-sky-400/40 text-sky-300 hover:bg-sky-500/10",
    neutral: "border-white/20 text-white/90 hover:bg-white/10",
  };
  return `inline-flex items-center gap-1.5 whitespace-nowrap rounded-xl border px-3 py-2 text-sm font-medium sm:gap-2 sm:px-4 ${tones[tone]}`;
};
