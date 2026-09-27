"use client";
// app/signup/page.tsx
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

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Signup failed");
      setLoading(false);
      return;
    }

    await signIn("credentials", { email, password, redirect: false });
    router.push("/dashboard");
  }

  const inputStyle: React.CSSProperties = {
    border: `1px solid ${BORDER}`,
    background: "#FFFFFF",
    color: TEXT_PRIMARY,
  };

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
            Create your account
          </h1>
          <p className="mt-1 text-sm" style={{ color: TEXT_SECONDARY }}>
            Start turning WhatsApp into your business.
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
                Name
              </span>
              <input
                type="text"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                className="rounded-xl px-3.5 py-3 text-sm outline-none transition-colors duration-150 focus:border-[#3B6BFF]"
                style={inputStyle}
              />
            </label>

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
                style={inputStyle}
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
                placeholder="At least 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                className="rounded-xl px-3.5 py-3 text-sm outline-none transition-colors duration-150 focus:border-[#3B6BFF]"
                style={inputStyle}
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
            {loading ? "Creating account..." : "Create account"}
          </button>

          <p
            className="mt-6 text-center text-sm"
            style={{ color: TEXT_SECONDARY }}
          >
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-medium"
              style={{ color: ACCENT }}
            >
              Sign in
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
              Turn your WhatsApp
              <br />
              into a business.
            </h2>
            <p
              className="mt-4 text-sm leading-relaxed"
              style={{ color: "#B8C4D9" }}
            >
              Every customer message becomes a structured order. Every
              order becomes a tracked job. All from the same WhatsApp
              you already use.
            </p>
          </div>

          {/* Bottom stats */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Orders extracted", value: "Auto" },
              { label: "Currencies", value: "30+" },
              { label: "Commands", value: "Native" },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-2xl p-4"
                style={{
                  background: "rgba(255, 255, 255, 0.04)",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  backdropFilter: "blur(20px)",
                }}
              >
                <p
                  className="text-lg font-bold tracking-tight text-white"
                >
                  {s.value}
                </p>
                <p
                  className="mt-1 text-[10px] font-medium uppercase tracking-[0.12em]"
                  style={{ color: "#8B95AB" }}
                >
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
}