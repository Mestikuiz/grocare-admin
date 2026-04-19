import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router";
import { useSidebar } from "../context/SidebarContext";
import { api } from "../api/client";
import {
  ChevronDownIcon,
  GridIcon,
  BoxIconLine,
  GroupIcon,
  PieChartIcon,
  TableIcon,
  DollarLineIcon,
  FolderIcon,
  BoltIcon,
  ListIcon,
  ShootingStarIcon,
} from "../icons";

type NavItem = {
  name: string;
  icon: React.ReactNode;
  path?: string;
  badge?: number;
  subItems?: { name: string; path: string; new?: boolean }[];
};

const navItems: NavItem[] = [
  { icon: <GridIcon />,      name: "Home",       path: "/" },
  { icon: <TableIcon />,     name: "Orders",     path: "/orders" },
  { icon: <BoxIconLine />,   name: "Products",   path: "/products" },
  {
    icon: <BoxIconLine />,
    name: "Catalog",
    subItems: [
      { name: "Categories", path: "/categories" },
      { name: "Brands",     path: "/brands" },
      { name: "Inventory",  path: "/inventory", new: true },
    ],
  },
  { icon: <GroupIcon />,     name: "Customers",  path: "/customers" },
  {
    icon: <GroupIcon />,
    name: "People",
    subItems: [
      { name: "Users",  path: "/users" },
      { name: "Riders", path: "/riders" },
    ],
  },
  { icon: <DollarLineIcon />, name: "Marketing",
    subItems: [
      { name: "Promotions", path: "/promotions" },
      { name: "Discounts",  path: "/discounts", new: true },
      { name: "Banners",    path: "/banners" },
      { name: "Reviews",    path: "/reviews" },
    ],
  },
  { icon: <PieChartIcon />,  name: "Analytics",  path: "/analytics" },
  { icon: <ListIcon />,      name: "Reports",    path: "/reports" },
  { icon: <FolderIcon />,    name: "Media",      path: "/media" },
];

const bottomItems: NavItem[] = [
  { icon: <ShootingStarIcon />, name: "Cities",     path: "/cities" },
  { icon: <BoltIcon />,         name: "App Config", path: "/config" },
];

