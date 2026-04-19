import { useEffect, useState, useRef } from "react";
import { Package } from "lucide-react";
import { api } from "../../api/client";
import { useToast } from "../../context/ToastContext";

const STOCK_STATUSES = ["all", "in_stock", "low_stock", "out_of_stock"];
const PAGE_SIZES = [20, 50, 100];

export default function Inventory() {
  const { showToast } = useToast();
  const [inventory, setInventory] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [stockFilter, setStockFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Multi-select
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Inline edit
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editStock, setEditStock] = useState(0);
  const [editPrice, setEditPrice] = useState(0);
  const [saving, setSaving] = useState(false);

  // Bulk update modal
  const [bulkModal, setBulkModal] = useState(false);
  const [bulkStock, setBulkStock] = useState("");
  const [bulkPrice, setBulkPrice] = useState("");
  const [bulkSaving, setBulkSaving] = useState(false);

  const fetchInventory = async (
    p = page,
    limit = pageSize,
    city = selectedCity,
    cat = selectedCategory,
    q = search,
    stock = stockFilter
  ) => {
    setLoading(true);
    try {
      const params: any = { page: p, limit };
      if (city) params.cityId = city;
      if (cat) params.categoryId = cat;
      if (q) params.search = q;
      if (stock !== "all") params.stockStatus = stock;

      const res = await api.get("/cities/inventory", { params });
      setInventory(res.data.data || res.data || []);
      setTotal(res.data.meta?.total || (res.data.data || res.data || []).length);
    } catch {
      try {
        const res = await api.get("/products", { params: { page: p, limit, search: q || undefined, categoryId: cat || undefined } });
        setInventory(res.data.data || []);
        setTotal(res.data.meta?.total || 0);
      } catch { /* ignore */ }
    }
    setLoading(false);
  };

  useEffect(() => {
    api.get("/cities").then(r => setCities(r.data.data || []));
    api.get("/categories").then(r => setCategories(Array.isArray(r.data) ? r.data : (r.data.data || [])));
    fetchInventory();
  }, []);

  useEffect(() => {
    fetchInventory(page, pageSize, selectedCity, selectedCategory, search, stockFilter);
  }, [page]);

  const handleSearch = (val: string) => {
    setSearchInput(val);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setSearch(val);
      setPage(1);
      setSelected(new Set());
      fetchInventory(1, pageSize, selectedCity, selectedCategory, val, stockFilter);
    }, 350);
  };

  const applyFilters = (city = selectedCity, cat = selectedCategory, stock = stockFilter) => {
    setPage(1);
    setSelected(new Set());
    fetchInventory(1, pageSize, city, cat, search, stock);
  };

  const handlePageSize = (size: number) => {
    setPageSize(size);
    setPage(1);
    setSelected(new Set());
    fetchInventory(1, size, selectedCity, selectedCategory, search, stockFilter);
  };

  const updateStock = async (productId: string, cityId: string, stock: number, price?: number) => {
    setSaving(true);
    try {
      const body: any = { productId, stock };
      if (price !== undefined) body.price = price;
      await api.post(`/cities/${cityId}/inventory`, body);
      setEditingId(null);
      showToast("Stock updated");
      fetchInventory(page, pageSize, selectedCity, selectedCategory, search, stockFilter);
    } catch { showToast("Failed to update stock", "error"); }
    setSaving(false);
  };

  const handleBulkUpdate = async () => {
    setBulkSaving(true);
    try {
      const ids = Array.from(selected);
      await Promise.all(
        ids.map(itemId => {
          const item = inventory.find(i => i.id === itemId);
          const productId = item?.product?.id || item?.id;
          // Use the item's own cityId first, fall back to the filter dropdown
          const cityId = item?.cityId || item?.city?.id || selectedCity;
          if (!cityId) return Promise.resolve(); // skip items with no city
          const body: any = { productId };
          if (bulkStock !== "") body.stock = Number(bulkStock);
          if (bulkPrice !== "") body.price = Number(bulkPrice);
          return api.post(`/cities/${cityId}/inventory`, body);
        })
      );
      setBulkModal(false);
      setBulkStock("");
      setBulkPrice("");
      const updatedCount = selected.size;
      setSelected(new Set());
      showToast(`${updatedCount} item${updatedCount !== 1 ? "s" : ""} updated`);
      fetchInventory(page, pageSize, selectedCity, selectedCategory, search, stockFilter);
    } catch { showToast("Failed to update inventory", "error"); }
    setBulkSaving(false);
  };

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === inventory.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(inventory.map(i => i.id)));
    }
  };

  const lowStock = inventory.filter(i => {
    const s = i.stock ?? i.product?.stock ?? 0;
    return s > 0 && s <= 5;
  });
  const outOfStock = inventory.filter(i => (i.stock ?? i.product?.stock ?? 0) === 0);
  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory</h1>
          <p className="text-sm text-gray-500">{total} total items</p>
        </div>
        <div className="flex items-center gap-3">
          {outOfStock.length > 0 && (
            <span className="flex items-center gap-1.5 bg-red-50 border border-red-200 px-3 py-1.5 rounded-lg text-xs font-medium text-red-600">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block" />
              {outOfStock.length} out of stock
            </span>
          )}
          {lowStock.length > 0 && (
            <span className="flex items-center gap-1.5 bg-yellow-50 border border-yellow-200 px-3 py-1.5 rounded-lg text-xs font-medium text-yellow-600">
              <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 inline-block" />
              {lowStock.length} low stock
            </span>
          )}
        </div>
      </div>

      {/* Filters bar */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
        <div className="flex flex-wrap gap-3">
          {/* Search */}
          <div className="flex-1 min-w-[220px]">
            <input
              type="text"
              placeholder="Search products..."
              value={searchInput}
              onChange={e => handleSearch(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-[#2382AA]"
            />
          </div>

          {/* City filter */}
          <select
            value={selectedCity}
            onChange={e => { setSelectedCity(e.target.value); applyFilters(e.target.value, selectedCategory, stockFilter); }}
            className="px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-[#2382AA]"
          >
            <option value="">All Cities</option>
            {cities.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>

          {/* Category filter */}
          <select
            value={selectedCategory}
            onChange={e => { setSelectedCategory(e.target.value); applyFilters(selectedCity, e.target.value, stockFilter); }}
            className="px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-[#2382AA]"
          >
            <option value="">All Categories</option>
            {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>

          {/* Page size */}
          <select
            value={pageSize}
            onChange={e => handlePageSize(Number(e.target.value))}
            className="px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-[#2382AA]"
          >
            {PAGE_SIZES.map(s => <option key={s} value={s}>Show {s}</option>)}
          </select>

          {/* Bulk update button */}
          {selected.size > 0 && (
            <button
              onClick={() => setBulkModal(true)}
              className="px-4 py-2 rounded-lg bg-[#1A1A1A] hover:bg-black text-white text-sm font-medium transition"
            >
              Update {selected.size} selected
            </button>
          )}
        </div>

        {/* Stock status quick filters */}
        <div className="flex flex-wrap gap-2">
          {[
            { key: "all", label: "All" },
            { key: "in_stock", label: "In Stock" },
            { key: "low_stock", label: "Low Stock" },
            { key: "out_of_stock", label: "Out of Stock" },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => { setStockFilter(key); applyFilters(selectedCity, selectedCategory, key); }}
              className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                stockFilter === key ? "bg-[#2382AA] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
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
                      checked={inventory.length > 0 && selected.size === inventory.length}
                      onChange={toggleAll}
                      className="rounded border-gray-300 text-[#2382AA] focus:ring-[#2382AA]"
                    />
                  </th>
                  {["Product", "Category", "City / SKU", "Price", "Stock", "Status", "Actions"].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {inventory.map((item: any) => {
                  const product = item.product || item;
                  const stock = item.stock ?? product.stock ?? 0;
                  const price = item.price ?? product.price ?? 0;
                  const isLow = stock > 0 && stock <= 5;
                  const isOut = stock === 0;
                  const isEditing = editingId === item.id;

                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-gray-50 transition-colors ${selected.has(item.id) ? "bg-[#2382AA]/5" : ""}`}
                    >
                      {/* Checkbox */}
                      <td className="px-4 py-3 w-10">
                        <input
                          type="checkbox"
                          checked={selected.has(item.id)}
                          onChange={() => toggleSelect(item.id)}
                          className="rounded border-gray-300 text-[#2382AA] focus:ring-[#2382AA]"
                        />
                      </td>

                      {/* Product */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {product.images?.[0]
                            ? <img src={product.images[0]} className="w-10 h-10 rounded-lg object-cover border border-gray-100 flex-shrink-0" />
                            : <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0"><Package size={16} className="text-gray-400" /></div>
                          }
                          <div>
                            <div className="font-medium text-gray-900">{product.name}</div>
                            <div className="text-xs text-gray-400">{product.unit}</div>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="px-4 py-3 text-gray-500 text-xs">{product.category?.name || "—"}</td>

                      {/* City / SKU */}
                      <td className="px-4 py-3 text-gray-500 text-xs">
                        {item.city?.name ? (
                          <span className="px-2 py-0.5 rounded-full bg-[#2382AA]/10 text-[#2382AA] font-medium">{item.city.name}</span>
                        ) : "—"}
                      </td>

                      {/* Price */}
                      <td className="px-4 py-3">
                        {isEditing ? (
                          <input
                            type="number"
                            value={editPrice}
                            onChange={e => setEditPrice(+e.target.value)}
                            min={0}
                            className="w-24 px-2 py-1 rounded-lg border border-[#2382AA] text-sm focus:outline-none"
                          />
                        ) : (
                          <span className="font-semibold text-gray-900">Rs. {price.toLocaleString()}</span>
                        )}
                      </td>

                      {/* Stock */}
                      <td className="px-4 py-3">
                        {isEditing ? (
                          <input
                            type="number"
                            value={editStock}
                            onChange={e => setEditStock(+e.target.value)}
                            min={0}
                            className="w-20 px-2 py-1 rounded-lg border border-[#2382AA] text-sm focus:outline-none"
                          />
                        ) : (
                          <span className={`font-semibold ${isOut ? "text-red-500" : isLow ? "text-yellow-600" : "text-gray-900"}`}>
                            {stock}
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                          isOut ? "bg-red-100 text-red-600"
                          : isLow ? "bg-yellow-100 text-yellow-700"
                          : "bg-green-100 text-green-700"
                        }`}>
                          {isOut ? "Out of Stock" : isLow ? "Low Stock" : "In Stock"}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3">
                        {isEditing ? (
                          <div className="flex gap-1.5">
                            <button
                              disabled={saving}
                              onClick={() => updateStock(product.id, item.cityId || selectedCity, editStock, editPrice)}
                              className="px-3 py-1 text-xs bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
                            >
                              {saving ? "..." : "Save"}
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="px-3 py-1 text-xs bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => { setEditingId(item.id); setEditStock(stock); setEditPrice(price); }}
                            className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-lg transition"
                          >
                            Edit
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {inventory.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-gray-400">No inventory data found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
            <div className="text-sm text-gray-500">
              Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total} items
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                className="px-3 py-1.5 rounded-lg text-sm border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition"
              >
                ← Prev
              </button>

              {/* Page numbers */}
              <div className="flex gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let p: number;
                  if (totalPages <= 5) {
                    p = i + 1;
                  } else if (page <= 3) {
                    p = i + 1;
                  } else if (page >= totalPages - 2) {
                    p = totalPages - 4 + i;
                  } else {
                    p = page - 2 + i;
                  }
                  return (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`w-8 h-8 rounded-lg text-sm transition ${
                        page === p ? "bg-[#2382AA] text-white font-medium" : "hover:bg-gray-100 text-gray-600"
                      }`}
                    >
                      {p}
                    </button>
                  );
                })}
              </div>

              <button
                disabled={page >= totalPages}
                onClick={() => setPage(p => p + 1)}
                className="px-3 py-1.5 rounded-lg text-sm border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition"
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bulk update modal */}
      {bulkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setBulkModal(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 p-6 space-y-5">
            <h2 className="text-lg font-bold text-gray-900">Bulk Update — {selected.size} items</h2>
            <p className="text-sm text-gray-500">Leave a field blank to skip updating it.</p>

            {!selectedCity && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-sm text-blue-700">
                Each item will be updated in its own city. Select a city filter above to restrict to one city.
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Set Stock Quantity</label>
                <input
                  type="number"
                  min={0}
                  value={bulkStock}
                  onChange={e => setBulkStock(e.target.value)}
                  placeholder="e.g. 50"
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#2382AA]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Set Price (Rs.)</label>
                <input
                  type="number"
                  min={0}
                  value={bulkPrice}
                  onChange={e => setBulkPrice(e.target.value)}
                  placeholder="e.g. 150"
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#2382AA]"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => { setBulkModal(false); setBulkStock(""); setBulkPrice(""); }}
                className="flex-1 px-4 py-2.5 rounded-lg border border-gray-200 text-sm font-medium hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                disabled={bulkSaving || (!bulkStock && !bulkPrice)}
                onClick={handleBulkUpdate}
                className="flex-1 px-4 py-2.5 rounded-lg bg-[#1A1A1A] hover:bg-black text-white text-sm font-medium transition disabled:opacity-50"
              >
                {bulkSaving ? "Updating..." : "Apply Update"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
