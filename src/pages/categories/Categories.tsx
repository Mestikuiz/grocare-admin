import { useEffect, useState } from "react";
import { useToast } from "../../context/ToastContext";
import { api, BASE_MEDIA } from "../../api/client";
import ImageDropzone from "../../components/ui/ImageDropzone";

export default function Categories() {
  const { showToast } = useToast();
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<any>({});
  const [imageUrl, setImageUrl] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await api.get("/categories", { params: { all: true } });
      setCategories(res.data.data || res.data || []);
    } catch (_) {}
    setLoading(false);
  };

  useEffect(() => { fetchCategories(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: "", nameUrdu: "", parentId: "" });
    setImageUrl("");
    setModalOpen(true);
  };

  const openEdit = (cat: any) => {
    setEditing(cat);
    setForm({ name: cat.name, nameUrdu: cat.nameUrdu || "", parentId: cat.parentId || "" });
    setImageUrl(cat.image || "");
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name?.trim()) { showToast("Category name is required", "error"); return; }
    setSaving(true);
    try {
      const payload: any = {
        name: form.name,
        nameUrdu: form.nameUrdu || undefined,
        image: imageUrl || undefined,
        parentId: form.parentId || undefined,
      };
      if (editing) {
        await api.patch(`/categories/${editing.id}`, payload);
      } else {
        await api.post("/categories", payload);
      }
      setModalOpen(false);
      fetchCategories();
      showToast(editing ? "Category updated" : "Category created");
    } catch (err: any) {
      showToast(err.response?.data?.message || "Save failed", "error");
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/categories/${id}`);
      fetchCategories();
      showToast("Category deleted");
    } catch (err: any) {
      showToast(err.response?.data?.message || "Delete failed", "error");
    }
    setDeleteId(null);
  };

  // Top-level categories
  const parents = categories.filter((c: any) => !c.parentId);
  // Map for quick lookup
  const catMap: Record<string, string> = {};
  categories.forEach((c: any) => { catMap[c.id] = c.name; });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Categories</h1>
          <p className="text-sm text-gray-500">{categories.length} total · {parents.length} parent</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#2382AA] hover:bg-[#1D6E91] text-white rounded-xl font-medium text-sm hover:opacity-90 transition shadow-sm"
        >
          + Add Category
        </button>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2382AA]"></div>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-700">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Image</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Urdu</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Parent</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
              {categories.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-gray-400 text-sm">No categories found</td>
                </tr>
              ) : (
                categories.map((cat: any) => (
                  <tr key={cat.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                    <td className="px-5 py-3">
                      {cat.image ? (
                        <img src={cat.image} alt={cat.name} className="w-10 h-10 rounded-xl object-cover border border-gray-100 dark:border-gray-700" />
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#2382AA]/20 to-[#2382AA]/20 flex items-center justify-center">
                          <span className="text-lg">🏷️</span>
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`font-medium text-sm text-gray-800 dark:text-white ${!cat.parentId ? "" : "pl-4"}`}>
                        {!cat.parentId ? "" : "↳ "}{cat.name}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-500 dark:text-gray-400" dir="rtl">
                      {cat.nameUrdu || <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-5 py-3">
                      {cat.parentId ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 text-xs font-medium">
                          {catMap[cat.parentId] || cat.parentId}
                        </span>
                      ) : (
                        <span className="text-gray-300 dark:text-gray-600 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      {cat.parentId ? (
                        <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">Sub</span>
                      ) : (
                        <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-300">Parent</span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEdit(cat)}
                          className="px-3 py-1.5 text-xs font-medium rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 transition"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => setDeleteId(cat.id)}
                          className="px-3 py-1.5 text-xs font-medium rounded-lg bg-red-50 hover:bg-red-100 text-red-500 transition"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Add/Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
                {editing ? "Edit Category" : "Add Category"}
              </h2>
              <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            <div className="p-6 space-y-4">
              {/* Image upload */}
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">Category Image</label>
                {imageUrl ? (
                  <div className="relative w-full h-32 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-600">
                    <img src={imageUrl} alt="preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/0 hover:bg-black/40 transition flex items-center justify-center opacity-0 hover:opacity-100">
                      <button type="button" onClick={() => setImageUrl("")}
                        className="px-3 py-1.5 bg-white rounded-lg text-sm font-medium text-gray-700 shadow hover:bg-gray-100">
                        Remove &amp; Replace
                      </button>
                    </div>
                  </div>
                ) : (
                  <ImageDropzone
                    onUploaded={urls => setImageUrl(BASE_MEDIA + urls[0])}
                    maxFiles={1}
                    existingCount={0}
                    label="Drag & drop category image, or click to browse"
                  />
                )}
              </div>

              {/* Name */}
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Name (English) *</label>
                <input
                  value={form.name || ""}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Fruits & Vegetables"
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-[#2382AA]"
                />
              </div>

              {/* Urdu */}
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Name (Urdu)</label>
                <input
                  dir="rtl"
                  value={form.nameUrdu || ""}
                  onChange={e => setForm({ ...form, nameUrdu: e.target.value })}
                  placeholder="اردو نام"
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-[#2382AA]"
                />
              </div>

              {/* Parent Category */}
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Parent Category</label>
                <select
                  value={form.parentId || ""}
                  onChange={e => setForm({ ...form, parentId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-[#2382AA]"
                >
                  <option value="">None (top-level)</option>
                  {parents.filter(p => p.id !== editing?.id).map((p: any) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                <p className="text-xs text-gray-400 mt-1">Leave empty to create a top-level category</p>
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

      {/* Delete Confirm Modal */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="text-center mb-5">
              <div className="text-5xl mb-3">🗑️</div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-1">Delete Category</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">This will permanently delete the category. Sub-categories may be affected.</p>
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
