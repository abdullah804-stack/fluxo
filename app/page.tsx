// app/page.tsx
import Link from "next/link";
import { ExtractionDemo } from "./_components/ExtractionDemo";

const ACCENT = "#3B6BFF";

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

        <div className="relative mx-auto max-w-6xl px-6 py-20 md:py-24">
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
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

              <h1 className="text-4xl font-bold leading-[1.08] tracking-tight text-white sm:text-5xl">
                Your WhatsApp already runs your business.
                <br />
                <span style={{ color: "#6B8AFF" }}>
                  Fluxo makes it official.
                </span>
              </h1>

              <p
                className="mt-6 max-w-lg text-base leading-relaxed sm:text-lg"
                style={{ color: "#B8C4D9" }}
              >
                Every message your customers send — orders, questions,
                payments, complaints — is read, understood, and turned
                into structured data. No spreadsheets. No lost
                information. No new app to learn.
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

              <p className="mt-6 text-xs" style={{ color: "#5A6B85" }}>
                Works with any WhatsApp Business number. Free to try.
              </p>
            </div>

            {/* Right: extraction animation */}
            <ExtractionDemo />
          </div>
        </div>
      </section>

      {/* THE PROBLEM */}
      <section
        className="relative"
        style={{
          borderTop: "1px solid rgba(255,255,255,0.06)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          background: "rgba(5, 11, 20, 0.5)",
        }}
      >
        <div className="mx-auto max-w-6xl px-6 py-20 md:py-24">
          <div className="max-w-3xl">
            <p
              className="text-[11px] font-semibold uppercase tracking-[0.15em]"
              style={{ color: "#6B8AFF" }}
            >
              The problem
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Millions of businesses run on WhatsApp — and it's chaos.
            </h2>
            <p
              className="mt-5 text-base leading-relaxed"
              style={{ color: "#B8C4D9" }}
            >
              Orders tracked in memory. Prices remembered instead of
              stored. Payments chased over chat. Customers asking
              &quot;where is my order&quot; because nobody wrote it down.
            </p>
            <p
              className="mt-4 text-base leading-relaxed"
              style={{ color: "#B8C4D9" }}
            >
              WhatsApp was never built to run a business. But it's where
              your customers are. Fluxo closes that gap.
            </p>
          </div>

          <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                stat: "70%",
                body: "of WhatsApp business messages go unanswered overnight",
              },
              {
                stat: "5+",
                body: "separate tools the average seller uses to track one order",
              },
              {
                stat: "1 in 3",
                body: "orders get forgotten or misremembered without a system",
              },
              {
                stat: "0",
                body: "structured reports at the end of the day",
              },
            ].map((item) => (
              <div
                key={item.stat}
                className="rounded-2xl p-5"
                style={{
                  background: "rgba(255, 255, 255, 0.03)",
                  border: "1px solid rgba(255, 255, 255, 0.06)",
                }}
              >
                <div
                  className="text-3xl font-bold tracking-tight"
                  style={{ color: "#FFFFFF" }}
                >
                  {item.stat}
                </div>
                <p
                  className="mt-2 text-sm leading-relaxed"
                  style={{ color: "#B8C4D9" }}
                >
                  {item.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="mx-auto max-w-6xl px-6 py-20 md:py-24">
        <div className="max-w-3xl">
          <p
            className="text-[11px] font-semibold uppercase tracking-[0.15em]"
            style={{ color: "#6B8AFF" }}
          >
            How it works
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Nothing changes on your side. Everything changes behind the scenes.
          </h2>
        </div>

        <div className="mt-14 grid gap-8 md:grid-cols-3">
          {[
            {
              n: "01",
              title: "You keep using WhatsApp",
              body: "Same app. Same number. Same customers. You do nothing differently.",
            },
            {
              n: "02",
              title: "Fluxo reads every message",
              body: "Each message is understood: is it an order, a question, a payment, a complaint?",
            },
            {
              n: "03",
              title: "Your business becomes a system",
              body: "Orders tracked. Customers organized. Reports on demand. All from your dashboard or a WhatsApp command.",
            },
          ].map((step) => (
            <div key={step.n}>
              <div
                className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl font-mono text-sm font-bold"
                style={{
                  background: "rgba(59, 107, 255, 0.12)",
                  color: "#6B8AFF",
                }}
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
      </section>

      {/* WHAT YOU GET */}
      <section
        style={{
          borderTop: "1px solid rgba(255,255,255,0.06)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          background: "rgba(5, 11, 20, 0.5)",
        }}
      >
        <div className="mx-auto max-w-6xl px-6 py-20 md:py-24">
          <div className="max-w-3xl">
            <p
              className="text-[11px] font-semibold uppercase tracking-[0.15em]"
              style={{ color: "#6B8AFF" }}
            >
              What you get
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              A complete operating system for your WhatsApp business.
            </h2>
          </div>

          <div className="mt-14 grid gap-8 md:grid-cols-3">
            <FeatureGroup
              title="Extract"
              items={[
                {
                  title: "Structured orders",
                  body: "Every order arrives with customer, items, quantity, price, address, and payment method.",
                },
                {
                  title: "Multi-modal input",
                  body: "Text, voice notes, and payment screenshots all become structured data.",
                },
                {
                  title: "Multi-language",
                  body: "English, Urdu, Hindi, and mixed — understood the same way.",
                },
              ]}
            />
            <FeatureGroup
              title="Operate"
              items={[
                {
                  title: "Natural language commands",
                  body: "Type 'summary', 'pending', or 'who owes me' in WhatsApp. Get answers in seconds.",
                },
                {
                  title: "Invoice PDFs",
                  body: "Send an invoice to any customer with one command — no design work.",
                },
                {
                  title: "Payment reminders",
                  body: "Chase unpaid customers with one word. Fluxo handles the rest.",
                },
              ]}
            />
            <FeatureGroup
              title="Understand"
              items={[
                {
                  title: "Real dashboard",
                  body: "Every order, customer, and message in one place. Kanban, list, and detail views.",
                },
                {
                  title: "Weekly reports",
                  body: "Revenue, top products, repeat customers — sent to your phone every Monday morning.",
                },
                {
                  title: "Catalogue & pricing",
                  body: "Store your products and prices once. Fluxo quotes them to customers automatically.",
                },
              ]}
            />
          </div>
        </div>
      </section>

      {/* COMMANDS SHOWCASE */}
      <section className="mx-auto max-w-6xl px-6 py-20 md:py-24">
        <div className="grid items-start gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <p
              className="text-[11px] font-semibold uppercase tracking-[0.15em]"
              style={{ color: "#6B8AFF" }}
            >
              Run it with commands
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Talk to your business the same way you talk to a friend.
            </h2>
            <p
              className="mt-5 text-base leading-relaxed"
              style={{ color: "#B8C4D9" }}
            >
              Forget dashboards you have to remember. Just type what you
              want in WhatsApp — Fluxo answers in seconds.
            </p>
            <p
              className="mt-4 text-base leading-relaxed"
              style={{ color: "#B8C4D9" }}
            >
              Ask for a summary. Mark deliveries. Send invoices. Chase
              payments. All with a single line.
            </p>

            <Link
              href="/signup"
              className="mt-8 inline-flex items-center gap-2 rounded-lg px-5 py-3 text-sm font-semibold text-white transition-colors"
              style={{ background: ACCENT }}
            >
              Try it free
              <span>→</span>
            </Link>
          </div>

          <div
            className="rounded-2xl p-6"
            style={{
              background: "rgba(255, 255, 255, 0.03)",
              border: "1px solid rgba(255, 255, 255, 0.06)",
            }}
          >
            <div
              className="mb-4 text-[10px] font-semibold uppercase tracking-[0.15em]"
              style={{ color: "#8B95AB" }}
            >
              Fluxo commands
            </div>
            <div className="flex flex-col gap-2.5">
              {[
                { cmd: "summary", desc: "Today's business at a glance" },
                { cmd: "pending", desc: "Orders still waiting to ship" },
                { cmd: "who owes me", desc: "Every unpaid customer" },
                { cmd: "invoice Sara", desc: "Send a PDF invoice instantly" },
                { cmd: "remind all", desc: "Chase every unpaid order" },
                { cmd: "delivered Ali", desc: "Mark an order as delivered" },
                { cmd: "weekly report", desc: "Full week — sent to your phone" },
                { cmd: "search kurti", desc: "Find any past conversation" },
              ].map((row) => (
                <div
                  key={row.cmd}
                  className="flex items-center justify-between gap-4"
                >
                  <code
                    className="rounded-md px-2 py-1 font-mono text-xs"
                    style={{
                      background: "rgba(59, 107, 255, 0.12)",
                      color: "#6B8AFF",
                    }}
                  >
                    {row.cmd}
                  </code>
                  <span
                    className="text-right text-xs"
                    style={{ color: "#B8C4D9" }}
                  >
                    {row.desc}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* WHO IT'S FOR */}
      <section
        style={{
          borderTop: "1px solid rgba(255,255,255,0.06)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          background: "rgba(5, 11, 20, 0.5)",
        }}
      >
        <div className="mx-auto max-w-6xl px-6 py-20 md:py-24">
          <div className="max-w-3xl">
            <p
              className="text-[11px] font-semibold uppercase tracking-[0.15em]"
              style={{ color: "#6B8AFF" }}
            >
              Who it's for
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Any business that takes orders on WhatsApp.
            </h2>
            <p
              className="mt-5 text-base leading-relaxed"
              style={{ color: "#B8C4D9" }}
            >
              From a single shopkeeper in Karachi to a small chain in
              California. If your customers message you, Fluxo is built
              for you.
            </p>
          </div>

          <div className="mt-14 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {[
              "Clothing",
              "Food & bakery",
              "Cosmetics",
              "Home decor",
              "Electronics",
              "Groceries",
              "Books",
              "Handicraft",
              "Salons",
              "Other",
            ].map((label) => (
              <div
                key={label}
                className="rounded-xl p-4 text-center"
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
        </div>
      </section>

      {/* BUILT WITH */}
      <section className="mx-auto max-w-6xl px-6 py-20 md:py-24">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <p
              className="text-[11px] font-semibold uppercase tracking-[0.15em]"
              style={{ color: "#6B8AFF" }}
            >
              Built with
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              A real-time AI pipeline, not a wrapper.
            </h2>
            <p
              className="mt-5 text-base leading-relaxed"
              style={{ color: "#B8C4D9" }}
            >
              AI interprets. Deterministic code executes. The AI never
              writes SQL, never generates executable code, and never
              touches your data directly. Its output is validated,
              scored, and linked back to the source before anything runs.
            </p>
            <p
              className="mt-4 text-base leading-relaxed"
              style={{ color: "#B8C4D9" }}
            >
              The pipeline handles text, voice notes, and images in the
              same loop — with multi-currency conversion and per-field
              confidence scoring.
            </p>

            <div className="mt-8 flex flex-wrap gap-2">
              {[
                "Next.js",
                "TypeScript",
                "PostgreSQL",
                "Prisma",
                "OpenRouter",
                "Groq Whisper",
                "Groq Vision",
                "Meta Cloud API",
              ].map((tech) => (
                <span
                  key={tech}
                  className="rounded-full px-3 py-1 text-xs font-medium"
                  style={{
                    background: "rgba(255, 255, 255, 0.05)",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    color: "#B8C4D9",
                  }}
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>

          <div
            className="overflow-hidden rounded-2xl"
            style={{
              background: "rgba(255, 255, 255, 0.03)",
              border: "1px solid rgba(255, 255, 255, 0.06)",
              padding: 24,
            }}
          >
            <div
              className="mb-4 text-[10px] font-semibold uppercase tracking-[0.15em]"
              style={{ color: "#8B95AB" }}
            >
              The pipeline
            </div>

            <div className="flex flex-col gap-3">
              <PipelineStep
                n="1"
                title="WhatsApp message arrives"
                detail="Text, voice, or image — via Meta Cloud API"
              />
              <Arrow />
              <PipelineStep
                n="2"
                title="AI reads and extracts"
                detail="Intent · Entities · Currency · Scheduling"
              />
              <Arrow />
              <PipelineStep
                n="3"
                title="Confidence scored & validated"
                detail="Every field backed by the source message"
              />
              <Arrow />
              <PipelineStep
                n="4"
                title="Persisted to PostgreSQL"
                detail="Ready for your dashboard and commands"
              />
            </div>
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

        <div className="relative mx-auto max-w-6xl px-6 py-20 text-center md:py-24">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Turn your first order into a system.
          </h2>
          <p
            className="mx-auto mt-4 max-w-lg text-base"
            style={{ color: "#B8C4D9" }}
          >
            Free to try. No credit card. Connect your WhatsApp number and
            Fluxo starts working within minutes.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 rounded-lg px-6 py-3 text-sm font-semibold text-white transition-colors"
              style={{ background: ACCENT }}
            >
              Get started
              <span>→</span>
            </Link>
            <a
              href="/setup-guide"
              className="inline-flex items-center gap-2 rounded-lg border px-6 py-3 text-sm font-medium transition-colors"
              style={{
                borderColor: "rgba(255,255,255,0.15)",
                color: "#B8C4D9",
              }}
            >
              See the setup guide
            </a>
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
              href="/setup-guide"
              className="transition-colors"
              style={{ color: "#8B95AB" }}
            >
              Setup guide
            </Link>
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

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function FeatureGroup({
  title,
  items,
}: {
  title: string;
  items: { title: string; body: string }[];
}) {
  return (
    <div>
      <div
        className="mb-5 text-[11px] font-semibold uppercase tracking-[0.15em]"
        style={{ color: "#6B8AFF" }}
      >
        {title}
      </div>
      <div className="flex flex-col gap-6">
        {items.map((item) => (
          <div key={item.title}>
            <h3 className="text-base font-semibold text-white">
              {item.title}
            </h3>
            <p
              className="mt-1.5 text-sm leading-relaxed"
              style={{ color: "#B8C4D9" }}
            >
              {item.body}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function PipelineStep({
  n,
  title,
  detail,
}: {
  n: string;
  title: string;
  detail: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg font-mono text-xs font-bold"
        style={{
          background: "rgba(59, 107, 255, 0.15)",
          color: "#6B8AFF",
        }}
      >
        {n}
      </span>
      <div className="min-w-0">
        <div className="text-sm font-medium text-white">{title}</div>
        <div className="mt-0.5 text-xs" style={{ color: "#8B95AB" }}>
          {detail}
        </div>
      </div>
    </div>
  );
}

function Arrow() {
  return (
    <div
      className="ml-3 h-4 w-px"
      style={{ background: "rgba(255,255,255,0.08)" }}
    />
  );
}