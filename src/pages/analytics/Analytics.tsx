import { useEffect, useState } from "react";
import ReactApexChart from "react-apexcharts";
import { TrendingUp, ShoppingBag, BarChart2, Truck } from "lucide-react";
import { api } from "../../api/client";

const PERIOD_OPTIONS = [
  { label: "Today", value: 1 },
  { label: "7 Days", value: 7 },
  { label: "30 Days", value: 30 },
  { label: "90 Days", value: 90 },
];

const STATUS_COLORS: Record<string, string> = {
  DELIVERED: "#22c55e",
  PENDING: "#f59e0b",
  CONFIRMED: "#3b82f6",
  PREPARING: "#8b5cf6",
  PICKED_UP: "#06b6d4",
  ASSIGNED: "#6366f1",
  CANCELLED: "#ef4444",
  READY: "#f97316",
};

const PAYMENT_COLORS: Record<string, string> = {
  COD: "#f59e0b",
  JAZZCASH: "#ef4444",
  EASYPAISA: "#22c55e",
  WALLET: "#8b5cf6",
  CARD: "#3b82f6",
};

function TrendBadge({ value }: { value: string | null }) {
  if (!value) return <span className="text-xs text-gray-400">No data</span>;
  const num = parseFloat(value);
  const up = num >= 0;
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-semibold px-2 py-0.5 rounded-full ${up ? "bg-green-50 text-green-600" : "bg-red-50 text-red-500"}`}>
      {up ? "↑" : "↓"} {Math.abs(num)}%
    </span>
  );
}

export default function Analytics() {
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);
  const [chartLoading, setChartLoading] = useState(true);
  const [overview, setOverview] = useState<any>(null);
  const [salesData, setSalesData] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);

  useEffect(() => {
    setLoading(true);
    setChartLoading(true);
    Promise.all([
      api.get(`/admin/analytics?days=${days}`),
      api.get(`/admin/sales-chart?days=${days}`),
      api.get("/admin/top-products?limit=5"),
    ]).then(([ov, chart, top]) => {
      setOverview(ov.data);
      setSalesData(chart.data);
      setTopProducts(top.data || []);
    }).catch(() => {}).finally(() => {
      setLoading(false);
      setChartLoading(false);
    });
  }, [days]);

  const dateLabels = salesData.map(d =>
    new Date(d.date).toLocaleDateString("en-PK", { month: "short", day: "numeric" })
  );

  const revenueChartOpts: ApexCharts.ApexOptions = {
    chart: { type: "bar", toolbar: { show: false }, fontFamily: "inherit" },
    plotOptions: { bar: { borderRadius: 5, columnWidth: "55%" } },
    dataLabels: { enabled: false },
    colors: ["#2382AA"],
    xaxis: { categories: dateLabels, labels: { style: { fontSize: "11px", colors: "#9ca3af" } }, axisBorder: { show: false }, axisTicks: { show: false } },
    yaxis: { labels: { formatter: (v) => `Rs.${(v / 1000).toFixed(0)}k`, style: { fontSize: "11px", colors: "#9ca3af" } } },
    tooltip: { y: { formatter: (v) => `Rs. ${v.toLocaleString()}` } },
    grid: { borderColor: "#f3f4f6", strokeDashArray: 4 },
  };

  const ordersChartOpts: ApexCharts.ApexOptions = {
    chart: { type: "area", toolbar: { show: false }, fontFamily: "inherit" },
    stroke: { curve: "smooth", width: 2 },
    fill: { type: "gradient", gradient: { opacityFrom: 0.25, opacityTo: 0.02 } },
    dataLabels: { enabled: false },
    colors: ["#1D6E91"],
    xaxis: { categories: dateLabels, labels: { style: { fontSize: "11px", colors: "#9ca3af" } }, axisBorder: { show: false }, axisTicks: { show: false } },
    yaxis: { labels: { formatter: (v) => String(Math.round(v)), style: { fontSize: "11px", colors: "#9ca3af" } } },
    grid: { borderColor: "#f3f4f6", strokeDashArray: 4 },
    tooltip: { y: { formatter: (v) => `${v} orders` } },
  };

  // City chart
  const cityNames = overview?.byCity?.map((c: any) => c.name) || [];
  const cityRevenues = overview?.byCity?.map((c: any) => c.revenue) || [];
  const cityChartOpts: ApexCharts.ApexOptions = {
    chart: { type: "bar", toolbar: { show: false }, fontFamily: "inherit" },
    plotOptions: { bar: { borderRadius: 5, horizontal: true, barHeight: "60%" } },
    dataLabels: { enabled: false },
    colors: ["#1D6E91"],
    xaxis: { labels: { formatter: (v) => `Rs.${(+v / 1000).toFixed(0)}k`, style: { fontSize: "11px", colors: "#9ca3af" } } },
    yaxis: { labels: { style: { fontSize: "12px" } } },
    grid: { borderColor: "#f3f4f6", strokeDashArray: 4 },
    tooltip: { y: { formatter: (v) => `Rs. ${v.toLocaleString()}` } },
  };

  // Payment pie chart
  const paymentLabels = overview?.byPayment?.map((p: any) => p.method) || [];
  const paymentValues = overview?.byPayment?.map((p: any) => p.orders) || [];
  const paymentColors = paymentLabels.map((m: string) => PAYMENT_COLORS[m] || "#94a3b8");
  const paymentChartOpts: ApexCharts.ApexOptions = {
    chart: { type: "donut", fontFamily: "inherit" },
    labels: paymentLabels,
    colors: paymentColors,
    dataLabels: { enabled: false },
    legend: { position: "bottom", fontSize: "12px" },
    plotOptions: { pie: { donut: { size: "65%" } } },
    tooltip: { y: { formatter: (v) => `${v} orders` } },
  };

  // Status donut chart
  const statusLabels = overview?.byStatus?.map((s: any) => s.status) || [];
  const statusValues = overview?.byStatus?.map((s: any) => s.count) || [];
  const statusColors = statusLabels.map((s: string) => STATUS_COLORS[s] || "#94a3b8");
  const statusChartOpts: ApexCharts.ApexOptions = {
    chart: { type: "donut", fontFamily: "inherit" },
    labels: statusLabels,
    colors: statusColors,
    dataLabels: { enabled: false },
    legend: { position: "bottom", fontSize: "11px" },
    plotOptions: { pie: { donut: { size: "65%" } } },
    tooltip: { y: { formatter: (v) => `${v} orders` } },
  };

  const kpis = overview?.kpis;
  const breakdown = overview?.revenueBreakdown;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Analytics</h1>
          <p className="text-sm text-gray-500">Sales performance & business insights</p>
        </div>
        <div className="flex gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-1 shadow-sm">
          {PERIOD_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setDays(opt.value)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${
                days === opt.value
                  ? "bg-[#2382AA] text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-800 dark:hover:text-gray-300"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Total Revenue",
            value: kpis ? `Rs. ${kpis.revenue.toLocaleString()}` : "—",
            trend: kpis?.revenueTrend,
            sub: "vs previous period",
            icon: <TrendingUp size={20} />,
            gradient: "from-[#2382AA]/10 to-[#1D6E91]/10",
            iconBg: "bg-[#2382AA]/10",
            iconColor: "text-[#2382AA]",
            text: "text-[#2382AA]",
          },
          {
            label: "Total Orders",
            value: kpis ? kpis.orders.toLocaleString() : "—",
            trend: kpis?.ordersTrend,
            sub: "vs previous period",
            icon: <ShoppingBag size={20} />,
            gradient: "from-blue-500/10 to-cyan-500/10",
            iconBg: "bg-blue-500/10",
            iconColor: "text-blue-600",
            text: "text-blue-600",
          },
          {
            label: "Avg Order Value",
            value: kpis ? `Rs. ${kpis.avgOrderValue.toLocaleString()}` : "—",
            trend: kpis?.avgOrderTrend,
            sub: "per order",
            icon: <BarChart2 size={20} />,
            gradient: "from-purple-500/10 to-pink-500/10",
            iconBg: "bg-purple-500/10",
            iconColor: "text-purple-600",
            text: "text-purple-600",
          },
          {
            label: "Delivery Revenue",
            value: breakdown ? `Rs. ${breakdown.deliveryFees.toLocaleString()}` : "—",
            trend: null,
            sub: `Service: Rs. ${breakdown?.serviceFees?.toLocaleString() ?? 0}`,
            icon: <Truck size={20} />,
            gradient: "from-green-500/10 to-emerald-500/10",
            iconBg: "bg-green-500/10",
            iconColor: "text-green-600",
            text: "text-green-600",
          },
        ].map(card => (
          <div key={card.label} className={`bg-gradient-to-br ${card.gradient} rounded-2xl border border-gray-100 dark:border-gray-700 p-5 bg-white dark:bg-gray-800`}>
            <div className={`w-10 h-10 ${card.iconBg} rounded-xl flex items-center justify-center mb-3 ${card.iconColor}`}>
              {card.icon}
            </div>
            {loading ? (
              <div className="h-7 w-28 bg-gray-100 dark:bg-gray-700 rounded animate-pulse mb-2" />
            ) : (
              <div className={`text-2xl font-bold ${card.text}`}>{card.value}</div>
            )}
            <div className="text-xs font-medium text-gray-500 mt-0.5 mb-2">{card.label}</div>
            <div className="flex items-center gap-2">
              <TrendBadge value={card.trend ?? null} />
              {card.sub && <span className="text-xs text-gray-400">{card.sub}</span>}
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row 1: Revenue + Orders */}
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 lg:col-span-7 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-gray-800 dark:text-white">Revenue Over Time</h3>
              <p className="text-xs text-gray-400">Last {days} day{days > 1 ? "s" : ""}</p>
            </div>
            <span className="w-3 h-3 rounded-full bg-[#2382AA]"></span>
          </div>
          {chartLoading ? (
            <div className="h-[260px] flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2382AA]"></div></div>
          ) : (
            <ReactApexChart options={revenueChartOpts} series={[{ name: "Revenue", data: salesData.map(d => d.revenue) }]} type="bar" height={260} />
          )}
        </div>

        <div className="col-span-12 lg:col-span-5 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-gray-800 dark:text-white">Orders Over Time</h3>
              <p className="text-xs text-gray-400">Last {days} day{days > 1 ? "s" : ""}</p>
            </div>
            <span className="w-3 h-3 rounded-full bg-[#1D6E91]"></span>
          </div>
          {chartLoading ? (
            <div className="h-[260px] flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1D6E91]"></div></div>
          ) : (
            <ReactApexChart options={ordersChartOpts} series={[{ name: "Orders", data: salesData.map(d => d.orders) }]} type="area" height={260} />
          )}
        </div>
      </div>

      {/* Charts Row 2: Revenue Breakdown + City + Payment */}
      <div className="grid grid-cols-12 gap-4">

        {/* Revenue Breakdown Table */}
        <div className="col-span-12 lg:col-span-4 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6">
          <h3 className="font-semibold text-gray-800 dark:text-white mb-1">Revenue Breakdown</h3>
          <p className="text-xs text-gray-400 mb-5">Last {days} day{days > 1 ? "s" : ""}</p>
          {loading ? (
            <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-10 bg-gray-100 dark:bg-gray-700 rounded-xl animate-pulse" />)}</div>
          ) : breakdown ? (
            <div className="space-y-2">
              {[
                { label: "Gross Subtotal", value: breakdown.subtotal, color: "text-gray-800 dark:text-white" },
                { label: "Delivery Fees", value: breakdown.deliveryFees, color: "text-blue-600" },
                { label: "Service Fees", value: breakdown.serviceFees, color: "text-purple-600" },
                { label: "Promo Discounts", value: -breakdown.promoDiscounts, color: "text-red-500" },
              ].map(row => (
                <div key={row.label} className="flex items-center justify-between px-3 py-2.5 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                  <span className="text-sm text-gray-600 dark:text-gray-400">{row.label}</span>
                  <span className={`text-sm font-semibold ${row.color}`}>
                    {row.value < 0 ? "−" : ""}Rs. {Math.abs(row.value).toLocaleString()}
                  </span>
                </div>
              ))}
              <div className="flex items-center justify-between px-3 py-3 bg-gradient-to-r from-[#2382AA]/10 to-[#1D6E91]/10 rounded-xl border border-[#2382AA]/20 mt-3">
                <span className="text-sm font-bold text-gray-800 dark:text-white">Net Revenue</span>
                <span className="text-base font-bold text-[#2382AA]">Rs. {breakdown.netRevenue.toLocaleString()}</span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-8">No data</p>
          )}
        </div>

        {/* City-wise Sales */}
        <div className="col-span-12 lg:col-span-5 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6">
          <h3 className="font-semibold text-gray-800 dark:text-white mb-1">Sales by City</h3>
          <p className="text-xs text-gray-400 mb-4">Revenue per delivery city</p>
          {loading ? (
            <div className="h-[240px] flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1D6E91]"></div></div>
          ) : cityNames.length === 0 ? (
            <div className="h-[240px] flex flex-col items-center justify-center text-gray-400">
              <div className="text-4xl mb-2">🏙️</div>
              <p className="text-sm">No city data yet</p>
            </div>
          ) : (
            <ReactApexChart
              options={{ ...cityChartOpts, xaxis: { ...cityChartOpts.xaxis, categories: cityNames } }}
              series={[{ name: "Revenue", data: cityRevenues }]}
              type="bar"
              height={240}
            />
          )}
        </div>

        {/* Payment Method Split */}
        <div className="col-span-12 lg:col-span-3 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6">
          <h3 className="font-semibold text-gray-800 dark:text-white mb-1">Payment Methods</h3>
          <p className="text-xs text-gray-400 mb-4">Orders by method</p>
          {loading ? (
            <div className="h-[200px] flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2382AA]"></div></div>
          ) : paymentValues.length === 0 ? (
            <div className="h-[200px] flex flex-col items-center justify-center text-gray-400">
              <div className="text-4xl mb-2">💳</div>
              <p className="text-sm">No payment data</p>
            </div>
          ) : (
            <>
              <ReactApexChart options={paymentChartOpts} series={paymentValues} type="donut" height={200} />
              <div className="mt-3 space-y-1.5">
                {overview.byPayment.map((p: any) => (
                  <div key={p.method} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: PAYMENT_COLORS[p.method] || "#94a3b8" }}></span>
                      <span className="text-gray-600 dark:text-gray-400">{p.method}</span>
                    </div>
                    <span className="font-semibold text-gray-700 dark:text-gray-300">{p.orders}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Charts Row 3: Order Status + Top Products */}
      <div className="grid grid-cols-12 gap-4">

        {/* Order Status Donut */}
        <div className="col-span-12 lg:col-span-4 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6">
          <h3 className="font-semibold text-gray-800 dark:text-white mb-1">Order Status</h3>
          <p className="text-xs text-gray-400 mb-4">Distribution by status</p>
          {loading ? (
            <div className="h-[200px] flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1D6E91]"></div></div>
          ) : statusValues.length === 0 ? (
            <div className="h-[200px] flex flex-col items-center justify-center text-gray-400">
              <div className="text-4xl mb-2">📊</div>
              <p className="text-sm">No status data</p>
            </div>
          ) : (
            <>
              <ReactApexChart options={statusChartOpts} series={statusValues} type="donut" height={200} />
              <div className="mt-3 space-y-1.5">
                {overview.byStatus.map((s: any) => (
                  <div key={s.status} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: STATUS_COLORS[s.status] || "#94a3b8" }}></span>
                      <span className="text-gray-600 dark:text-gray-400">{s.status}</span>
                    </div>
                    <span className="font-semibold text-gray-700 dark:text-gray-300">{s.count}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Top Products */}
        <div className="col-span-12 lg:col-span-8 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-800 dark:text-white">Top Selling Products</h3>
              <p className="text-xs text-gray-400">By units sold</p>
            </div>
          </div>
          {loading ? (
            <div className="p-6 space-y-3">
              {[...Array(5)].map((_, i) => <div key={i} className="h-12 bg-gray-100 dark:bg-gray-700 rounded-xl animate-pulse" />)}
            </div>
          ) : topProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <div className="text-4xl mb-2">📦</div>
              <p className="text-sm">No sales data yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-700/50">
                  <tr>
                    {["#", "Product", "Units Sold", "Revenue", "Avg Price"].map(h => (
                      <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                  {topProducts.map((p: any, i: number) => (
                    <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                      <td className="px-5 py-3">
                        <span className="text-sm font-bold text-gray-300 dark:text-gray-600">#{i + 1}</span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          {p.images?.[0]
                            ? <img src={p.images[0]} className="w-9 h-9 rounded-xl object-cover border border-gray-100" />
                            : <div className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-base">📦</div>
                          }
                          <div>
                            <div className="font-medium text-gray-800 dark:text-white text-sm">{p.name}</div>
                            <div className="text-xs text-gray-400">Rs. {p.price?.toLocaleString()}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-xs font-bold">
                          {p.totalSold ?? 0}
                        </span>
                      </td>
                      <td className="px-5 py-3 font-semibold text-green-600 text-sm">
                        Rs. {p.totalRevenue?.toLocaleString() ?? 0}
                      </td>
                      <td className="px-5 py-3 text-gray-500 dark:text-gray-400 text-sm">
                        Rs. {p.totalSold ? Math.round(p.totalRevenue / p.totalSold).toLocaleString() : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
