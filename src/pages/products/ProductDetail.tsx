import { useEffect, useRef, useState, lazy, Suspense } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { api, BASE_MEDIA } from "../../api/client";
import { ErrorBoundary } from "../../components/common/ErrorBoundary";

const RichTextEditor = lazy(() => import("../../components/form/RichTextEditor"));

const UNITS = ["piece", "kg", "g", "liter", "ml", "pack", "box", "dozen", "pair", "set"];

function Section({ title, children, action }: { title?: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {title && (
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
          {action}
        </div>
      )}
      <div className="p-5">{children}</div>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      {children}
      {hint && <p className="text-xs text-gray-400">{hint}</p>}
    </div>
  );
}

const inputCls = "w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#2382AA] focus:border-transparent";

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const isNew = !id || id === "new";
  const navigate = useNavigate();

  const [loading, setLoading] = useState(!!id && id !== "new");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ msg, type });
    toastTimer.current = setTimeout(() => setToast(null), 3500);
  };
  const [categories, setCategories] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);

  // Form state
  const [name, setName]               = useState("");
  const [nameUrdu, setNameUrdu]       = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice]             = useState("");
  const [comparePrice, setComparePrice] = useState("");
  const [unit, setUnit]               = useState("piece");
  const [weight, setWeight]           = useState("");
  const [sku, setSku]                 = useState("");
  const [barcode, setBarcode]         = useState("");
  const [stock, setStock]             = useState("0");
  const [minStock, setMinStock]       = useState("5");
  const [categoryId, setCategoryId]   = useState("");
  const [brandId, setBrandId]         = useState("");
  const [tags, setTags]               = useState<string[]>([]);
  const [tagInput, setTagInput]       = useState("");
  const [isActive, setIsActive]       = useState(true);
  const [isFeatured, setIsFeatured]   = useState(false);
  const [images, setImages]           = useState<string[]>([]);
  const [uploading, setUploading]     = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // SEO preview
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  useEffect(() => {
    api.get("/categories").then(r => setCategories(Array.isArray(r.data) ? r.data : (r.data.data || [])));
    api.get("/brands").then(r => setBrands(r.data.data || []));
    if (!isNew) {
      api.get(`/products/${id}`)
        .then(r => {
          const p = r.data.data ?? r.data;
          setName(p.name ?? "");
          setNameUrdu(p.nameUrdu ?? "");
          setDescription(p.description ?? "");
          setPrice(String(p.price ?? ""));
          setComparePrice(String(p.comparePrice ?? ""));
          setUnit(p.unit ?? "piece");
          setWeight(p.weight ?? "");
          setSku(p.sku ?? "");
          setBarcode(p.barcode ?? "");
          setStock(String(p.stock ?? 0));
          setMinStock(String(p.minStock ?? 5));
          setCategoryId(p.categoryId ?? "");
          setBrandId(p.brandId ?? "");
          setTags(p.tags ?? []);
          setIsActive(p.isActive ?? true);
          setIsFeatured(p.isFeatured ?? false);
          setImages(p.images ?? []);
        })
        .finally(() => setLoading(false));
    }
  }, [id, isNew]);

  const uploadImage = async (file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    const r = await api.post("/upload/image", fd, { headers: { "Content-Type": "multipart/form-data" } });
    return r.data.url || r.data.data?.url || r.data.filename;
  };

  const handleFiles = async (files: FileList) => {
    setUploading(true);
    try {
      const urls = await Promise.all(Array.from(files).map(uploadImage));
      setImages(prev => [...prev, ...urls.filter(Boolean)]);
    } catch { showToast("Image upload failed", "error"); }
    setUploading(false);
  };

  const removeImage = (idx: number) => setImages(prev => prev.filter((_, i) => i !== idx));
  const moveImage   = (from: number, to: number) => {
    setImages(prev => {
      const next = [...prev];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    });
  };

  const addTag = (val: string) => {
    const t = val.trim();
    if (t && !tags.includes(t)) setTags(prev => [...prev, t]);
    setTagInput("");
  };
  const removeTag = (t: string) => setTags(prev => prev.filter(x => x !== t));

  const buildPayload = () => ({
    name, nameUrdu: nameUrdu || undefined,
    description: description || undefined,
    price: parseFloat(price) || 0,
    comparePrice: comparePrice ? parseFloat(comparePrice) : undefined,
    unit, weight: weight || undefined,
    sku: sku || undefined, barcode: barcode || undefined,
    stock: parseInt(stock) || 0,
    minStock: parseInt(minStock) || 5,
    categoryId, brandId: brandId || undefined,
    tags, isActive, isFeatured, images,
  });

  const handleSave = async () => {
    if (!name.trim()) return showToast("Product name is required", "error");
    if (!categoryId)  return showToast("Please select a category", "error");
    if (!price)       return showToast("Price is required", "error");
    setSaving(true);
    try {
      if (isNew) {
        await api.post("/products", buildPayload());
        navigate("/products", { replace: true, state: { toast: "Product created successfully" } });
      } else {
        await api.put(`/products/${id}`, buildPayload());
        navigate("/products", { replace: true, state: { toast: "Product saved successfully" } });
      }
    } catch (e: any) {
      showToast(e.response?.data?.message || "Save failed", "error");
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!confirm("Delete this product? This cannot be undone.")) return;
    setDeleting(true);
    try {
      await api.delete(`/products/${id}`);
      navigate("/products", { replace: true });
    } catch (e: any) {
      showToast(e.response?.data?.message || "Delete failed", "error");
    }
    setDeleting(false);
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#2382AA]" />
    </div>
  );

  return (
    <div className="max-w-6xl space-y-0">

      {/* ── HEADER ── */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <Link to="/products" className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 transition">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            Products
          </Link>
          <span className="text-gray-200">/</span>
          <h1 className="text-lg font-semibold text-gray-900">{isNew ? "Add product" : (name || "Edit product")}</h1>
        </div>
        <div className="flex items-center gap-2">
          {!isNew && (
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="px-4 py-2 rounded-lg border border-red-200 text-red-600 text-sm font-medium hover:bg-red-50 transition disabled:opacity-50"
            >
              {deleting ? "Deleting…" : "Delete"}
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2 rounded-lg bg-[#1A1A1A] hover:bg-black text-white text-sm font-medium transition disabled:opacity-60"
          >
            {saving ? "Saving…" : isNew ? "Save product" : "Save"}
          </button>
        </div>
      </div>

      {/* ── 2-COLUMN LAYOUT ── */}
      <div className="grid grid-cols-12 gap-5">

        {/* ── LEFT (8 cols) ── */}
        <div className="col-span-12 lg:col-span-8 space-y-4">

          {/* Title + Urdu name */}
          <Section>
            <div className="space-y-4">
              <Field label="Product title">
                <input
                  type="text" value={name} onChange={e => setName(e.target.value)}
                  placeholder="e.g. Fresh Mango 1kg"
                  className={inputCls}
                />
              </Field>
              <Field label="Urdu name" hint="Displayed in Urdu on the customer app">
                <input
                  type="text" value={nameUrdu} onChange={e => setNameUrdu(e.target.value)}
                  placeholder="اردو نام"
                  dir="rtl"
                  className={inputCls}
                />
              </Field>
            </div>
          </Section>

          {/* Description */}
          <Section title="Description">
            <ErrorBoundary fallback={
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={8}
                placeholder="Describe the product — ingredients, benefits, usage…"
                className={`${inputCls} resize-none`}
              />
            }>
              <Suspense fallback={
                <div className="border border-gray-200 rounded-lg bg-gray-50 flex items-center justify-center" style={{ minHeight: 260 }}>
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#2382AA]" />
                </div>
              }>
                <RichTextEditor
                  value={description}
                  onChange={setDescription}
                  minHeight={260}
                  placeholder="Describe the product — ingredients, benefits, usage… Paste from any website and formatting is preserved automatically."
                />
              </Suspense>
            </ErrorBoundary>
          </Section>

          {/* Media */}
          <Section title="Media">
            <div
              className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center cursor-pointer hover:border-[#2382AA] transition mb-4"
              onClick={() => fileRef.current?.click()}
              onDragOver={e => e.preventDefault()}
              onDrop={e => { e.preventDefault(); if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files); }}
            >
              <input
                ref={fileRef} type="file" accept="image/*" multiple hidden
                onChange={e => e.target.files && handleFiles(e.target.files)}
              />
              {uploading ? (
                <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                  <div className="w-4 h-4 border-2 border-[#2382AA] border-t-transparent rounded-full animate-spin" />
                  Uploading…
                </div>
              ) : (
                <>
                  <svg className="mx-auto mb-2 text-gray-300" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/>
                  </svg>
                  <p className="text-sm text-gray-500">Drop images here or <span className="text-[#2382AA] font-medium">click to upload</span></p>
                  <p className="text-xs text-gray-400 mt-1">PNG, JPG, WEBP — first image is the cover</p>
                </>
              )}
            </div>

            {images.length > 0 && (
              <div className="grid grid-cols-4 gap-3">
                {images.map((img, idx) => (
                  <div key={idx} className="relative group aspect-square rounded-lg overflow-hidden border border-gray-100 bg-gray-50">
                    <img
                      src={img.startsWith("http") ? img : `${BASE_MEDIA}${img}`}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                    {idx === 0 && (
                      <span className="absolute top-1.5 left-1.5 text-[10px] font-semibold px-1.5 py-0.5 bg-black/70 text-white rounded">Cover</span>
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                      {idx > 0 && (
                        <button
                          onClick={() => moveImage(idx, idx - 1)}
                          className="w-7 h-7 bg-white rounded-full flex items-center justify-center text-gray-700 text-xs hover:bg-gray-100"
                          title="Move left"
                        >←</button>
                      )}
                      <button
                        onClick={() => removeImage(idx)}
                        className="w-7 h-7 bg-white rounded-full flex items-center justify-center text-red-500 text-xs hover:bg-red-50"
                        title="Remove"
                      >✕</button>
                      {idx < images.length - 1 && (
                        <button
                          onClick={() => moveImage(idx, idx + 1)}
                          className="w-7 h-7 bg-white rounded-full flex items-center justify-center text-gray-700 text-xs hover:bg-gray-100"
                          title="Move right"
                        >→</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Section>

          {/* Pricing */}
          <Section title="Pricing">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Price (Rs.)">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">Rs.</span>
                  <input
                    type="number" value={price} onChange={e => setPrice(e.target.value)}
                    placeholder="0.00" min={0}
                    className={`${inputCls} pl-9`}
                  />
                </div>
              </Field>
              <Field label="Compare-at price" hint="Shown as strikethrough original price">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">Rs.</span>
                  <input
                    type="number" value={comparePrice} onChange={e => setComparePrice(e.target.value)}
                    placeholder="0.00" min={0}
                    className={`${inputCls} pl-9`}
                  />
                </div>
              </Field>
              <Field label="Unit">
                <select value={unit} onChange={e => setUnit(e.target.value)} className={inputCls}>
                  {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </Field>
              <Field label="Weight" hint="e.g. 500g, 1kg, 250ml">
                <input
                  type="text" value={weight} onChange={e => setWeight(e.target.value)}
                  placeholder="e.g. 500g"
                  className={inputCls}
                />
              </Field>
            </div>
          </Section>

          {/* Inventory */}
          <Section title="Inventory">
            <div className="grid grid-cols-2 gap-4">
              <Field label="SKU (Stock Keeping Unit)">
                <input type="text" value={sku} onChange={e => setSku(e.target.value)} placeholder="e.g. MANGO-1KG" className={inputCls} />
              </Field>
              <Field label="Barcode">
                <input type="text" value={barcode} onChange={e => setBarcode(e.target.value)} placeholder="ISBN, UPC, EAN…" className={inputCls} />
              </Field>
              <Field label="Stock quantity" hint="Global stock level">
                <input type="number" value={stock} onChange={e => setStock(e.target.value)} min={0} className={inputCls} />
              </Field>
              <Field label="Low stock alert" hint="Alert when stock falls below this">
                <input type="number" value={minStock} onChange={e => setMinStock(e.target.value)} min={0} className={inputCls} />
              </Field>
            </div>
          </Section>

          {/* SEO */}
          <Section title="Search engine listing">
            <div className="rounded-lg border border-gray-100 bg-gray-50 p-4 mb-4">
              <p className="text-xs text-gray-400 mb-1">grocare.pk/products/{slug || "product-url"}</p>
              <p className="text-[15px] text-blue-600 font-medium leading-tight">{name || "Product title"}</p>
              <p className="text-xs text-gray-500 mt-1 line-clamp-2">{description || "Product description will appear here…"}</p>
            </div>
            <Field label="URL slug" hint="Used in the product URL — auto-generated from title">
              <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-[#2382AA]">
                <span className="px-3 py-2 bg-gray-50 text-xs text-gray-400 border-r border-gray-200 whitespace-nowrap">/products/</span>
                <input
                  type="text" value={slug} readOnly
                  className="flex-1 px-3 py-2 text-sm bg-white focus:outline-none text-gray-500"
                />
              </div>
            </Field>
          </Section>

        </div>

        {/* ── RIGHT (4 cols) ── */}
        <div className="col-span-12 lg:col-span-4 space-y-4">

          {/* Status */}
          <Section title="Status">
            <div className="space-y-3">
              <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition ${isActive ? "border-green-200 bg-green-50" : "border-gray-200 hover:border-gray-300"}`}>
                <input type="radio" name="status" checked={isActive} onChange={() => setIsActive(true)} className="accent-green-600" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Active</p>
                  <p className="text-xs text-gray-500">Visible to customers</p>
                </div>
                {isActive && <span className="ml-auto text-xs font-semibold text-green-600 bg-green-100 px-2 py-0.5 rounded-full">Live</span>}
              </label>
              <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition ${!isActive ? "border-gray-300 bg-gray-50" : "border-gray-200 hover:border-gray-300"}`}>
                <input type="radio" name="status" checked={!isActive} onChange={() => setIsActive(false)} className="accent-gray-500" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Draft</p>
                  <p className="text-xs text-gray-500">Hidden from store</p>
                </div>
                {!isActive && <span className="ml-auto text-xs font-semibold text-gray-500 bg-gray-200 px-2 py-0.5 rounded-full">Hidden</span>}
              </label>
            </div>
          </Section>

          {/* Featured */}
          <Section title="Publishing">
            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <p className="text-sm font-medium text-gray-900">Featured product</p>
                <p className="text-xs text-gray-500 mt-0.5">Show on home screen highlights</p>
              </div>
              <button
                type="button"
                onClick={() => setIsFeatured(v => !v)}
                className={`relative w-10 h-6 rounded-full transition-colors duration-200 ${isFeatured ? "bg-[#2382AA]" : "bg-gray-200"}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${isFeatured ? "translate-x-4" : "translate-x-0"}`} />
              </button>
            </label>
          </Section>

          {/* Product organization */}
          <Section title="Product organization">
            <div className="space-y-4">
              <Field label="Category">
                <select value={categoryId} onChange={e => setCategoryId(e.target.value)} className={inputCls}>
                  <option value="">Select category…</option>
                  {categories.map((c: any) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </Field>
              <Field label="Brand">
                <select value={brandId} onChange={e => setBrandId(e.target.value)} className={inputCls}>
                  <option value="">No brand</option>
                  {brands.map((b: any) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </Field>
              <Field label="Tags" hint="Press Enter or comma to add a tag">
                <div className="space-y-2">
                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {tags.map(t => (
                        <span key={t} className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                          {t}
                          <button onClick={() => removeTag(t)} className="text-gray-400 hover:text-red-500 leading-none">✕</button>
                        </span>
                      ))}
                    </div>
                  )}
                  <input
                    type="text"
                    value={tagInput}
                    onChange={e => setTagInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addTag(tagInput); }
                    }}
                    onBlur={() => tagInput.trim() && addTag(tagInput)}
                    placeholder="Add tag…"
                    className={inputCls}
                  />
                </div>
              </Field>
            </div>
          </Section>

          {/* Summary card */}
          {!isNew && (
            <Section title="Summary">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Price</span>
                  <span className="font-medium text-gray-900">Rs. {parseFloat(price || "0").toLocaleString()}</span>
                </div>
                {comparePrice && (
                  <div className="flex justify-between text-gray-600">
                    <span>MRP</span>
                    <span className="line-through text-gray-400">Rs. {parseFloat(comparePrice).toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-600">
                  <span>Stock</span>
                  <span className={`font-medium ${parseInt(stock) === 0 ? "text-red-500" : parseInt(stock) <= parseInt(minStock) ? "text-yellow-600" : "text-green-600"}`}>
                    {stock} {unit}s
                  </span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Images</span>
                  <span className="font-medium text-gray-900">{images.length}</span>
                </div>
              </div>
            </Section>
          )}

        </div>
      </div>

      {/* ── ERROR TOAST ── */}
      {toast && toast.type === "error" && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-lg text-sm font-medium bg-red-600 text-white">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
          {toast.msg}
          <button onClick={() => setToast(null)} className="ml-2 opacity-60 hover:opacity-100">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>
      )}

      {/* ── BOTTOM SAVE BAR ── */}
      <div className="sticky bottom-0 left-0 right-0 z-10 mt-6 bg-white border-t border-gray-200 px-6 py-3 flex items-center justify-between -mx-6">
        <Link to="/products" className="text-sm text-gray-500 hover:text-gray-700">
          Discard changes
        </Link>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2 rounded-lg bg-[#1A1A1A] hover:bg-black text-white text-sm font-medium transition disabled:opacity-60"
        >
          {saving ? "Saving…" : isNew ? "Save product" : "Save changes"}
        </button>
      </div>

    </div>
  );
}
