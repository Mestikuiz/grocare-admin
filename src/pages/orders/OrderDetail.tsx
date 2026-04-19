import { useEffect, useState } from "react";
import { useToast } from "../../context/ToastContext";
import { useParams, Link } from "react-router";
import { api } from "../../api/client";
import InvoiceModal from "../../components/orders/InvoiceModal";

const STATUS_STEPS = ["PENDING","CONFIRMED","PREPARING","READY","ASSIGNED","PICKED_UP","DELIVERED"];

const FULFILLMENT_LABEL: Record<string, { label: string; color: string; bg: string }> = {
  PENDING:   { label: "Unfulfilled",  color: "text-yellow-800", bg: "bg-yellow-50 border-yellow-200" },
  CONFIRMED: { label: "Confirmed",    color: "text-blue-800",   bg: "bg-blue-50 border-blue-200" },
  PREPARING: { label: "Preparing",    color: "text-purple-800", bg: "bg-purple-50 border-purple-200" },
  READY:     { label: "Ready",        color: "text-indigo-800", bg: "bg-indigo-50 border-indigo-200" },
  ASSIGNED:  { label: "Assigned",     color: "text-cyan-800",   bg: "bg-cyan-50 border-cyan-200" },
  PICKED_UP: { label: "Out for Delivery", color: "text-orange-800", bg: "bg-orange-50 border-orange-200" },
  DELIVERED: { label: "Fulfilled",    color: "text-green-800",  bg: "bg-green-50 border-green-200" },
  CANCELLED: { label: "Cancelled",    color: "text-red-800",    bg: "bg-red-50 border-red-200" },
};

const PAYMENT_LABEL: Record<string, { label: string; color: string; dot: string }> = {
  PENDING:  { label: "Payment pending", color: "text-orange-700", dot: "bg-orange-400" },
  PAID:     { label: "Paid",            color: "text-green-700",  dot: "bg-green-500" },
  FAILED:   { label: "Payment failed",  color: "text-red-700",    dot: "bg-red-500" },
  REFUNDED: { label: "Refunded",        color: "text-gray-600",   dot: "bg-gray-400" },
};

function SectionCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-lg border border-gray-200 overflow-hidden ${className}`}>
      {children}
    </div>
  );
}

export default function OrderDetail() {
  const { id } = useParams();
  const { showToast } = useToast();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [invoice, setInvoice] = useState<any>(null);
  const [invoiceLoading, setInvoiceLoading] = useState(false);

  const reload = () =>
    api.get(`/orders/${id}`).then(r => setOrder(r.data.data ?? r.data));

  useEffect(() => {
    api.get(`/orders/${id}`)
      .then(r => setOrder(r.data.data ?? r.data))
      .finally(() => setLoading(false));
  }, [id]);

  const updateStatus = async (status: string) => {
    setUpdating(true);
    try {
      await api.put(`/orders/${id}/status`, { status });
      await reload();
      showToast(`Order status updated to ${status}`);
    } catch (e: any) {
      showToast(e.response?.data?.message || "Update failed", "error");
    }
    setUpdating(false);
  };

  const markAsPaid = async () => {
    setUpdating(true);
    try {
      await api.patch(`/orders/${id}/payment-status`, { status: "PAID" });
      await reload();
      showToast("Payment marked as paid");
    } catch (e: any) {
      showToast(e.response?.data?.message || "Update failed", "error");
    }
    setUpdating(false);
  };

  const openInvoice = async () => {
    setInvoiceLoading(true);
    try {
      const r = await api.get(`/orders/${id}/invoice`);
      setInvoice(r.data.data);
    } catch (_) { showToast("Failed to load invoice", "error"); }
    setInvoiceLoading(false);
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#2382AA]" />
    </div>
  );
  if (!order) return <div className="text-center py-12 text-gray-400">Order not found</div>;

  const pkr = (n: number) => `Rs. ${(n ?? 0).toLocaleString("en-PK")}`;
  const fulfill = FULFILLMENT_LABEL[order.status] ?? FULFILLMENT_LABEL.PENDING;
  const pay     = PAYMENT_LABEL[order.paymentStatus ?? "PENDING"];
  const currentStep = STATUS_STEPS.indexOf(order.status);
  const isActive = (s: string) => order.status === s;

  const nextAction: { label: string; status: string; cls: string } | null =
    isActive("PENDING")   ? { label: "Confirm Order",    status: "CONFIRMED", cls: "bg-blue-600 hover:bg-blue-700 text-white" } :
    isActive("CONFIRMED") ? { label: "Start Preparing",  status: "PREPARING", cls: "bg-purple-600 hover:bg-purple-700 text-white" } :
    isActive("PREPARING") ? { label: "Mark Ready",       status: "READY",     cls: "bg-indigo-600 hover:bg-indigo-700 text-white" } :
    isActive("READY")     ? { label: "Assign Rider",     status: "ASSIGNED",  cls: "bg-cyan-600 hover:bg-cyan-700 text-white" } :
    isActive("ASSIGNED")  ? { label: "Mark Picked Up",   status: "PICKED_UP", cls: "bg-orange-500 hover:bg-orange-600 text-white" } :
    isActive("PICKED_UP") ? { label: "Mark Delivered",   status: "DELIVERED", cls: "bg-green-600 hover:bg-green-700 text-white" } :
    null;

  return (
    <>
    <div className="max-w-5xl space-y-1">

      {/* ── PAGE HEADER ── */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link to="/orders" className="text-sm text-gray-400 hover:text-gray-600">← Orders</Link>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold text-gray-900">#{order.orderNumber}</h1>
            {/* Payment badge */}
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${
              order.paymentStatus === "PAID" ? "bg-green-50 border-green-200 text-green-700" :
              order.paymentStatus === "FAILED" ? "bg-red-50 border-red-200 text-red-700" :
              "bg-orange-50 border-orange-200 text-orange-700"
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${pay?.dot}`} />
              {pay?.label}
            </span>
            {/* Fulfillment badge */}
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${fulfill.bg} ${fulfill.color}`}>
              {fulfill.label}
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            {new Date(order.createdAt).toLocaleString("en-PK", { dateStyle: "medium", timeStyle: "short" })}
            {order.city && ` · ${order.city.name}`}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {nextAction && (
            <button
              disabled={updating}
              onClick={() => updateStatus(nextAction.status)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition disabled:opacity-60 ${nextAction.cls}`}
            >
              {updating ? "..." : nextAction.label}
            </button>
          )}
          {["PENDING","CONFIRMED"].includes(order.status) && (
            <button
              disabled={updating}
              onClick={() => updateStatus("CANCELLED")}
              className="px-4 py-2 rounded-lg text-sm font-medium border border-red-200 text-red-600 hover:bg-red-50 transition disabled:opacity-60"
            >
              Cancel
            </button>
          )}
          <button
            onClick={openInvoice}
            disabled={invoiceLoading}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-[#1A1A1A] hover:bg-black text-white transition disabled:opacity-60"
          >
            {invoiceLoading
              ? <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>
                </svg>
            }
            Print
          </button>
        </div>
      </div>

      {/* ── 2-COLUMN LAYOUT ── */}
      <div className="grid grid-cols-12 gap-5">

        {/* LEFT — 8 cols */}
        <div className="col-span-12 lg:col-span-8 space-y-4">

          {/* Fulfillment card */}
          <SectionCard>
            <div className={`px-5 py-3 border-b flex items-center gap-2 ${fulfill.bg}`}>
              <span className={`w-2 h-2 rounded-full ${order.status === "DELIVERED" ? "bg-green-500" : order.status === "CANCELLED" ? "bg-red-500" : "bg-yellow-500"}`} />
              <span className={`text-sm font-semibold ${fulfill.color}`}>{fulfill.label}</span>
            </div>

            {/* Shipping info */}
            <div className="px-5 py-3 border-b border-gray-50 flex items-center gap-4 text-sm text-gray-500">
              <span className="flex items-center gap-1.5">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h11a2 2 0 012 2v3m0 0h3l3 3v4h-3m-3 0a2 2 0 100 4 2 2 0 000-4zm-7 0a2 2 0 100 4 2 2 0 000-4z"/></svg>
                {order.deliverySlot ? `${order.deliverySlot.label} · ${order.deliverySlot.timeFrom}–${order.deliverySlot.timeTo}` : "Standard Delivery"}
              </span>
            </div>

            {/* Items */}
            <div className="divide-y divide-gray-50">
              {order.items?.map((item: any) => (
                <div key={item.id} className="flex items-center gap-4 px-5 py-4">
                  <div className="w-14 h-14 rounded-lg border border-gray-100 bg-gray-50 overflow-hidden flex-shrink-0 flex items-center justify-center">
                    {item.product?.images?.[0]
                      ? <img src={item.product.images[0]} alt={item.product.name} className="w-full h-full object-cover" />
                      : <span className="text-2xl opacity-30">📦</span>
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{item.product?.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{item.product?.unit}</p>
                  </div>
                  <div className="text-sm text-gray-500 flex-shrink-0">
                    {pkr(item.price)} × {item.quantity}
                  </div>
                  <div className="text-sm font-semibold text-gray-900 flex-shrink-0 w-24 text-right">
                    {pkr(item.total)}
                  </div>
                </div>
              ))}
            </div>

            {/* Action row */}
            {nextAction && (
              <div className="px-5 py-4 border-t border-gray-100 flex justify-end">
                <button
                  disabled={updating}
                  onClick={() => updateStatus(nextAction.status)}
                  className={`px-5 py-2 rounded-lg text-sm font-medium transition disabled:opacity-60 ${nextAction.cls}`}
                >
                  {updating ? "Updating..." : nextAction.label + " →"}
                </button>
              </div>
            )}
          </SectionCard>

          {/* Payment card */}
          <SectionCard>
            <div className={`px-5 py-3 border-b flex items-center gap-2 ${
              order.paymentStatus === "PAID" ? "bg-green-50 border-green-200" : "bg-orange-50 border-orange-200"
            }`}>
              <span className={`w-2 h-2 rounded-full ${pay?.dot}`} />
              <span className={`text-sm font-semibold ${pay?.color}`}>{pay?.label}</span>
            </div>

            <div className="px-5 py-4 space-y-2 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal <span className="text-gray-400">({order.items?.length} items)</span></span>
                <span>{pkr(order.subtotal)}</span>
              </div>
              {order.deliveryFee >= 0 && (
                <div className="flex justify-between text-gray-600">
                  <span>Delivery fee</span>
                  <span>{order.deliveryFee === 0 ? <span className="text-green-600">Free</span> : pkr(order.deliveryFee)}</span>
                </div>
              )}
              {order.serviceFee > 0 && (
                <div className="flex justify-between text-gray-600">
                  <span>Service fee</span>
                  <span>{pkr(order.serviceFee)}</span>
                </div>
              )}
              {order.promoDiscount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Promo discount {order.promoCode && <span className="text-xs bg-green-100 px-1.5 py-0.5 rounded ml-1">{order.promoCode}</span>}</span>
                  <span>−{pkr(order.promoDiscount)}</span>
                </div>
              )}
              {order.walletDiscount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Wallet</span>
                  <span>−{pkr(order.walletDiscount)}</span>
                </div>
              )}

              <div className="flex justify-between font-semibold text-gray-900 pt-2 border-t border-gray-100">
                <span>Total</span>
                <span>{pkr(order.total)}</span>
              </div>
              <div className="flex justify-between text-gray-500">
                <span>Paid</span>
                <span className={order.paymentStatus === "PAID" ? "text-green-600 font-medium" : "text-gray-400"}>
                  {order.paymentStatus === "PAID" ? pkr(order.total) : pkr(0)}
                </span>
              </div>
              {order.paymentStatus !== "PAID" && (
                <div className="flex justify-between font-semibold text-orange-700 pt-1 border-t border-gray-100">
                  <span>Balance due</span>
                  <span>{pkr(order.total)}</span>
                </div>
              )}
            </div>

            <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between text-sm">
              <span className="text-gray-500">
                Payment: <span className="font-medium text-gray-800">{order.paymentMethod}</span>
              </span>
              <div className="flex gap-2">
                <button
                  onClick={openInvoice}
                  disabled={invoiceLoading}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 text-xs font-medium transition"
                >
                  Send Invoice
                </button>
                {order.paymentStatus !== "PAID" && (
                  <button
                    onClick={markAsPaid}
                    disabled={updating}
                    className="px-3 py-1.5 rounded-lg bg-[#1A1A1A] text-white text-xs font-medium hover:bg-black transition disabled:opacity-60"
                  >
                    Mark as paid
                  </button>
                )}
              </div>
            </div>
          </SectionCard>

          {/* Order progress */}
          {order.status !== "CANCELLED" && (
            <SectionCard>
              <div className="px-5 py-4">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Order Progress</p>
                <div className="flex items-center">
                  {STATUS_STEPS.map((s, i) => (
                    <div key={s} className="flex items-center flex-1">
                      <div className="flex flex-col items-center flex-1">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                          i < currentStep ? "bg-[#2382AA] text-white" :
                          i === currentStep ? "bg-[#2382AA] text-white ring-4 ring-[#2382AA]/20" :
                          "bg-gray-100 text-gray-400"
                        }`}>
                          {i < currentStep ? "✓" : i + 1}
                        </div>
                        <div className={`text-[10px] mt-1 text-center leading-tight hidden sm:block ${i <= currentStep ? "text-[#2382AA] font-medium" : "text-gray-400"}`}>
                          {s.replace("_", " ")}
                        </div>
                      </div>
                      {i < STATUS_STEPS.length - 1 && (
                        <div className={`h-0.5 flex-1 mx-1 rounded ${i < currentStep ? "bg-[#2382AA]" : "bg-gray-100"}`} />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </SectionCard>
          )}
        </div>

        {/* RIGHT — 4 cols */}
        <div className="col-span-12 lg:col-span-4 space-y-4">

          {/* Notes */}
          <SectionCard>
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <span className="text-sm font-semibold text-gray-800">Notes</span>
            </div>
            <div className="px-4 py-3 text-sm text-gray-400 italic">
              {order.notes || "No notes from customer"}
            </div>
          </SectionCard>

          {/* Customer */}
          <SectionCard>
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <span className="text-sm font-semibold text-gray-800">Customer</span>
            </div>
            <div className="px-4 py-4 space-y-4 text-sm">
              {/* Name */}
              <div>
                <Link to="/customers" className="font-medium text-[#2382AA] hover:underline">
                  {order.user?.name || "Unknown"}
                </Link>
                {order.user?._count?.orders != null && (
                  <p className="text-xs text-gray-400 mt-0.5">{order.user._count.orders} order{order.user._count.orders !== 1 ? "s" : ""}</p>
                )}
              </div>

              {/* Contact */}
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Contact info</p>
                <p className="text-gray-600">{order.user?.email || <span className="text-gray-300">No email</span>}</p>
                <p className="text-gray-600">{order.user?.phone || <span className="text-gray-300">No phone</span>}</p>
              </div>

              {/* Shipping address */}
              {order.address && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Shipping address</p>
                  <p className="text-gray-600 leading-relaxed">
                    {order.user?.name}<br />
                    {order.address.fullAddress}<br />
                    {order.address.area && <>{order.address.area},<br /></>}
                    {order.address.city}
                  </p>
                  {order.user?.phone && (
                    <p className="text-gray-500 mt-1">{order.user.phone}</p>
                  )}
                </div>
              )}

              {/* Billing = shipping */}
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Billing address</p>
                <p className="text-gray-400 text-xs">Same as shipping address</p>
              </div>
            </div>
          </SectionCard>

          {/* Rider (if assigned) */}
          {order.rider && (
            <SectionCard>
              <div className="px-4 py-3 border-b border-gray-100">
                <span className="text-sm font-semibold text-gray-800">Assigned Rider</span>
              </div>
              <div className="px-4 py-4 text-sm">
                <p className="font-medium text-gray-800">{order.rider.user?.name}</p>
                <p className="text-gray-500">{order.rider.user?.phone}</p>
                <p className="text-xs text-gray-400 mt-1">Zone: {order.rider.zone || "—"}</p>
                <span className={`inline-flex mt-2 px-2 py-0.5 rounded-full text-xs font-medium ${
                  order.rider.isAvailable ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                }`}>
                  {order.rider.isAvailable ? "Available" : "Busy"}
                </span>
              </div>
            </SectionCard>
          )}

          {/* Tags placeholder */}
          <SectionCard>
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <span className="text-sm font-semibold text-gray-800">Tags</span>
            </div>
            <div className="px-4 py-3">
              <p className="text-xs text-gray-400">No tags</p>
            </div>
          </SectionCard>
        </div>

      </div>
    </div>

    {invoice && <InvoiceModal invoice={invoice} onClose={() => setInvoice(null)} />}
    </>
  );
}
