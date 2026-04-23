import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { useToast } from "../../context/ToastContext";
import { api, BASE_MEDIA } from "../../api/client";
import ImageDropzone from "../../components/ui/ImageDropzone";

export default function Brands() {
  const { showToast } = useToast();
  const [brands, setBrands] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<any>({});
  const [logoUrl, setLogoUrl] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const fetchBrands = async () => {
    setLoading(true);
    try {
      const res = await api.get("/brands");
      setBrands(res.data.data || res.data || []);
    } catch (_) {}
    setLoading(false);
  };

  useEffect(() => { fetchBrands(); }, []);

  const slugify = (str: string) =>
    str.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  const openCreate = () => {
    setEditing(null);
    setForm({ name: "", slug: "", isFeatured: false });
    setLogoUrl("");
    setModalOpen(true);
  };

  const openEdit = (b: any) => {
    setEditing(b);
    setForm({ name: b.name, slug: b.slug || "", isFeatured: b.isFeatured || false });
    setLogoUrl(b.logo || "");
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name?.trim()) { showToast("Brand name is required", "error"); return; }
    setSaving(true);
    try {
      const payload: any = {
        name: form.name,
        slug: form.slug || slugify(form.name),
        logo: logoUrl || undefined,
        isFeatured: form.isFeatured,
      };
      if (editing) {
        await api.patch(`/brands/admin/${editing.id}`, payload);
      } else {
        await api.post("/brands/admin", payload);
      }
      setModalOpen(false);
      fetchBrands();
      showToast(editing ? "Brand updated" : "Brand created");
    } catch (err: any) {
      showToast(err.response?.data?.message || "Save failed", "error");
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/brands/admin/${id}`);
      fetchBrands();
      showToast("Brand deleted");
    } catch (err: any) {
      showToast(err.response?.data?.message || "Delete failed", "error");
    }
    setDeleteId(null);
  };

  const filtered = brands.filter((b: any) =>
    b.name?.toLowerCase().includes(search.toLowerCase()) ||
    b.slug?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Brands</h1>
          <p className="text-sm text-gray-500">{brands.length} total · {brands.filter((b: any) => b.isFeatured).length} featured</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#2382AA] hover:bg-[#1D6E91] text-white rounded-xl font-medium text-sm hover:opacity-90 transition shadow-sm"
        >
          + Add Brand
        </button>
      </div>

      {/* Search */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-4">
        <input
          placeholder="Search brands..."
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
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm py-16 text-center text-gray-400">
          No brands found
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {filtered.map((brand: any) => (
            <div
              key={brand.id}
              className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden hover:shadow-md transition-all group"
            >
              {/* Logo */}
              <div className="h-28 bg-gray-50 dark:bg-gray-700/50 flex items-center justify-center p-3 relative">
                {brand.logo ? (
                  <img src={brand.logo} alt={brand.name} className="max-h-full max-w-full object-contain" />
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-[#2382AA]/20 to-[#2382AA]/20 flex items-center justify-center">
                    <span className="text-2xl font-bold text-[#2382AA]/60">{brand.name?.[0]?.toUpperCase()}</span>
                  </div>
                )}
                {brand.isFeatured && (
                  <span className="absolute top-2 right-2 bg-yellow-400 text-yellow-900 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    ★ Featured
                  </span>
                )}
              </div>

              {/* Info */}
              <div className="p-3">
                <div className="font-semibold text-sm text-gray-800 dark:text-white truncate">{brand.name}</div>
                <div className="text-xs text-gray-400 mt-0.5 truncate font-mono">{brand.slug}</div>
                {brand._count?.products !== undefined && (
                  <div className="text-xs text-gray-500 mt-1">{brand._count.products} products</div>
                )}

                {/* Actions */}
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => openEdit(brand)}
                    className="flex-1 py-1.5 text-xs font-medium rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 transition"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => setDeleteId(brand.id)}
                    className="py-1.5 px-2.5 text-xs font-medium rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition"
                  >
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
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
                {editing ? "Edit Brand" : "Add Brand"}
              </h2>
              <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            <div className="p-6 space-y-4">
              {/* Logo upload */}
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">Brand Logo</label>
                {logoUrl ? (
                  <div className="relative w-full h-32 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 flex items-center justify-center">
                    <img src={logoUrl} alt="logo" className="max-h-full max-w-full object-contain p-3" />
                    <div className="absolute inset-0 bg-black/0 hover:bg-black/40 transition flex items-center justify-center opacity-0 hover:opacity-100">
                      <button type="button" onClick={() => setLogoUrl("")}
                        className="px-3 py-1.5 bg-white rounded-lg text-sm font-medium text-gray-700 shadow hover:bg-gray-100">
                        Remove &amp; Replace
                      </button>
                    </div>
                  </div>
                ) : (
                  <ImageDropzone
                    onUploaded={urls => setLogoUrl(BASE_MEDIA + urls[0])}
                    maxFiles={1}
                    existingCount={0}
                    label="Drag & drop brand logo, or click to browse"
                  />
                )}
              </div>

              {/* Name */}
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Brand Name *</label>
                <input
                  value={form.name || ""}
                  onChange={e => {
                    const name = e.target.value;
                    setForm({ ...form, name, slug: editing ? form.slug : slugify(name) });
                  }}
                  placeholder="e.g. Nestlé"
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-[#2382AA]"
                />
              </div>

              {/* Slug */}
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Slug</label>
                <input
                  value={form.slug || ""}
                  onChange={e => setForm({ ...form, slug: e.target.value })}
                  placeholder="e.g. nestle"
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-[#2382AA] font-mono"
                />
                <p className="text-xs text-gray-400 mt-1">Auto-generated from name. Used in URLs.</p>
              </div>

              {/* Featured toggle */}
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                <div>
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Featured Brand</div>
                  <div className="text-xs text-gray-400">Show in featured brands section</div>
                </div>
                <div
                  className={`w-11 h-6 rounded-full cursor-pointer transition-colors relative ${form.isFeatured ? "bg-[#2382AA]" : "bg-gray-200 dark:bg-gray-600"}`}
                  onClick={() => setForm({ ...form, isFeatured: !form.isFeatured })}
                >
                  <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform shadow ${form.isFeatured ? "translate-x-6" : "translate-x-1"}`}></div>
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
                {saving ? "Saving..." : editing ? "Update Brand" : "Create Brand"}
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
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-1">Delete Brand</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">This action cannot be undone. Products linked to this brand may be affected.</p>
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
