import { useEffect, useState } from "react";
import { Package } from "lucide-react";
import { api } from "../../api/client";

export default function Reports() {
  const [stats, setStats] = useState<any>(null);
  const [salesData, setSalesData] = useState<any[]>([]);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get("/admin/dashboard"),
      api.get(`/admin/sales-chart?days=${days}`),
      api.get("/admin/top-products?limit=10"),
    ]).then(([s, c, t]) => {
      setStats({ ...s.data, topProducts: t.data });
      setSalesData(c.data);
    }).finally(() => setLoading(false));
  }, [days]);

  const downloadCSV = () => {
    const headers = ["Date", "Revenue (Rs.)", "Orders"];
    const rows = salesData.map(d => [d.date, d.revenue, d.orders]);
    const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `grocare-report-${days}days.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const downloadTopProductsCSV = () => {
    if (!stats?.topProducts) return;
    const headers = ["Rank", "Product", "Units Sold", "Revenue (Rs.)"];
    const rows = stats.topProducts.map((p: any, i: number) => [i + 1, p.name, p.totalSold, p.totalRevenue]);
    const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "grocare-top-products.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  const totalRevenue = salesData.reduce((s, d) => s + d.revenue, 0);
  const totalOrders = salesData.reduce((s, d) => s + d.orders, 0);
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  const bestDay = salesData.reduce((best: any, d) => (!best || d.revenue > best.revenue) ? d : best, null);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reports</h1>
          <p className="text-sm text-gray-500">Sales & performance reports</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {[7, 14, 30, 90].map(d => (
            <button key={d} onClick={() => setDays(d)} className={`px-4 py-2 rounded-xl text-sm font-medium transition ${days === d ? "bg-[#2382AA] text-white shadow-sm" : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50"}`}>{d}d</button>
          ))}
          <button onClick={downloadCSV} className="px-4 py-2 rounded-xl bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition">⬇ Export CSV</button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2382AA]"></div></div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Total Revenue", value: `Rs. ${totalRevenue.toLocaleString()}`, icon: "💰", color: "bg-gradient-to-br from-[#2382AA] to-[#1D6E91] text-white" },
              { label: "Total Orders", value: totalOrders.toLocaleString(), icon: "📦", color: "bg-[#2382AA] text-white" },
              { label: "Avg Order Value", value: `Rs. ${Math.round(avgOrderValue).toLocaleString()}`, icon: "📊", color: "bg-gradient-to-br from-[#2382AA] to-[#4F46E5] text-white" },
              { label: "Best Day Revenue", value: bestDay ? `Rs. ${bestDay.revenue.toLocaleString()}` : "—", icon: "🏆", color: "bg-gradient-to-br from-green-500 to-emerald-600 text-white" },
            ].map(c => (
              <div key={c.label} className={`rounded-2xl p-5 shadow-md ${c.color}`}>
                <div className="text-2xl mb-2">{c.icon}</div>
                <div className="text-xl font-bold">{c.value}</div>
                <div className="text-sm font-medium opacity-80 mt-0.5">{c.label}</div>
              </div>
            ))}
          </div>

          {/* Daily Breakdown Table */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700">
              <h3 className="font-semibold text-gray-800 dark:text-white">Daily Breakdown — Last {days} days</h3>
              <button onClick={downloadCSV} className="text-xs text-[#2382AA] hover:underline">Export →</button>
            </div>
            <div className="overflow-x-auto max-h-80">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-700/50 sticky top-0">
                  <tr>
                    {["Date", "Revenue", "Orders", "Avg Order"].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                  {[...salesData].reverse().map((d, i) => (
                    <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-700 dark:text-gray-300">
                        {new Date(d.date).toLocaleDateString("en-PK", { weekday: "short", month: "short", day: "numeric" })}
                      </td>
                      <td className="px-4 py-3 font-semibold text-green-600">Rs. {d.revenue.toLocaleString()}</td>
                      <td className="px-4 py-3 text-blue-600 font-medium">{d.orders}</td>
                      <td className="px-4 py-3 text-gray-600">Rs. {d.orders > 0 ? Math.round(d.revenue / d.orders).toLocaleString() : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Top Products Report */}
          {stats?.topProducts?.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700">
                <h3 className="font-semibold text-gray-800 dark:text-white">Top Selling Products</h3>
                <button onClick={downloadTopProductsCSV} className="text-xs text-[#2382AA] hover:underline">Export →</button>
              </div>
              <div className="divide-y divide-gray-50 dark:divide-gray-700">
                {stats.topProducts.map((p: any, i: number) => (
                  <div key={p.id} className="flex items-center gap-4 px-6 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                    <span className="w-8 text-center text-lg font-bold text-gray-300">#{i + 1}</span>
                    {p.images?.[0] ? <img src={p.images[0]} className="w-10 h-10 rounded-xl object-cover border border-gray-100" /> : <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center"><Package size={18} className="text-gray-300" /></div>}
                    <div className="flex-1">
                      <div className="font-medium text-gray-800 dark:text-white">{p.name}</div>
                      <div className="text-xs text-gray-400">{p.totalSold} units sold</div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-green-600">Rs. {p.totalRevenue?.toLocaleString()}</div>
                      <div className="text-xs text-gray-400">revenue</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
