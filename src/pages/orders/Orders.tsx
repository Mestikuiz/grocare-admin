import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { api } from "../../api/client";
import CreateOrderModal from "./CreateOrderModal";

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  CONFIRMED: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  PREPARING: "bg-purple-100 text-purple-700",
  READY: "bg-indigo-100 text-indigo-700",
  ASSIGNED: "bg-cyan-100 text-cyan-700",
  PICKED_UP: "bg-orange-100 text-orange-700",
  DELIVERED: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  CANCELLED: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

const ALL_STATUSES = ["PENDING","CONFIRMED","PREPARING","READY","ASSIGNED","PICKED_UP","DELIVERED","CANCELLED"];

export default function Orders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);

  const fetchOrders = async (p = page, s = status, q = search) => {
    setLoading(true);
    try {
      const res = await api.get("/orders", { params: { page: p, limit: 20, status: s || undefined, search: q || undefined } });
      setOrders(res.data.data || []);
      setTotal(res.data.meta?.total || 0);
    } catch (_) {}
    setLoading(false);
  };

  useEffect(() => { fetchOrders(); }, [page]);

  const updateStatus = async (id: string, newStatus: string) => {
    await api.put(`/orders/${id}/status`, { status: newStatus });
    fetchOrders();
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
          <p className="text-sm text-gray-500">{total} total orders</p>
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#1A1A1A] hover:bg-black text-white rounded-lg font-medium text-sm transition"
        >
          + Create order
        </button>
      </div>
      {createOpen && (
        <CreateOrderModal
          onClose={() => setCreateOpen(false)}
          onCreated={(orderId: string) => { setCreateOpen(false); navigate(`/orders/${orderId}`); }}
        />
      )}

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-4">
        <div className="flex flex-wrap gap-3">
          <input
            type="text"
            placeholder="Search by order # or customer..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === "Enter" && fetchOrders(1)}
            className="flex-1 min-w-[200px] px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-[#2382AA]"
          />
          <select
            value={status}
            onChange={e => { setStatus(e.target.value); fetchOrders(1, e.target.value); }}
            className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-[#2382AA]"
          >
            <option value="">All Statuses</option>
            {ALL_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <button
            onClick={() => fetchOrders(1)}
            className="px-4 py-2 rounded-xl bg-[#2382AA] text-white text-sm font-medium hover:bg-[#e5365f] transition"
          >Search</button>
        </div>

        {/* Status quick filters */}
        <div className="flex flex-wrap gap-2 mt-3">
          <button onClick={() => { setStatus(""); fetchOrders(1, ""); }} className={`px-3 py-1 rounded-full text-xs font-medium transition ${!status ? "bg-[#2382AA] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>All</button>
          {ALL_STATUSES.map(s => (
            <button key={s} onClick={() => { setStatus(s); fetchOrders(1, s); }}
              className={`px-3 py-1 rounded-full text-xs font-medium transition ${status === s ? "bg-[#2382AA] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2382AA]"></div></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700">
                <tr>
                  {["Order #", "Customer", "Items", "Total", "Payment", "Status", "Date", "Actions"].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                {orders.map(o => (
                  <tr key={o.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                    <td className="px-4 py-3">
                      <Link to={`/orders/${o.id}`} className="font-semibold text-[#2382AA] hover:underline">#{o.orderNumber}</Link>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-800 dark:text-white">{o.user?.name || "—"}</div>
                      <div className="text-xs text-gray-400">{o.user?.phone}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{o._count?.items || o.items?.length || 0} items</td>
                    <td className="px-4 py-3 font-semibold text-gray-800 dark:text-white">Rs. {o.total?.toLocaleString()}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{o.paymentMethod}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[o.status] || "bg-gray-100 text-gray-600"}`}>{o.status}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">{new Date(o.createdAt).toLocaleDateString("en-PK")}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <Link to={`/orders/${o.id}`} className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg transition">View</Link>
                        {o.status === "PENDING" && (
                          <button onClick={() => updateStatus(o.id, "CONFIRMED")} className="px-2 py-1 text-xs bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition">Confirm</button>
                        )}
                        {o.status === "CONFIRMED" && (
                          <button onClick={() => updateStatus(o.id, "PREPARING")} className="px-2 py-1 text-xs bg-purple-50 text-purple-600 hover:bg-purple-100 rounded-lg transition">Prepare</button>
                        )}
                        {(o.status === "PENDING" || o.status === "CONFIRMED") && (
                          <button onClick={() => updateStatus(o.id, "CANCELLED")} className="px-2 py-1 text-xs bg-red-50 text-red-500 hover:bg-red-100 rounded-lg transition">Cancel</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {orders.length === 0 && (
                  <tr><td colSpan={8} className="px-4 py-12 text-center text-gray-400">No orders found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
        {/* Pagination */}
        {total > 20 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 dark:border-gray-700">
            <span className="text-sm text-gray-500">Page {page} of {Math.ceil(total / 20)}</span>
            <div className="flex gap-2">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1.5 rounded-lg text-sm border disabled:opacity-40 hover:bg-gray-50 transition">← Prev</button>
              <button disabled={page >= Math.ceil(total / 20)} onClick={() => setPage(p => p + 1)} className="px-3 py-1.5 rounded-lg text-sm border disabled:opacity-40 hover:bg-gray-50 transition">Next →</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