const AppSidebar: React.FC = () => {
  const { isMobileOpen, toggleMobileSidebar } = useSidebar();
  const location = useLocation();

  const [pendingOrders, setPendingOrders] = useState<number>(0);

  // Fetch pending order count — refresh every 60 seconds
  useEffect(() => {
    const fetchPending = async () => {
      try {
        const res = await api.get("/orders", { params: { status: "PENDING", limit: 1, page: 1 } });
        const total = res.data?.meta?.total ?? res.data?.total ?? 0;
        setPendingOrders(total);
      } catch { /* ignore */ }
    };
    fetchPending();
    const timer = setInterval(fetchPending, 60_000);
    return () => clearInterval(timer);
  }, []);

  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);
  const subMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [subMenuHeights, setSubMenuHeights] = useState<Record<string, number>>({});

  const isActive = useCallback(
    (path: string) => location.pathname === path,
    [location.pathname]
  );

  const isChildActive = useCallback(
    (subItems: { path: string }[]) => subItems.some(s => isActive(s.path)),
    [isActive]
  );

  // Auto-open submenu if child is active
  useEffect(() => {
    const allItems = [...navItems, ...bottomItems];
    let matched: string | null = null;
    allItems.forEach(item => {
      if (item.subItems && isChildActive(item.subItems)) matched = item.name;
    });
    setOpenSubmenu(matched);
  }, [location.pathname, isChildActive]);

  // Measure submenu heights
  useEffect(() => {
    if (openSubmenu && subMenuRefs.current[openSubmenu]) {
      setSubMenuHeights(prev => ({
        ...prev,
        [openSubmenu]: subMenuRefs.current[openSubmenu]?.scrollHeight || 0,
      }));
    }
  }, [openSubmenu]);

  const toggleSubmenu = (name: string) => {
    if (!subMenuHeights[name] && subMenuRefs.current[name]) {
      setSubMenuHeights(prev => ({
        ...prev,
        [name]: subMenuRefs.current[name]?.scrollHeight || 0,
      }));
    }
    setOpenSubmenu(prev => (prev === name ? null : name));
  };

  const renderItems = (items: NavItem[]) =>
    items.map(item => {
      const resolved: NavItem = item.name === "Orders" && pendingOrders > 0
        ? { ...item, badge: pendingOrders }
        : item;
      item = resolved;
      return (
      <li key={item.name}>
        {item.subItems ? (
          <div className="relative">
            {/* Parent button
                px-3 (12px) + icon w-4 center (8px) = icon center at 20px from button left
                button is inside nav px-3 (12px), so icon center = 12+12+8 = 32px from aside
                relative div starts at 12px (nav padding), so icon center = 12+8 = 20px from relative div */}
            <button
              onClick={() => toggleSubmenu(item.name)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                isChildActive(item.subItems)
                  ? "bg-white shadow-sm text-gray-900 font-medium"
                  : "text-gray-600 hover:bg-white/70 hover:text-gray-900"
              }`}
            >
              <span className="w-4 h-4 flex-shrink-0 opacity-70">{item.icon}</span>
              <span className="flex-1 text-left">{item.name}</span>
              <ChevronDownIcon
                className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
                  openSubmenu === item.name ? "rotate-180" : ""
                }`}
              />
            </button>

            <div
              ref={el => { subMenuRefs.current[item.name] = el; }}
              className="overflow-hidden transition-all duration-200"
              style={{
                height: openSubmenu === item.name
                  ? `${subMenuHeights[item.name] || 0}px`
                  : "0px",
              }}
            >
              <div className="ml-5 py-1 space-y-0.5">
                {item.subItems.map((sub, idx) => {
                  const active = isActive(sub.path);
                  const last = idx === item.subItems.length - 1;
                  return (
                    <Link
                      key={sub.path}
                      to={sub.path}
                      className={`flex items-center justify-between py-1.5 pr-2.5 rounded-r-lg text-sm transition-colors ${
                        active
                          ? "text-gray-900 font-medium bg-white shadow-sm"
                          : "text-gray-500 hover:text-gray-800 hover:bg-white/60"
                      }`}
                    >
                      {/* SVG draws line + arrow as ONE connected path */}
                      <svg
                        width="20" height="28"
                        viewBox="0 0 20 28"
                        className="flex-shrink-0 mr-1"
                        fill="none"
                      >
                        {/* vertical line — full height for non-last, half for last */}
                        <line
                          x1="6" y1="0"
                          x2="6" y2={last ? "14" : "28"}
                          stroke="#d1d5db" strokeWidth="1.5"
                        />
                        {/* horizontal branch — only for active item */}
                        {active && (
                          <path
                            d="M6,14 L14,14"
                            stroke="#9ca3af" strokeWidth="1.5"
                            strokeLinecap="round"
                          />
                        )}
                        {/* arrowhead — only for active item */}
                        {active && (
                          <polyline
                            points="11,10.5 14.5,14 11,17.5"
                            stroke="#9ca3af" strokeWidth="1.5"
                            strokeLinecap="round" strokeLinejoin="round"
                          />
                        )}
                      </svg>
                      <span className="flex-1 truncate">{sub.name}</span>
                      {sub.new && (
                        <span className="ml-1.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-[#2382AA]/10 text-[#2382AA] flex-shrink-0">
                          new
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          item.path && (
            <Link
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                isActive(item.path)
                  ? "bg-white shadow-sm text-gray-900 font-medium"
                  : "text-gray-600 hover:bg-white/70 hover:text-gray-900"
              }`}
            >
              <span className="w-4 h-4 flex-shrink-0 opacity-70">{item.icon}</span>
              <span className="flex-1">{item.name}</span>
              {item.badge != null && item.badge > 0 && (
                <span className="text-[11px] font-semibold px-1.5 py-0.5 rounded-full bg-gray-200 text-gray-600 min-w-[20px] text-center">
                  {item.badge}
                </span>
              )}
            </Link>
          )
        )}
      </li>
      );
    });

  return (
    <>
      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={toggleMobileSidebar}
        />
      )}

      <aside
        className={`fixed top-14 left-0 h-[calc(100vh-56px)] w-[240px] bg-[#F6F7F7] border-r border-gray-200 z-40 flex flex-col transition-transform duration-300 rounded-tl-2xl
          ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0`}
      >
        {/* Nav — scrollbar hidden, shows on hover */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5 sidebar-nav">
          <ul className="space-y-0.5">
            {renderItems(navItems)}
          </ul>

          {/* Divider */}
          <div className="my-4 border-t border-gray-100" />

          <ul className="space-y-0.5">
            {renderItems(bottomItems)}
          </ul>
        </nav>

        {/* Footer */}
        <div className="flex-shrink-0 px-4 py-3 border-t border-gray-200">
          <p className="text-[11px] text-gray-400">Grocare Admin v1.0</p>
        </div>
      </aside>
    </>
  );
};

export default AppSidebar;
