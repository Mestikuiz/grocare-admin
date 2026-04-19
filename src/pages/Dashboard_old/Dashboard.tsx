import { useEffect, useState } from "react";
import { Link } from "react-router";
import ReactApexChart from "react-apexcharts";
import { api } from "../../api/client";

interface Stats {
  orders: { total: number; today: number; thisMonth: number; pending: number };
  revenue: { total: number; today: number; thisMonth: number };
  users: { total: number };
  products: { total: number; lowStock: number };
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [salesChart, setSalesChart] = useState<{ date: string; revenue: number; orders: number }[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get("/admin/dashboard"),
      api.get("/admin/sales-chart?days=14"),
      api.get("/admin/top-products?limit=5"),
      api.get("/orders?page=1&limit=8"),
    ]).then(([s, c, t, o]) => {
      setStats(s.data);
      setSalesChart(c.data);
      setTopProducts(t.data);
      setRecentOrders(o.data.data || []);
    }).finally(() => setLoading(false));
  }, []);

  const statCards = [
    { label: "Total Revenue", value: `Rs. ${(stats?.revenue.total || 0).toLocaleString()}`, sub: `Today: Rs. ${(stats?.revenue.today || 0).toLocaleString()}`, color: "from-[#FF8C00] to-[#FF3D6B]", icon: "💰" },
    { label: "Total Orders", value: (stats?.orders.total || 0).toLocaleString(), sub: `Today: ${stats?.orders.today || 0} orders`, color: "from-[#FF3D6B] to-[#7B2FBE]", icon: "📦" },
    { label: "Customers", value: (stats?.users.total || 0).toLocaleString(), sub: "Registered users", color: "from-[#7B2FBE] to-[#4F46E5]", icon: "👥" },
    { label: "Pending Orders", value: (stats?.orders.pending || 0).toLocaleString(), sub: "Needs attention", color: "from-[#F59E0B] to-[#EF4444]", icon: "⏳" },
  ];

  const chartOptions: ApexCharts.ApexOptions = {
    chart: { type: "area", toolbar: { show: false }, zoom: { enabled: false } },
    dataLabels: { enabled: false },
    stroke: { curve: "smooth", width: 2 },
    fill: { type: "gradient", gradient: { opacityFrom: 0.4, opacityTo: 0.05 } },
    colors: ["#FF3D6B", "#7B2FBE"],
    xaxis: {
      categories: salesChart.map(d => {
        const date = new Date(d.date);
        return date.toLocaleDateString("en-PK", { month: "short", day: "numeric" });
      }),
      labels: { style: { fontSize: "12px" } },
    },
    yaxis: [
      { title: { text: "Revenue (Rs.)" }, labels: { formatter: (v) => `Rs. ${v.toLocaleString()}` } },
      { opposite: true, title: { text: "Orders" } },
    ],
    tooltip: { y: { formatter: (v, { seriesIndex }) => seriesIndex === 0 ? `Rs. ${v.toLocaleString()}` : `${v} orders` } },
    legend: { position: "top" },
    grid: { borderColor: "#f3f4f6" },
  };

  const chartSeries = [
    { name: "Revenue", data: salesChart.map(d => d.revenue) },
    { name: "Orders", data: salesChart.map(d => d.orders) },
  ];

  const statusColors: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-700",
    CONFIRMED: "bg-blue-100 text-blue-700",
    PREPARING: "bg-purple-100 text-purple-700",
    READY: "bg-indigo-100 text-indigo-700",
    ASSIGNED: "bg-cyan-100 text-cyan-700",
    PICKED_UP: "bg-orange-100 text-orange-700",
    DELIVERED: "bg-green-100 text-green-700",
    CANCELLED: "bg-red-100 text-red-700",
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#FF3D6B]"></div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">Welcome back, SmartBazaar Admin</p>
        </div>
        <div className="text-sm text-gray-500 bg-white dark:bg-gray-800 px-4 py-2 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
          {new Date().toLocaleDateString("en-PK", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {statCards.map((c) => (
          <div key={c.label} className={`rounded-2xl p-5 bg-gradient-to-br ${c.color} text-white shadow-md`}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-3xl">{c.icon}</span>
              <span className="text-xs font-medium bg-white/20 px-2 py-1 rounded-full">{c.sub}</span>
            </div>
            <div className="text-2xl font-bold">{c.value}</div>
            <div className="text-sm font-medium text-white/80 mt-1">{c.label}</div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-12 gap-4">
        {/* Sales Chart */}
        <div className="col-span-12 xl:col-span-8 bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold text-gray-800 dark:text-white">Revenue & Orders</h2>
              <p className="text-xs text-gray-500">Last 14 days</p>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-gray-900 dark:text-white">Rs. {(stats?.revenue.thisMonth || 0).toLocaleString()}</div>
              <div className="text-xs text-gray-500">This month</div>
            </div>
          </div>
          {salesChart.length > 0 ? (
            <ReactApexChart options={chartOptions} series={chartSeries} type="area" height={280} />
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-400">No data yet</div>
          )}
        </div>

        {/* Summary Card */}
        <div className="col-span-12 xl:col-span-4 space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm">
            <h3 className="font-semibold text-gray-800 dark:text-white mb-4">This Month</h3>
            <div className="space-y-3">
              {[
                { label: "Revenue", value: `Rs. ${(stats?.revenue.thisMonth || 0).toLocaleString()}`, color: "text-green-600" },
                { label: "Orders", value: stats?.orders.thisMonth || 0, color: "text-blue-600" },
                { label: "Low Stock Items", value: stats?.products.lowStock || 0, color: "text-red-500" },
                { label: "Active Products", value: stats?.products.total || 0, color: "text-purple-600" },
              ].map(i => (
                <div key={i.label} className="flex items-center justify-between py-2 border-b border-gray-50 dark:border-gray-700 last:border-0">
                  <span className="text-sm text-gray-500">{i.label}</span>
                  <span className={`font-semibold ${i.color}`}>{i.value}</span>
                </div>
              ))}
            </div>
          </div>

          {stats?.products.lowStock ? (
            <div className="bg-red-50 dark:bg-red-900/20 rounded-2xl p-4 border border-red-100 dark:border-red-800">
              <div className="flex items-center gap-2 mb-1">
                <span>⚠️</span>
                <span className="font-semibold text-red-700 dark:text-red-400 text-sm">Low Stock Alert</span>
              </div>
              <p className="text-xs text-red-600 dark:text-red-300">{stats.products.lowStock} products have low inventory. Check Inventory page.</p>
              <Link to="/inventory" className="mt-2 inline-block text-xs font-medium text-red-600 hover:underline">View Inventory →</Link>
            </div>
          ) : null}
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-12 gap-4">
        {/* Recent Orders */}
        <div className="col-span-12 xl:col-span-7 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700">
            <h2 className="font-semibold text-gray-800 dark:text-white">Recent Orders</h2>
            <Link to="/orders" className="text-sm text-[#FF3D6B] hover:underline">View all →</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  {["Order #", "Customer", "Amount", "Status", "Date"].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                {recentOrders.map((o: any) => (
                  <tr key={o.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                    <td className="px-4 py-3 font-medium text-[#FF3D6B]">
                      <Link to={`/orders/${o.id}`}>#{o.orderNumber}</Link>
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{o.user?.name || o.user?.phone || "—"}</td>
                    <td className="px-4 py-3 font-semibold text-gray-800 dark:text-white">Rs. {o.total?.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[o.status] || "bg-gray-100 text-gray-600"}`}>
                        {o.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{new Date(o.createdAt).toLocaleDateString("en-PK")}</td>
                  </tr>
                ))}
                {recentOrders.length === 0 && (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">No orders yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Products */}
        <div className="col-span-12 xl:col-span-5 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700">
            <h2 className="font-semibold text-gray-800 dark:text-white">Top Products</h2>
            <Link to="/products" className="text-sm text-[#FF3D6B] hover:underline">View all →</Link>
          </div>
          <div className="divide-y divide-gray-50 dark:divide-gray-700">
            {topProducts.map((p: any, i) => (
              <div key={p.id} className="flex items-center gap-3 px-6 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                <span className="text-lg font-bold text-gray-300 w-6">#{i + 1}</span>
                {p.images?.[0] ? (
                  <img src={p.images[0]} alt={p.name} className="w-10 h-10 rounded-lg object-cover border border-gray-100" />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-lg">📦</div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-800 dark:text-white text-sm truncate">{p.name}</div>
                  <div className="text-xs text-gray-400">{p.totalSold} sold</div>
                </div>
                <div className="text-sm font-semibold text-gray-800 dark:text-white">Rs. {p.totalRevenue?.toLocaleString()}</div>
              </div>
            ))}
            {topProducts.length === 0 && (
              <div className="px-6 py-8 text-center text-gray-400 text-sm">No sales data yet</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
