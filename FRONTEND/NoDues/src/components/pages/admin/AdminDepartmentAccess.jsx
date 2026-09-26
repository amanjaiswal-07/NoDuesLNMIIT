import { useState, useEffect } from "react";
import AddAccessModal from "../../Modal/AddAccessModal";
import EditAccessModal from "../../Modal/EditAccessModal";
import RemoveAccessModal from "../../Modal/RemoveAccessModal";
import api from "../../../api/client";

// Used for dropdown options
const routeOptions = [
  "/medical",
  "/sports",
  "/store",
  "/administration",
  "/nad",
  "/accounts",
  "/warden",
  "/placement",
  "/lucs",
  "/admin",
  "/library/staff",
  "/library/librarian",
  "/labs/cse-cce",
  "/labs/ece-cce",
  "/labs/mech",
  "/labs/physics",
  "/hod/ece",
  "/hod/cce",
  "/hod/cse",
  "/hod/mech",
];

// Need reverse mapping just like backend to show friendly routes in the table
const PERMISSION_TO_ROUTE = {
  'medical': '/medical',
  'sports': '/sports',
  'lucs': '/lucs',
  'warden': '/warden',
  'placement': '/placement',
  'administration': '/administration',
  'library_staff': '/library/staff',
  'library_librarian': '/library/librarian',
  'store': '/store',
  'nad': '/nad',
  'accounts': '/accounts',
  'hod_cse': '/hod/cse',
  'hod_ece': '/hod/ece',
  'hod_cce': '/hod/cce',
  'hod_mech': '/hod/mech',
  'labs_cse_cce': '/labs/cse-cce',
  'labs_ece_cce': '/labs/ece-cce',
  'labs_mech': '/labs/mech',
  'labs_physics': '/labs/physics',
  'admin_all': '/admin',
};

export default function AdminDepartmentAccess() {
  const [accessList, setAccessList] = useState([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState("");

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showRemoveModal, setShowRemoveModal] = useState(false);

  const [editingId, setEditingId] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    route: routeOptions[0],
  });

  const fetchAccessList = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/admin/staff-access');
      // Format backend data to map multiple permissions into multiple explicit rows
      const formatted = (res.data.users || []).flatMap(u => {
        if (!u.permissionCodes || u.permissionCodes.length === 0) {
          return [{ id: u._id, userId: u._id, name: u.name, email: u.email, route: 'No Permissions', rawCode: null }];
        }
        return u.permissionCodes.map(code => ({
          id: `${u._id}-${code}`,
          userId: u._id,
          name: u.name,
          email: u.email,
          route: PERMISSION_TO_ROUTE[code] || code,
          rawCode: code
        }));
      });
      setAccessList(formatted);
    } catch (err) {
      console.error('Error fetching staff access:', err);
      setMessage(err.response?.data?.error || 'Failed to load staff list');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAccessList();
  }, []);

  const filteredList = accessList.filter((item) => {
    const query = search.toLowerCase();
    return (
      item.name.toLowerCase().includes(query) ||
      item.email.toLowerCase().includes(query)
    );
  });

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      route: routeOptions[0],
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
      route: user.route,
      oldCode: user.rawCode,  // Keep track of the targeted permission
    });
    setEditingId(user.userId);
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

    if (!trimmedName || !trimmedEmail || !formData.route) return;

    try {
      await api.post('/admin/staff-access', {
        name: trimmedName,
        email: trimmedEmail,
        route: formData.route,
      });
      setMessage("Staff access added successfully.");
      closeAddModal();
      fetchAccessList();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to add staff access');
    }
  };

  const handleEditAccess = async (e) => {
    e.preventDefault();

    const trimmedName = formData.name.trim();
    const trimmedEmail = formData.email.trim().toLowerCase();

    if (!trimmedName || !trimmedEmail || !formData.route) return;

    try {
      await api.put(`/admin/staff-access/${editingId}?oldCode=${formData.oldCode || ''}`, {
        name: trimmedName,
        email: trimmedEmail,
        route: formData.route,
      });
      setMessage("Staff access updated successfully.");
      closeEditModal();
      fetchAccessList();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update staff access');
    }
  };

  const handleRemoveAccess = async () => {
    if (!selectedUser) return;
    try {
      await api.delete(`/admin/staff-access/${selectedUser.userId}?code=${selectedUser.rawCode}`);
      setMessage("Staff access removed successfully.");
      closeRemoveModal();
      fetchAccessList();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to remove staff access');
      closeRemoveModal();
    }
  };

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/5 p-6 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-white">
            Department Wise Access Control
          </h2>
          <p className="mt-1 text-sm text-white/60">
            Manage which email IDs are allowed to log in and where they should be routed.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500"
        >
          + Add Access
        </button>
      </section>

      {message && (
        <div className="rounded-xl bg-blue-500/10 border border-blue-500/20 p-4 text-blue-200">
          {message}
        </div>
      )}

      <section>
        <input
          type="text"
          placeholder="Search by name or email"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white placeholder:text-white/35 outline-none focus:border-blue-500"
        />
      </section>

      <section className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm text-white/80">
            <thead className="bg-white/5 text-xs uppercase tracking-wide text-white/50">
              <tr>
                <th className="px-5 py-4">Name</th>
                <th className="px-5 py-4">Email</th>
                <th className="px-5 py-4">Route</th>
                <th className="px-5 py-4">Action</th>
              </tr>
            </thead>

            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="4" className="px-5 py-8 text-center text-sm text-white/50">
                    Loading staff access list...
                  </td>
                </tr>
              ) : filteredList.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-5 py-8 text-center text-sm text-white/50">
                    No access records found.
                  </td>
                </tr>
              ) : (
                filteredList.map((user) => (
                  <tr key={user.id} className="border-t border-white/10">
                    <td className="px-5 py-4">{user.name}</td>
                    <td className="px-5 py-4">{user.email}</td>
                    <td className="px-5 py-4">
                      <span className="rounded-lg bg-blue-500/10 px-3 py-1 text-xs text-blue-400">
                        {user.route}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => openEditModal(user)}
                          className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-white/75 hover:bg-white/10"
                        >
                          Edit
                        </button>

                        <button
                          onClick={() => openRemoveModal(user)}
                          className="rounded-lg border border-red-400/20 px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/10"
                        >
                          Remove
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <AddAccessModal
        isOpen={showAddModal}
        formData={formData}
        routeOptions={routeOptions}
        onChange={handleChange}
        onClose={closeAddModal}
        onSubmit={handleAddAccess}
      />

      <EditAccessModal
        isOpen={showEditModal}
        formData={formData}
        routeOptions={routeOptions}
        onChange={handleChange}
        onClose={closeEditModal}
        onSubmit={handleEditAccess}
      />

      <RemoveAccessModal
        isOpen={showRemoveModal}
        user={selectedUser}
        onClose={closeRemoveModal}
        onConfirm={handleRemoveAccess}
      />
    </div>
  );
}