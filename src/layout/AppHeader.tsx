import { useEffect, useRef, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router";
import { useSidebar } from "../context/SidebarContext";
import NotificationDropdown from "../components/header/NotificationDropdown";
import UserDropdown from "../components/header/UserDropdown";
import { api, BASE_MEDIA } from "../api/client";

interface SearchResult {
  type: "product" | "order" | "user";
  id: string;
  title: string;
  sub: string;
  image?: string;
  href: string;
}

function GlobalSearch() {
  const [query, setQuery]     = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen]       = useState(false);
  const inputRef   = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const timerRef   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navigate   = useNavigate();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === "Escape") { setOpen(false); inputRef.current?.blur(); }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const search = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); setOpen(false); return; }
    setLoading(true);
    try {
      const [prodRes, orderRes] = await Promise.allSettled([
        api.get("/products", { params: { search: q, limit: 5, page: 1 } }),
        api.get("/orders",   { params: { search: q, limit: 4, page: 1 } }),
      ]);
      const items: SearchResult[] = [];
      if (prodRes.status === "fulfilled") {
        (prodRes.value.data?.data || []).forEach((p: any) => items.push({
          type: "product", id: p.id,
          title: p.name,
          sub: `Rs. ${p.price?.toLocaleString()} • ${p.category?.name || "Product"}`,
          image: p.images?.[0] ? `${BASE_MEDIA}${p.images[0]}` : undefined,
          href: `/products`,
        }));
      }
      if (orderRes.status === "fulfilled") {
        (orderRes.value.data?.data || []).forEach((o: any) => items.push({
          type: "order", id: o.id,
          title: `#${o.orderNumber}`,
          sub: `${o.status} • Rs. ${o.total?.toLocaleString()}`,
          href: `/orders/${o.id}`,
        }));
      }
      setResults(items);
      setOpen(items.length > 0);
    } catch (_) {}
    setLoading(false);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!val.trim()) { setResults([]); setOpen(false); return; }
    timerRef.current = setTimeout(() => search(val), 300);
  };

  const handleSelect = (item: SearchResult) => {
    setOpen(false); setQuery(""); navigate(item.href);
  };

  const products = results.filter(r => r.type === "product");
  const orders   = results.filter(r => r.type === "order");

  return (
    <div ref={wrapperRef} className="relative w-full max-w-[480px]">
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
          {loading ? (
            <div className="w-4 h-4 border-2 border-gray-400 border-t-white rounded-full animate-spin" />
          ) : (
            <svg className="text-gray-400" width="16" height="16" viewBox="0 0 20 20" fill="none">
              <path fillRule="evenodd" clipRule="evenodd" d="M3.04175 9.37363C3.04175 5.87693 5.87711 3.04199 9.37508 3.04199C12.8731 3.04199 15.7084 5.87693 15.7084 9.37363C15.7084 12.8703 12.8731 15.7053 9.37508 15.7053C5.87711 15.7053 3.04175 12.8703 3.04175 9.37363ZM9.37508 1.54199C5.04902 1.54199 1.54175 5.04817 1.54175 9.37363C1.54175 13.6991 5.04902 17.2053 9.37508 17.2053C11.2674 17.2053 13.003 16.5344 14.357 15.4176L17.177 18.238C17.4699 18.5309 17.9448 18.5309 18.2377 18.238C18.5306 17.9451 18.5306 17.4703 18.2377 17.1774L15.418 14.3573C16.5365 13.0033 17.2084 11.2669 17.2084 9.37363C17.2084 5.04817 13.7011 1.54199 9.37508 1.54199Z" fill="currentColor" />
            </svg>
          )}
        </span>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleChange}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder="Search"
          className="w-full h-9 rounded-lg bg-white/10 border border-white/20 pl-9 pr-16 text-sm text-white placeholder-gray-400 focus:outline-none focus:bg-white/15 focus:border-white/40 transition"
        />
        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-0.5 text-[11px] text-gray-400 border border-white/20 rounded px-1.5 py-0.5 bg-white/5">
          CTRL K
        </span>
      </div>

      {open && (
        <div className="absolute left-0 top-full mt-2 w-full bg-white rounded-xl border border-gray-100 shadow-2xl z-[99999] overflow-hidden">
          {products.length > 0 && (
            <>
              <div className="px-4 py-2 text-[11px] font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-50">Products</div>
              {products.map(item => (
                <button key={item.id} onClick={() => handleSelect(item)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition text-left">
                  {item.image
                    ? <img src={item.image} className="w-8 h-8 rounded-lg object-cover border border-gray-100 flex-shrink-0" />
                    : <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-sm flex-shrink-0">📦</div>
                  }
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-gray-800 truncate">{item.title}</div>
                    <div className="text-xs text-gray-400 truncate">{item.sub}</div>
                  </div>
                </button>
              ))}
            </>
          )}
          {orders.length > 0 && (
            <>
              <div className="px-4 py-2 text-[11px] font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-50">Orders</div>
              {orders.map(item => (
                <button key={item.id} onClick={() => handleSelect(item)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition text-left">
                  <div className="w-8 h-8 rounded-lg bg-[#2382AA]/10 flex items-center justify-center text-sm flex-shrink-0">🛒</div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-gray-800">{item.title}</div>
                    <div className="text-xs text-gray-400">{item.sub}</div>
                  </div>
                </button>
              ))}
            </>
          )}
          {results.length === 0 && !loading && (
            <div className="px-4 py-6 text-center text-sm text-gray-400">No results found</div>
          )}
        </div>
      )}
    </div>
  );
}

const AppHeader: React.FC = () => {
  const { toggleMobileSidebar } = useSidebar();

  return (
    <header
      className="fixed top-0 left-0 right-0 z-[99999] flex items-center h-14 px-4 lg:px-6"
      style={{ background: "#1A1A1A" }}
    >
      {/* Mobile hamburger */}
      <button
        onClick={toggleMobileSidebar}
        className="lg:hidden flex items-center justify-center w-8 h-8 text-gray-300 hover:text-white mr-3"
        aria-label="Toggle Sidebar"
      >
        <svg width="18" height="14" viewBox="0 0 18 14" fill="none">
          <path fillRule="evenodd" clipRule="evenodd"
            d="M0 1C0 0.448 0.448 0 1 0H17C17.552 0 18 0.448 18 1C18 1.552 17.552 2 17 2H1C0.448 2 0 1.552 0 1ZM0 13C0 12.448 0.448 12 1 12H17C17.552 12 18 12.448 18 13C18 13.552 17.552 14 17 14H1C0.448 14 0 13.552 0 13ZM1 6C0.448 6 0 6.448 0 7C0 7.552 0.448 8 1 8H9C9.552 8 10 7.552 10 7C10 6.448 9.552 6 9 6H1Z"
            fill="currentColor" />
        </svg>
      </button>

      {/* Logo */}
      <Link to="/" className="flex-shrink-0 mr-6">
        <img
          src="/images/logo/logo-dark.png"
          alt="Grocare"
          className="h-8 w-auto object-contain"
        />
      </Link>

      {/* Search — center */}
      <div className="flex-1 flex items-center justify-center">
        <GlobalSearch />
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-3 ml-4 flex-shrink-0">
        <NotificationDropdown />
        <UserDropdown />
      </div>
    </header>
  );
};

export default AppHeader;
