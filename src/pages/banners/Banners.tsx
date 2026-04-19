import { useEffect, useState } from "react";
import { useToast } from "../../context/ToastContext";
import { api, BASE_MEDIA } from "../../api/client";
import ImageDropzone from "../../components/ui/ImageDropzone";

export default function Banners() {
  const { showToast } = useToast();
  const [banners, setBanners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<any>({});
  const [imageUrl, setImageUrl] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchBanners = async () => {
    setLoading(true);
    try {
      const res = await api.get("/banners");
      setBanners(res.data.data || res.data || []);
    } catch (_) {}
    setLoading(false);
  };

  useEffect(() => { fetchBanners(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ title: "", link: "", sortOrder: 0, isActive: true });
    setImageUrl("");
    setModalOpen(true);
  };

  const openEdit = (b: any) => {
    setEditing(b);
    setForm({ title: b.title || "", link: b.link || "", sortOrder: b.sortOrder ?? 0, isActive: b.isActive !== false });
    setImageUrl(b.image || "");
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.title?.trim()) { showToast("Title is required", "error"); return; }
    if (!imageUrl) { showToast("Please upload a banner image", "error"); return; }
    setSaving(true);
    try {
      const payload = {
        title: form.title,
        image: imageUrl,
        link: form.link || undefined,
        sortOrder: Number(form.sortOrder) || 0,
        isActive: form.isActive,
      };
      if (editing) {
        await api.patch(`/admin/banners/${editing.id}`, payload);
      } else {
        await api.post("/admin/banners", payload);
      }
      setModalOpen(false);
      fetchBanners();
      showToast(editing ? "Banner updated" : "Banner created");
    } catch (err: any) {
      showToast(err.response?.data?.message || "Save failed", "error");
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/admin/banners/${id}`);
      fetchBanners();
      showToast("Banner deleted");
    } catch (err: any) {
      showToast(err.response?.data?.message || "Delete failed", "error");
    }
    setDeleteId(null);
  };

  const toggleActive = async (banner: any) => {
    try {
      await api.patch(`/admin/banners/${banner.id}`, { isActive: !banner.isActive });
      setBanners(prev => prev.map(b => b.id === banner.id ? { ...b, isActive: !b.isActive } : b));
    } catch (_) {}
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Banners</h1>
          <p className="text-sm text-gray-500">{banners.length} total · {banners.filter(b => b.isActive).length} active</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#2382AA] hover:bg-[#1D6E91] text-white rounded-xl font-medium text-sm hover:opacity-90 transition shadow-sm"
        >
          + Add Banner
        </button>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2382AA]"></div>
        </div>
      ) : banners.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm py-20 text-center">
          <div className="text-5xl mb-3">🖼️</div>
          <p className="text-gray-400 text-sm">No banners yet. Add your first banner.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {banners.map((banner: any) => (
            <div
              key={banner.id}
              className={`bg-white dark:bg-gray-800 rounded-2xl border shadow-sm overflow-hidden transition-all hover:shadow-md ${!banner.isActive ? "opacity-60 border-gray-100 dark:border-gray-700" : "border-gray-100 dark:border-gray-700"}`}
            >
              {/* Banner image */}
              <div className="relative h-44 bg-gray-100 dark:bg-gray-700">
                {banner.image ? (
                  <img src={banner.image} alt={banner.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-300 text-4xl">🖼️</div>
                )}
                {/* Sort order badge */}
                <div className="absolute top-2 left-2 bg-black/50 text-white text-xs px-2 py-0.5 rounded-lg font-mono">
                  #{banner.sortOrder ?? 0}
                </div>
                {/* Active badge */}
                <div className={`absolute top-2 right-2 px-2.5 py-0.5 rounded-full text-xs font-semibold ${banner.isActive ? "bg-green-500 text-white" : "bg-red-100 text-red-600"}`}>
                  {banner.isActive ? "Active" : "Inactive"}
                </div>
              </div>

              {/* Info */}
              <div className="p-4">
                <h3 className="font-semibold text-gray-800 dark:text-white text-sm truncate">{banner.title}</h3>
                {banner.link && (
                  <a href={banner.link} target="_blank" rel="noreferrer" className="text-xs text-[#2382AA] hover:underline truncate block mt-0.5">
                    {banner.link}
                  </a>
                )}
                <div className="flex gap-2 mt-3">
                  <button onClick={() => openEdit(banner)} className="flex-1 py-1.5 text-xs font-medium rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 transition">
                    Edit
                  </button>
                  <button
                    onClick={() => toggleActive(banner)}
                    className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition ${banner.isActive ? "bg-orange-50 text-orange-600 hover:bg-orange-100" : "bg-green-50 text-green-600 hover:bg-green-100"}`}
                  >
                    {banner.isActive ? "Deactivate" : "Activate"}
                  </button>
                  <button onClick={() => setDeleteId(banner.id)} className="py-1.5 px-2.5 text-xs font-medium rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition">
                    🗑
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
                {editing ? "Edit Banner" : "Add Banner"}
              </h2>
              <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            <div className="p-6 space-y-4">
              {/* Image Upload */}
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">Banner Image *</label>
                {imageUrl ? (
                  <div className="relative rounded-xl overflow-hidden border border-gray-200 dark:border-gray-600">
                    <img src={imageUrl} alt="preview" className="w-full h-44 object-cover" />
                    <div className="absolute inset-0 bg-black/0 hover:bg-black/40 transition flex items-center justify-center opacity-0 hover:opacity-100">
                      <button
                        type="button"
                        onClick={() => setImageUrl("")}
                        className="px-3 py-1.5 bg-white rounded-lg text-sm font-medium text-gray-700 shadow hover:bg-gray-100"
                      >
                        Remove &amp; Replace
                      </button>
                    </div>
                  </div>
                ) : (
                  <ImageDropzone
                    onUploaded={urls => setImageUrl(BASE_MEDIA + urls[0])}
                    maxFiles={1}
                    existingCount={0}
                    label="Drag & drop banner image, or click to browse"
                  />
                )}
                <p className="text-xs text-gray-400 mt-1">Recommended: 1200×400px</p>
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Title *</label>
                <input
                  value={form.title || ""}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Weekend Sale — Up to 50% Off"
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-[#2382AA]"
                />
              </div>

              {/* Link */}
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Link URL</label>
                <input
                  value={form.link || ""}
                  onChange={e => setForm({ ...form, link: e.target.value })}
                  placeholder="e.g. /products?category=fruits"
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-[#2382AA]"
                />
              </div>

              {/* Sort Order */}
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Sort Order</label>
                <input
                  type="number"
                  value={form.sortOrder ?? 0}
                  onChange={e => setForm({ ...form, sortOrder: e.target.value })}
                  className="w-32 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-[#2382AA]"
                />
                <p className="text-xs text-gray-400 mt-1">Lower number = shown first</p>
              </div>

              {/* Active toggle */}
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                <div>
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Active</div>
                  <div className="text-xs text-gray-400">Show this banner on the home screen</div>
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
                {saving ? "Saving..." : editing ? "Update Banner" : "Create Banner"}
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
              <div className="text-5xl mb-3">🗑️</div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-1">Delete Banner</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">This banner will be permanently removed from the app.</p>
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
