import { useEffect, useState } from "react";
import { api } from "../../api/client";

interface ConfigForm {
  // General
  freeDeliveryThreshold: string;
  deliveryFee: string;
  serviceFee: string;
  coinsPerHundred: string;
  coinsToRupee: string;
  maxCoinsRedeemPercent: string;
  firstOrderDiscountEnabled: boolean;
  firstOrderDiscountPercent: string;
  allowBackOrders: boolean;
  trackStock: boolean;

  // Email
  resendApiKey: string;
  emailFromAddress: string;
  emailFromName: string;
  adminEmail: string;
  storeManagerEmails: string;
  emailNewOrder: boolean;
  emailOrderConfirmed: boolean;
  emailOrderDispatched: boolean;
  emailOrderDelivered: boolean;
  emailOrderCancelled: boolean;
  emailLowStock: boolean;
  emailNewCustomer: boolean;
  emailStoreManager: boolean;

  // SMS
  jazsSmsApiKey: string;
  jazsSmsFrom: string;
  smsOrderConfirmed: boolean;
  smsOrderDelivered: boolean;
  smsRiderAssignment: boolean;

  // WhatsApp
  twilioAccountSid: string;
  twilioAuthToken: string;
  twilioWhatsappFrom: string;
  whatsappOrderConfirmed: boolean;
  whatsappOrderDelivered: boolean;
  whatsappDailySummary: boolean;
}

const DEFAULT_CONFIG: ConfigForm = {
  freeDeliveryThreshold: "",
  deliveryFee: "",
  serviceFee: "",
  coinsPerHundred: "",
  coinsToRupee: "",
  maxCoinsRedeemPercent: "",
  firstOrderDiscountEnabled: false,
  firstOrderDiscountPercent: "",
  allowBackOrders: false,
  trackStock: true,
  resendApiKey: "",
  emailFromAddress: "",
  emailFromName: "",
  adminEmail: "",
  storeManagerEmails: "",
  emailNewOrder: true,
  emailOrderConfirmed: true,
  emailOrderDispatched: true,
  emailOrderDelivered: true,
  emailOrderCancelled: true,
  emailLowStock: true,
  emailNewCustomer: false,
  emailStoreManager: false,
  jazsSmsApiKey: "",
  jazsSmsFrom: "Grocare",
  smsOrderConfirmed: false,
  smsOrderDelivered: false,
  smsRiderAssignment: false,
  twilioAccountSid: "",
  twilioAuthToken: "",
  twilioWhatsappFrom: "",
  whatsappOrderConfirmed: false,
  whatsappOrderDelivered: false,
  whatsappDailySummary: false,
};

function Toggle({ checked, onChange, color = "bg-[#2382AA]" }: { checked: boolean; onChange: () => void; color?: string }) {
  return (
    <div
      className={`w-12 h-7 rounded-full cursor-pointer transition-colors relative flex-shrink-0 ${checked ? color : "bg-gray-200 dark:bg-gray-600"}`}
      onClick={onChange}
    >
      <div className={`w-5 h-5 bg-white rounded-full absolute top-1 transition-transform shadow ${checked ? "translate-x-6" : "translate-x-1"}`} />
    </div>
  );
}

function ToggleRow({ label, hint, checked, onChange, color }: { label: string; hint: string; checked: boolean; onChange: () => void; color?: string }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-700 last:border-0">
      <div>
        <div className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</div>
        <div className="text-xs text-gray-400 mt-0.5">{hint}</div>
      </div>
      <Toggle checked={checked} onChange={onChange} color={color} />
    </div>
  );
}

