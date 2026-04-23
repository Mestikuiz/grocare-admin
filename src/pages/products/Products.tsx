import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { Package } from "lucide-react";
import { api, BASE_MEDIA } from "../../api/client";

const PAGE_SIZES = [20, 50, 100];

export default function Products() {
  const navigate = useNavigate();
  const location = useLocation();
  const [products, setProducts]     = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [brands, setBrands]         = useState<any[]>([]);
  const [total, setTotal]           = useState(0);
  const [page, setPage]             = useState(1);
  const [pageSize, setPageSize]     = useState(20);
  const [loading, setLoading]       = useState(true);

  // Filters
  const [search, setSearch]         = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [filterCat, setFilterCat]   = useState("");
  const [filterBrand, setFilterBrand] = useState("");
  const [filterStock, setFilterStock] = useState("");
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Multi-select
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Toast
  const [toast, setToast] = useState<string | null>(null);
  const [toastVisible, setToastVisible] = useState(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const msg = (location.state as any)?.toast;
    if (msg) {
      // Clear navigation state so refresh doesn't re-show it
      window.history.replaceState({}, "");
      setToast(msg);
      setToastVisible(true);
      toastTimer.current = setTimeout(() => {
        setToastVisible(false);
        setTimeout(() => setToast(null), 400);
      }, 3000);
    }
    return () => { if (toastTimer.current) clearTimeout(toastTimer.current); };
  }, []);

  const fetchProducts = async (
    p = page, limit = pageSize,
    q = search, cat = filterCat,
    brand = filterBrand, stock = filterStock
  ) => {
    setLoading(true);
    try {
      const res = await api.get("/products", {
        params: {
          page: p, limit,
          search: q || undefined,
          categoryId: cat || undefined,
          brandId: brand || undefined,
          inStock: stock === "in" ? true : stock === "out" ? false : undefined,
        },
      });
      setProducts(res.data.data || []);
      setTotal(res.data.meta?.total || 0);
    } catch (_) {}
    setLoading(false);
  };

  useEffect(() => {
    fetchProducts();
    api.get("/categories").then(r => setCategories(Array.isArray(r.data) ? r.data : (r.data.data || [])));
    api.get("/brands").then(r => setBrands(r.data.data || []));
  }, []);

  useEffect(() => {
    fetchProducts(page, pageSize, search, filterCat, filterBrand, filterStock);
  }, [page]);

  const handleSearchChange = (val: string) => {
    setSearchInput(val);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setSearch(val);
      setPage(1);
      setSelected(new Set());
      fetchProducts(1, pageSize, val, filterCat, filterBrand, filterStock);
    }, 350);
  };

  const applyFilter = (cat = filterCat, brand = filterBrand, stock = filterStock) => {
    setPage(1); setSelected(new Set());
    fetchProducts(1, pageSize, search, cat, brand, stock);
  };

  const handlePageSize = (size: number) => {
    setPageSize(size); setPage(1); setSelected(new Set());
    fetchProducts(1, size, search, filterCat, filterBrand, filterStock);
  };

  const toggleSelect = (id: string) =>
    setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleAll = () =>
    setSelected(selected.size === products.length ? new Set() : new Set(products.map(p => p.id)));

  const handleBulkDelete = async () => {
    if (!confirm(`Delete ${selected.size} products? This cannot be undone.`)) return;
    await Promise.all(Array.from(selected).map(id => api.delete(`/products/${id}`).catch(() => {})));
    setSelected(new Set());
    fetchProducts(page, pageSize, search, filterCat, filterBrand, filterStock);
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-5">

      {/* ── TOAST ── */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-xl shadow-2xl text-sm font-medium bg-[#1A1A1A] text-white pointer-events-none
            ${toastVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}`}
          style={{ transition: "opacity 0.4s ease, transform 0.4s ease" }}
        >
          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-green-500 flex-shrink-0">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><path d="M20 6L9 17l-5-5"/></svg>
          </span>
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="text-sm text-gray-500">{total} products</p>
        </div>
        <Link
          to="/products/new"
          className="flex items-center gap-2 px-4 py-2.5 bg-[#1A1A1A] hover:bg-black text-white rounded-lg font-medium text-sm transition"
        >
          + Add product
        </Link>
      </div>

      {/* Filter bar */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
        <div className="flex flex-wrap gap-3">
          {/* Search */}
          <div className="flex-1 min-w-[220px] relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="15" height="15" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd"/>
            </svg>
            <input
              type="text" placeholder="Search products…"
              value={searchInput} onChange={e => handleSearchChange(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-[#2382AA]"
            />
          </div>

          {/* Category */}
          <select
            value={filterCat}
            onChange={e => { setFilterCat(e.target.value); applyFilter(e.target.value, filterBrand, filterStock); }}
            className="px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-[#2382AA]"
          >
            <option value="">All Categories</option>
            {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>

          {/* Brand */}
          <select
            value={filterBrand}
            onChange={e => { setFilterBrand(e.target.value); applyFilter(filterCat, e.target.value, filterStock); }}
            className="px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-[#2382AA]"
          >
            <option value="">All Brands</option>
            {brands.map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>

          {/* Page size */}
          <select
            value={pageSize} onChange={e => handlePageSize(Number(e.target.value))}
            className="px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-[#2382AA]"
          >
            {PAGE_SIZES.map(s => <option key={s} value={s}>Show {s}</option>)}
          </select>

          {/* Bulk actions */}
          {selected.size > 0 && (
            <button
              onClick={handleBulkDelete}
              className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition"
            >
              Delete {selected.size} selected
            </button>
          )}
        </div>

        {/* Stock quick filters */}
        <div className="flex gap-2">
          {[
            { key: "", label: "All" },
            { key: "in", label: "In Stock" },
            { key: "out", label: "Out of Stock" },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => { setFilterStock(key); applyFilter(filterCat, filterBrand, key); }}
              className={`px-3 py-1 rounded-full text-xs font-medium transition ${filterStock === key ? "bg-[#2382AA] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2382AA]" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 w-10">
                    <input
                      type="checkbox"
                      checked={products.length > 0 && selected.size === products.length}
                      onChange={toggleAll}
                      className="rounded border-gray-300 text-[#2382AA] focus:ring-[#2382AA]"
                    />
                  </th>
                  {["Product", "Status", "Inventory", "Category", "Price"].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {products.map(p => {
                  const img = p.images?.[0]
                    ? (p.images[0].startsWith("http") ? p.images[0] : `${BASE_MEDIA}${p.images[0]}`)
                    : null;
                  const isLow  = p.stock > 0 && p.stock <= (p.minStock ?? 5);
                  const isOut  = p.stock === 0;
                  return (
                    <tr
                      key={p.id}
                      className={`hover:bg-gray-50 transition-colors cursor-pointer ${selected.has(p.id) ? "bg-[#2382AA]/5" : ""}`}
                      onClick={() => navigate(`/products/${p.id}`)}
                    >
                      {/* Checkbox — stop propagation so row click doesn't interfere */}
                      <td className="px-4 py-3 w-10" onClick={e => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selected.has(p.id)}
                          onChange={() => toggleSelect(p.id)}
                          className="rounded border-gray-300 text-[#2382AA] focus:ring-[#2382AA]"
                        />
                      </td>

                      {/* Product */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg border border-gray-100 bg-gray-50 overflow-hidden flex-shrink-0 flex items-center justify-center">
                            {img
                              ? <img src={img} alt={p.name} className="w-full h-full object-cover" />
                              : <Package size={18} className="text-gray-200" />
                            }
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-[#2382AA] truncate hover:underline">{p.name}</p>
                            {p.nameUrdu && <p className="text-xs text-gray-400 truncate" dir="rtl">{p.nameUrdu}</p>}
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${p.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                          {p.isActive ? "Active" : "Draft"}
                        </span>
                        {p.isFeatured && (
                          <span className="ml-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-[#2382AA]/10 text-[#2382AA]">Featured</span>
                        )}
                      </td>

                      {/* Inventory */}
                      <td className="px-4 py-3">
                        <span className={`font-semibold text-sm ${isOut ? "text-red-500" : isLow ? "text-yellow-600" : "text-gray-700"}`}>
                          {p.stock ?? 0}
                        </span>
                        <span className="text-gray-400 text-xs ml-1">{p.unit}</span>
                        {isOut && <span className="ml-1.5 text-xs text-red-500">· Out of stock</span>}
                        {isLow && !isOut && <span className="ml-1.5 text-xs text-yellow-600">· Low</span>}
                      </td>

                      {/* Category */}
                      <td className="px-4 py-3 text-gray-500 text-xs">{p.category?.name ?? "—"}</td>

                      {/* Price */}
                      <td className="px-4 py-3">
                        <span className="font-semibold text-gray-900">Rs. {p.price?.toLocaleString()}</span>
                        {p.comparePrice && (
                          <span className="ml-1.5 text-xs text-gray-400 line-through">Rs. {p.comparePrice?.toLocaleString()}</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {products.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-16 text-center">
                      <p className="text-gray-400 text-sm">No products found</p>
                      <Link to="/products/new" className="mt-2 inline-block text-sm text-[#2382AA] hover:underline">+ Add your first product</Link>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
            <p className="text-sm text-gray-500">
              Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total}
            </p>
            <div className="flex items-center gap-2">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
                className="px-3 py-1.5 rounded-lg text-sm border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition">
                ← Prev
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const p = totalPages <= 5 ? i + 1 : page <= 3 ? i + 1 : page >= totalPages - 2 ? totalPages - 4 + i : page - 2 + i;
                return (
                  <button key={p} onClick={() => setPage(p)}
                    className={`w-8 h-8 rounded-lg text-sm transition ${page === p ? "bg-[#2382AA] text-white font-medium" : "hover:bg-gray-100 text-gray-600"}`}>
                    {p}
                  </button>
                );
              })}
              <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}
                className="px-3 py-1.5 rounded-lg text-sm border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition">
                Next →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
