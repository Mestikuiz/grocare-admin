import { useEffect, useState } from "react"
import { api } from "../../api/client"
import EcommerceMetrics from "../../components/ecommerce/EcommerceMetrics"
import MonthlySalesChart from "../../components/ecommerce/MonthlySalesChart"
import RecentOrders from "../../components/ecommerce/RecentOrders"
import TopProducts from "../../components/ecommerce/TopProducts"
import PageMeta from "../../components/common/PageMeta"

export default function Dashboard() {
  const [stats, setStats] = useState<any>(null)
  const [chartData, setChartData] = useState<any[]>([])
  const [recentOrders, setRecentOrders] = useState<any[]>([])
  const [topProducts, setTopProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAll = async () => {
      // Fire all requests independently — one failure won't block the rest
      const [statsRes, chartRes, ordersRes, topRes] = await Promise.allSettled([
        api.get("/admin/dashboard"),
        api.get("/admin/sales-chart?days=7"),
        api.get("/orders?limit=5&page=1"),
        api.get("/admin/top-products?limit=5"),
      ])

      if (statsRes.status  === "fulfilled") setStats(statsRes.value.data)
      if (chartRes.status  === "fulfilled") setChartData(chartRes.value.data?.data ?? chartRes.value.data ?? [])
      if (ordersRes.status === "fulfilled") setRecentOrders(ordersRes.value.data?.data ?? [])
      if (topRes.status    === "fulfilled") setTopProducts(topRes.value.data?.data ?? topRes.value.data ?? [])

      setLoading(false)
    }
    fetchAll()
  }, [])

  return (
    <>
      <PageMeta title="Dashboard | Grocare Admin" description="Grocare Admin Dashboard" />

      <div className="space-y-6">
        {/* Page heading */}
        <div>
          <h1 className="text-xl font-bold text-gray-900">Overview</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {new Date().toLocaleDateString("en-PK", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>

        {/* Stat cards */}
        <EcommerceMetrics stats={stats} loading={loading} />

        {/* Revenue chart — full width */}
        <MonthlySalesChart chartData={chartData} loading={loading} />

        {/* Recent orders + top products side by side */}
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <div className="xl:col-span-2">
            <RecentOrders orders={recentOrders} loading={loading} />
          </div>
          <div>
            <TopProducts products={topProducts} loading={loading} />
          </div>
        </div>
      </div>
    </>
  )
}
