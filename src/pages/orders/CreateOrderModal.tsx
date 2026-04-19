import { useEffect, useState } from "react";
import { api } from "../../api/client";
import { useToast } from "../../context/ToastContext";

interface Props {
  onClose: () => void;
  onCreated: (orderId: string) => void;
}

export default function CreateOrderModal({ onClose, onCreated }: Props) {
  const { showToast } = useToast();
  // Step: 'customer' | 'products' | 'checkout'
  const [step, setStep] = useState<"customer"|"products"|"checkout">("customer");
  const [saving, setSaving] = useState(false);

  // Customer search
  const [customerSearch, setCustomerSearch] = useState("");
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [customerLoading, setCustomerLoading] = useState(false);

  // Customer addresses
  const [addresses, setAddresses] = useState<any[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<any>(null);

  // Products
  const [productSearch, setProductSearch] = useState("");
  const [productResults, setProductResults] = useState<any[]>([]);
  const [cartItems, setCartItems] = useState<{ product: any; qty: number }[]>([]);
  const [productLoading, setProductLoading] = useState(false);

  // Checkout
  const [paymentMethod, setPaymentMethod] = useState("COD");
  const [promoCode, setPromoCode] = useState("");
  const [deliverySlots, setDeliverySlots] = useState<any[]>([]);
  const [selectedSlot, setSelectedSlot] = useState("");
  const [cities, setCities] = useState<any[]>([]);
  const [selectedCity, setSelectedCity] = useState("");

  useEffect(() => {
    api.get("/delivery-slots").then(r => setDeliverySlots(r.data?.data || r.data || []));
    api.get("/cities").then(r => setCities(r.data?.data || []));
  }, []);

  // Customer search
  useEffect(() => {
    if (!customerSearch.trim()) { setCustomers([]); return; }
    setCustomerLoading(true);
    const t = setTimeout(async () => {
      try {
        const r = await api.get("/admin/users", { params: { search: customerSearch, role: "CUSTOMER", limit: 8 } });
        setCustomers(r.data.data || []);
      } catch (_) {}
      setCustomerLoading(false);
    }, 300);
    return () => clearTimeout(t);
  }, [customerSearch]);

  const selectCustomer = async (c: any) => {
    setSelectedCustomer(c);
    setCustomers([]);
    setCustomerSearch(c.name || c.phone);
    try {
      const r = await api.get("/addresses", { headers: { "x-user-id": c.id } });
      // Admin can't directly get other user's addresses — use admin endpoint
      const r2 = await api.get(`/admin/users/${c.id}`);
      setAddresses(r2.data?.data?.addresses || r2.data?.addresses || []);
    } catch (_) {}
  };

  // Product search
  useEffect(() => {
    if (!productSearch.trim()) { setProductResults([]); return; }
    setProductLoading(true);
    const t = setTimeout(async () => {
      try {
        const r = await api.get("/products", { params: { search: productSearch, limit: 8, cityId: selectedCity || undefined } });
        setProductResults(r.data.data || []);
      } catch (_) {}
      setProductLoading(false);
    }, 300);
    return () => clearTimeout(t);
  }, [productSearch, selectedCity]);

  const addToCart = (product: any) => {
    setCartItems(prev => {
      const existing = prev.find(i => i.product.id === product.id);
      if (existing) return prev.map(i => i.product.id === product.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { product, qty: 1 }];
    });
    setProductSearch("");
    setProductResults([]);
  };

  const updateQty = (productId: string, qty: number) => {
    if (qty <= 0) setCartItems(prev => prev.filter(i => i.product.id !== productId));
    else setCartItems(prev => prev.map(i => i.product.id === productId ? { ...i, qty } : i));
  };

  const subtotal = cartItems.reduce((s, i) => s + i.product.price * i.qty, 0);
  const pkr = (n: number) => `Rs. ${(n ?? 0).toLocaleString("en-PK")}`;

  const handleCreate = async () => {
    if (!selectedCustomer) { showToast("Please select a customer", "error"); return; }
    if (cartItems.length === 0) { showToast("Please add at least one product", "error"); return; }
    if (!selectedAddress) { showToast("Please select a delivery address", "error"); return; }

    setSaving(true);
    try {
      // Admin creates order on behalf of customer
      const res = await api.post("/admin/orders", {
        userId:         selectedCustomer.id,
        addressId:      selectedAddress.id,
        cityId:         selectedCity || undefined,
        deliverySlotId: selectedSlot || undefined,
        paymentMethod,
        promoCode:      promoCode || undefined,
        items: cartItems.map(i => ({ productId: i.product.id, quantity: i.qty })),
      });
      const orderId = res.data?.data?.id || res.data?.id;
      showToast("Order created successfully");
      if (orderId) onCreated(orderId);
      else { fetchOrders(); onClose(); }
    } catch (e: any) {
      showToast(e.response?.data?.message || "Failed to create order", "error");
    }
    setSaving(false);
  };

  const fetchOrders = () => {};

  return (
    <div className="fixed inset-0 z-[99998] flex items-start justify-center pt-16 px-4 bg-black/50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <h2 className="text-base font-semibold text-gray-900">Create order</h2>
            {/* Step indicators */}
            {(["customer","products","checkout"] as const).map((s, i) => (
              <span key={s} className={`text-xs px-2 py-0.5 rounded-full font-medium ${step === s ? "bg-[#1A1A1A] text-white" : "bg-gray-100 text-gray-400"}`}>
                {i+1}. {s.charAt(0).toUpperCase()+s.slice(1)}
              </span>
            ))}
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 text-xl">✕</button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">

          {/* ── STEP 1: Customer ── */}
          {step === "customer" && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Search customer</label>
                <input
                  type="text"
                  placeholder="Name or phone number..."
                  value={customerSearch}
                  onChange={e => setCustomerSearch(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2382AA]"
                />
                {customers.length > 0 && (
                  <div className="mt-1 border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                    {customers.map(c => (
                      <button key={c.id} onClick={() => selectCustomer(c)}
                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 text-left border-b border-gray-50 last:border-0">
                        <div className="w-8 h-8 rounded-full bg-[#2382AA] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {(c.name || c.phone).charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-800">{c.name || "No name"}</p>
                          <p className="text-xs text-gray-400">{c.phone}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {selectedCustomer && (
                <div className="bg-[#2382AA]/5 border border-[#2382AA]/20 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#2382AA] flex items-center justify-center text-white font-bold">
                      {(selectedCustomer.name || selectedCustomer.phone).charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{selectedCustomer.name || "No name"}</p>
                      <p className="text-sm text-gray-500">{selectedCustomer.phone}</p>
                    </div>
                  </div>

                  {/* Address selection */}
                  {addresses.length > 0 && (
                    <div className="mt-4">
                      <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Delivery address</p>
                      <div className="space-y-2">
                        {addresses.map((a: any) => (
                          <label key={a.id} className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition ${selectedAddress?.id === a.id ? "border-[#2382AA] bg-[#2382AA]/5" : "border-gray-200 hover:border-gray-300"}`}>
                            <input type="radio" name="address" checked={selectedAddress?.id === a.id} onChange={() => setSelectedAddress(a)} className="mt-0.5 accent-[#2382AA]" />
                            <div className="text-sm">
                              <p className="font-medium text-gray-800">{a.label} {a.isDefault && <span className="text-xs text-[#2382AA]">Default</span>}</p>
                              <p className="text-gray-500 text-xs">{a.fullAddress}, {a.area}, {a.city}</p>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                  {addresses.length === 0 && (
                    <p className="mt-3 text-xs text-orange-600 bg-orange-50 rounded-lg px-3 py-2">No saved addresses. Customer must add an address first.</p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── STEP 2: Products ── */}
          {step === "products" && (
            <div className="space-y-4">
              {/* City filter */}
              <div className="flex gap-3">
                <select value={selectedCity} onChange={e => setSelectedCity(e.target.value)}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none">
                  <option value="">All Cities</option>
                  {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              {/* Product search */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Add products</label>
                <input
                  type="text"
                  placeholder="Search products..."
                  value={productSearch}
                  onChange={e => setProductSearch(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2382AA]"
                />
                {productResults.length > 0 && (
                  <div className="mt-1 border border-gray-200 rounded-lg overflow-hidden shadow-sm max-h-56 overflow-y-auto">
                    {productResults.map(p => (
                      <button key={p.id} onClick={() => addToCart(p)}
                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 text-left border-b border-gray-50 last:border-0">
                        <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0 flex items-center justify-center">
                          {p.images?.[0] ? <img src={p.images[0]} className="w-full h-full object-cover" /> : <span className="text-lg">📦</span>}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">{p.name}</p>
                          <p className="text-xs text-gray-400">{p.unit}</p>
                        </div>
                        <span className="text-sm font-semibold text-[#2382AA] flex-shrink-0">{pkr(p.price)}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Cart */}
              {cartItems.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Order items</p>
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    {cartItems.map(({ product: p, qty }) => (
                      <div key={p.id} className="flex items-center gap-3 px-4 py-3 border-b border-gray-50 last:border-0">
                        <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0 flex items-center justify-center">
                          {p.images?.[0] ? <img src={p.images[0]} className="w-full h-full object-cover" /> : <span className="text-lg">📦</span>}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">{p.name}</p>
                          <p className="text-xs text-gray-400">{pkr(p.price)} each</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => updateQty(p.id, qty-1)} className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-sm font-bold">-</button>
                          <span className="w-6 text-center text-sm font-medium">{qty}</span>
                          <button onClick={() => updateQty(p.id, qty+1)} className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-sm font-bold">+</button>
                        </div>
                        <span className="text-sm font-semibold text-gray-800 w-20 text-right">{pkr(p.price * qty)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between px-4 py-3 bg-gray-50 text-sm font-semibold">
                      <span>Subtotal</span><span>{pkr(subtotal)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── STEP 3: Checkout ── */}
          {step === "checkout" && (
            <div className="space-y-4">
              {/* Payment method */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Payment method</label>
                <div className="grid grid-cols-3 gap-2">
                  {["COD","JAZZCASH","EASYPAISA"].map(m => (
                    <button key={m} onClick={() => setPaymentMethod(m)}
                      className={`py-2.5 rounded-lg border text-sm font-medium transition ${paymentMethod === m ? "border-[#2382AA] bg-[#2382AA]/5 text-[#2382AA]" : "border-gray-200 text-gray-600 hover:border-gray-300"}`}>
                      {m === "COD" ? "Cash on Delivery" : m === "JAZZCASH" ? "JazzCash" : "EasyPaisa"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Delivery slot */}
              {deliverySlots.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Delivery slot <span className="text-gray-400 font-normal">(optional)</span></label>
                  <select value={selectedSlot} onChange={e => setSelectedSlot(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none">
                    <option value="">Select a slot</option>
                    {deliverySlots.map((s: any) => (
                      <option key={s.id} value={s.id}>{s.label} · {s.timeFrom}–{s.timeTo}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Promo code */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Promo code <span className="text-gray-400 font-normal">(optional)</span></label>
                <input
                  type="text"
                  placeholder="e.g. WELCOME20"
                  value={promoCode}
                  onChange={e => setPromoCode(e.target.value.toUpperCase())}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2382AA] uppercase"
                />
              </div>

              {/* Summary */}
              <div className="bg-gray-50 rounded-lg p-4 text-sm space-y-1.5">
                <p className="font-semibold text-gray-700 mb-2">Order Summary</p>
                <div className="flex justify-between text-gray-600"><span>Customer</span><span className="font-medium">{selectedCustomer?.name || selectedCustomer?.phone}</span></div>
                <div className="flex justify-between text-gray-600"><span>Address</span><span className="font-medium text-right max-w-[180px] truncate">{selectedAddress?.label} · {selectedAddress?.city}</span></div>
                <div className="flex justify-between text-gray-600"><span>Items</span><span>{cartItems.length} products</span></div>
                <div className="flex justify-between text-gray-600"><span>Subtotal</span><span>{pkr(subtotal)}</span></div>
                <div className="flex justify-between text-gray-600"><span>Payment</span><span>{paymentMethod}</span></div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
          <div>
            {step !== "customer" && (
              <button onClick={() => setStep(step === "checkout" ? "products" : "customer")}
                className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700">
                ← Back
              </button>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700">Cancel</button>
            {step === "customer" && (
              <button
                disabled={!selectedCustomer || !selectedAddress}
                onClick={() => setStep("products")}
                className="px-5 py-2 bg-[#1A1A1A] text-white rounded-lg text-sm font-medium hover:bg-black transition disabled:opacity-40"
              >
                Next: Add products →
              </button>
            )}
            {step === "products" && (
              <button
                disabled={cartItems.length === 0}
                onClick={() => setStep("checkout")}
                className="px-5 py-2 bg-[#1A1A1A] text-white rounded-lg text-sm font-medium hover:bg-black transition disabled:opacity-40"
              >
                Next: Checkout →
              </button>
            )}
            {step === "checkout" && (
              <button
                disabled={saving}
                onClick={handleCreate}
                className="px-5 py-2 bg-[#2382AA] text-white rounded-lg text-sm font-medium hover:bg-[#1D6E91] transition disabled:opacity-60"
              >
                {saving ? "Creating..." : "Create Order"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
