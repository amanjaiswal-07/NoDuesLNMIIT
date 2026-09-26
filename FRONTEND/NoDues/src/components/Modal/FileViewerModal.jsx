/**
 * FileViewerModal.jsx — lets a student view their own uploaded documents on the Profile page (details below).
 */

import { useState, useEffect, useCallback, useRef } from "react";
import api from "../../api/client";

/**
 * FileViewerModal — in-app viewer for images and PDFs.
 * Files fetched via backend proxy; Cloudinary URLs never reach the browser.
 *
 * Props:
 *   fieldName  – "idCardFile" | "btpReportFile" | etc.
 *   label      – modal header text
 *   version    – change to force re-fetch after re-upload (pass existingUrl string)
 *   onClose    – dismiss callback
 */
export default function FileViewerModal({ fieldName, label, version, onClose }) {
    const [objectUrl, setObjectUrl] = useState(null);
    const [contentType, setContentType] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const objectUrlRef = useRef(null);

    const fetchFile = useCallback(async () => {
        try {
            setLoading(true);
            setError("");
            // ?v= busts server/browser cache after a re-upload
            const bust = version ? encodeURIComponent(version) : Date.now();
            const res = await api.get(`/student/file/${fieldName}?v=${bust}`, {
                responseType: "blob",
            });
            const blob = res.data;
            const type = res.headers["content-type"] || blob.type || "application/octet-stream";
            setContentType(type);
            const url = URL.createObjectURL(blob);
            objectUrlRef.current = url;
            setObjectUrl(url);
        } catch (err) {
            console.error("FileViewerModal:", err);
            setError(err.response?.data?.error || "Failed to load file. Please try again.");
        } finally {
            setLoading(false);
        }
    }, [fieldName, version]);

    useEffect(() => {
        fetchFile();
        return () => { if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current); };
    }, [fetchFile]);

    // Close on Escape
    useEffect(() => {
        const h = (e) => { if (e.key === "Escape") onClose(); };
        window.addEventListener("keydown", h);
        return () => window.removeEventListener("keydown", h);
    }, [onClose]);

    const isImage = contentType.startsWith("image/");
    const isPdf = contentType === "application/pdf";

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div className="relative flex w-full max-w-4xl flex-col rounded-2xl border border-white/15 bg-neutral-900 shadow-2xl" style={{ maxHeight: "90vh" }}>

                {/* Header */}
                <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
                    <h3 className="text-base font-semibold text-white">{label || "File Viewer"}</h3>
                    <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg text-white/60 hover:bg-white/10 hover:text-white transition-colors" aria-label="Close">✕</button>
                </div>

                {/* Content */}
                <div className="flex flex-1 items-center justify-center overflow-auto p-4" style={{ minHeight: "300px" }}>

                    {loading && (
                        <div className="flex flex-col items-center gap-3 text-white/60">
                            <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                            <p className="text-sm">Loading file…</p>
                        </div>
                    )}

                    {error && !loading && (
                        <div className="rounded-xl border border-red-400/30 bg-red-500/10 p-6 text-center">
                            <p className="text-sm font-medium text-red-200">{error}</p>
                            <button onClick={fetchFile} className="mt-3 rounded-lg bg-red-600/30 px-4 py-2 text-xs font-medium text-red-200 hover:bg-red-600/50">Retry</button>
                        </div>
                    )}

                    {!loading && !error && objectUrl && (
                        <>
                            {isImage && <img src={objectUrl} alt={label} className="max-h-[70vh] max-w-full rounded-lg object-contain border border-white/10" />}
                            {isPdf && <iframe src={objectUrl} title={label} className="h-[70vh] w-full rounded-lg border border-white/10 bg-white" />}
                            {!isImage && !isPdf && (
                                <div className="rounded-xl border border-amber-400/30 bg-amber-500/10 p-6 text-center">
                                    <p className="text-sm font-medium text-amber-200">Preview not available for this file type ({contentType}).</p>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="flex justify-end border-t border-white/10 px-6 py-3">
                    <button onClick={onClose} className="rounded-xl bg-white/10 px-5 py-2 text-sm font-medium text-white hover:bg-white/20">Close</button>
                </div>
            </div>
        </div>
    );
}
