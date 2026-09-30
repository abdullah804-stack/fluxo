"use client";
// app/dashboard/_components/Sidebar.tsx
import Link from "next/link";
import { usePathname } from "next/navigation";

const P = {
  width: 18,
  height: 18,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

const I = {
  grid: (
    <svg {...P}>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  ),
  package: (
    <svg {...P}>
      <path d="M21 8 12 3 3 8v8l9 5 9-5z" />
      <path d="m3 8 9 5 9-5M12 13v8" />
    </svg>
  ),
  users: (
    <svg {...P}>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20c.5-3.5 3-5.5 6.5-5.5s6 2 6.5 5.5" />
      <path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14.8c2 .6 3.2 2.4 3.5 5.2" />
    </svg>
  ),
  msg: (
    <svg {...P}>
      <path d="M21 12a8 8 0 0 1-11.6 7.1L3 20l1-4.6A8 8 0 1 1 21 12z" />
    </svg>
  ),
  chart: (
    <svg {...P}>
      <path d="M3 3v18h18" />
      <path d="m7 14 3-3 3 3 4-6" />
    </svg>
  ),
  tag: (
    <svg {...P}>
      <path d="M20.6 13.4 12 4.8H4.8V12l8.6 8.6a2 2 0 0 0 2.8 0l4.4-4.4a2 2 0 0 0 0-2.8z" />
      <circle cx="7.5" cy="7.5" r="1.2" />
    </svg>
  ),
  gear: (
    <svg {...P}>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9 7 7M17 17l2.1 2.1M4.9 19.1 7 17M17 7l2.1-2.1" />
    </svg>
  ),
  chevron: (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  ),
  close: (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  ),
};

const nav = [
  { href: "/dashboard", label: "Overview", icon: I.grid, exact: true },
  { href: "/dashboard/orders", label: "Orders", icon: I.package },
  { href: "/dashboard/products", label: "Products", icon: I.tag },
  { href: "/dashboard/customers", label: "Customers", icon: I.users },
  { href: "/dashboard/messages", label: "Messages", icon: I.msg },
  { href: "/dashboard/analytics", label: "Analytics", icon: I.chart },
];

const ACCENT = "#3B6BFF";
const ACCENT_SOFT = "#E5ECFF";
const HOVER_BG = "#F0F4FF";

export function Sidebar({
  email,
  name,
  open,
  onClose,
}: {
  email: string;
  name: string;
  open: boolean;
  onClose: () => void;
}) {
  const path = usePathname();

  const item = (n: {
    href: string;
    label: string;
    icon: React.ReactNode;
    exact?: boolean;
  }) => {
    const on = n.exact ? path === n.href : path.startsWith(n.href);

    return (
      <Link
        key={n.href}
        href={n.href}
        onClick={onClose}
        aria-current={on ? "page" : undefined}
        className="group relative flex items-center gap-3 overflow-hidden rounded-xl py-2.5 pl-4 pr-3 text-sm font-medium transition-colors duration-200"
        style={{
          background: on ? ACCENT_SOFT : "transparent",
          color: on ? ACCENT : "#556075",
        }}
        onMouseEnter={(e) => {
          if (!on) e.currentTarget.style.background = HOVER_BG;
        }}
        onMouseLeave={(e) => {
          if (!on) e.currentTarget.style.background = "transparent";
        }}
      >
        {on && (
          <span
            className="nav-bar-in absolute inset-y-0 left-0 w-1 rounded-r"
            style={{ background: ACCENT }}
          />
        )}
        <span
          className="nav-icon"
          style={{ color: on ? ACCENT : "#8B95AB" }}
        >
          {n.icon}
        </span>
        {n.label}
      </Link>
    );
  };

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r bg-white transition-transform duration-300 ease-out md:z-20 md:translate-x-0 ${
        open ? "translate-x-0" : "-translate-x-full"
      }`}
      style={{ borderColor: "#E6EAF5" }}
      aria-hidden={!open}
    >
      {/* Logo + mobile close */}
      <div className="flex items-center justify-between px-5 py-6">
        <div className="flex items-center gap-3">
          <span
            className="flex h-10 w-10 items-center justify-center rounded-xl text-base font-bold text-white"
            style={{
              background:
                "linear-gradient(135deg, #3B6BFF 0%, #6B8AFF 100%)",
              boxShadow: "0 4px 14px -4px rgba(59, 107, 255, 0.4)",
            }}
          >
            F
          </span>
          <div className="leading-tight">
            <div
              className="text-lg font-bold tracking-tight"
              style={{ color: "#0B1220" }}
            >
              Fluxo
            </div>
            <div
              className="text-[10px] font-medium tracking-[0.15em]"
              style={{ color: "#8B95AB" }}
            >
              BUSINESS OS
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          aria-label="Close menu"
          className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors md:hidden"
          style={{ color: "#556075" }}
        >
          {I.close}
        </button>
      </div>

      {/* Nav */}
      <nav className="mt-2 flex flex-1 flex-col gap-1 overflow-y-auto px-2 pb-4">
        {nav.map(item)}
        <hr
          className="my-4 ml-2 mr-4"
          style={{ borderColor: "#EDF0F8" }}
        />
        {item({
          href: "/dashboard/settings",
          label: "Settings",
          icon: I.gear,
        })}
      </nav>

      {/* User block */}
      <div
        className="p-3"
        style={{ borderTop: "1px solid #EDF0F8" }}
      >
        <div
          className="flex items-center gap-3 rounded-lg px-2 py-2 transition-colors duration-200"
          onMouseEnter={(e) => {
            e.currentTarget.style.background = HOVER_BG;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
          }}
        >
          <span
            className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white"
            style={{
              background:
                "linear-gradient(135deg, #3B6BFF 0%, #6B8AFF 100%)",
            }}
          >
            {name.slice(0, 1).toUpperCase()}
            <span
              className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white"
              style={{ background: "#10B981" }}
            />
          </span>
          <div className="min-w-0 flex-1 leading-tight">
            <div
              className="truncate text-sm font-medium"
              style={{ color: "#0B1220" }}
            >
              {name}
            </div>
            <div
              className="truncate text-xs"
              style={{ color: "#8B95AB" }}
            >
              {email}
            </div>
          </div>
          <span style={{ color: "#C4CBDA" }}>{I.chevron}</span>
        </div>
      </div>
    </aside>
  );
}