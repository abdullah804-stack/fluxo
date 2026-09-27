// app/page.tsx
import Link from "next/link";

const ACCENT = "#3B6BFF";
const ACCENT_HOVER = "#2D56D9";

export default function Home() {
  return (
    <div
      className="min-h-screen"
      style={{ background: "#0B1220", color: "#F5F7FA" }}
    >
      {/* NAVBAR */}
      <nav
        className="sticky top-0 z-50 backdrop-blur"
        style={{
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          background: "rgba(11, 18, 32, 0.75)",
        }}
      >
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <span
              className="flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold text-white"
              style={{
                background:
                  "linear-gradient(135deg, #3B6BFF 0%, #6B8AFF 100%)",
              }}
            >
              F
            </span>
            <span className="text-base font-bold tracking-tight">
              Fluxo
            </span>
          </Link>
          <div className="flex items-center gap-6 text-sm">
            <a
              href="https://github.com/abdullah804-stack/fluxo"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden transition-colors sm:inline"
              style={{ color: "#B8C4D9" }}
            >
              GitHub
            </a>
            <Link
              href="/login"
              className="hidden transition-colors sm:inline"
              style={{ color: "#B8C4D9" }}
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="rounded-lg px-4 py-2 font-medium text-white transition-colors"
              style={{ background: ACCENT }}
            >
              Get started
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative overflow-hidden">
        {/* Ambient blobs */}
        <div className="pointer-events-none absolute inset-0">
          <div
            className="absolute -top-40 right-0 h-[700px] w-[700px] rounded-full opacity-40 blur-[140px]"
            style={{
              background:
                "radial-gradient(circle, #3B6BFF 0%, transparent 70%)",
            }}
          />
          <div
            className="absolute -bottom-40 -left-40 h-[600px] w-[600px] rounded-full opacity-30 blur-[140px]"
            style={{
              background:
                "radial-gradient(circle, #8B5CF6 0%, transparent 70%)",
            }}
          />
        </div>

        <div className="relative mx-auto max-w-6xl px-6 py-24">
          <div className="grid items-center gap-16 lg:grid-cols-2">
            {/* Left: copy */}
            <div>
              <div
                className="mb-6 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium"
                style={{
                  background: "rgba(59, 107, 255, 0.12)",
                  color: "#6B8AFF",
                  border: "1px solid rgba(59, 107, 255, 0.2)",
                }}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Now in early access
              </div>

              <h1 className="text-5xl font-bold leading-[1.05] tracking-tight text-white">
                Turn your WhatsApp
                <br />
                into a business.
              </h1>

              <p
                className="mt-6 max-w-lg text-lg leading-relaxed"
                style={{ color: "#B8C4D9" }}
              >
                Every customer message becomes a structured order. Every
                order becomes a tracked job. Every question answered.
                From the same WhatsApp you already use.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Link
                  href="/signup"
                  className="inline-flex items-center gap-2 rounded-lg px-5 py-3 text-sm font-semibold text-white transition-colors"
                  style={{ background: ACCENT }}
                >
                  Get started free
                  <span>→</span>
                </Link>
                <a
                  href="#how-it-works"
                  className="text-sm font-medium transition-colors"
                  style={{ color: "#B8C4D9" }}
                >
                  See how it works
                </a>
              </div>

              <p
                className="mt-6 text-xs"
                style={{ color: "#5A6B85" }}
              >
                No credit card. No setup. Just your WhatsApp.
              </p>
            </div>

            {/* Right: live activity mockup */}
            <div className="relative">
              <div
                className="rounded-3xl p-6"
                style={{
                  background: "rgba(255, 255, 255, 0.04)",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  backdropFilter: "blur(24px)",
                  boxShadow:
                    "0 24px 60px -20px rgba(59, 107, 255, 0.3)",
                }}
              >
                {/* Header */}
                <div className="mb-4 flex items-center justify-between">
                  <span
                    className="text-[10px] font-semibold uppercase tracking-[0.15em]"
                    style={{ color: "#8B95AB" }}
                  >
                    Live activity
                  </span>
                  <span
                    className="inline-flex items-center gap-1.5 text-xs"
                    style={{ color: "#10B981" }}
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    Online
                  </span>
                </div>

                {/* Feed */}
                <div className="flex flex-col gap-3">
                  {[
                    {
                      msg: "Sara k liye 2 suits, 3,500, COD",
                      tag: "order",
                      color: "#6B8AFF",
                      bg: "rgba(59, 107, 255, 0.15)",
                    },
                    {
                      msg: "Where is my order?",
                      tag: "question",
                      color: "#F5B83D",
                      bg: "rgba(245, 158, 11, 0.15)",
                    },
                    {
                      msg: "Payment kar diya",
                      tag: "payment",
                      color: "#10B981",
                      bg: "rgba(16, 185, 129, 0.15)",
                    },
                    {
                      msg: "Aapka maal kharab tha",
                      tag: "complaint",
                      color: "#F43F5E",
                      bg: "rgba(244, 63, 94, 0.15)",
                    },
                  ].map((item, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between gap-3 rounded-xl p-3"
                      style={{
                        background: "rgba(255, 255, 255, 0.03)",
                        border:
                          "1px solid rgba(255, 255, 255, 0.05)",
                      }}
                    >
                      <span
                        className="truncate text-sm"
                        style={{ color: "#E5EAF3" }}
                      >
                        {item.msg}
                      </span>
                      <span
                        className="shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-medium"
                        style={{
                          background: item.bg,
                          color: item.color,
                        }}
                      >
                        {item.tag}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Footer stat */}
                <div
                  className="mt-4 flex items-center justify-between border-t pt-4"
                  style={{ borderColor: "rgba(255,255,255,0.06)" }}
                >
                  <span
                    className="text-xs"
                    style={{ color: "#8B95AB" }}
                  >
                    Structured in real time
                  </span>
                  <span
                    className="text-xs font-semibold"
                    style={{ color: "#6B8AFF" }}
                  >
                    Auto
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section
        id="how-it-works"
        className="relative"
        style={{
          borderTop: "1px solid rgba(255,255,255,0.06)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          background: "rgba(5, 11, 20, 0.5)",
        }}
      >
        <div className="mx-auto max-w-6xl px-6 py-24">
          <h2 className="text-3xl font-bold tracking-tight">
            How it works
          </h2>
          <p
            className="mt-3 max-w-2xl text-base"
            style={{ color: "#B8C4D9" }}
          >
            No setup. No configuration. No fields to fill. Just your
            WhatsApp.
          </p>

          <div className="mt-14 grid gap-10 md:grid-cols-3">
            {[
              {
                n: "01",
                title: "You keep using WhatsApp",
                body: "Same app. Same number. Same customers. Nothing changes on your side.",
              },
              {
                n: "02",
                title: "Fluxo reads every message",
                body: "Every incoming message is understood: is it an order, a question, a payment, or a complaint?",
              },
              {
                n: "03",
                title: "Your business becomes a system",
                body: "Orders tracked. Customers organized. Reports in one word. Everything runs from your dashboard.",
              },
            ].map((step) => (
              <div key={step.n}>
                <div
                  className="mb-3 font-mono text-xs"
                  style={{ color: "#5A6B85" }}
                >
                  {step.n}
                </div>
                <h3 className="text-lg font-semibold text-white">
                  {step.title}
                </h3>
                <p
                  className="mt-2 text-sm leading-relaxed"
                  style={{ color: "#B8C4D9" }}
                >
                  {step.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHO IT'S FOR */}
      <section className="mx-auto max-w-6xl px-6 py-24">
        <h2 className="text-3xl font-bold tracking-tight">
          Built for businesses that live on WhatsApp
        </h2>
        <p
          className="mt-3 max-w-2xl text-base"
          style={{ color: "#B8C4D9" }}
        >
          From Karachi to California. Any business that takes orders,
          answers questions, or coordinates work through WhatsApp DMs.
        </p>

        <div className="mt-14 grid grid-cols-2 gap-4 md:grid-cols-4">
          {[
            "Clothing",
            "Food",
            "Services",
            "Retail",
            "Salons",
            "Trades",
            "Repairs",
            "Freelance",
          ].map((label) => (
            <div
              key={label}
              className="rounded-2xl p-5 text-center"
              style={{
                background: "rgba(255, 255, 255, 0.03)",
                border: "1px solid rgba(255, 255, 255, 0.06)",
              }}
            >
              <p
  className="text-sm font-medium"
  style={{ color: "#E5EAF3" }}
>
  {label}
</p>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section
        style={{
          borderTop: "1px solid rgba(255,255,255,0.06)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          background: "rgba(5, 11, 20, 0.5)",
        }}
      >
        <div className="mx-auto max-w-6xl px-6 py-24">
          <h2 className="text-3xl font-bold tracking-tight">
            What you get
          </h2>
          <p
            className="mt-3 max-w-2xl text-base"
            style={{ color: "#B8C4D9" }}
          >
            Everything a spreadsheet can't do — without leaving
            WhatsApp.
          </p>

          <div className="mt-14 grid gap-x-12 gap-y-10 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                title: "Auto-extracted orders",
                body: "Every message becomes a structured order with customer, items, price, and payment method.",
              },
              {
                title: "Real dashboard",
                body: "See your whole business in one screen. Sales, pending, unpaid, top customers.",
              },
              {
                title: "Multi-currency",
                body: "Orders in PKR, USD, EUR, AED, or any of 30+ currencies convert to your base automatically.",
              },
              {
                title: "Natural language commands",
                body: "Type 'summary', 'pending', or 'who owes me' in WhatsApp. Get answers in seconds.",
              },
              {
                title: "Customer history",
                body: "Every customer with their full order history, total spent, and last contact.",
              },
              {
                title: "Voice notes and images",
                body: "Voice messages transcribed. Payment screenshots read. All become structured data.",
              },
            ].map((f) => (
              <div key={f.title}>
                <h3 className="text-base font-semibold text-white">
                  {f.title}
                </h3>
                <p
                  className="mt-2 text-sm leading-relaxed"
                  style={{ color: "#B8C4D9" }}
                >
                  {f.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* UNDER THE HOOD */}
      <section className="mx-auto max-w-6xl px-6 py-24">
        <div className="grid items-start gap-16 lg:grid-cols-2">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">
              Under the hood
            </h2>
            <p
              className="mt-4 text-base leading-relaxed"
              style={{ color: "#B8C4D9" }}
            >
              Fluxo is not a chatbot. It's a real-time AI pipeline that
              runs on every message you receive.
            </p>
            <p
              className="mt-4 text-base leading-relaxed"
              style={{ color: "#B8C4D9" }}
            >
              AI interprets. Deterministic code executes. The AI never
              writes SQL, never generates executable code, and never
              touches your data directly. Its output is validated before
              anything runs.
            </p>
          </div>

          <div
            className="rounded-2xl p-6 font-mono text-xs leading-relaxed"
            style={{
              background: "rgba(255, 255, 255, 0.03)",
              border: "1px solid rgba(255, 255, 255, 0.06)",
              color: "#B8C4D9",
            }}
          >
            <pre>{`WhatsApp message
      ↓
Intent + entity extraction (AI)
      ↓
Confidence scoring
      ↓
Validation (schema + source)
      ↓
PostgreSQL persist
      ↓
Dashboard update

Same thesis as SheetForge:
AI interprets, code executes.`}</pre>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section
        className="relative overflow-hidden"
        style={{
          borderTop: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <div className="pointer-events-none absolute inset-0">
          <div
            className="absolute left-1/2 top-1/2 h-[500px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-30 blur-[140px]"
            style={{
              background:
                "radial-gradient(circle, #3B6BFF 0%, transparent 70%)",
            }}
          />
        </div>

        <div className="relative mx-auto max-w-6xl px-6 py-24 text-center">
          <h2 className="text-4xl font-bold tracking-tight text-white">
            Turn your first order into a system.
          </h2>
          <p
            className="mx-auto mt-4 max-w-lg text-base"
            style={{ color: "#B8C4D9" }}
          >
            Free to try. No credit card. Connect your WhatsApp in under
            two minutes.
          </p>
          <div className="mt-8 flex justify-center">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 rounded-lg px-6 py-3 text-sm font-semibold text-white transition-colors"
              style={{ background: ACCENT }}
            >
              Get started
              <span>→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer
        style={{
          borderTop: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 text-sm md:flex-row">
          <div className="flex items-center gap-2.5">
            <span
              className="flex h-6 w-6 items-center justify-center rounded-md text-xs font-bold text-white"
              style={{
                background:
                  "linear-gradient(135deg, #3B6BFF 0%, #6B8AFF 100%)",
              }}
            >
              F
            </span>
            <span style={{ color: "#8B95AB" }}>
              © {new Date().getFullYear()} Fluxo
            </span>
          </div>
          <div className="flex items-center gap-6">
            <a
              href="https://github.com/abdullah804-stack/fluxo"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors"
              style={{ color: "#8B95AB" }}
            >
              GitHub
            </a>
            <Link
              href="/login"
              className="transition-colors"
              style={{ color: "#8B95AB" }}
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="transition-colors"
              style={{ color: "#8B95AB" }}
            >
              Sign up
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}