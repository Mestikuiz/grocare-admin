import { useEffect, useRef, useState } from "react";
import { api, BASE_MEDIA } from "../../api/client";
import { useToast } from "../../context/ToastContext";

const PAGE_SIZE = 24;

interface MediaItem {
  id: string;
  filename: string;
  url: string;
  originalName: string;
  mimeType: string;
  size: number;
  altText: string | null;
  caption: string | null;
  tags: string[];
  createdAt: string;
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-PK", { year: "numeric", month: "short", day: "numeric" });
}

export default function MediaLibrary() {
  const { showToast } = useToast();
  const [files, setFiles]             = useState<MediaItem[]>([]);
  const [total, setTotal]             = useState(0);
  const [page, setPage]               = useState(1);
  const [loading, setLoading]         = useState(true);
  const [uploading, setUploading]     = useState(false);
  const [search, setSearch]           = useState("");
  const [searchInput, setSearchInput] = useState("");
  const searchTimer                   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileRef                       = useRef<HTMLInputElement>(null);
  const [dragging, setDragging]       = useState(false);

  // Multi-select checkboxes
  const [checkedIds, setCheckedIds]   = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [confirmBulk, setConfirmBulk] = useState(false);

  // Detail panel
  const [selected, setSelected]       = useState<MediaItem | null>(null);
  const [panelVisible, setPanelVisible] = useState(false);
  const [panelExiting, setPanelExiting] = useState(false);
  const [altText, setAltText]         = useState("");
  const [caption, setCaption]         = useState("");
  const [tagInput, setTagInput]       = useState("");
  const [tags, setTags]               = useState<string[]>([]);
  const [saving, setSaving]           = useState(false);
  const [copied, setCopied]           = useState(false);
  const [deleting, setDeleting]       = useState(false);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const load = async (p = page, q = search) => {
    setLoading(true);
    try {
      const res = await api.get("/upload/list", { params: { page: p, limit: PAGE_SIZE, search: q || undefined } });
      setFiles(res.data.data || []);
      setTotal(res.data.meta?.total || 0);
    } catch { setFiles([]); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleSearch = (val: string) => {
    setSearchInput(val);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setSearch(val);
      setPage(1);
      load(1, val);
    }, 350);
  };

  const handleFiles = async (fileList: FileList) => {
    setUploading(true);
    try {
      const fd = new FormData();
      Array.from(fileList).forEach(f => fd.append("files", f));
      await api.post("/upload/images", fd, { headers: { "Content-Type": "multipart/form-data" } });
      setPage(1);
      await load(1, search);
    } catch { /* ignore */ }
    setUploading(false);
  };

  // ── Panel helpers ──────────────────────────────────────────────────────────
  const openPanel = (item: MediaItem) => {
    setSelected(item);
    setAltText(item.altText ?? "");
    setCaption(item.caption ?? "");
    setTags(item.tags ?? []);
    setTagInput("");
    setCopied(false);
    setPanelExiting(false);
    setPanelVisible(true);
  };

  /** Slide + fade out over 300 ms, then clear */
  const closePanel = () => {
    setPanelExiting(true);
    setTimeout(() => {
      setPanelVisible(false);
      setPanelExiting(false);
      setSelected(null);
    }, 300);
  };

  /** Slide out slowly (3 s total: 0.3 s exit + 2.7 s wait) after delete */
  const closePanelAfterDelete = () => {
    setPanelExiting(true);
    setTimeout(() => {
      setPanelVisible(false);
      setPanelExiting(false);
      setSelected(null);
    }, 3000);
  };

  const handleSaveMeta = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      const res = await api.patch(`/upload/${selected.id}`, { altText, caption, tags });
      const updated = res.data.data;
      setFiles(prev => prev.map(f => f.id === updated.id ? updated : f));
      setSelected(updated);
      showToast("Image details saved");
    } catch { showToast("Failed to save image details", "error"); }
    setSaving(false);
  };

  // ── Single delete (from panel) ──────────────────────────────────────────────
  const handleDelete = async () => {
    if (!selected) return;
    if (!confirm(`Delete "${selected.originalName}"?`)) return;
    setDeleting(true);
    try {
      await api.delete(`/upload/${selected.id}`);
      setFiles(prev => prev.filter(f => f.id !== selected.id));
      setTotal(t => t - 1);
      setCheckedIds(prev => { const n = new Set(prev); n.delete(selected.id); return n; });
      showToast("Image deleted");
      closePanelAfterDelete();           // slow fade-out
    } catch { showToast("Failed to delete image", "error"); }
    setDeleting(false);
  };

  // ── Bulk delete (checkbox selection) ──────────────────────────────────────
  const handleBulkDelete = async () => {
    setBulkDeleting(true);
    setConfirmBulk(false);
    try {
      await Promise.all(Array.from(checkedIds).map(id => api.delete(`/upload/${id}`).catch(() => {})));
      // if the open panel item was in the batch, close it
      const deletedCount = checkedIds.size;
      if (selected && checkedIds.has(selected.id)) closePanelAfterDelete();
      setFiles(prev => prev.filter(f => !checkedIds.has(f.id)));
      setTotal(t => t - deletedCount);
      setCheckedIds(new Set());
      showToast(`${deletedCount} image${deletedCount !== 1 ? "s" : ""} deleted`);
    } catch { showToast("Failed to delete images", "error"); }
    setBulkDeleting(false);
  };

  // ── Checkbox toggle ────────────────────────────────────────────────────────
  const toggleCheck = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();          // don't open panel
    setCheckedIds(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  const toggleAll = () => {
    if (checkedIds.size === files.length) setCheckedIds(new Set());
    else setCheckedIds(new Set(files.map(f => f.id)));
  };

  const addTag = (val: string) => {
    const t = val.trim().toLowerCase();
    if (t && !tags.includes(t)) setTags(prev => [...prev, t]);
    setTagInput("");
  };

  const imgUrl = (item: MediaItem) => item.url.startsWith("http") ? item.url : `${BASE_MEDIA}${item.url}`;

  return (
    <div className="flex h-full gap-0">

      {/* ── MAIN AREA ── */}
      <div className={`flex-1 min-w-0 space-y-5 transition-all duration-300 ${panelVisible ? "mr-[340px]" : ""}`}>

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Media Library</h1>
            <p className="text-sm text-gray-500">{total} file{total !== 1 ? "s" : ""}</p>
          </div>
          <div className="flex items-center gap-2">
            {/* Bulk delete bar */}
            {checkedIds.size > 0 && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-50 border border-red-200">
                <span className="text-sm text-red-700 font-medium">{checkedIds.size} selected</span>
                <button
                  onClick={() => setConfirmBulk(true)}
                  disabled={bulkDeleting}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-medium transition disabled:opacity-50"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                  {bulkDeleting ? "Deleting…" : "Delete"}
                </button>
                <button onClick={() => setCheckedIds(new Set())} className="text-red-400 hover:text-red-600 text-xs px-1">✕ Clear</button>
              </div>
            )}
            <button
              onClick={() => fileRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1A1A1A] hover:bg-black text-white text-sm font-medium transition"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>
              Upload
            </button>
          </div>
          <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={e => e.target.files && handleFiles(e.target.files)} />
        </div>

        {/* Search + select-all row */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-xs">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
            <input
              type="text"
              value={searchInput}
              onChange={e => handleSearch(e.target.value)}
              placeholder="Search by name, tag…"
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-[#2382AA]"
            />
          </div>
          {files.length > 0 && (
            <label className="flex items-center gap-2 text-sm text-gray-500 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={checkedIds.size === files.length && files.length > 0}
                onChange={toggleAll}
                className="w-4 h-4 rounded border-gray-300 accent-[#2382AA]"
              />
              Select all
            </label>
          )}
        </div>

        {/* Drag-drop zone */}
        <div
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={e => { e.preventDefault(); setDragging(false); if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files); }}
          onClick={() => fileRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-colors ${
            dragging ? "border-[#2382AA] bg-[#2382AA]/5" : "border-gray-200 hover:border-[#2382AA] hover:bg-gray-50"
          }`}
        >
          {uploading ? (
            <div className="flex items-center justify-center gap-2 text-sm text-gray-500 py-2">
              <div className="w-4 h-4 border-2 border-[#2382AA] border-t-transparent rounded-full animate-spin" />
              Uploading…
            </div>
          ) : (
            <p className="text-sm text-gray-400">
              <span className="text-[#2382AA] font-medium">Click to upload</span> or drag & drop — PNG, JPG, WEBP up to 5 MB
            </p>
          )}
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="aspect-square rounded-xl bg-gray-100 animate-pulse" />
            ))}
          </div>
        ) : files.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-gray-400">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="mb-3 opacity-40">
              <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/>
            </svg>
            <p className="text-sm">No images found</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {files.map(item => {
              const isChecked = checkedIds.has(item.id);
              return (
                <div
                  key={item.id}
                  className={`group relative aspect-square rounded-xl overflow-hidden border-2 cursor-pointer transition-all ${
                    isChecked
                      ? "border-[#2382AA] ring-2 ring-[#2382AA]/30"
                      : selected?.id === item.id && panelVisible
                      ? "border-[#2382AA]"
                      : "border-transparent hover:border-gray-300"
                  }`}
                  onClick={() => openPanel(item)}
                >
                  <img src={imgUrl(item)} alt={item.altText || item.originalName} className="w-full h-full object-cover bg-gray-100" />

                  {/* Hover overlay */}
                  <div className={`absolute inset-0 transition-all ${isChecked ? "bg-[#2382AA]/20" : "bg-black/0 group-hover:bg-black/25"}`} />

                  {/* Checkbox — visible on hover OR when checked */}
                  <div
                    onClick={e => toggleCheck(e, item.id)}
                    className={`absolute top-2 left-2 transition-opacity ${isChecked ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}
                  >
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shadow transition-colors ${
                      isChecked ? "bg-[#2382AA] border-[#2382AA]" : "bg-white/90 border-gray-300"
                    }`}>
                      {isChecked && (
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5"><path d="M20 6L9 17l-5-5"/></svg>
                      )}
                    </div>
                  </div>

                  {/* Filename on hover */}
                  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent px-2 py-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-white text-[10px] truncate">{item.originalName}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-2">
            <p className="text-sm text-gray-500">
              Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of {total}
            </p>
            <div className="flex items-center gap-1.5">
              <button
                disabled={page === 1}
                onClick={() => { const p = page - 1; setPage(p); load(p, search); }}
                className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm disabled:opacity-40 hover:bg-gray-50 transition"
              >← Prev</button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let p: number;
                if (totalPages <= 5) p = i + 1;
                else if (page <= 3) p = i + 1;
                else if (page >= totalPages - 2) p = totalPages - 4 + i;
                else p = page - 2 + i;
                return (
                  <button key={p} onClick={() => { setPage(p); load(p, search); }}
                    className={`w-8 h-8 rounded-lg text-sm transition ${page === p ? "bg-[#2382AA] text-white font-medium" : "hover:bg-gray-100 text-gray-600"}`}
                  >{p}</button>
                );
              })}
              <button
                disabled={page >= totalPages}
                onClick={() => { const p = page + 1; setPage(p); load(p, search); }}
                className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm disabled:opacity-40 hover:bg-gray-50 transition"
              >Next →</button>
            </div>
          </div>
        )}
      </div>

      {/* ── DETAIL PANEL ── */}
      <div
        className="fixed right-0 h-full w-[340px] bg-white border-l border-gray-200 z-40 flex flex-col shadow-xl"
        style={{
          top: "56px",
          transition: "transform 0.3s ease, opacity 0.3s ease",
          transform: panelVisible ? "translateX(0)" : "translateX(100%)",
          opacity: panelExiting ? 0 : 1,
          pointerEvents: panelVisible && !panelExiting ? "auto" : "none",
        }}
      >
        {selected && (
          <>
            {/* Panel header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900 truncate pr-4">{selected.originalName}</h3>
              <button onClick={closePanel} className="text-gray-400 hover:text-gray-700 flex-shrink-0">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">

              {/* Preview */}
              <div className="rounded-xl overflow-hidden border border-gray-100 bg-gray-50 aspect-video flex items-center justify-center">
                <img src={imgUrl(selected)} alt={selected.altText || ""} className="max-h-full max-w-full object-contain" />
              </div>

              {/* File info */}
              <div className="rounded-lg bg-gray-50 border border-gray-100 divide-y divide-gray-100 text-sm">
                <div className="flex justify-between px-3 py-2">
                  <span className="text-gray-500">Size</span>
                  <span className="font-medium text-gray-800">{formatBytes(selected.size)}</span>
                </div>
                <div className="flex justify-between px-3 py-2">
                  <span className="text-gray-500">Type</span>
                  <span className="font-medium text-gray-800">{selected.mimeType.split("/")[1].toUpperCase()}</span>
                </div>
                <div className="flex justify-between px-3 py-2">
                  <span className="text-gray-500">Uploaded</span>
                  <span className="font-medium text-gray-800">{formatDate(selected.createdAt)}</span>
                </div>
              </div>

              {/* URL */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">File URL</label>
                <div className="flex gap-2 items-center">
                  <input
                    readOnly
                    value={`${BASE_MEDIA}${selected.url}`}
                    className="flex-1 min-w-0 px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-xs text-gray-600 focus:outline-none"
                  />
                  <button
                    onClick={() => { navigator.clipboard.writeText(`${BASE_MEDIA}${selected.url}`); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                    className={`flex-shrink-0 px-3 py-2 rounded-lg text-xs font-medium transition ${copied ? "bg-green-600 text-white" : "bg-gray-100 hover:bg-gray-200 text-gray-700"}`}
                  >{copied ? "Copied!" : "Copy"}</button>
                </div>
              </div>

              {/* Alt text */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Alt Text</label>
                <input type="text" value={altText} onChange={e => setAltText(e.target.value)}
                  placeholder="Describe the image for screen readers…"
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#2382AA]"
                />
              </div>

              {/* Caption */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Caption</label>
                <textarea rows={2} value={caption} onChange={e => setCaption(e.target.value)}
                  placeholder="Optional caption…"
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#2382AA]"
                />
              </div>

              {/* Tags */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Tags</label>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {tags.map(t => (
                      <span key={t} className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#2382AA]/10 text-[#2382AA] text-xs rounded-full font-medium">
                        {t}
                        <button onClick={() => setTags(prev => prev.filter(x => x !== t))} className="opacity-60 hover:opacity-100">×</button>
                      </span>
                    ))}
                  </div>
                )}
                <input type="text" value={tagInput} onChange={e => setTagInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addTag(tagInput); } }}
                  onBlur={() => tagInput.trim() && addTag(tagInput)}
                  placeholder="Add tag, press Enter…"
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#2382AA]"
                />
              </div>
            </div>

            {/* Panel footer */}
            <div className="px-5 py-4 border-t border-gray-100 space-y-2">
              <button onClick={handleSaveMeta} disabled={saving}
                className="w-full py-2.5 rounded-lg bg-[#1A1A1A] hover:bg-black text-white text-sm font-medium transition disabled:opacity-50"
              >{saving ? "Saving…" : "Save changes"}</button>
              <button onClick={handleDelete} disabled={deleting}
                className="w-full py-2.5 rounded-lg border border-red-200 text-red-600 text-sm font-medium hover:bg-red-50 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                {deleting ? "Deleting…" : "Delete file"}
              </button>
            </div>
          </>
        )}
      </div>

      {/* Backdrop mobile */}
      {panelVisible && !panelExiting && (
        <div className="fixed inset-0 z-30 bg-black/10 lg:hidden" onClick={closePanel} />
      )}

      {/* ── BULK DELETE CONFIRM MODAL ── */}
      {confirmBulk && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setConfirmBulk(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900">Delete {checkedIds.size} file{checkedIds.size > 1 ? "s" : ""}?</h3>
                <p className="text-sm text-gray-500">This cannot be undone.</p>
              </div>
            </div>
            <div className="flex gap-3 pt-1">
              <button onClick={() => setConfirmBulk(false)}
                className="flex-1 py-2.5 rounded-lg border border-gray-200 text-sm font-medium hover:bg-gray-50 transition"
              >Cancel</button>
              <button onClick={handleBulkDelete} disabled={bulkDeleting}
                className="flex-1 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition disabled:opacity-50"
              >{bulkDeleting ? "Deleting…" : "Yes, delete"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
