import { useEffect, useState } from "react";
import { useToast } from "../../context/ToastContext";
import { api } from "../../api/client";

export default function Riders() {
  const { showToast } = useToast();
  const [riders, setRiders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);
  const [detailRider, setDetailRider] = useState<any>(null);
  const [riderOrders, setRiderOrders] = useState<any[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  const fetchRiders = async () => {
    setLoading(true);
    try {
      const res = await api.get("/riders");
      setRiders(res.data || []);
    } catch (_) {}
    setLoading(false);
  };

  useEffect(() => { fetchRiders(); }, []);

  const openDetail = async (rider: any) => {
    setDetailRider(rider);
    setRiderOrders([]);
    setOrdersLoading(true);
    try {
      const res = await api.get("/orders", {
        params: { riderId: rider.id, limit: 10, page: 1 },
      });
      setRiderOrders(res.data.data || []);
    } catch (_) {}
    setOrdersLoading(false);
  };

  const toggleAvailability = async (rider: any) => {
    setToggling(rider.id);
    try {
      await api.patch(`/riders/${rider.id}`, { isAvailable: !rider.isAvailable });
      setRiders(prev => prev.map(r => r.id === rider.id ? { ...r, isAvailable: !r.isAvailable } : r));
      if (detailRider?.id === rider.id) setDetailRider({ ...detailRider, isAvailable: !rider.isAvailable });
      showToast(`Rider marked ${!rider.isAvailable ? "available" : "unavailable"}`);
    } catch (err: any) {
      showToast(err.response?.data?.message || "Update failed", "error");
    }
    setToggling(null);
  };

  const updateZone = async (rider: any, zone: string) => {
    try {
      await api.patch(`/riders/${rider.id}`, { zone });
      setRiders(prev => prev.map(r => r.id === rider.id ? { ...r, zone } : r));
      if (detailRider?.id === rider.id) setDetailRider({ ...detailRider, zone });
    } catch (_) {}
  };

  const getInitial = (user: any) => {
    const name = user?.name || "";
    const phone = user?.phone || "";
    if (name.trim()) return name.trim().split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase();
    if (phone.trim()) return phone.trim().slice(-2);
    return "R";
  };

  const formatDate = (d: string) =>
    d ? new Date(d).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" }) : "—";

  const available = riders.filter(r => r.isAvailable).length;
  const total = riders.length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Riders</h1>
          <p className="text-sm text-gray-500">{total} total · {available} available now</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-5">
          <div className="text-3xl font-bold text-gray-800 dark:text-white">{total}</div>
          <div className="text-sm text-gray-500 mt-1">Total Riders</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-green-100 dark:border-green-900/30 shadow-sm p-5">
          <div className="text-3xl font-bold text-green-600">{available}</div>
          <div className="text-sm text-gray-500 mt-1">Available</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-red-100 dark:border-red-900/30 shadow-sm p-5">
          <div className="text-3xl font-bold text-red-500">{total - available}</div>
          <div className="text-sm text-gray-500 mt-1">Unavailable</div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Rider</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Phone</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Zone</th>
                  <th className="text-center px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Orders</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                {riders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-16 text-center text-gray-400 text-sm">No riders found</td>
                  </tr>
                ) : riders.map((rider: any) => (
                  <tr key={rider.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                    {/* Avatar + Name */}
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                          {getInitial(rider.user)}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-800 dark:text-white">
                            {rider.user?.name || <span className="text-gray-400 italic">No name</span>}
                          </div>
                          <div className="text-xs text-gray-400">#{rider.id.slice(0, 8)}</div>
                        </div>
                      </div>
                    </td>
                    {/* Phone */}
                    <td className="px-5 py-3">
                      <code className="text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-0.5 rounded-lg font-mono">
                        {rider.user?.phone || "—"}
                      </code>
                    </td>
                    {/* Zone */}
                    <td className="px-5 py-3">
                      {rider.zone ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-xs font-medium">
                          📍 {rider.zone}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-sm">—</span>
                      )}
                    </td>
                    {/* Total Orders */}
                    <td className="px-5 py-3 text-center">
                      <span className="text-sm font-bold text-gray-700 dark:text-gray-300">{rider.totalOrders ?? 0}</span>
                    </td>
                    {/* Status */}
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                        rider.isAvailable
                          ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300"
                          : "bg-red-50 text-red-500 dark:bg-red-900/20 dark:text-red-400"
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${rider.isAvailable ? "bg-green-500" : "bg-red-400"}`}></span>
                        {rider.isAvailable ? "Available" : "Unavailable"}
                      </span>
                    </td>
                    {/* Actions */}
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openDetail(rider)}
                          className="px-3 py-1.5 text-xs font-medium rounded-lg bg-green-50 hover:bg-green-100 text-green-700 dark:bg-green-900/20 transition"
                        >
                          View
                        </button>
                        <button
                          onClick={() => toggleAvailability(rider)}
                          disabled={toggling === rider.id}
                          className={`relative w-11 h-6 rounded-full transition-colors duration-200 flex-shrink-0 ${
                            rider.isAvailable ? "bg-green-500" : "bg-gray-200 dark:bg-gray-600"
                          } ${toggling === rider.id ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
                        >
                          <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform shadow ${rider.isAvailable ? "translate-x-6" : "translate-x-1"}`}></div>
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

      {/* Rider Detail Drawer */}
      {detailRider && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/30" onClick={() => setDetailRider(null)} />
          <div className="relative w-full max-w-md bg-white dark:bg-gray-800 shadow-2xl overflow-y-auto flex flex-col">
            {/* Drawer Header */}
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 px-6 py-4 flex items-center justify-between z-10 flex-shrink-0">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Rider Details</h2>
              <button onClick={() => setDetailRider(null)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 transition text-xl">✕</button>
            </div>

            <div className="p-6 space-y-5">
              {/* Profile */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
                  {getInitial(detailRider.user)}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">{detailRider.user?.name || "No Name"}</h3>
                  <p className="text-sm text-gray-500">{detailRider.user?.phone}</p>
                  <div className="flex gap-2 mt-1">
                    <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">RIDER</span>
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                      detailRider.isAvailable ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"
                    }`}>
                      {detailRider.isAvailable ? "Available" : "Unavailable"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 text-center">
                  <p className="text-xs text-gray-500 mb-1">Total Deliveries</p>
                  <p className="text-2xl font-bold text-green-600">{detailRider.totalOrders ?? 0}</p>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 text-center">
                  <p className="text-xs text-gray-500 mb-1">Zone</p>
                  <p className="text-lg font-bold text-blue-600">{detailRider.zone || "—"}</p>
                </div>
              </div>

              {/* Location */}
              {(detailRider.latitude || detailRider.longitude) && (
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
                  <p className="text-xs font-semibold text-gray-500 mb-2">Last Known Location</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300 font-mono">
                    {detailRider.latitude?.toFixed(6)}, {detailRider.longitude?.toFixed(6)}
                  </p>
                </div>
              )}

              {/* Zone Edit */}
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Update Zone</label>
                <div className="flex gap-2">
                  <input
                    id="zoneInput"
                    defaultValue={detailRider.zone || ""}
                    placeholder="e.g. Gulshan, DHA, Saddar"
                    className="flex-1 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                  />
                  <button
                    onClick={() => {
                      const val = (document.getElementById("zoneInput") as HTMLInputElement)?.value;
                      if (val !== undefined) updateZone(detailRider, val);
                    }}
                    className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white text-sm rounded-xl transition font-medium"
                  >
                    Save
                  </button>
                </div>
              </div>

              {/* Recent Orders */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Recent Deliveries</h4>
                {ordersLoading ? (
                  <div className="flex justify-center py-6">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-500"></div>
                  </div>
                ) : riderOrders.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-4">No deliveries yet</p>
                ) : (
                  <div className="space-y-2">
                    {riderOrders.map((o: any) => (
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
                            o.status === "PICKED_UP" ? "bg-blue-100 text-blue-700" :
                            "bg-yellow-100 text-yellow-700"
                          }`}>{o.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Toggle Availability */}
              <button
                onClick={() => toggleAvailability(detailRider)}
                disabled={toggling === detailRider.id}
                className={`w-full py-3 rounded-xl font-medium text-sm transition border ${
                  detailRider.isAvailable
                    ? "bg-red-50 hover:bg-red-100 text-red-600 border-red-200"
                    : "bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
                }`}
              >
                {detailRider.isAvailable ? "🔴 Mark as Unavailable" : "🟢 Mark as Available"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
