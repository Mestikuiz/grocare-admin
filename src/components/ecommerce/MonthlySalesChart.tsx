import Chart from "react-apexcharts"
import { ApexOptions } from "apexcharts"

interface Props {
  chartData: { date: string; revenue: number; orders: number }[]
  loading: boolean
}

export default function MonthlySalesChart({ chartData, loading }: Props) {
  const labels = chartData.map((d) =>
    new Date(d.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })
  )
  const revenues = chartData.map((d) => d.revenue ?? 0)

  const options: ApexOptions = {
    colors: ["#2382AA"],
    chart: {
      fontFamily: "Outfit, sans-serif",
      type: "bar",
      height: 180,
      toolbar: { show: false },
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: "39%",
        borderRadius: 5,
        borderRadiusApplication: "end",
      },
    },
    dataLabels: { enabled: false },
    stroke: { show: true, width: 4, colors: ["transparent"] },
    xaxis: {
      categories: labels,
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    legend: { show: false },
    grid: { yaxis: { lines: { show: true } } },
    fill: { opacity: 1 },
    tooltip: {
      y: { formatter: (val: number) => `Rs. ${val.toLocaleString("en-PK")}` },
    },
  }

  const series = [{ name: "Revenue (PKR)", data: revenues }]

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white px-5 pt-5 pb-2 sm:px-6 sm:pt-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-semibold text-gray-800">Revenue — Last 7 Days</h3>
          <p className="text-sm text-gray-500">Daily revenue in PKR</p>
        </div>
      </div>

      {loading ? (
        <div className="h-[180px] flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2382AA]" />
        </div>
      ) : (
        <Chart options={options} series={series} type="bar" height={180} />
      )}
    </div>
  )
}
