"use client";
// app/login/page.tsx
import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";

const BORDER = "#E6EAF5";
const TEXT_PRIMARY = "#0B1220";
const TEXT_SECONDARY = "#556075";
const TEXT_MUTED = "#8B95AB";
const ACCENT = "#3B6BFF";
const ACCENT_HOVER = "#2D56D9";
const ERROR_TEXT = "#B91C1C";
const ERROR_BG = "#FEF2F2";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("Invalid email or password");
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen" style={{ background: "#F5F7FE" }}>
      {/* Left — form */}
      <section className="flex w-full flex-col items-center justify-center px-6 py-12 md:w-1/2">
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm"
          style={{ border: `1px solid ${BORDER}` }}
        >
          {/* Mobile logo */}
          <div className="mb-8 flex items-center gap-3 md:hidden">
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
                className="text-base font-bold tracking-tight"
                style={{ color: TEXT_PRIMARY }}
              >
                Fluxo
              </div>
              <div
                className="text-[10px] font-medium tracking-[0.15em]"
                style={{ color: TEXT_MUTED }}
              >
                BUSINESS OS
              </div>
            </div>
          </div>

          <h1
            className="text-2xl font-bold tracking-tight"
            style={{ color: TEXT_PRIMARY }}
          >
            Welcome back
          </h1>
          <p className="mt-1 text-sm" style={{ color: TEXT_SECONDARY }}>
            Sign in to your Fluxo account.
          </p>

          {error && (
            <div
              className="mt-5 rounded-xl p-3 text-sm"
              style={{ background: ERROR_BG, color: ERROR_TEXT }}
            >
              {error}
            </div>
          )}

          <div className="mt-6 flex flex-col gap-3">
            <label className="flex flex-col gap-1.5">
              <span
                className="text-sm font-medium"
                style={{ color: TEXT_SECONDARY }}
              >
                Email
              </span>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                className="rounded-xl px-3.5 py-3 text-sm outline-none transition-colors duration-150 focus:border-[#3B6BFF]"
                style={{
                  border: `1px solid ${BORDER}`,
                  background: "#FFFFFF",
                  color: TEXT_PRIMARY,
                }}
                required
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span
                className="text-sm font-medium"
                style={{ color: TEXT_SECONDARY }}
              >
                Password
              </span>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                className="rounded-xl px-3.5 py-3 text-sm outline-none transition-colors duration-150 focus:border-[#3B6BFF]"
                style={{
                  border: `1px solid ${BORDER}`,
                  background: "#FFFFFF",
                  color: TEXT_PRIMARY,
                }}
                required
              />
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-6 w-full rounded-xl py-3 text-sm font-semibold text-white transition-colors duration-150 disabled:opacity-60"
            style={{ background: ACCENT }}
            onMouseEnter={(e) => {
              if (!loading)
                e.currentTarget.style.background = ACCENT_HOVER;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = ACCENT;
            }}
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>

          <p
            className="mt-6 text-center text-sm"
            style={{ color: TEXT_SECONDARY }}
          >
            Don&apos;t have an account?{" "}
            <Link
              href="/signup"
              className="font-medium"
              style={{ color: ACCENT }}
            >
              Sign up
            </Link>
          </p>
        </form>
      </section>

      {/* Right — brand panel */}
      <aside
        className="relative hidden overflow-hidden md:flex md:w-1/2"
        style={{ background: "#0B1220" }}
      >
        {/* Ambient blobs */}
        <div
          className="absolute -top-40 -right-40 h-[600px] w-[600px] rounded-full opacity-40 blur-[120px]"
          style={{
            background:
              "radial-gradient(circle, #3B6BFF 0%, transparent 70%)",
          }}
        />
        <div
          className="absolute -bottom-40 -left-40 h-[500px] w-[500px] rounded-full opacity-30 blur-[120px]"
          style={{
            background:
              "radial-gradient(circle, #8B5CF6 0%, transparent 70%)",
          }}
        />

        {/* Content */}
        <div className="relative z-10 flex w-full flex-col justify-between p-12">
          {/* Top logo */}
          <div className="flex items-center gap-3">
            <span
              className="flex h-10 w-10 items-center justify-center rounded-xl text-base font-bold text-white"
              style={{
                background:
                  "linear-gradient(135deg, #3B6BFF 0%, #6B8AFF 100%)",
              }}
            >
              F
            </span>
            <div className="leading-tight">
              <div className="text-base font-bold tracking-tight text-white">
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

          {/* Center tagline */}
          <div className="max-w-md">
            <h2 className="text-4xl font-bold leading-tight tracking-tight text-white">
              Your WhatsApp,
              <br />
              running your business.
            </h2>
            <p
              className="mt-4 text-sm leading-relaxed"
              style={{ color: "#B8C4D9" }}
            >
              Upload nothing. Configure nothing. Every order, every
              customer, every message — structured, tracked, and ready
              to act on.
            </p>
          </div>

          {/* Bottom mini-mockup */}
          <div
            className="max-w-sm rounded-2xl p-5"
            style={{
              background: "rgba(255, 255, 255, 0.04)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              backdropFilter: "blur(20px)",
            }}
          >
            <div className="mb-3 flex items-center justify-between">
              <span
                className="text-[10px] font-semibold uppercase tracking-[0.15em]"
                style={{ color: "#8B95AB" }}
              >
                Live activity
              </span>
              <span
                className="inline-flex items-center gap-1.5 text-[10px]"
                style={{ color: "#10B981" }}
              >
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Online
              </span>
            </div>
            <div className="flex flex-col gap-2 text-xs">
              <div className="flex items-center justify-between">
                <span style={{ color: "#B8C4D9" }}>
                  Sara k liye 2 suits, 3,500
                </span>
                <span
                  className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                  style={{
                    background: "rgba(59, 107, 255, 0.15)",
                    color: "#6B8AFF",
                  }}
                >
                  order
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span style={{ color: "#B8C4D9" }}>
                  Where is my order?
                </span>
                <span
                  className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                  style={{
                    background: "rgba(245, 158, 11, 0.15)",
                    color: "#F5B83D",
                  }}
                >
                  question
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span style={{ color: "#B8C4D9" }}>
                  Marked Ahmed as paid
                </span>
                <span
                  className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                  style={{
                    background: "rgba(16, 185, 129, 0.15)",
                    color: "#10B981",
                  }}
                >
                  payment
                </span>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}