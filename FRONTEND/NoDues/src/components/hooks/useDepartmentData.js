/**
 * useDepartmentData — shared hook for every department dashboard.
 *
 * All departments call the SAME backend endpoints:
 *   GET  /clearance/pending?unitCode=<code>
 *   GET  /clearance/approved?unitCode=<code>
 *   GET  /clearance/rejected?unitCode=<code>
 *   POST /clearance/:stepId/approve
 *   POST /clearance/:stepId/reject    { reason }
 *   POST /clearance/bulk-approve      { stepIds: [...] }
 *
 * For departments with multiple unit codes (e.g. labs, HOD groups),
 * fetch is run in parallel for each code and results merged.
 *
 * @param {string | string[]} unitCodes - single code or array of codes this dept manages
 */

import { useState, useEffect, useCallback } from "react";
import api from "../../api/client";

export default function useDepartmentData(unitCodes) {
    const codes = Array.isArray(unitCodes) ? unitCodes : [unitCodes];

    const [pending, setPending] = useState([]);
    const [approved, setApproved] = useState([]);
    const [rejected, setRejected] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");

    /** Flatten a step from the backend into the flat object used by existing UI components */
    const flattenStep = (step, unitCode) => {
        const req = step.requestId || {};
        return {
            // Step identity — both id and stepId for backward compat
            id: step._id,           // used by PendingRequests checkbox (s.id)
            stepId: step._id,       // used by useDepartmentData actions

            unitCode: step.unitCode || unitCode,
            unitLabel: step.unitLabel || unitCode,
            unitGroup: step.unitGroup || null,

            // Request identity (NoDuesRequest fields populated by backend)
            requestId: req._id || req,
            studentName: req.studentName || "—",
            rollNo: req.rollNo || "—",
            studentEmail: req.studentEmail || "—",
            branch: req.branch || "—",
            hostel: req.hostel || "—",
            placementStatus: req.placementStatus || "—",

            // Step state
            status: step.status,
            rejectionReason: step.rejectionReason || "",
            studentReply: step.studentReply || "",
            actionBy: step.actionBy || "",
            actionAt: step.actionAt || null,

            // Library staff only: what the Librarian did with the forwarded request
            librarianStatus: step.librarianStatus || null,
            librarianReason: step.librarianReason || "",

            // Backwards-compat flat fields used by existing UI components
            name: req.studentName || "—",
            roll: req.rollNo || "—",
            email: req.studentEmail || "—",
        };
    };

    const fetchAll = useCallback(async () => {
        try {
            setIsLoading(true);
            setError("");

            // Fetch pending, approved, rejected for ALL unit codes in parallel
            const fetchForCode = async (code) => {
                const [pRes, aRes, rRes] = await Promise.all([
                    api.get(`/clearance/pending?unitCode=${code}`),
                    api.get(`/clearance/approved?unitCode=${code}`),
                    api.get(`/clearance/rejected?unitCode=${code}`),
                ]);
                return {
                    pending: (pRes.data.steps || []).filter((s) => s.requestId).map((s) => flattenStep(s, code)),
                    approved: (aRes.data.steps || []).filter((s) => s.requestId).map((s) => flattenStep(s, code)),
                    rejected: (rRes.data.steps || []).filter((s) => s.requestId).map((s) => flattenStep(s, code)),
                };
            };

            const results = await Promise.all(codes.map(fetchForCode));

            // Merge results from all codes
            setPending(results.flatMap((r) => r.pending));
            setApproved(results.flatMap((r) => r.approved));
            setRejected(results.flatMap((r) => r.rejected));
        } catch (err) {
            console.error("useDepartmentData fetch error:", err);
            setError(err.response?.data?.error || "Failed to load requests.");
        } finally {
            setIsLoading(false);
        }
    }, [codes.join(",")]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => { fetchAll(); }, [fetchAll]);

    /** Run an action; if the server refuses it, tell the user why, then reload the lists */
    const runAction = useCallback(async (label, call) => {
        try {
            await call();
        } catch (err) {
            window.alert(`${label}: ${err.response?.data?.error || "Something went wrong. Please try again."}`);
        } finally {
            await fetchAll();
        }
    }, [fetchAll]);

    /** Approve a single step */
    const approveStep = useCallback((item) =>
        runAction(`Could not approve ${item.name || "this request"}`, () =>
            api.post(`/clearance/${item.stepId}/approve`)),
    [runAction]);

    /** Approve multiple steps at once */
    const bulkApprove = useCallback((items) =>
        runAction("Could not approve the selected requests", () =>
            api.post("/clearance/bulk-approve", { stepIds: items.map((i) => i.stepId) })),
    [runAction]);

    /** Reject a single step with a reason, description, and optional restartFrom array */
    const rejectStep = useCallback((item, reason, description, restartFrom) =>
        runAction(`Could not put ${item.name || "this request"} on hold`, () =>
            api.post(`/clearance/${item.stepId}/reject`, { reason, description, restartFrom: restartFrom || [] })),
    [runAction]);

    return {
        pending,
        approved,
        rejected,
        isLoading,
        error,
        refresh: fetchAll,
        // Expose as the names that existing department child pages expect
        approveStudent: approveStep,
        rejectStudent: rejectStep,
        bulkApproveStudents: bulkApprove,
        moveApprovedToRejected: rejectStep,
        moveRejectedToApproved: approveStep,
    };
}
