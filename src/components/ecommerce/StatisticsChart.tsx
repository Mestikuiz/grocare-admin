import Chart from "react-apexcharts"
import { ApexOptions } from "apexcharts"

interface Props {
  chartData: { date: string; revenue: number; orders: number }[]
  loading: boolean
}

export default function StatisticsChart({ chartData, loading }: Props) {
  const labels = chartData.map((d) =>
    new Date(d.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })
  )
  const revenues = chartData.map((d) => d.revenue ?? 0)
  const orders = chartData.map((d) => d.orders ?? 0)

  const options: ApexOptions = {
    legend: {
      show: true,
      position: "top",
      horizontalAlign: "left",
    },
    colors: ["#2382AA", "#465FFF"],
    chart: {
      fontFamily: "Outfit, sans-serif",
      height: 310,
      type: "area",
      toolbar: { show: false },
    },
    fill: {
      type: "gradient",
      gradient: {
        opacityFrom: 0.55,
        opacityTo: 0,
      },
    },
    stroke: { curve: "smooth", width: [2, 2] },
    markers: { size: 0 },
    grid: {
      xaxis: { lines: { show: false } },
      yaxis: { lines: { show: true } },
    },
    dataLabels: { enabled: false },
    tooltip: {
      x: { show: true },
      y: [
        { formatter: (val: number) => `Rs. ${val.toLocaleString("en-PK")}` },
        { formatter: (val: number) => `${val} orders` },
      ],
    },
    xaxis: {
      type: "category",
      categories: labels,
      axisBorder: { show: false },
      axisTicks: { show: false },
      tooltip: { enabled: false },
    },
    yaxis: [
      {
        title: { text: "Revenue (PKR)", style: { fontSize: "12px" } },
        labels: { formatter: (val: number) => `Rs. ${(val / 1000).toFixed(0)}k` },
      },
      {
        opposite: true,
        title: { text: "Orders", style: { fontSize: "12px" } },
        labels: { formatter: (val: number) => `${val}` },
      },
    ],
  }

  const series = [
    { name: "Revenue (PKR)", data: revenues },
    { name: "Orders", data: orders },
  ]

  return (
    <div className="rounded-2xl border border-gray-200 bg-white px-5 pt-5 pb-3 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          Orders & Revenue — Last 7 Days
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Daily orders and revenue trend
        </p>
      </div>

      {loading ? (
        <div className="h-[310px] flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2382AA]" />
        </div>
      ) : (
        <Chart options={options} series={series} type="area" height={310} />
      )}
    </div>
  )
}
