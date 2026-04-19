import Chart from "react-apexcharts"
import { ApexOptions } from "apexcharts"

interface Props {
  stats: any
  loading: boolean
}

export default function MonthlyTarget({ stats, loading }: Props) {
  const todayRevenue = stats?.revenue?.today ?? 0
  const totalRevenue = stats?.revenue?.total ?? 0
  const todayOrders = stats?.orders?.today ?? 0
  const totalOrders = stats?.orders?.total ?? 0

  // today's revenue as % of total (or 0 if no data)
  const pct = totalRevenue > 0 ? Math.min(Math.round((todayRevenue / totalRevenue) * 100), 100) : 0

  const options: ApexOptions = {
    colors: ["#2382AA"],
    chart: {
      fontFamily: "Outfit, sans-serif",
      type: "radialBar",
      height: 330,
      sparkline: { enabled: true },
    },
    plotOptions: {
      radialBar: {
        startAngle: -85,
        endAngle: 85,
        hollow: { size: "80%" },
        track: {
          background: "#E4E7EC",
          strokeWidth: "100%",
          margin: 5,
        },
        dataLabels: {
          name: {
            show: true,
            offsetY: -10,
            fontSize: "13px",
            color: "#6B7280",
          },
          value: {
            show: true,
            fontSize: "28px",
            fontWeight: "700",
            color: "#111827",
            offsetY: -40,
            formatter: (val: number) => `${val}%`,
          },
        },
      },
    },
    fill: { type: "solid" },
    stroke: { lineCap: "round" },
    labels: ["Today vs Total"],
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
      <div className="mb-2">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Today's Performance</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">Today vs all-time total</p>
      </div>

      {loading ? (
        <div className="h-[200px] flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2382AA]" />
        </div>
      ) : (
        <>
          <Chart options={options} series={[pct]} type="radialBar" height={280} />

          <div className="grid grid-cols-2 gap-4 mt-2">
            <div className="rounded-xl bg-gray-50 dark:bg-gray-800 p-4 text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Today Orders</p>
              <p className="text-xl font-bold text-gray-800 dark:text-white">{todayOrders}</p>
              <p className="text-xs text-gray-400 mt-1">of {totalOrders} total</p>
            </div>
            <div className="rounded-xl bg-gray-50 dark:bg-gray-800 p-4 text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Today Revenue</p>
              <p className="text-xl font-bold text-[#2382AA]">
                Rs. {todayRevenue.toLocaleString("en-PK")}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                of Rs. {totalRevenue.toLocaleString("en-PK")}
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
