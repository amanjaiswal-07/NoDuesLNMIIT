import { useState, useEffect } from "react";
import api from "../../api/client";
import DepartmentAddAccessModal from "../Modal/DepartmentAddAccessModal";
import DepartmentRemoveAccessModal from "../Modal/DepartmentRemoveAccessModal";
import DepartmentEditAccessModal from "../Modal/DepartmentEditAccessModal";

// Mapping frontend routes to backend generic unitCodes for API calls
const getUnitCodeFromRoute = (route) => {
  const map = {
    '/medical': 'medical',
    '/sports': 'sports',
    '/lucs': 'lucs',
    '/warden': 'warden',
    '/placement': 'placement',
    '/administration': 'administration',
    '/library/staff': 'library_staff',
    '/library/librarian': 'library_librarian',
    '/store': 'store',
    '/nad': 'nad',
    '/accounts': 'accounts',
    '/hod/cse': 'hod_cse',
    '/hod/ece': 'hod_ece',
    '/hod/cce': 'hod_cce',
    '/hod/mech': 'hod_mech',
    '/labs/cse-cce': 'labs_cse_cce',
    '/labs/ece-cce': 'labs_ece_cce',
    '/labs/mech': 'labs_mech',
    '/labs/physics': 'labs_physics',
  };
  return map[route] || null;
};

export default function DepartmentAccessManager({ currentRoute }) {
  const [accessList, setAccessList] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
  });

  const unitCode = getUnitCodeFromRoute(currentRoute);

  const fetchAccessList = async () => {
    if (!unitCode) return;
    try {
      setIsLoading(true);
      // Fetch users who have this unitCode permission
      const res = await api.get(`/clearance/${unitCode}/access`);
      setAccessList(res.data.users || []);
    } catch (err) {
      console.error("Error fetching department access list:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAccessList();
  }, [currentRoute, unitCode]); // eslint-disable-line react-hooks/exhaustive-deps -- refetch only when the department changes

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
    });
    setEditingId(null);
  };

  const openAddModal = () => {
    resetForm();
    setShowAddModal(true);
  };

  const closeAddModal = () => {
    setShowAddModal(false);
    resetForm();
  };

  const openEditModal = (user) => {
    setFormData({
      name: user.name,
      email: user.email,
    });
    setEditingId(user._id);
    setShowEditModal(true);
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    resetForm();
  };

  const openRemoveModal = (user) => {
    setSelectedUser(user);
    setShowRemoveModal(true);
  };

  const closeRemoveModal = () => {
    setSelectedUser(null);
    setShowRemoveModal(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAddAccess = async (e) => {
    e.preventDefault();

    const trimmedName = formData.name.trim();
    const trimmedEmail = formData.email.trim().toLowerCase();

    if (!trimmedName || !trimmedEmail || !unitCode) return;

    try {
      await api.post(`/clearance/${unitCode}/access`, {
        name: trimmedName,
        email: trimmedEmail,
      });
      closeAddModal();
      fetchAccessList();
    } catch (err) {
      alert(err.response?.data?.error || "Failed to add access.");
    }
  };

  const handleEditAccess = async (e) => {
    e.preventDefault();

    const trimmedName = formData.name.trim();
    const trimmedEmail = formData.email.trim().toLowerCase();

    if (!trimmedName || !trimmedEmail || !unitCode || !editingId) return;

    try {
      await api.put(`/clearance/${unitCode}/access/${editingId}`, {
        name: trimmedName,
        email: trimmedEmail,
      });
      closeEditModal();
      fetchAccessList();
    } catch (err) {
      alert(err.response?.data?.error || "Failed to update access.");
    }
  };

  const handleRemoveAccess = async () => {
    if (!selectedUser || !unitCode) return;

    try {
      await api.delete(`/clearance/${unitCode}/access/${selectedUser._id}`);
      closeRemoveModal();
      fetchAccessList();
    } catch (err) {
      alert(err.response?.data?.error || "Failed to remove access.");
      closeRemoveModal();
    }
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-white shadow-lg backdrop-blur">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Department Access</h2>
          <p className="mt-1 text-sm text-white/65">
            Manage which email IDs are allowed to access this department.
          </p>
        </div>

        <button
          onClick={openAddModal}
          disabled={!unitCode}
          className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50"
        >
          + Add Access
        </button>
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-white/10 bg-black/20">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm text-white/80">
            <thead className="bg-white/5 text-xs uppercase tracking-wide text-white/50">
              <tr>
                <th className="px-5 py-4">Name</th>
                <th className="px-5 py-4">Email</th>
                <th className="px-5 py-4">Action</th>
              </tr>
            </thead>

            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="3" className="px-5 py-8 text-center">
                    Loading access list...
                  </td>
                </tr>
              ) : accessList.length > 0 ? (
                accessList.map((user) => (
                  <tr key={user._id} className="border-t border-white/10">
                    <td className="px-5 py-4">{user.name}</td>
                    <td className="px-5 py-4">{user.email}</td>
                    <td className="px-5 py-4 flex gap-2">
                      <button
                        onClick={() => openEditModal(user)}
                        className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-white/80 hover:bg-white/10 transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => openRemoveModal(user)}
                        className="rounded-lg border border-red-400/20 px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/10 transition-colors"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="3"
                    className="px-5 py-8 text-center text-sm text-white/50"
                  >
                    No authorized users found for this department.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <DepartmentAddAccessModal
        isOpen={showAddModal}
        formData={formData}
        onChange={handleChange}
        onClose={closeAddModal}
        onSubmit={handleAddAccess}
      />

      <DepartmentEditAccessModal
        isOpen={showEditModal}
        formData={formData}
        onChange={handleChange}
        onClose={closeEditModal}
        onSubmit={handleEditAccess}
      />

      <DepartmentRemoveAccessModal
        isOpen={showRemoveModal}
        user={selectedUser}
        onClose={closeRemoveModal}
        onConfirm={handleRemoveAccess}
      />
    </div>
  );
}