import { useEffect, useState } from "react";
import { useToast } from "../../context/ToastContext";
import { api } from "../../api/client";

const ROLE_STYLES: Record<string, string> = {
  CUSTOMER: "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  ADMIN: "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  STORE_MANAGER: "bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
  RIDER: "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300",
};

export default function Users() {
  const { showToast } = useToast();
  const [users, setUsers] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<any>({});
  const [saving, setSaving] = useState(false);

  const LIMIT = 20;

  const fetchUsers = async (p = page, q = search, role = filterRole) => {
    setLoading(true);
    try {
      const res = await api.get("/admin/users", {
        params: { page: p, limit: LIMIT, search: q || undefined, role: role || undefined },
      });
      setUsers(res.data.data || []);
      setTotal(res.data.meta?.total || 0);
    } catch (_) {}
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, [page]);

  const handleSearch = () => { setPage(1); fetchUsers(1, search, filterRole); };
  const handleRoleFilter = (role: string) => { setFilterRole(role); setPage(1); fetchUsers(1, search, role); };

  const openCreate = () => {
    setEditing(null);
    setForm({ phone: "", name: "", email: "", role: "CUSTOMER", password: "" });
    setModalOpen(true);
  };

  const openEdit = (u: any) => {
    setEditing(u);
    setForm({ name: u.name || "", email: u.email || "", role: u.role, isActive: u.isActive !== false });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!editing && !form.phone?.trim()) { showToast("Phone is required", "error"); return; }
    setSaving(true);
    try {
      if (editing) {
        await api.patch(`/admin/users/${editing.id}`, {
          name: form.name || undefined,
          email: form.email || undefined,
          role: form.role,
          isActive: form.isActive,
        });
      } else {
        await api.post("/admin/users", {
          phone: form.phone,
          name: form.name || undefined,
          email: form.email || undefined,
          role: form.role,
          password: form.password || undefined,
        });
      }
      setModalOpen(false);
      fetchUsers(1);
      showToast("User saved");
    } catch (err: any) {
      showToast(err.response?.data?.message || "Save failed", "error");
    }
    setSaving(false);
  };

  const getInitial = (name: string, phone: string) => {
    if (name?.trim()) return name.trim()[0].toUpperCase();
    if (phone?.trim()) return phone.trim().slice(-2);
    return "?";
  };

  const avatarColor = (role: string) => {
    const map: Record<string, string> = {
      CUSTOMER: "bg-blue-500",
      ADMIN: "bg-red-500",
      STORE_MANAGER: "bg-orange-500",
      RIDER: "bg-green-500",
    };
    return map[role] || "bg-gray-400";
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Users</h1>
          <p className="text-sm text-gray-500">{total} total users</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#2382AA] hover:bg-[#1D6E91] text-white rounded-xl font-medium text-sm hover:opacity-90 transition shadow-sm"
        >
          + Add User
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-4">
        <div className="flex flex-wrap gap-3">
          <input
            placeholder="Search by name or phone..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSearch()}
            className="flex-1 min-w-[200px] px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-[#2382AA]"
          />
          <select
            value={filterRole}
            onChange={e => handleRoleFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm focus:outline-none"
          >
            <option value="">All Roles</option>
            <option value="CUSTOMER">Customer</option>
            <option value="ADMIN">Admin</option>
            <option value="STORE_MANAGER">Store Manager</option>
            <option value="RIDER">Rider</option>
          </select>
          <button
            onClick={handleSearch}
            className="px-4 py-2 rounded-xl bg-[#2382AA] hover:bg-[#1D6E91] text-white text-sm font-medium hover:opacity-90 transition"
          >
            Search
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2382AA]"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-700">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">User</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Phone</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Orders</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Joined</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-16 text-center text-gray-400 text-sm">No users found</td>
                  </tr>
                ) : (
                  users.map((u: any) => (
                    <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          {u.avatar ? (
                            <img src={u.avatar} alt={u.name} className="w-9 h-9 rounded-full object-cover" />
                          ) : (
                            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold ${avatarColor(u.role)}`}>
                              {getInitial(u.name, u.phone)}
                            </div>
                          )}
                          <div>
                            <div className="text-sm font-medium text-gray-800 dark:text-white">
                              {u.name || <span className="text-gray-400 italic">No name</span>}
                            </div>
                            {u.isActive === false && (
                              <span className="text-xs text-red-400">Inactive</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <code className="text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-0.5 rounded-lg font-mono">
                          {u.phone}
                        </code>
                      </td>
                      <td className="px-5 py-3 text-sm text-gray-500 dark:text-gray-400">
                        {u.email || <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${ROLE_STYLES[u.role] || "bg-gray-100 text-gray-600"}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-sm text-gray-600 dark:text-gray-400">
                        {u._count?.orders ?? u.ordersCount ?? <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-5 py-3 text-sm text-gray-500 dark:text-gray-400">
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end">
                          <button
                            onClick={() => openEdit(u)}
                            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 transition"
                          >
                            Edit
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {total > LIMIT && (
        <div className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 px-6 py-4 shadow-sm">
          <span className="text-sm text-gray-500">Page {page} of {Math.ceil(total / LIMIT)} · {total} users</span>
          <div className="flex gap-2">
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-4 py-2 rounded-xl text-sm border border-gray-200 dark:border-gray-600 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700 transition">← Prev</button>
            <button disabled={page >= Math.ceil(total / LIMIT)} onClick={() => setPage(p => p + 1)} className="px-4 py-2 rounded-xl text-sm border border-gray-200 dark:border-gray-600 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700 transition">Next →</button>
          </div>
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
                {editing ? "Edit User" : "Add User"}
              </h2>
              <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            <div className="p-6 space-y-4">
              {!editing && (
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Phone Number *</label>
                  <input
                    value={form.phone || ""}
                    onChange={e => setForm({ ...form, phone: e.target.value })}
                    placeholder="e.g. 03001234567"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-[#2382AA]"
                  />
                </div>
              )}
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Full Name</label>
                <input
                  value={form.name || ""}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Ahmed Khan"
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-[#2382AA]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Email</label>
                <input
                  type="email"
                  value={form.email || ""}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  placeholder="e.g. ahmed@gmail.com"
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-[#2382AA]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Role *</label>
                <select
                  value={form.role || "CUSTOMER"}
                  onChange={e => setForm({ ...form, role: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-[#2382AA]"
                >
                  <option value="CUSTOMER">Customer</option>
                  <option value="ADMIN">Admin</option>
                  <option value="STORE_MANAGER">Store Manager</option>
                  <option value="RIDER">Rider</option>
                </select>
              </div>
              {!editing && (
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Password (optional)</label>
                  <input
                    type="password"
                    value={form.password || ""}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                    placeholder="Leave blank for OTP-only login"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-[#2382AA]"
                  />
                </div>
              )}
              {editing && (
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                  <div>
                    <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Active Account</div>
                    <div className="text-xs text-gray-400">Allow user to login and place orders</div>
                  </div>
                  <div
                    className={`w-11 h-6 rounded-full cursor-pointer transition-colors relative ${form.isActive ? "bg-green-500" : "bg-gray-200 dark:bg-gray-600"}`}
                    onClick={() => setForm({ ...form, isActive: !form.isActive })}
                  >
                    <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform shadow ${form.isActive ? "translate-x-6" : "translate-x-1"}`}></div>
                  </div>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 dark:border-gray-700">
              <button onClick={() => setModalOpen(false)} className="px-5 py-2 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-5 py-2 rounded-xl bg-[#2382AA] hover:bg-[#1D6E91] text-white text-sm font-medium hover:opacity-90 transition disabled:opacity-60 shadow-sm"
              >
                {saving ? "Saving..." : editing ? "Update User" : "Create User"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
