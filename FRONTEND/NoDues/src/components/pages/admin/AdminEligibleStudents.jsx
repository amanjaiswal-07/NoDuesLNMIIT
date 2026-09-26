/**
 * AdminEligibleStudents.jsx — manage who may apply (/admin/eligible-students): add / edit / remove
 * students, select and bulk-remove, and import a CSV (rows with an unknown branch or duplicates are
 * skipped and listed in the result message).
 */

import { useRef, useState, useEffect } from "react";
import Papa from "papaparse";
import { ArrowDownTrayIcon, ArrowUpTrayIcon } from "@heroicons/react/24/outline";
import AddEligibleStudentModal from "../../Modal/AddEligibleStudentModal";
import RemoveEligibleStudentModal from "../../Modal/RemoveEligibleStudentModal";
import EditEligibleStudentModal from "../../Modal/EditEligibleStudentModal";
import BulkRemoveEligibleStudentModal from "../../Modal/BulkRemoveEligibleStudentModal";
import api from "../../../api/client";

export default function AdminEligibleStudents() {
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [showBulkRemoveModal, setShowBulkRemoveModal] = useState(false);

  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedRows, setSelectedRows] = useState([]);

  const [message, setMessage] = useState("");
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    rollNo: "",
    branch: "",
  });

  const fetchStudents = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/admin/eligible-students');
      setStudents(res.data.students || []);
      setSelectedRows([]); // Clear selections on fetch
    } catch (err) {
      console.error('Error fetching students:', err);
      setMessage(err.response?.data?.error || 'Failed to load students');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const filteredStudents = students.filter((student) => {
    const query = search.toLowerCase();
    return (
      student.name.toLowerCase().includes(query) ||
      student.email.toLowerCase().includes(query) ||
      student.rollNo.toLowerCase().includes(query) ||
      student.branch.toLowerCase().includes(query)
    );
  });

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedRows(filteredStudents.map(s => s._id));
    } else {
      setSelectedRows([]);
    }
  };

  const handleSelectRow = (id) => {
    setSelectedRows(prev =>
      prev.includes(id) ? prev.filter(rowId => rowId !== id) : [...prev, id]
    );
  };

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      rollNo: "",
      branch: "",
    });
    setSelectedStudent(null);
  };

  const openAddModal = () => {
    resetForm();
    setShowAddModal(true);
  };

  const closeAddModal = () => {
    setShowAddModal(false);
    resetForm();
  };

  const openEditModal = (student) => {
    setFormData({
      name: student.name,
      email: student.email,
      rollNo: student.rollNo,
      branch: student.branch,
    });
    setSelectedStudent(student);
    setShowEditModal(true);
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    resetForm();
  };

  const openRemoveModal = (student) => {
    setSelectedStudent(student);
    setShowRemoveModal(true);
  };

  const closeRemoveModal = () => {
    setSelectedStudent(null);
    setShowRemoveModal(false);
  };

  const openBulkRemoveModal = () => {
    if (selectedRows.length === 0) return;
    setShowBulkRemoveModal(true);
  };

  const closeBulkRemoveModal = () => {
    setShowBulkRemoveModal(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAddStudent = async (e) => {
    e.preventDefault();

    const trimmedName = formData.name.trim();
    const trimmedEmail = formData.email.trim().toLowerCase();
    const trimmedRollNo = formData.rollNo.trim();
    const trimmedBranch = formData.branch.trim().toUpperCase();

    if (!trimmedName || !trimmedEmail || !trimmedRollNo || !trimmedBranch) {
      setMessage("All fields are required.");
      return;
    }

    try {
      await api.post('/admin/eligible-students', {
        name: trimmedName,
        email: trimmedEmail,
        rollNo: trimmedRollNo,
        branch: trimmedBranch,
      });
      setMessage("Student added successfully.");
      closeAddModal();
      fetchStudents();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to add student');
    }
  };

  const handleEditStudent = async (e) => {
    e.preventDefault();
    if (!selectedStudent) return;

    const trimmedName = formData.name.trim();
    const trimmedEmail = formData.email.trim().toLowerCase();
    const trimmedRollNo = formData.rollNo.trim();
    const trimmedBranch = formData.branch.trim().toUpperCase();

    if (!trimmedName || !trimmedEmail || !trimmedRollNo || !trimmedBranch) {
      setMessage("All fields are required.");
      return;
    }

    try {
      await api.put(`/admin/eligible-students/${selectedStudent._id}`, {
        name: trimmedName,
        email: trimmedEmail,
        rollNo: trimmedRollNo,
        branch: trimmedBranch,
      });
      setMessage("Student updated successfully.");
      closeEditModal();
      fetchStudents();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update student');
    }
  };

  const handleRemoveStudent = async () => {
    if (!selectedStudent) return;

    try {
      await api.delete(`/admin/eligible-students/${selectedStudent._id}`);
      setMessage("Student removed successfully.");
      closeRemoveModal();
      fetchStudents();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to remove student');
      closeRemoveModal();
    }
  };

  const handleBulkRemoveStudents = async () => {
    if (selectedRows.length === 0) return;

    try {
      await api.delete('/admin/eligible-students/bulk', {
        data: { studentIds: selectedRows }
      });
      setMessage("Selected students removed successfully.");
      closeBulkRemoveModal();
      fetchStudents();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to bulk remove students');
      closeBulkRemoveModal();
    }
  };

  const handleCSVUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleCSVUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const parsedRows = results.data || [];

        const newStudents = [];

        parsedRows.forEach((row) => {
          const name = (row.Name || row.name || "").trim();
          const email = (row.Email || row.email || "").trim().toLowerCase();
          const rollNo = (row.RollNo || row.rollNo || row["Roll No"] || "").trim();
          const branch = (row.Branch || row.branch || "").trim().toUpperCase();

          if (!name || !email || !rollNo || !branch) return;

          newStudents.push({
            name,
            email,
            rollNo,
            branch,
          });
        });

        if (newStudents.length === 0) {
          setMessage("No new valid students found in CSV.");
        } else {
          try {
            const res = await api.post('/admin/eligible-students/bulk', { students: newStudents });
            const skippedLines = (res.data.skippedDetails || []).map(
              (s) => `• ${s.row?.rollNo || s.row?.email || "row"}: ${s.reason}`
            );
            setMessage(
              `${res.data.imported} students imported successfully. ${res.data.skipped} skipped.` +
              (skippedLines.length ? `\n${skippedLines.join("\n")}` : "")
            );
            fetchStudents();
          } catch (err) {
            setMessage(err.response?.data?.error || 'Bulk import failed');
          }
        }

        event.target.value = "";
      },
      error: () => {
        setMessage("Failed to read CSV file.");
        event.target.value = "";
      },
    });
  };

  const handleDownloadTemplate = () => {
    const csvContent =
      "Name,Email,RollNo,Branch\nAman Sharma,23uec513@lnmiit.ac.in,23UEC513,ECE";

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "eligible_students_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/5 p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-white">Eligible Students</h2>
            <p className="mt-1 text-sm text-white/60">
              Manage students who are allowed to apply for No Dues.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={openAddModal}
              className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500"
            >
              + Add Student
            </button>

            {selectedRows.length > 0 && (
              <button
                onClick={openBulkRemoveModal}
                className="rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500"
              >
                Remove Selected ({selectedRows.length})
              </button>
            )}

            <button
              onClick={handleCSVUploadClick}
              className="flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-sm text-white/80 hover:bg-white/10"
            >
              <ArrowUpTrayIcon className="h-5 w-5" />
              Upload CSV
            </button>

            <button
              onClick={handleDownloadTemplate}
              className="flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-sm text-white/80 hover:bg-white/10"
            >
              <ArrowDownTrayIcon className="h-5 w-5" />
              Download Template
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleCSVUpload}
              className="hidden"
            />
          </div>
        </div>

        {message && (
          <div className="whitespace-pre-line rounded-xl border border-blue-500/20 bg-blue-500/10 px-4 py-3 text-sm text-blue-300">
            {message}
          </div>
        )}
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <p className="text-sm text-white/60">Total Eligible Students</p>
          <p className="mt-3 text-3xl font-semibold text-white">{students.length}</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 md:col-span-3">
          <input
            type="text"
            placeholder="Search by name, email, roll no or branch"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white placeholder:text-white/35 outline-none focus:border-blue-500"
          />
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm text-white/80">
            <thead className="bg-white/5 text-xs uppercase tracking-wide text-white/50">
              <tr>
                <th className="px-5 py-4 w-12 text-center">
                  <input
                    type="checkbox"
                    checked={filteredStudents.length > 0 && selectedRows.length === filteredStudents.length}
                    onChange={handleSelectAll}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                </th>
                <th className="px-5 py-4">Name</th>
                <th className="px-5 py-4">Email</th>
                <th className="px-5 py-4">Roll No</th>
                <th className="px-5 py-4">Branch</th>
                <th className="px-5 py-4">Action</th>
              </tr>
            </thead>

            <tbody>
              {filteredStudents.map((student) => (
                <tr key={student._id} className="border-t border-white/10">
                  <td className="px-5 py-4 text-center">
                    <input
                      type="checkbox"
                      checked={selectedRows.includes(student._id)}
                      onChange={() => handleSelectRow(student._id)}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                  </td>
                  <td className="px-5 py-4">{student.name}</td>
                  <td className="px-5 py-4">{student.email}</td>
                  <td className="px-5 py-4">{student.rollNo}</td>
                  <td className="px-5 py-4">
                    <span className="rounded-lg bg-blue-500/10 px-3 py-1 text-xs text-blue-400">
                      {student.branch}
                    </span>
                  </td>
                  <td className="px-5 py-4 flex gap-2">
                    <button
                      onClick={() => openEditModal(student)}
                      className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-white/80 hover:bg-white/10"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => openRemoveModal(student)}
                      className="rounded-lg border border-red-400/20 px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/10"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}

              {filteredStudents.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-5 py-8 text-center text-sm text-white/50">
                    {isLoading ? "Loading students…" : "No eligible students found."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <AddEligibleStudentModal
        isOpen={showAddModal}
        formData={formData}
        onChange={handleChange}
        onClose={closeAddModal}
        onSubmit={handleAddStudent}
      />

      <EditEligibleStudentModal
        isOpen={showEditModal}
        formData={formData}
        onChange={handleChange}
        onClose={closeEditModal}
        onSubmit={handleEditStudent}
      />

      <RemoveEligibleStudentModal
        isOpen={showRemoveModal}
        student={selectedStudent}
        onClose={closeRemoveModal}
        onConfirm={handleRemoveStudent}
      />

      <BulkRemoveEligibleStudentModal
        isOpen={showBulkRemoveModal}
        selectedCount={selectedRows.length}
        onClose={closeBulkRemoveModal}
        onConfirm={handleBulkRemoveStudents}
      />
    </div>
  );
}