"use client";
// app/dashboard/_components/DashboardShell.tsx
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "./Sidebar";

export function DashboardShell({
  email,
  name,
  children,
}: {
  email: string;
  name: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const path = usePathname();

  // Close drawer whenever the route changes
  useEffect(() => {
    setOpen(false);
  }, [path]);

  // Lock scroll when drawer is open on mobile
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      {/* Mobile top bar — only visible below md */}
      <div
        className="sticky top-0 z-30 flex h-14 items-center justify-between border-b bg-white/90 px-4 backdrop-blur md:hidden"
        style={{ borderColor: "#E6EAF5" }}
      >
        <button
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          className="flex h-9 w-9 items-center justify-center rounded-lg transition-colors"
          style={{ color: "#0B1220" }}
        >
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
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <div className="flex items-center gap-2">
          <span
            className="flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold text-white"
            style={{
              background:
                "linear-gradient(135deg, #3B6BFF 0%, #6B8AFF 100%)",
            }}
          >
            F
          </span>
          <span
            className="text-sm font-bold tracking-tight"
            style={{ color: "#0B1220" }}
          >
            Fluxo
          </span>
        </div>

        <span
          className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold text-white"
          style={{
            background:
              "linear-gradient(135deg, #3B6BFF 0%, #6B8AFF 100%)",
          }}
        >
          {name.slice(0, 1).toUpperCase()}
        </span>
      </div>

      {/* Backdrop — only when drawer is open, only below md */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          aria-hidden
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden"
        />
      )}

      {/* Sidebar — drawer on mobile, static on md+ */}
      <Sidebar
        email={email}
        name={name}
        open={open}
        onClose={() => setOpen(false)}
      />

      {/* Main content */}
      <main className="relative z-[5] min-h-screen md:pl-64">
        <div className="mx-auto max-w-[1280px] px-4 py-6 sm:px-6 sm:py-8 md:px-8">
          {children}
        </div>
      </main>
    </>
  );
}