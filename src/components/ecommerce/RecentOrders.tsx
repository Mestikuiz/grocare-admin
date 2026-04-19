import { Link } from "react-router"

interface Props {
  orders: any[]
  loading: boolean
}

const STATUS_COLORS: Record<string, string> = {
  PENDING:   "bg-yellow-100 text-yellow-700",
  CONFIRMED: "bg-blue-100 text-blue-700",
  PREPARING: "bg-purple-100 text-purple-700",
  READY:     "bg-indigo-100 text-indigo-700",
  ASSIGNED:  "bg-cyan-100 text-cyan-700",
  PICKED_UP: "bg-orange-100 text-orange-700",
  DELIVERED: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-700",
}

export default function RecentOrders({ orders, loading }: Props) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <div>
          <h3 className="text-base font-semibold text-gray-800">Recent Orders</h3>
          <p className="text-sm text-gray-500">Latest 5 orders</p>
        </div>
        <Link
          to="/orders"
          className="text-sm font-medium text-[#2382AA] hover:underline"
        >
          View all
        </Link>
      </div>

      {loading ? (
        <div className="py-10 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2382AA]" />
        </div>
      ) : orders.length === 0 ? (
        <div className="py-10 text-center text-sm text-gray-400">No orders yet</div>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              {["Order #", "Customer", "Amount", "Status", "Date"].map(h => (
                <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {orders.map((order: any) => (
              <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-5 py-3">
                  <Link to={`/orders/${order.id}`} className="font-medium text-[#2382AA] hover:underline">
                    #{order.orderNumber}
                  </Link>
                </td>
                <td className="px-5 py-3 text-gray-700">{order.user?.name || order.user?.phone || "—"}</td>
                <td className="px-5 py-3 font-medium text-gray-800">Rs. {(order.total ?? 0).toLocaleString("en-PK")}</td>
                <td className="px-5 py-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[order.status] ?? "bg-gray-100 text-gray-600"}`}>
                    {order.status}
                  </span>
                </td>
                <td className="px-5 py-3 text-xs text-gray-400">
                  {new Date(order.createdAt).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
