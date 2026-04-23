import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { useToast } from "../../context/ToastContext";
import { api } from "../../api/client";

const DISCOUNT_ENTITY_TYPES = ["PRODUCT", "BRAND", "CATEGORY", "CITY"] as const;
type EntityType = typeof DISCOUNT_ENTITY_TYPES[number];

export default function Discounts() {
  const { showToast } = useToast();
  const [discounts, setDiscounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Entity option lists
  const [products, setProducts] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);

  const fetchDiscounts = async () => {
    setLoading(true);
    try {
      const res = await api.get("/discounts");
      setDiscounts(res.data.data || res.data || []);
    } catch (_) {}
    setLoading(false);
  };

  const fetchEntityLists = async () => {
    try {
      const [p, b, c, ci] = await Promise.allSettled([
        api.get("/products", { params: { limit: 200 } }),
        api.get("/brands"),
        api.get("/categories", { params: { all: true } }),
        api.get("/cities"),
      ]);
      if (p.status === "fulfilled") setProducts(p.value.data.data || []);
      if (b.status === "fulfilled") setBrands(b.value.data.data || []);
      if (c.status === "fulfilled") setCategories(c.value.data.data || c.value.data || []);
      if (ci.status === "fulfilled") setCities(ci.value.data.data || ci.value.data || []);
    } catch (_) {}
  };

  useEffect(() => {
    fetchDiscounts();
    fetchEntityLists();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: "", type: "PRODUCT", entityId: "", discountType: "PERCENT", value: "", minQty: "", maxUses: "", expiresAt: "", priority: 0, isActive: true });
    setModalOpen(true);
  };

  const openEdit = (d: any) => {
    setEditing(d);
    setForm({
      name: d.name,
      type: d.type,
      entityId: d.entityId || "",
      discountType: d.discountType,
      value: d.value,
      minQty: d.minQty ?? "",
      maxUses: d.maxUses ?? "",
      expiresAt: d.expiresAt ? d.expiresAt.split("T")[0] : "",
      priority: d.priority ?? 0,
      isActive: d.isActive !== false,
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name?.trim()) { showToast("Discount name is required", "error"); return; }
    if (!form.value) { showToast("Discount value is required", "error"); return; }
    setSaving(true);
    try {
      const payload: any = {
        name: form.name,
        type: form.type,
        entityId: form.entityId || undefined,
        discountType: form.discountType,
        value: Number(form.value),
        minQty: form.minQty ? Number(form.minQty) : undefined,
        maxUses: form.maxUses ? Number(form.maxUses) : undefined,
        expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : undefined,
        priority: Number(form.priority) || 0,
        isActive: form.isActive,
      };
      if (editing) {
        await api.patch(`/admin/discounts/${editing.id}`, payload);
      } else {
        await api.post("/admin/discounts", payload);
      }
      setModalOpen(false);
      fetchDiscounts();
      showToast(editing ? "Discount updated" : "Discount created");
    } catch (err: any) {
      showToast(err.response?.data?.message || "Save failed", "error");
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/admin/discounts/${id}`);
      fetchDiscounts();
      showToast("Discount deleted");
    } catch (err: any) {
      showToast(err.response?.data?.message || "Delete failed", "error");
    }
    setDeleteId(null);
  };

  const toggleActive = async (d: any) => {
    try {
      await api.patch(`/admin/discounts/${d.id}`, { isActive: !d.isActive });
      setDiscounts(prev => prev.map(x => x.id === d.id ? { ...x, isActive: !x.isActive } : x));
    } catch (_) {}
  };

  const entityOptions = (type: EntityType) => {
    const map: Record<EntityType, any[]> = { PRODUCT: products, BRAND: brands, CATEGORY: categories, CITY: cities };
    return map[type] || [];
  };

  const entityLabel = (type: EntityType, id: string) => {
    const opts = entityOptions(type);
    return opts.find((o: any) => o.id === id)?.name || id?.slice(0, 12) || "—";
  };

  const typeBadgeStyle: Record<EntityType, string> = {
    PRODUCT: "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300",
    BRAND: "bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300",
    CATEGORY: "bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-300",
    CITY: "bg-teal-50 text-teal-700 dark:bg-teal-900/20 dark:text-teal-300",
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Discounts</h1>
          <p className="text-sm text-gray-500">{discounts.length} total · {discounts.filter(d => d.isActive).length} active</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#2382AA] hover:bg-[#1D6E91] text-white rounded-xl font-medium text-sm hover:opacity-90 transition shadow-sm"
        >
          + Add Discount
        </button>
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
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Target</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Discount</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Priority</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                {discounts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-16 text-center text-gray-400 text-sm">No discounts found</td>
                  </tr>
                ) : (
                  discounts.map((d: any) => (
                    <tr key={d.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                      <td className="px-5 py-3 text-sm font-medium text-gray-800 dark:text-white">{d.name}</td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${typeBadgeStyle[d.type as EntityType] || "bg-gray-100 text-gray-600"}`}>
                          {d.type}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-sm text-gray-500 dark:text-gray-400">
                        {d.entityId ? entityLabel(d.type, d.entityId) : <span className="text-gray-300">All</span>}
                      </td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold ${d.discountType === "PERCENT" ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300" : "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300"}`}>
                          {d.discountType === "PERCENT" ? `${d.value}%` : `Rs. ${d.value}`}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-sm text-gray-600 dark:text-gray-400 font-mono">
                        {d.priority ?? 0}
                      </td>
                      <td className="px-5 py-3">
                        <div
                          className={`relative w-11 h-6 rounded-full cursor-pointer transition-colors ${d.isActive ? "bg-green-500" : "bg-gray-200 dark:bg-gray-600"}`}
                          onClick={() => toggleActive(d)}
                        >
                          <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform shadow ${d.isActive ? "translate-x-6" : "translate-x-1"}`}></div>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => openEdit(d)} className="px-3 py-1.5 text-xs font-medium rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 transition">
                            Edit
                          </button>
                          <button onClick={() => setDeleteId(d.id)} className="px-3 py-1.5 text-xs font-medium rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition">
                            Delete
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

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
                {editing ? "Edit Discount" : "Add Discount"}
              </h2>
              <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            <div className="p-6 space-y-4">
              {/* Name */}
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Discount Name *</label>
                <input
                  value={form.name || ""}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Ramadan Special Discount"
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-[#2382AA]"
                />
              </div>

              {/* Type */}
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Applies To *</label>
                <div className="grid grid-cols-4 gap-2">
                  {DISCOUNT_ENTITY_TYPES.map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setForm({ ...form, type: t, entityId: "" })}
                      className={`py-2 rounded-xl text-xs font-medium border transition ${form.type === t ? "border-[#2382AA] bg-[#2382AA]/5 text-[#2382AA]" : "border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"}`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Entity select */}
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Select {form.type} <span className="text-gray-400">(leave blank to apply to all)</span>
                </label>
                <select
                  value={form.entityId || ""}
                  onChange={e => setForm({ ...form, entityId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-[#2382AA]"
                >
                  <option value="">All {form.type}s</option>
                  {entityOptions(form.type as EntityType).map((o: any) => (
                    <option key={o.id} value={o.id}>{o.name}</option>
                  ))}
                </select>
              </div>

              {/* Discount type + value */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Discount Type *</label>
                  <select
                    value={form.discountType || "PERCENT"}
                    onChange={e => setForm({ ...form, discountType: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-[#2382AA]"
                  >
                    <option value="PERCENT">Percentage (%)</option>
                    <option value="FIXED">Fixed Amount (Rs.)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Value *</label>
                  <input
                    type="number"
                    value={form.value || ""}
                    onChange={e => setForm({ ...form, value: e.target.value })}
                    placeholder={form.discountType === "PERCENT" ? "e.g. 20" : "e.g. 100"}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-[#2382AA]"
                  />
                </div>
              </div>

              {/* Min Qty, Max Uses, Priority */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Min Qty</label>
                  <input
                    type="number"
                    value={form.minQty || ""}
                    onChange={e => setForm({ ...form, minQty: e.target.value })}
                    placeholder="e.g. 2"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-[#2382AA]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Max Uses</label>
                  <input
                    type="number"
                    value={form.maxUses || ""}
                    onChange={e => setForm({ ...form, maxUses: e.target.value })}
                    placeholder="Unlimited"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-[#2382AA]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Priority</label>
                  <input
                    type="number"
                    value={form.priority ?? 0}
                    onChange={e => setForm({ ...form, priority: e.target.value })}
                    placeholder="0"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-[#2382AA]"
                  />
                </div>
              </div>

              {/* Expires */}
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Expiry Date</label>
                <input
                  type="date"
                  value={form.expiresAt || ""}
                  onChange={e => setForm({ ...form, expiresAt: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-[#2382AA]"
                />
              </div>

              {/* Active */}
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                <div>
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Active</div>
                  <div className="text-xs text-gray-400">Apply this discount to eligible orders</div>
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
                {saving ? "Saving..." : editing ? "Update" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="text-center mb-5">
              <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mb-3 mx-auto"><Trash2 size={28} className="text-red-400" /></div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-1">Delete Discount</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">This discount rule will be permanently deleted.</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 text-sm hover:bg-gray-50 transition">
                Cancel
              </button>
              <button onClick={() => handleDelete(deleteId)} className="flex-1 px-4 py-2 rounded-xl bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
