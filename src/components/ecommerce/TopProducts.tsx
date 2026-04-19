import { Link } from "react-router"
import { BASE_MEDIA } from "../../api/client"

interface Props {
  products: any[]
  loading: boolean
}

export default function TopProducts({ products, loading }: Props) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-semibold text-gray-800">Top Products</h3>
          <p className="text-sm text-gray-500">Best selling products</p>
        </div>
        <Link
          to="/products"
          className="text-sm text-[#2382AA] hover:underline font-medium"
        >
          View all
        </Link>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-3 animate-pulse">
              <div className="w-10 h-10 rounded-lg bg-gray-200 dark:bg-gray-700 shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 w-32 bg-gray-200 dark:bg-gray-700 rounded" />
                <div className="h-2.5 w-20 bg-gray-200 dark:bg-gray-700 rounded" />
              </div>
              <div className="h-3 w-16 bg-gray-200 dark:bg-gray-700 rounded" />
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="py-8 text-center text-gray-400 text-sm">No sales data yet</div>
      ) : (
        <div className="space-y-4">
          {products.map((p: any, i: number) => (
            <div key={p.id} className="flex items-center gap-3">
              <span className="text-sm font-bold text-gray-400 w-4 shrink-0">{i + 1}</span>
              <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 overflow-hidden shrink-0 flex items-center justify-center">
                {p.images?.[0] ? (
                  <img
                    src={`${BASE_MEDIA}${p.images[0]}`}
                    alt={p.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-lg">📦</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 dark:text-white truncate">{p.name}</p>
                <p className="text-xs text-gray-400">{p.totalSold ?? 0} sold</p>
              </div>
              <p className="text-sm font-semibold text-[#2382AA] shrink-0">
                Rs. {(p.revenue ?? 0).toLocaleString("en-PK")}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
