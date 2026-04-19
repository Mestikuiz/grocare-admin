import { useEffect, useRef } from "react";

interface Props {
  invoice: any;
  onClose: () => void;
}

export default function InvoiceModal({ invoice, onClose }: Props) {
  const printRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [onClose]);

  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;
    const win = window.open("", "_blank", "width=800,height=900");
    if (!win) return;
    win.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice #${invoice.orderNumber}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 13px; color: #111; padding: 32px; }
            .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; padding-bottom: 20px; border-bottom: 2px solid #111; }
            .brand { font-size: 22px; font-weight: 800; letter-spacing: -0.5px; }
            .brand span { color: #2382AA; }
            .brand-sub { font-size: 11px; color: #666; margin-top: 2px; }
            .inv-meta { text-align: right; }
            .inv-meta h2 { font-size: 20px; font-weight: 700; color: #2382AA; }
            .inv-meta p { font-size: 12px; color: #555; margin-top: 3px; }
            .section { margin-bottom: 24px; }
            .section-title { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #888; margin-bottom: 8px; }
            .row { display: flex; gap: 40px; }
            .col { flex: 1; }
            .col p { font-size: 12px; color: #444; line-height: 1.6; }
            .col p strong { color: #111; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
            th { background: #f6f7f7; padding: 9px 12px; text-align: left; font-size: 11px; text-transform: uppercase; color: #888; font-weight: 600; border-bottom: 1px solid #e5e7eb; }
            th:last-child, td:last-child { text-align: right; }
            td { padding: 10px 12px; font-size: 12px; border-bottom: 1px solid #f3f4f6; vertical-align: middle; }
            .product-name { font-weight: 600; color: #111; }
            .product-unit { font-size: 11px; color: #888; }
            .billing { margin-left: auto; width: 280px; }
            .billing-row { display: flex; justify-content: space-between; padding: 5px 0; font-size: 12px; color: #555; }
            .billing-row.discount { color: #16a34a; }
            .billing-row.total { font-weight: 700; font-size: 14px; color: #111; padding-top: 10px; border-top: 2px solid #111; margin-top: 6px; }
            .badge { display: inline-block; padding: 2px 8px; border-radius: 100px; font-size: 11px; font-weight: 600; }
            .badge-pending { background: #fef9c3; color: #854d0e; }
            .badge-paid { background: #dcfce7; color: #166534; }
            .badge-failed { background: #fee2e2; color: #991b1b; }
            .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #e5e7eb; text-align: center; font-size: 11px; color: #aaa; }
            @media print { body { padding: 16px; } }
          </style>
        </head>
        <body>
          ${content.innerHTML}
        </body>
      </html>
    `);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); win.close(); }, 400);
  };

  const d = invoice;
  const pkr = (n: number) => `Rs. ${(n ?? 0).toLocaleString("en-PK")}`;
  const payStatusClass = d.paymentStatus === "PAID" ? "badge-paid" : d.paymentStatus === "FAILED" ? "badge-failed" : "badge-pending";

  return (
    <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Modal header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-800">Invoice #{d.orderNumber}</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-[#1A1A1A] hover:bg-black text-white text-sm font-medium rounded-lg transition"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>
              </svg>
              Print / Save PDF
            </button>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 text-xl transition">✕</button>
          </div>
        </div>

        {/* Invoice content — scrollable */}
        <div className="flex-1 overflow-y-auto p-6">
          <div ref={printRef}>
            {/* Header */}
            <div className="header">
              <div>
                <div className="brand">Gro<span>care</span></div>
                <div className="brand-sub">Fresh Grocery Delivery</div>
              </div>
              <div className="inv-meta">
                <h2>INVOICE</h2>
                <p>#{d.orderNumber}</p>
                <p>{new Date(d.date).toLocaleDateString("en-PK", { day: "numeric", month: "long", year: "numeric" })}</p>
              </div>
            </div>

            {/* Customer + Delivery */}
            <div className="section">
              <div className="row">
                <div className="col">
                  <div className="section-title">Bill To</div>
                  <p><strong>{d.address?.user?.name || "Customer"}</strong></p>
                  <p>{d.address?.user?.phone || ""}</p>
                </div>
                <div className="col">
                  <div className="section-title">Delivery Address</div>
                  <p><strong>{d.address?.label}</strong></p>
                  <p>{d.address?.fullAddress}</p>
                  <p>{d.address?.area}, {d.address?.city}</p>
                </div>
                <div className="col" style={{ textAlign: "right" }}>
                  <div className="section-title">Payment</div>
                  <p><strong>{d.paymentMethod}</strong></p>
                  <p>
                    <span className={`badge ${payStatusClass}`}>{d.paymentStatus}</span>
                  </p>
                  {d.deliverySlot && <p style={{ marginTop: 6 }}>Slot: {d.deliverySlot.label}<br />{d.deliverySlot.timeFrom} – {d.deliverySlot.timeTo}</p>}
                </div>
              </div>
            </div>

            {/* Items table */}
            <div className="section">
              <div className="section-title">Order Items</div>
              <table>
                <thead>
                  <tr>
                    <th style={{ width: "40%" }}>Item</th>
                    <th style={{ textAlign: "center" }}>Qty</th>
                    <th style={{ textAlign: "right" }}>Unit Price</th>
                    {d.items?.some((i: any) => i.savedAmount > 0) && <th style={{ textAlign: "right" }}>Discount</th>}
                    <th style={{ textAlign: "right" }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {d.items?.map((item: any, idx: number) => (
                    <tr key={idx}>
                      <td>
                        <div className="product-name">{item.name}</div>
                        <div className="product-unit">{item.unit}</div>
                      </td>
                      <td style={{ textAlign: "center" }}>{item.quantity}</td>
                      <td style={{ textAlign: "right" }}>
                        {item.originalPrice && item.originalPrice !== item.price
                          ? <><span style={{ textDecoration: "line-through", color: "#aaa", marginRight: 4 }}>{pkr(item.originalPrice)}</span>{pkr(item.price)}</>
                          : pkr(item.price)
                        }
                      </td>
                      {d.items?.some((i: any) => i.savedAmount > 0) && (
                        <td style={{ textAlign: "right", color: "#16a34a" }}>
                          {item.savedAmount > 0 ? `-${pkr(item.savedAmount)}` : "—"}
                        </td>
                      )}
                      <td style={{ textAlign: "right", fontWeight: 600 }}>{pkr(item.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Billing */}
            <div className="billing">
              {[
                { label: "Subtotal", value: pkr(d.billing?.subtotal) },
                d.billing?.promoDiscount > 0 && { label: `Promo (${d.promoCode})`, value: `-${pkr(d.billing.promoDiscount)}`, discount: true },
                d.billing?.coinsAmount > 0 && { label: `Coins (${d.billing.coinsUsed} pts)`, value: `-${pkr(d.billing.coinsAmount)}`, discount: true },
                d.billing?.walletUsed > 0 && { label: "Wallet", value: `-${pkr(d.billing.walletUsed)}`, discount: true },
                { label: "Delivery Fee", value: pkr(d.billing?.deliveryFee) },
                d.billing?.serviceFee > 0 && { label: "Service Fee", value: pkr(d.billing.serviceFee) },
              ].filter(Boolean).map((r: any, i: number) => (
                <div key={i} className={`billing-row${r.discount ? " discount" : ""}`}>
                  <span>{r.label}</span><span>{r.value}</span>
                </div>
              ))}
              <div className="billing-row total">
                <span>Total</span>
                <span style={{ color: "#2382AA" }}>{pkr(d.billing?.total)}</span>
              </div>
            </div>

            {/* Footer */}
            <div className="footer">
              <p>Thank you for shopping with Grocare!</p>
              <p style={{ marginTop: 4 }}>Questions? Contact support via the Grocare app.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
