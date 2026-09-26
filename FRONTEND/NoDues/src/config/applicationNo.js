/**
 * Readable application number shown to students and staff, e.g. "ND-2026-23UEC513".
 * New requests store it (applicationNo); older ones are derived from year + roll number.
 */
export function applicationNo(request) {
  if (!request) return "—";
  if (request.applicationNo) return request.applicationNo;
  const date = request.submittedAt || request.createdAt;
  const year = date ? new Date(date).getFullYear() : new Date().getFullYear();
  return request.rollNo ? `ND-${year}-${String(request.rollNo).toUpperCase()}` : "—";
}
