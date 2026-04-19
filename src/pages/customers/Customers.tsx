import { useEffect, useState } from "react";
import { useToast } from "../../context/ToastContext";
import { api } from "../../api/client";

export default function Customers() {
  const { showToast } = useToast();
  const [customers, setCustomers] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterActive, setFilterActive] = useState("");
  const [detailUser, setDetailUser] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const LIMIT = 20;

  const fetchCustomers = async (p = page, q = search, active = filterActive) => {
    setLoading(true);
    try {
      const res = await api.get("/admin/users", {
        params: {
          page: p,
          limit: LIMIT,
          role: "CUSTOMER",
          search: q || undefined,
          isActive: active === "active" ? true : active === "inactive" ? false : undefined,
        },
      });
      setCustomers(res.data.data || []);
      setTotal(res.data.meta?.total || 0);
    } catch (_) {}
    setLoading(false);
  };

  useEffect(() => { fetchCustomers(); }, [page]);

  const openDetail = async (u: any) => {
    setDetailUser(u);
    setDetailLoading(true);
    try {
      const res = await api.get(`/admin/users/${u.id}`);
      setDetailUser(res.data.data ?? res.data);
    } catch (_) {}
    setDetailLoading(false);
  };

  const toggleBlock = async (u: any) => {
    try {
      await api.patch(`/admin/users/${u.id}`, { isActive: !u.isActive });
      fetchCustomers(page, search, filterActive);
      if (detailUser?.id === u.id) setDetailUser({ ...detailUser, isActive: !u.isActive });
      showToast(`Customer ${u.isActive ? "blocked" : "unblocked"}`);
    } catch (err: any) {
      showToast(err.response?.data?.message || "Failed", "error");
    }
  };

  const getInitials = (name: string, phone: string) => {
    if (name?.trim()) return name.trim().split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();
    return phone?.slice(-2) || "?";
  };

  const formatDate = (d: string) =>
    d ? new Date(d).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" }) : "—";

  const formatAmount = (n: number) =>
    n ? `Rs. ${n.toLocaleString()}` : "Rs. 0";

  // Stats summary from current page
  const totalOrders = customers.reduce((s, c) => s + (c.totalOrders || 0), 0);
  const totalWallet = customers.reduce((s, c) => s + (c.walletBalance || 0), 0);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Customers</h1>
          <p className="text-sm text-gray-500">{total} registered customers</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4 shadow-sm">
          <p className="text-xs text-gray-500 mb-1">Total Customers</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{total}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4 shadow-sm">
          <p className="text-xs text-gray-500 mb-1">Orders (this page)</p>
          <p className="text-2xl font-bold text-blue-600">{totalOrders}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4 shadow-sm">
          <p className="text-xs text-gray-500 mb-1">Wallet Balance (page)</p>
          <p className="text-2xl font-bold text-green-600">Rs. {totalWallet.toLocaleString()}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4 shadow-sm">
          <p className="text-xs text-gray-500 mb-1">Active Customers</p>
          <p className="text-2xl font-bold text-purple-600">{customers.filter(c => c.isActive !== false).length}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-4">
        <div className="flex flex-wrap gap-3">
          <input
            placeholder="Search by name or phone..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === "Enter" && fetchCustomers(1, search, filterActive)}
            className="flex-1 min-w-[200px] px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-[#2382AA]"
          />
          <select
            value={filterActive}
            onChange={e => { setFilterActive(e.target.value); setPage(1); fetchCustomers(1, search, e.target.value); }}
            className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm focus:outline-none"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Blocked</option>
          </select>
          <button
            onClick={() => { setPage(1); fetchCustomers(1, search, filterActive); }}
            className="px-4 py-2 rounded-xl bg-[#2382AA] hover:bg-[#1D6E91] text-white text-sm font-medium transition"
          >
            Search
          </button>
        </div>
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
                <tr className="border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Customer</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Phone</th>
                  <th className="text-center px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Orders</th>
                  <th className="text-center px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Wallet</th>
                  <th className="text-center px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Coins</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Joined</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                {customers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-16 text-center text-gray-400 text-sm">No customers found</td>
                  </tr>
                ) : customers.map((c: any) => (
                  <tr key={c.id} className="hover:bg-blue-50/30 dark:hover:bg-gray-700/30 transition-colors">
                    {/* Avatar + Name */}
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        {c.avatar ? (
                          <img src={c.avatar} alt={c.name} className="w-9 h-9 rounded-full object-cover" />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-[#2382AA] flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                            {getInitials(c.name, c.phone)}
                          </div>
                        )}
                        <div>
                          <div className="text-sm font-medium text-gray-800 dark:text-white">
                            {c.name || <span className="text-gray-400 italic">No name</span>}
                          </div>
                          {c.email && <div className="text-xs text-gray-400 truncate max-w-[140px]">{c.email}</div>}
                        </div>
                      </div>
                    </td>
                    {/* Phone */}
                    <td className="px-5 py-3">
                      <code className="text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-0.5 rounded-lg font-mono">
                        {c.phone}
                      </code>
                    </td>
                    {/* Orders */}
                    <td className="px-5 py-3 text-center">
                      <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
                        c.totalOrders > 0 ? "bg-[#2382AA]/10 text-[#2382AA]" : "bg-gray-100 text-gray-400"
                      }`}>
                        {c.totalOrders || 0}
                      </span>
                    </td>
                    {/* Wallet */}
                    <td className="px-5 py-3 text-center">
                      <span className={`text-sm font-semibold ${c.walletBalance > 0 ? "text-green-600" : "text-gray-400"}`}>
                        {formatAmount(c.walletBalance || 0)}
                      </span>
                    </td>
                    {/* Coins */}
                    <td className="px-5 py-3 text-center">
                      <span className={`text-sm font-semibold ${c.coins > 0 ? "text-yellow-600" : "text-gray-400"}`}>
                        {c.coins > 0 ? `🪙 ${c.coins}` : "—"}
                      </span>
                    </td>
                    {/* Joined */}
                    <td className="px-5 py-3 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                      {formatDate(c.createdAt)}
                    </td>
                    {/* Status */}
                    <td className="px-5 py-3">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${
                        c.isActive !== false
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                          : "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-300"
                      }`}>
                        {c.isActive !== false ? "Active" : "Blocked"}
                      </span>
                    </td>
                    {/* Actions */}
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openDetail(c)}
                          className="px-3 py-1.5 text-xs font-medium rounded-lg bg-[#2382AA]/10 hover:bg-[#2382AA]/20 text-[#2382AA] transition"
                        >
                          View
                        </button>
                        <button
                          onClick={() => toggleBlock(c)}
                          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition ${
                            c.isActive !== false
                              ? "bg-red-50 hover:bg-red-100 text-red-500 dark:bg-red-900/20"
                              : "bg-green-50 hover:bg-green-100 text-green-600 dark:bg-green-900/20"
                          }`}
                        >
                          {c.isActive !== false ? "Block" : "Unblock"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {total > LIMIT && (
        <div className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 px-6 py-4 shadow-sm">
          <span className="text-sm text-gray-500">Page {page} of {Math.ceil(total / LIMIT)} · {total} customers</span>
          <div className="flex gap-2">
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-4 py-2 rounded-xl text-sm border border-gray-200 dark:border-gray-600 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700 transition">← Prev</button>
            <button disabled={page >= Math.ceil(total / LIMIT)} onClick={() => setPage(p => p + 1)} className="px-4 py-2 rounded-xl text-sm border border-gray-200 dark:border-gray-600 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700 transition">Next →</button>
          </div>
        </div>
      )}

      {/* Customer Detail Drawer */}
      {detailUser && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/30" onClick={() => setDetailUser(null)} />
          <div className="relative w-full max-w-md bg-white dark:bg-gray-800 shadow-2xl overflow-y-auto">
            {/* Drawer Header */}
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 px-6 py-4 flex items-center justify-between z-10">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Customer Details</h2>
              <button onClick={() => setDetailUser(null)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 transition text-xl">✕</button>
            </div>

            {detailLoading ? (
              <div className="flex items-center justify-center h-48">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2382AA]"></div>
              </div>
            ) : (
              <div className="p-6 space-y-5">
                {/* Profile */}
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-[#2382AA] flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
                    {getInitials(detailUser.name, detailUser.phone)}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">{detailUser.name || "No Name"}</h3>
                    <p className="text-sm text-gray-500">{detailUser.phone}</p>
                    {detailUser.email && <p className="text-sm text-gray-400">{detailUser.email}</p>}
                    <div className="flex gap-2 mt-1">
                      <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-[#2382AA]/10 text-[#2382AA]">CUSTOMER</span>
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                        detailUser.isActive !== false ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"
                      }`}>
                        {detailUser.isActive !== false ? "Active" : "Blocked"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-[#2382AA]/10 rounded-xl p-3 text-center">
                    <p className="text-xs text-gray-500 mb-1">Orders</p>
                    <p className="text-xl font-bold text-[#2382AA]">{detailUser.totalOrders || detailUser._count?.orders || 0}</p>
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-3 text-center">
                    <p className="text-xs text-gray-500 mb-1">Wallet</p>
                    <p className="text-xl font-bold text-green-600">Rs. {(detailUser.wallet?.balance ?? detailUser.walletBalance ?? 0).toLocaleString()}</p>
                  </div>
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-3 text-center">
                    <p className="text-xs text-gray-500 mb-1">Coins</p>
                    <p className="text-xl font-bold text-yellow-600">{detailUser.wallet?.coins ?? detailUser.coins ?? 0}</p>
                  </div>
                </div>

                {/* Info */}
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Member Since</span>
                    <span className="font-medium text-gray-700 dark:text-gray-300">{formatDate(detailUser.createdAt)}</span>
                  </div>
                  {detailUser.dob && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Date of Birth</span>
                      <span className="font-medium text-gray-700 dark:text-gray-300">{formatDate(detailUser.dob)}</span>
                    </div>
                  )}
                  {detailUser.addresses?.length > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Addresses</span>
                      <span className="font-medium text-gray-700 dark:text-gray-300">{detailUser.addresses.length}</span>
                    </div>
                  )}
                </div>

                {/* Recent Orders */}
                {detailUser.orders?.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Recent Orders</h4>
                    <div className="space-y-2">
                      {detailUser.orders.map((o: any) => (
                        <div key={o.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                          <div>
                            <p className="text-sm font-medium text-gray-800 dark:text-white">{o.orderNumber}</p>
                            <p className="text-xs text-gray-400">{formatDate(o.createdAt)}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold text-gray-800 dark:text-white">Rs. {o.total?.toLocaleString()}</p>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                              o.status === "DELIVERED" ? "bg-green-100 text-green-700" :
                              o.status === "CANCELLED" ? "bg-red-100 text-red-600" :
                              "bg-blue-100 text-blue-700"
                            }`}>{o.status}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Addresses */}
                {detailUser.addresses?.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Saved Addresses</h4>
                    <div className="space-y-2">
                      {detailUser.addresses.map((a: any) => (
                        <div key={a.id} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium bg-gray-200 dark:bg-gray-600 px-2 py-0.5 rounded-full">{a.label}</span>
                            {a.isDefault && <span className="text-xs text-green-600 font-medium">Default</span>}
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{a.fullAddress}</p>
                          <p className="text-xs text-gray-400">{a.city}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Block/Unblock */}
                <button
                  onClick={() => toggleBlock(detailUser)}
                  className={`w-full py-3 rounded-xl font-medium text-sm transition ${
                    detailUser.isActive !== false
                      ? "bg-red-50 hover:bg-red-100 text-red-600 border border-red-200"
                      : "bg-green-50 hover:bg-green-100 text-green-700 border border-green-200"
                  }`}
                >
                  {detailUser.isActive !== false ? "🚫 Block This Customer" : "✓ Unblock This Customer"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