function TextField({
  label, value, onChange, placeholder, hint, type = "text", masked = false
}: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder: string; hint?: string; type?: string; masked?: boolean;
}) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{label}</label>
      <div className="relative">
        <input
          type={masked && !show ? "password" : type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-[#2382AA]"
          style={{ paddingRight: masked ? "3.5rem" : undefined }}
        />
        {masked && (
          <button
            type="button"
            onClick={() => setShow(s => !s)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600"
          >
            {show ? "Hide" : "Show"}
          </button>
        )}
      </div>
      {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
    </div>
  );
}

export default function AppConfig() {
  const [form, setForm] = useState<ConfigForm>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ show: boolean; message: string; type: "success" | "error" }>({ show: false, message: "", type: "success" });

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast(t => ({ ...t, show: false })), 3000);
  };

  const fetchConfig = async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/config");
      const d = res.data.data || res.data || {};
      setForm({
        freeDeliveryThreshold: d.freeDeliveryThreshold ?? "",
        deliveryFee: d.deliveryFee ?? "",
        serviceFee: d.serviceFee ?? "",
        coinsPerHundred: d.coinsPerHundred ?? "",
        coinsToRupee: d.coinsToRupee ?? "",
        maxCoinsRedeemPercent: d.maxCoinsRedeemPercent ?? "",
        firstOrderDiscountEnabled: d.firstOrderDiscountEnabled ?? false,
        firstOrderDiscountPercent: d.firstOrderDiscountPercent ?? "",
        allowBackOrders: d.allowBackOrders ?? false,
        trackStock: d.trackStock ?? true,
        resendApiKey: d.resendApiKey ?? "",
        emailFromAddress: d.emailFromAddress ?? "",
        emailFromName: d.emailFromName ?? "",
        adminEmail: d.adminEmail ?? "",
        storeManagerEmails: d.storeManagerEmails ?? "",
        emailNewOrder: d.emailNewOrder ?? true,
        emailOrderConfirmed: d.emailOrderConfirmed ?? true,
        emailOrderDispatched: d.emailOrderDispatched ?? true,
        emailOrderDelivered: d.emailOrderDelivered ?? true,
        emailOrderCancelled: d.emailOrderCancelled ?? true,
        emailLowStock: d.emailLowStock ?? true,
        emailNewCustomer: d.emailNewCustomer ?? false,
        emailStoreManager: d.emailStoreManager ?? false,
        jazsSmsApiKey: d.jazsSmsApiKey ?? "",
        jazsSmsFrom: d.jazsSmsFrom ?? "Grocare",
        smsOrderConfirmed: d.smsOrderConfirmed ?? false,
        smsOrderDelivered: d.smsOrderDelivered ?? false,
        smsRiderAssignment: d.smsRiderAssignment ?? false,
        twilioAccountSid: d.twilioAccountSid ?? "",
        twilioAuthToken: d.twilioAuthToken ?? "",
        twilioWhatsappFrom: d.twilioWhatsappFrom ?? "",
        whatsappOrderConfirmed: d.whatsappOrderConfirmed ?? false,
        whatsappOrderDelivered: d.whatsappOrderDelivered ?? false,
        whatsappDailySummary: d.whatsappDailySummary ?? false,
      });
    } catch (_) {}
    setLoading(false);
  };

  useEffect(() => { fetchConfig(); }, []);

  const set = (key: keyof ConfigForm, value: ConfigForm[keyof ConfigForm]) =>
    setForm(f => ({ ...f, [key]: value }));

  const handleSave = async () => {
    setSaving(true);
    try {
      const num = (v: string) => v !== "" ? Number(v) : undefined;
      await api.patch("/admin/config", {
        freeDeliveryThreshold: num(form.freeDeliveryThreshold),
        deliveryFee: num(form.deliveryFee),
        serviceFee: num(form.serviceFee),
        coinsPerHundred: num(form.coinsPerHundred),
        coinsToRupee: num(form.coinsToRupee),
        maxCoinsRedeemPercent: num(form.maxCoinsRedeemPercent),
        firstOrderDiscountEnabled: form.firstOrderDiscountEnabled,
        firstOrderDiscountPercent: num(form.firstOrderDiscountPercent),
        allowBackOrders: form.allowBackOrders,
        trackStock: form.trackStock,
        resendApiKey: form.resendApiKey || undefined,
        emailFromAddress: form.emailFromAddress || undefined,
        emailFromName: form.emailFromName || undefined,
        adminEmail: form.adminEmail || undefined,
        storeManagerEmails: form.storeManagerEmails || undefined,
        emailNewOrder: form.emailNewOrder,
        emailOrderConfirmed: form.emailOrderConfirmed,
        emailOrderDispatched: form.emailOrderDispatched,
        emailOrderDelivered: form.emailOrderDelivered,
        emailOrderCancelled: form.emailOrderCancelled,
        emailLowStock: form.emailLowStock,
        emailNewCustomer: form.emailNewCustomer,
        emailStoreManager: form.emailStoreManager,
        jazsSmsApiKey: form.jazsSmsApiKey || undefined,
        jazsSmsFrom: form.jazsSmsFrom || undefined,
        smsOrderConfirmed: form.smsOrderConfirmed,
        smsOrderDelivered: form.smsOrderDelivered,
        smsRiderAssignment: form.smsRiderAssignment,
        twilioAccountSid: form.twilioAccountSid || undefined,
        twilioAuthToken: form.twilioAuthToken || undefined,
        twilioWhatsappFrom: form.twilioWhatsappFrom || undefined,
        whatsappOrderConfirmed: form.whatsappOrderConfirmed,
        whatsappOrderDelivered: form.whatsappOrderDelivered,
        whatsappDailySummary: form.whatsappDailySummary,
      });
      showToast("Configuration saved successfully", "success");
    } catch (err: any) {
      showToast(err.response?.data?.message || "Failed to save configuration", "error");
    }
    setSaving(false);
  };

  const numField = (label: string, key: keyof ConfigForm, placeholder: string, suffix?: string, hint?: string) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{label}</label>
      <div className="relative">
        <input
          type="number"
          value={form[key] as string}
          onChange={e => set(key, e.target.value)}
          placeholder={placeholder}
          className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-[#2382AA] pr-16"
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-medium bg-gray-100 dark:bg-gray-600 px-2 py-1 rounded-lg">
            {suffix}
          </span>
        )}
      </div>
      {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2382AA]" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">App Configuration</h1>
        <p className="text-sm text-gray-500 mt-1">Manage delivery fees, loyalty coins, promotions, and notification channels.</p>
      </div>

      {/* ── Delivery ────────────────────────────────────────────────────────────── */}
      <Section icon="🚚" title="Delivery Settings" subtitle="Configure delivery and service fees for customers">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {numField("Free Delivery Threshold", "freeDeliveryThreshold", "e.g. 1000", "Rs.", "Orders above this amount get free delivery")}
          {numField("Delivery Fee", "deliveryFee", "e.g. 150", "Rs.", "Charged when order is below threshold")}
          {numField("Service Fee", "serviceFee", "e.g. 25", "Rs.", "Platform service fee per order")}
        </div>
        {(form.freeDeliveryThreshold || form.deliveryFee || form.serviceFee) && (
          <PreviewBox color="blue">
            {form.deliveryFee && <p>Orders below Rs. {form.freeDeliveryThreshold || "—"} → Rs. {form.deliveryFee} delivery fee</p>}
            {form.freeDeliveryThreshold && <p>Orders above Rs. {form.freeDeliveryThreshold} → Free delivery ✓</p>}
            {form.serviceFee && <p>Service fee: Rs. {form.serviceFee} on every order</p>}
          </PreviewBox>
        )}
      </Section>

      {/* ── Wallet & Coins ───────────────────────────────────────────────────────── */}
      <Section icon="🪙" title="Wallet & Coins" subtitle="Configure loyalty coins earning and redemption rates">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {numField("Coins per Rs. 100", "coinsPerHundred", "e.g. 10", "coins", "Coins earned for every Rs. 100 spent")}
          {numField("Coins to Rupee Rate", "coinsToRupee", "e.g. 100", "coins=1Rs", "How many coins equal Rs. 1")}
          {numField("Max Redeem Percent", "maxCoinsRedeemPercent", "e.g. 20", "%", "Max % of order value payable by coins")}
        </div>
      </Section>

      {/* ── First Order Discount ─────────────────────────────────────────────────── */}
      <Section icon="🎁" title="First Order Discount" subtitle="Give new customers a discount on their first order">
        <ToggleRow
          label="Enable First Order Discount"
          hint="New users get a discount on their very first order"
          checked={form.firstOrderDiscountEnabled}
          onChange={() => set("firstOrderDiscountEnabled", !form.firstOrderDiscountEnabled)}
        />
        <div className={`mt-4 transition-opacity ${form.firstOrderDiscountEnabled ? "opacity-100" : "opacity-40 pointer-events-none"}`}>
          {numField("First Order Discount Percent", "firstOrderDiscountPercent", "e.g. 10", "%", "Percentage discount applied to the first order")}
        </div>
      </Section>

      {/* ── Inventory ────────────────────────────────────────────────────────────── */}
      <Section icon="📦" title="Inventory & Stock" subtitle="Control how stock levels affect product visibility and ordering">
        <ToggleRow label="Track Stock" hint="Products go out of stock when qty reaches 0" checked={form.trackStock} onChange={() => set("trackStock", !form.trackStock)} color="bg-blue-500" />
        <div className={!form.trackStock ? "opacity-40 pointer-events-none" : ""}>
          <ToggleRow label="Allow Back Orders" hint="Out-of-stock products can still be ordered" checked={form.allowBackOrders} onChange={() => set("allowBackOrders", !form.allowBackOrders)} color="bg-orange-500" />
        </div>
      </Section>

      {/* ═══════════════════════════════════════════════════════════════════════════ */}
      {/* NOTIFICATIONS */}
      {/* ═══════════════════════════════════════════════════════════════════════════ */}

      <div>
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">Notification Channels</h2>
        <p className="text-sm text-gray-500 mt-0.5">Configure email, SMS, and WhatsApp alerts for orders and activity.</p>
      </div>

      {/* ── Email (Resend) ────────────────────────────────────────────────────────── */}
      <Section icon="📧" title="Email Notifications" subtitle="Transactional emails via Resend.com — free up to 3,000 emails/month">

        {/* How to get Resend key */}
        <div className="mb-5 p-4 bg-blue-50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-800/30 text-sm">
          <p className="font-semibold text-blue-800 dark:text-blue-300 mb-2">How to get your Resend API key</p>
          <ol className="list-decimal list-inside space-y-1 text-blue-700 dark:text-blue-400 text-xs">
            <li>Go to <strong>resend.com</strong> and create a free account</li>
            <li>Add your domain (e.g. grocare.pk) and verify it via DNS</li>
            <li>Go to <strong>API Keys</strong> → Create API Key</li>
            <li>Paste the key below (starts with <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">re_</code>)</li>
          </ol>
          <p className="mt-2 text-xs text-blue-600 dark:text-blue-400">Free plan: 3,000 emails/month. No credit card needed.</p>
        </div>

        {/* Credentials */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
          <TextField label="Resend API Key" value={form.resendApiKey} onChange={v => set("resendApiKey", v)} placeholder="re_xxxxxxxxxxxxxxxxxxxx" masked hint="Leave blank to disable email" />
          <TextField label="From Email Address" value={form.emailFromAddress} onChange={v => set("emailFromAddress", v)} placeholder="orders@grocare.pk" hint="Must be verified in Resend" />
          <TextField label="From Name" value={form.emailFromName} onChange={v => set("emailFromName", v)} placeholder="Grocare" />
          <TextField label="Admin Email" value={form.adminEmail} onChange={v => set("adminEmail", v)} placeholder="admin@grocare.pk" hint="Receives new order & stock alerts" />
        </div>
        <div className="mb-5">
          <TextField label="Store Manager Emails" value={form.storeManagerEmails} onChange={v => set("storeManagerEmails", v)} placeholder="manager1@grocare.pk, manager2@grocare.pk" hint="Comma-separated. Gets CC'd on new orders when enabled below." />
        </div>

        {/* Toggles */}
        <div className="rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="px-4 py-2.5 bg-gray-50 dark:bg-gray-700/50 text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Send email when…
          </div>
          <div className="px-4 divide-y divide-gray-100 dark:divide-gray-700">
            <ToggleRow label="New order placed" hint="Alert admin when a customer places a new order" checked={form.emailNewOrder} onChange={() => set("emailNewOrder", !form.emailNewOrder)} />
            <ToggleRow label="CC store managers on new orders" hint="Also send new order alert to store manager emails above" checked={form.emailStoreManager} onChange={() => set("emailStoreManager", !form.emailStoreManager)} />
            <ToggleRow label="Order confirmed → customer" hint="Send confirmation with order summary to customer" checked={form.emailOrderConfirmed} onChange={() => set("emailOrderConfirmed", !form.emailOrderConfirmed)} />
            <ToggleRow label="Order dispatched (out for delivery) → customer" hint="Notify customer when rider picks up order" checked={form.emailOrderDispatched} onChange={() => set("emailOrderDispatched", !form.emailOrderDispatched)} />
            <ToggleRow label="Order delivered → customer" hint="Notify customer on successful delivery" checked={form.emailOrderDelivered} onChange={() => set("emailOrderDelivered", !form.emailOrderDelivered)} />
            <ToggleRow label="Order cancelled → admin + customer" hint="Alert both admin and customer on cancellation" checked={form.emailOrderCancelled} onChange={() => set("emailOrderCancelled", !form.emailOrderCancelled)} />
            <ToggleRow label="Low stock alert → admin" hint="Email admin when product stock falls below minStock threshold" checked={form.emailLowStock} onChange={() => set("emailLowStock", !form.emailLowStock)} />
            <ToggleRow label="New customer signup → admin" hint="Notify admin when a new customer registers" checked={form.emailNewCustomer} onChange={() => set("emailNewCustomer", !form.emailNewCustomer)} />
          </div>
        </div>
      </Section>

      {/* ── SMS (Jazz SMS) ────────────────────────────────────────────────────────── */}
      <Section icon="💬" title="SMS Notifications" subtitle="Send SMS alerts via Jazz SMS gateway (Pakistan)">

        <div className="mb-5 p-4 bg-amber-50 dark:bg-amber-900/10 rounded-xl border border-amber-100 dark:border-amber-800/30 text-sm">
          <p className="font-semibold text-amber-800 dark:text-amber-300 mb-2">How to get Jazz SMS API key</p>
          <ol className="list-decimal list-inside space-y-1 text-amber-700 dark:text-amber-400 text-xs">
            <li>Visit <strong>jasmin.sms.jazz.com.pk</strong> or Jazz SMS portal</li>
            <li>Register as a business sender</li>
            <li>Get your API key and approved sender ID (e.g. "Grocare")</li>
            <li>Enter credentials below — SMS sends go live instantly</li>
          </ol>
          <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
            Pricing: ~Rs. 0.15–0.30 per SMS. SMPP or HTTP API. Contact Jazz Business: <strong>0300-8229900</strong>
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
          <TextField label="Jazz SMS API Key" value={form.jazsSmsApiKey} onChange={v => set("jazsSmsApiKey", v)} placeholder="Your Jazz SMS API key" masked hint="Leave blank to disable SMS" />
          <TextField label="SMS Sender ID" value={form.jazsSmsFrom} onChange={v => set("jazsSmsFrom", v)} placeholder="Grocare" hint="Approved 11-character sender name" />
        </div>

        <div className="rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="px-4 py-2.5 bg-gray-50 dark:bg-gray-700/50 text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Send SMS when…
          </div>
          <div className="px-4 divide-y divide-gray-100 dark:divide-gray-700">
            <ToggleRow label="Order confirmed → customer" hint="SMS with order number sent to customer's phone" checked={form.smsOrderConfirmed} onChange={() => set("smsOrderConfirmed", !form.smsOrderConfirmed)} color="bg-amber-500" />
            <ToggleRow label="Order delivered → customer" hint="Delivery confirmation SMS to customer" checked={form.smsOrderDelivered} onChange={() => set("smsOrderDelivered", !form.smsOrderDelivered)} color="bg-amber-500" />
            <ToggleRow label="Order assigned → rider" hint="SMS notification to rider when assigned a new order" checked={form.smsRiderAssignment} onChange={() => set("smsRiderAssignment", !form.smsRiderAssignment)} color="bg-amber-500" />
          </div>
        </div>
      </Section>

      {/* ── WhatsApp (Twilio) ─────────────────────────────────────────────────────── */}
      <Section icon="💚" title="WhatsApp Notifications" subtitle="Send WhatsApp messages via Twilio Business API">

        <div className="mb-5 p-4 bg-green-50 dark:bg-green-900/10 rounded-xl border border-green-100 dark:border-green-800/30 text-sm">
          <p className="font-semibold text-green-800 dark:text-green-300 mb-2">How to set up Twilio WhatsApp</p>
          <ol className="list-decimal list-inside space-y-1 text-green-700 dark:text-green-400 text-xs">
            <li>Sign up at <strong>twilio.com</strong> (free trial gives $15 credit)</li>
            <li>Go to Console → Messaging → WhatsApp Senders</li>
            <li>Use <strong>Sandbox</strong> for testing (free) or apply for a production number</li>
            <li>Copy your <strong>Account SID</strong> and <strong>Auth Token</strong> from the dashboard</li>
            <li>WhatsApp From: <code className="bg-green-100 dark:bg-green-900 px-1 rounded">whatsapp:+14155238886</code> (sandbox) or your approved number</li>
          </ol>
          <p className="mt-2 text-xs text-green-600 dark:text-green-400">Pricing: ~$0.005 per WhatsApp message. Much cheaper than SMS with richer formatting.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
          <TextField label="Twilio Account SID" value={form.twilioAccountSid} onChange={v => set("twilioAccountSid", v)} placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" masked />
          <TextField label="Twilio Auth Token" value={form.twilioAuthToken} onChange={v => set("twilioAuthToken", v)} placeholder="Your auth token" masked />
          <TextField label="WhatsApp From Number" value={form.twilioWhatsappFrom} onChange={v => set("twilioWhatsappFrom", v)} placeholder="whatsapp:+14155238886" hint="Include 'whatsapp:' prefix" />
        </div>

        <div className="rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="px-4 py-2.5 bg-gray-50 dark:bg-gray-700/50 text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Send WhatsApp when…
          </div>
          <div className="px-4 divide-y divide-gray-100 dark:divide-gray-700">
            <ToggleRow label="Order confirmed → customer" hint="WhatsApp order summary sent to customer" checked={form.whatsappOrderConfirmed} onChange={() => set("whatsappOrderConfirmed", !form.whatsappOrderConfirmed)} color="bg-green-500" />
            <ToggleRow label="Order delivered → customer" hint="Delivery confirmation on WhatsApp" checked={form.whatsappOrderDelivered} onChange={() => set("whatsappOrderDelivered", !form.whatsappOrderDelivered)} color="bg-green-500" />
            <ToggleRow label="Daily summary → admin" hint="End-of-day order summary WhatsApp message to admin" checked={form.whatsappDailySummary} onChange={() => set("whatsappDailySummary", !form.whatsappDailySummary)} color="bg-green-500" />
          </div>
        </div>
      </Section>

      {/* Save */}
      <div className="flex justify-end pb-8">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-8 py-3 bg-[#2382AA] hover:bg-[#1D6E91] text-white rounded-xl font-medium text-sm transition disabled:opacity-60 shadow-sm"
        >
          {saving ? (
            <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />Saving...</>
          ) : (
            "Save Configuration"
          )}
        </button>
      </div>

      {/* Toast */}
      {toast.show && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-lg text-sm font-medium ${toast.type === "success" ? "bg-green-500 text-white" : "bg-red-500 text-white"}`}>
          <span>{toast.type === "success" ? "✓" : "✕"}</span>
          {toast.message}
        </div>
      )}
    </div>
  );
}

// ── Local helper components ──────────────────────────────────────────────────

function Section({ icon, title, subtitle, children }: { icon: string; title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-gray-700 flex items-center justify-center text-xl">{icon}</div>
        <div>
          <h2 className="text-base font-semibold text-gray-800 dark:text-white">{title}</h2>
          <p className="text-xs text-gray-500">{subtitle}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

function PreviewBox({ color, children }: { color: "blue" | "yellow" | "green"; children: React.ReactNode }) {
  const c = { blue: "bg-blue-50 border-blue-100 text-blue-800", yellow: "bg-yellow-50 border-yellow-100 text-yellow-800", green: "bg-green-50 border-green-100 text-green-800" }[color];
  return (
    <div className={`mt-5 p-4 rounded-xl border text-sm space-y-1 dark:opacity-80 ${c}`}>
      {children}
    </div>
  );
}
