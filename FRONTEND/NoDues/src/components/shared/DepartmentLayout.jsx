/**
 * DepartmentLayout — single shared layout component used by ALL departments.
 *
 * Usage:
 *   <DepartmentLayout role="medical" unitCodes={["medical"]} title="Medical Officer" />
 *
 * Props:
 *   role       – role string for the Header component
 *   unitCodes  – array of unit codes this department manages
 *   title      – department display title
 *   basePath   – (optional) base route path for Header
 *   pendingCountFilter – (optional) predicate; when given, the header badge counts only matching pending rows
 */

import { Outlet, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import Header from "../Header/Header";
import useDepartmentData from "../hooks/useDepartmentData";

export default function DepartmentLayout({ role, unitCodes, title, basePath, headerPaths, headerLabels, pendingCountFilter, children }) {
    const navigate = useNavigate();
    const {
        pending, approved, rejected,
        isLoading, error,
        refresh,
        approveStudent, rejectStudent, bulkApproveStudents,
        moveApprovedToRejected, moveRejectedToApproved,
    } = useDepartmentData(unitCodes);

    // Redirect on auth failure
    useEffect(() => {
        if (error && (error.includes("401") || error.includes("403") || error.includes("Not authorized"))) {
            navigate("/");
        }
    }, [error, navigate]);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-neutral-900 flex items-center justify-center">
                <div className="flex flex-col items-center gap-3 text-white/50">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                    <p className="text-sm">Loading {title || "department"} dashboard…</p>
                </div>
            </div>
        );
    }
    const contextData = {
        unitCodes,
        title,
        pending,
        approved,
        rejected,
        isLoading,
        refresh,
        approveStudent,
        rejectStudent,
        bulkApproveStudents,
        moveApprovedToRejected,
        moveRejectedToApproved,
    };

    return (
        <div className="min-h-screen bg-neutral-900 text-white">
            <Header
                role={role}
                basePath={basePath}
                pendingCount={pendingCountFilter ? pending.filter(pendingCountFilter).length : pending.length}
                paths={headerPaths}
                labels={headerLabels}
            />

            {error && (
                <div className="mx-auto max-w-7xl px-6 pt-4">
                    <div className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                        {error} —{" "}
                        <button onClick={refresh} className="underline hover:no-underline">Retry</button>
                    </div>
                </div>
            )}

            <main className="mx-auto max-w-7xl px-6 py-8">
                {children ? children(contextData) : <Outlet context={contextData} />}
            </main>
        </div>
    );
}
