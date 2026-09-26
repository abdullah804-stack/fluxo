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
};

const nav = [
  { href: "/dashboard", label: "Overview", icon: I.grid, exact: true },
  { href: "/dashboard/orders", label: "Orders", icon: I.package },
  { href: "/dashboard/customers", label: "Customers", icon: I.users },
  { href: "/dashboard/messages", label: "Messages", icon: I.msg },
];

const ACCENT = "#3B6BFF";
const ACCENT_SOFT = "#E5ECFF";
const HOVER_BG = "#F0F4FF";

export function Sidebar({ email, name }: { email: string; name: string }) {
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
      className="fixed inset-y-0 left-0 z-10 flex w-64 flex-col border-r bg-white"
      style={{ borderColor: "#E6EAF5" }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-6">
        <span
          className="flex h-10 w-10 items-center justify-center rounded-xl text-base font-bold text-white"
          style={{
            background: "linear-gradient(135deg, #3B6BFF 0%, #6B8AFF 100%)",
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

      {/* Nav */}
      <nav className="mt-6 flex flex-1 flex-col gap-1 px-2">
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
      <div className="p-3" style={{ borderTop: "1px solid #EDF0F8" }}>
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