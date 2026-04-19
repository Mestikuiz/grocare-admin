import { useEffect, useState } from "react";
import { useToast } from "../../context/ToastContext";
import { api } from "../../api/client";

export default function Cities() {
  const { showToast } = useToast();
  const [cities, setCities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const fetchCities = async () => {
    setLoading(true);
    try {
      const res = await api.get("/cities/admin/all");
      setCities(res.data.data || res.data || []);
    } catch (_) {}
    setLoading(false);
  };

  useEffect(() => { fetchCities(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: "", nameUrdu: "", isActive: true });
    setModalOpen(true);
  };

  const openEdit = (c: any) => {
    setEditing(c);
    setForm({ name: c.name, nameUrdu: c.nameUrdu || "", isActive: c.isActive !== false });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name?.trim()) { showToast("City name is required", "error"); return; }
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        nameUrdu: form.nameUrdu || undefined,
        isActive: form.isActive,
      };
      if (editing) {
        await api.patch(`/cities/admin/${editing.id}`, payload);
      } else {
        await api.post("/cities/admin", payload);
      }
      setModalOpen(false);
      fetchCities();
      showToast(editing ? "City updated" : "City created");
    } catch (err: any) {
      showToast(err.response?.data?.message || "Save failed", "error");
    }
    setSaving(false);
  };

  const toggleActive = async (city: any) => {
    setToggling(city.id);
    try {
      await api.patch(`/cities/admin/${city.id}`, { isActive: !city.isActive });
      setCities(prev => prev.map(c => c.id === city.id ? { ...c, isActive: !c.isActive } : c));
      showToast(`City ${city.isActive ? "deactivated" : "activated"}`);
    } catch (err: any) {
      showToast(err.response?.data?.message || "Update failed", "error");
    }
    setToggling(null);
  };

  const filtered = cities.filter((c: any) =>
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.nameUrdu?.includes(search)
  );

  const activeCities = cities.filter(c => c.isActive).length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Cities</h1>
          <p className="text-sm text-gray-500">{cities.length} total · {activeCities} active</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#2382AA] hover:bg-[#1D6E91] text-white rounded-xl font-medium text-sm hover:opacity-90 transition shadow-sm"
        >
          + Add City
        </button>
      </div>

      {/* Search */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-4">
        <input
          placeholder="Search cities..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full max-w-sm px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-[#2382AA]"
        />
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2382AA]"></div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm py-20 text-center">
          <div className="text-5xl mb-3">🏙️</div>
          <p className="text-gray-400 text-sm">No cities found. Add your first delivery city.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filtered.map((city: any) => (
            <div
              key={city.id}
              className={`bg-white dark:bg-gray-800 rounded-2xl border shadow-sm overflow-hidden hover:shadow-md transition-all ${city.isActive ? "border-gray-100 dark:border-gray-700" : "border-gray-100 dark:border-gray-700 opacity-60"}`}
            >
              {/* City card top */}
              <div className={`h-20 flex items-center justify-center ${city.isActive ? "bg-gradient-to-br from-[#2382AA]/10 to-[#2382AA]/10" : "bg-gray-100 dark:bg-gray-700/50"}`}>
                <span className="text-4xl">🏙️</span>
              </div>

              {/* Info */}
              <div className="p-3">
                <div className="font-semibold text-sm text-gray-800 dark:text-white">{city.name}</div>
                {city.nameUrdu && (
                  <div className="text-xs text-gray-400 mt-0.5" dir="rtl">{city.nameUrdu}</div>
                )}
                {city._count?.orders !== undefined && (
                  <div className="text-xs text-gray-500 mt-1">{city._count.orders} orders</div>
                )}

                {/* Active badge */}
                <div className="mt-2">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${city.isActive ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300" : "bg-red-50 text-red-500 dark:bg-red-900/20 dark:text-red-400"}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${city.isActive ? "bg-green-500" : "bg-red-400"}`}></span>
                    {city.isActive ? "Active" : "Inactive"}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => openEdit(city)}
                    className="flex-1 py-1.5 text-xs font-medium rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 transition"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => toggleActive(city)}
                    disabled={toggling === city.id}
                    className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition disabled:opacity-60 ${city.isActive ? "bg-red-50 text-red-500 hover:bg-red-100" : "bg-green-50 text-green-600 hover:bg-green-100"}`}
                  >
                    {toggling === city.id ? "..." : city.isActive ? "Disable" : "Enable"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-sm">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
                {editing ? "Edit City" : "Add City"}
              </h2>
              <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            <div className="p-6 space-y-4">
              {/* Name */}
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">City Name (English) *</label>
                <input
                  value={form.name || ""}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Karachi"
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-[#2382AA]"
                />
              </div>

              {/* Urdu name */}
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">City Name (Urdu)</label>
                <input
                  dir="rtl"
                  value={form.nameUrdu || ""}
                  onChange={e => setForm({ ...form, nameUrdu: e.target.value })}
                  placeholder="کراچی"
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-[#2382AA]"
                />
              </div>

              {/* Active toggle */}
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                <div>
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Active</div>
                  <div className="text-xs text-gray-400">Accept delivery orders for this city</div>
                </div>
                <div
                  className={`w-11 h-6 rounded-full cursor-pointer transition-colors relative ${form.isActive ? "bg-green-500" : "bg-gray-200 dark:bg-gray-600"}`}
                  onClick={() => setForm({ ...form, isActive: !form.isActive })}
                >
                  <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform shadow ${form.isActive ? "translate-x-6" : "translate-x-1"}`}></div>
                </div>
              </div>
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
                {saving ? "Saving..." : editing ? "Update City" : "Add City"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
