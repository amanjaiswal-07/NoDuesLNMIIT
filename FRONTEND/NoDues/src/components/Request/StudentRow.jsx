/**
 * StudentRow — one student in a department's Pending / Approved / On Hold list.
 *
 * Phones & tablets: checkbox + number + name, then roll & email underneath, then the
 * action buttons on their own wrapping line. Wide screens: everything on one line.
 *
 * `wide` is for lists with many buttons (Pending): they only go single-line on xl screens.
 * Leave out `onToggleSelect` for lists without selection checkboxes.
 */
export default function StudentRow({ idx, s, isSelected, onToggleSelect, wide = false, children }) {
  const row = wide
    ? "xl:flex-row xl:items-center xl:gap-4"
    : "lg:flex-row lg:items-center lg:gap-4";
  const info = wide
    ? "xl:grid-cols-[minmax(0,1.2fr)_120px_minmax(0,1.4fr)] xl:items-center xl:gap-4"
    : "lg:grid-cols-[minmax(0,1.2fr)_120px_minmax(0,1.4fr)] lg:items-center lg:gap-4";
  const actions = wide
    ? "xl:ml-auto xl:shrink-0 xl:flex-nowrap xl:pl-0"
    : "lg:ml-auto lg:shrink-0 lg:flex-nowrap lg:pl-0";

  return (
    <div className={`flex flex-col gap-3 rounded-2xl border border-white/15 bg-white/5 px-4 py-4 text-white shadow-sm sm:px-5 ${row}`}>
      <div className="flex min-w-0 flex-1 items-start gap-3">
        {onToggleSelect && (
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onToggleSelect(s.id)}
            aria-label={`Select ${s.name}`}
            className="mt-1 h-4 w-4 shrink-0 rounded border-white/20 bg-transparent"
          />
        )}
        <span className="w-7 shrink-0 pt-px text-white/60">{idx + 1}.</span>
        <div className={`grid min-w-0 flex-1 gap-0.5 ${info}`}>
          <p className="truncate font-medium" title={s.name}>{s.name}</p>
          <p className="text-sm text-white/70">{s.roll}</p>
          <p className="truncate text-sm text-white/60" title={s.email}>{s.email}</p>
        </div>
      </div>

      <div className={`flex flex-wrap items-center gap-2 ${onToggleSelect ? "pl-[3.25rem]" : "pl-10"} ${actions}`}>
        {children}
      </div>
    </div>
  );
}
