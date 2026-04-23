import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { useToast } from "../../context/ToastContext";
import { api } from "../../api/client";

export default function Promotions() {
  const { showToast } = useToast();
  const [promotions, setPromotions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchPromotions = async () => {
    setLoading(true);
    try {
      const res = await api.get("/promotions");
      setPromotions(res.data.data || res.data || []);
    } catch (_) {}
    setLoading(false);
  };

  useEffect(() => { fetchPromotions(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ code: "", discountType: "PERCENT", discountValue: "", minOrder: "", maxUses: "", expiresAt: "", isActive: true });
    setModalOpen(true);
  };

  const openEdit = (p: any) => {
    setEditing(p);
    setForm({
      code: p.code,
      discountType: p.discountType,
      discountValue: p.discountValue,
      minOrder: p.minOrder ?? "",
      maxUses: p.maxUses ?? "",
      expiresAt: p.expiresAt ? p.expiresAt.split("T")[0] : "",
      isActive: p.isActive !== false,
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.code?.trim()) { showToast("Promo code is required", "error"); return; }
    if (!form.discountValue) { showToast("Discount value is required", "error"); return; }
    setSaving(true);
    try {
      const payload: any = {
        code: form.code.toUpperCase().trim(),
        discountType: form.discountType,
        discountValue: Number(form.discountValue),
        minOrder: form.minOrder ? Number(form.minOrder) : undefined,
        maxUses: form.maxUses ? Number(form.maxUses) : undefined,
        expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : undefined,
        isActive: form.isActive,
      };
      if (editing) {
        await api.patch(`/admin/promotions/${editing.id}`, payload);
      } else {
        await api.post("/admin/promotions", payload);
      }
      setModalOpen(false);
      fetchPromotions();
      showToast(editing ? "Promo updated" : "Promo created");
    } catch (err: any) {
      showToast(err.response?.data?.message || "Save failed", "error");
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/admin/promotions/${id}`);
      fetchPromotions();
      showToast("Promo deleted");
    } catch (err: any) {
      showToast(err.response?.data?.message || "Delete failed", "error");
    }
    setDeleteId(null);
  };

  const toggleActive = async (promo: any) => {
    try {
      await api.patch(`/admin/promotions/${promo.id}`, { isActive: !promo.isActive });
      setPromotions(prev => prev.map(p => p.id === promo.id ? { ...p, isActive: !p.isActive } : p));
    } catch (_) {}
  };

  const isExpired = (expiresAt: string) => expiresAt && new Date(expiresAt) < new Date();

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Promotions</h1>
          <p className="text-sm text-gray-500">{promotions.length} total · {promotions.filter(p => p.isActive && !isExpired(p.expiresAt)).length} active</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#2382AA] hover:bg-[#1D6E91] text-white rounded-xl font-medium text-sm hover:opacity-90 transition shadow-sm"
        >
          + Add Promo Code
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
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Code</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Discount</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Min Order</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Uses</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Expires</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                {promotions.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-16 text-center text-gray-400 text-sm">No promotions found</td>
                  </tr>
                ) : (
                  promotions.map((promo: any) => (
                    <tr key={promo.id} className={`hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors ${isExpired(promo.expiresAt) ? "opacity-60" : ""}`}>
                      {/* Code */}
                      <td className="px-5 py-3">
                        <code className="font-mono text-sm font-bold text-[#2382AA] dark:text-purple-300 bg-purple-50 dark:bg-purple-900/20 px-2.5 py-1 rounded-lg">
                          {promo.code}
                        </code>
                      </td>
                      {/* Type badge */}
                      <td className="px-5 py-3">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${promo.discountType === "PERCENT" ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300" : "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300"}`}>
                          {promo.discountType === "PERCENT" ? "% Percent" : "₨ Fixed"}
                        </span>
                      </td>
                      {/* Discount value */}
                      <td className="px-5 py-3 text-sm font-semibold text-gray-700 dark:text-gray-200">
                        {promo.discountType === "PERCENT" ? `${promo.discountValue}%` : `Rs. ${promo.discountValue}`}
                      </td>
                      {/* Min Order */}
                      <td className="px-5 py-3 text-sm text-gray-600 dark:text-gray-400">
                        {promo.minOrder ? `Rs. ${promo.minOrder}` : <span className="text-gray-300">—</span>}
                      </td>
                      {/* Uses */}
                      <td className="px-5 py-3 text-sm text-gray-600 dark:text-gray-400">
                        <span className="font-medium text-gray-700 dark:text-gray-300">{promo.usedCount ?? 0}</span>
                        {promo.maxUses ? <span className="text-gray-400"> / {promo.maxUses}</span> : <span className="text-gray-400"> / ∞</span>}
                      </td>
                      {/* Expires */}
                      <td className="px-5 py-3 text-sm text-gray-500 dark:text-gray-400">
                        {promo.expiresAt ? (
                          <span className={isExpired(promo.expiresAt) ? "text-red-500" : ""}>
                            {new Date(promo.expiresAt).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" })}
                            {isExpired(promo.expiresAt) && " (Expired)"}
                          </span>
                        ) : (
                          <span className="text-gray-300">Never</span>
                        )}
                      </td>
                      {/* Active toggle */}
                      <td className="px-5 py-3">
                        <div
                          className={`relative w-11 h-6 rounded-full cursor-pointer transition-colors ${promo.isActive ? "bg-green-500" : "bg-gray-200 dark:bg-gray-600"}`}
                          onClick={() => toggleActive(promo)}
                        >
                          <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform shadow ${promo.isActive ? "translate-x-6" : "translate-x-1"}`}></div>
                        </div>
                      </td>
                      {/* Actions */}
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => openEdit(promo)} className="px-3 py-1.5 text-xs font-medium rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 transition">
                            Edit
                          </button>
                          <button onClick={() => setDeleteId(promo.id)} className="px-3 py-1.5 text-xs font-medium rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition">
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
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
                {editing ? "Edit Promo Code" : "Add Promo Code"}
              </h2>
              <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            <div className="p-6 space-y-4">
              {/* Code */}
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Promo Code *</label>
                <input
                  value={form.code || ""}
                  onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  placeholder="e.g. SAVE50"
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-[#2382AA] font-mono font-bold tracking-wide uppercase"
                />
              </div>

              {/* Discount type */}
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Discount Type *</label>
                <div className="flex gap-3">
                  {["PERCENT", "FIXED"].map(type => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setForm({ ...form, discountType: type })}
                      className={`flex-1 py-2 rounded-xl text-sm font-medium border transition ${form.discountType === type ? "border-[#2382AA] bg-[#2382AA]/5 text-[#2382AA]" : "border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"}`}
                    >
                      {type === "PERCENT" ? "% Percentage" : "₨ Fixed Amount"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Discount value */}
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Discount Value * {form.discountType === "PERCENT" ? "(0–100%)" : "(Rs.)"}
                </label>
                <input
                  type="number"
                  value={form.discountValue || ""}
                  onChange={e => setForm({ ...form, discountValue: e.target.value })}
                  placeholder={form.discountType === "PERCENT" ? "e.g. 15" : "e.g. 100"}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-[#2382AA]"
                />
              </div>

              {/* Grid fields */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Min Order (Rs.)</label>
                  <input
                    type="number"
                    value={form.minOrder || ""}
                    onChange={e => setForm({ ...form, minOrder: e.target.value })}
                    placeholder="e.g. 500"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-[#2382AA]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Max Uses</label>
                  <input
                    type="number"
                    value={form.maxUses || ""}
                    onChange={e => setForm({ ...form, maxUses: e.target.value })}
                    placeholder="Leave blank = unlimited"
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

              {/* Active toggle */}
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                <div>
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Active</div>
                  <div className="text-xs text-gray-400">Allow users to apply this code</div>
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
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-1">Delete Promo Code</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">This promo code will be permanently deleted.</p>
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
