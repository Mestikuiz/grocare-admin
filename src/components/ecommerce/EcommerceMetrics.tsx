interface Props {
  stats: any
  loading: boolean
}

function StatCard({
  label,
  value,
  today,
  todayLabel = "today",
  positive,
}: {
  label: string
  value: string | number
  today?: string | number
  todayLabel?: string
  positive?: boolean
}) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{label}</p>
      <p className="mt-2 text-2xl font-bold text-gray-900">{value}</p>
      {today !== undefined && (
        <p className={`mt-1 text-xs font-medium ${positive !== false ? "text-green-600" : "text-gray-400"}`}>
          {typeof today === "number" && today > 0 ? "+" : ""}{today} {todayLabel}
        </p>
      )}
    </div>
  )
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5 animate-pulse">
      <div className="h-3 w-24 bg-gray-200 rounded" />
      <div className="mt-2 h-7 w-20 bg-gray-200 rounded" />
      <div className="mt-1 h-3 w-16 bg-gray-200 rounded" />
    </div>
  )
}

export default function EcommerceMetrics({ stats, loading }: Props) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {[1, 2, 3, 4].map((i) => <SkeletonCard key={i} />)}
      </div>
    )
  }

  const pkr = (n: number) => `Rs. ${(n ?? 0).toLocaleString("en-PK")}`
  const fmt = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n ?? 0)

  return (
    <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
      <StatCard
        label="Total Revenue"
        value={pkr(stats?.revenue?.total ?? 0)}
        today={pkr(stats?.revenue?.today ?? 0)}
        todayLabel="today"
        positive
      />
      <StatCard
        label="Total Orders"
        value={fmt(stats?.orders?.total ?? 0)}
        today={stats?.orders?.today ?? 0}
        todayLabel="today"
        positive
      />
      <StatCard
        label="Customers"
        value={fmt(stats?.users?.total ?? 0)}
        today={stats?.users?.today ?? 0}
        todayLabel="new"
        positive
      />
      <StatCard
        label="Products"
        value={stats?.products?.total ?? 0}
        today={stats?.products?.lowStock ?? 0}
        todayLabel="low stock"
        positive={false}
      />
    </div>
  )
}
