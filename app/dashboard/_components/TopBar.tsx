"use client";
// app/dashboard/_components/TopBar.tsx
export function TopBar() {
  const today = new Date();
  const shortDate = today.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
  const fullDate = today.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="mb-6 flex items-center justify-between gap-3 md:mb-8">
      {/* Search bar — hidden on mobile */}
      <div
        className="hidden h-11 w-full max-w-[520px] items-center gap-2.5 rounded-full border bg-white px-4 shadow-sm transition-shadow duration-200 focus-within:shadow-md md:flex"
        style={{ borderColor: "#E6EAF5" }}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="shrink-0"
          style={{ color: "#8B95AB" }}
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m21 21-4.3-4.3" />
        </svg>
        <input
          placeholder="Search orders, customers, or anything..."
          aria-label="Search"
          className="w-full bg-transparent text-sm outline-none"
          style={{ color: "#0B1220" }}
        />
        <span
          className="hidden shrink-0 items-center gap-1 rounded-md border px-1.5 py-0.5 text-[11px] font-medium sm:inline-flex"
          style={{ borderColor: "#E6EAF5", color: "#8B95AB" }}
        >
          ⌘ K
        </span>
      </div>

      {/* Right side controls — always visible */}
      <div className="ml-auto flex items-center gap-2 md:gap-3">
        {/* Notification bell */}
        <button
          aria-label="Notifications"
          className="relative flex h-10 w-10 items-center justify-center rounded-full border bg-white shadow-sm transition-colors duration-200"
          style={{ borderColor: "#E6EAF5", color: "#556075" }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#F0F4FF";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "#FFFFFF";
          }}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M6 8a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6" />
            <path d="M10 20a2 2 0 0 0 4 0" />
          </svg>
          <span
            className="absolute right-2 top-2 h-2 w-2 rounded-full border border-white"
            style={{ background: "#EF4444" }}
          />
        </button>

        {/* Date pill — compact on mobile, full on desktop */}
        <button
          className="flex h-10 items-center gap-2 rounded-full border bg-white px-3 text-sm font-medium shadow-sm transition-colors duration-200 md:px-4"
          style={{ borderColor: "#E6EAF5", color: "#0B1220" }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#F0F4FF";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "#FFFFFF";
          }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="shrink-0"
            style={{ color: "#556075" }}
          >
            <rect x="3" y="5" width="18" height="16" rx="2" />
            <path d="M8 3v4M16 3v4M3 10h18" />
          </svg>
          <span className="hidden md:inline">{fullDate}</span>
          <span className="md:hidden">{shortDate}</span>
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="hidden md:inline-block"
            style={{ color: "#8B95AB" }}
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>
      </div>
    </div>
  );
}