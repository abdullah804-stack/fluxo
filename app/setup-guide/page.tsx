// app/setup-guide/page.tsx
import Link from "next/link";
import { auth } from "@/auth";

const BORDER = "#E6EAF5";
const TEXT_PRIMARY = "#0B1220";
const TEXT_SECONDARY = "#556075";
const TEXT_MUTED = "#8B95AB";
const ACCENT = "#3B6BFF";

export default async function SetupGuidePage() {
  const session = await auth();
  const isLoggedIn = Boolean(session?.user?.email);
  const ctaHref = isLoggedIn ? "/dashboard/settings" : "/signup";
  const ctaLabel = isLoggedIn
    ? "I'm ready — connect WhatsApp"
    : "Create your account";

  return (
    <div
      className="min-h-screen"
      style={{ background: "#F5F7FE" }}
    >
      {/* Nav */}
      <nav
        className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur"
        style={{ borderColor: BORDER }}
      >
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-6">
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
            <span
              className="text-base font-bold tracking-tight"
              style={{ color: TEXT_PRIMARY }}
            >
              Fluxo
            </span>
          </Link>
          <Link
            href={isLoggedIn ? "/dashboard" : "/login"}
            className="text-sm font-medium"
            style={{ color: TEXT_SECONDARY }}
          >
            {isLoggedIn ? "Back to dashboard" : "Sign in"}
          </Link>
        </div>
      </nav>

      <main className="mx-auto max-w-3xl px-6 py-16">
        {/* Header */}
        <div className="mb-12">
          <p
            className="text-[11px] font-semibold uppercase tracking-[0.15em]"
            style={{ color: TEXT_MUTED }}
          >
            Setup guide
          </p>
          <h1
            className="mt-2 text-4xl font-bold tracking-tight"
            style={{ color: TEXT_PRIMARY }}
          >
            Connect your WhatsApp in 5 minutes
          </h1>
          <p
            className="mt-4 max-w-xl text-base"
            style={{ color: TEXT_SECONDARY }}
          >
            You&apos;ll need a free Meta Business account and about 5
            minutes. Follow these steps exactly — we&apos;ll copy three
            values into Fluxo at the end.
          </p>
        </div>

        {/* Time estimate + prerequisites */}
        <div
          className="mb-10 rounded-2xl bg-white p-6 shadow-sm"
          style={{ border: `1px solid ${BORDER}` }}
        >
          <h2
            className="text-base font-semibold tracking-tight"
            style={{ color: TEXT_PRIMARY }}
          >
            Before you start
          </h2>
          <ul
            className="mt-3 flex flex-col gap-2 text-sm"
            style={{ color: TEXT_SECONDARY }}
          >
            <li className="flex items-start gap-2">
              <span
                className="mt-1.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full"
                style={{ background: ACCENT }}
              />
              A WhatsApp number you can receive a code on (your phone is
              fine)
            </li>
            <li className="flex items-start gap-2">
              <span
                className="mt-1.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full"
                style={{ background: ACCENT }}
              />
              A Facebook account (any personal account works)
            </li>
            <li className="flex items-start gap-2">
              <span
                className="mt-1.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full"
                style={{ background: ACCENT }}
              />
              About 5 minutes of uninterrupted time
            </li>
          </ul>
          <p
            className="mt-4 text-xs"
            style={{ color: TEXT_MUTED }}
          >
            Meta&apos;s setup is free. Fluxo never charges you to connect
            your own WhatsApp number.
          </p>
        </div>

        {/* Step 1 */}
        <Step
          n={1}
          title="Create a Meta Business account"
          body={
            <>
              <p>
                Go to{" "}
                <a
                  href="https://business.facebook.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: ACCENT, fontWeight: 500 }}
                >
                  business.facebook.com
                </a>{" "}
                and click <strong>Create account</strong>.
              </p>
              <p className="mt-3">
                Sign in with your Facebook account. If you don&apos;t
                have one, create it — it&apos;s free.
              </p>
              <p className="mt-3">
                Fill in your business name and email. That&apos;s it for
                this step — you don&apos;t need to verify anything yet.
              </p>
            </>
          }
        />

        {/* Step 2 */}
        <Step
          n={2}
          title="Create a Meta developer app"
          body={
            <>
              <p>
                Go to{" "}
                <a
                  href="https://developers.facebook.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: ACCENT, fontWeight: 500 }}
                >
                  developers.facebook.com
                </a>{" "}
                and sign in with the same Facebook account.
              </p>
              <p className="mt-3">
                Click <strong>My Apps → Create App</strong>.
              </p>
              <p className="mt-3">
                Choose:
              </p>
              <ul className="mt-2 flex flex-col gap-1.5 pl-4">
                <li>
                  App type: <strong>Business</strong>
                </li>
                <li>
                  App name: <strong>Anything you like (e.g. &quot;My
                  Shop&quot;)</strong>
                </li>
                <li>
                  Contact email: <strong>Your email</strong>
                </li>
              </ul>
              <p className="mt-3">
                Click <strong>Create app</strong>.
              </p>
            </>
          }
        />

        {/* Step 3 */}
        <Step
          n={3}
          title="Add WhatsApp to your app"
          body={
            <>
              <p>
                On your app dashboard, scroll down to{" "}
                <strong>Add products to your app</strong>.
              </p>
              <p className="mt-3">
                Find <strong>WhatsApp</strong> → click{" "}
                <strong>Set up</strong>.
              </p>
              <p className="mt-3">
                Meta will create a WhatsApp Business account for you and
                take you to the <strong>Getting Started</strong> page.
                This is where you&apos;ll find the three values you need
                for Fluxo.
              </p>
            </>
          }
        />

        {/* Step 4 */}
        <Step
          n={4}
          title="Copy your three values"
          body={
            <>
              <p>
                On the <strong>WhatsApp → API Setup</strong> page,
                you&apos;ll see three things you need to copy into Fluxo:
              </p>

              <div
                className="mt-5 flex flex-col gap-3 rounded-xl p-4"
                style={{ background: "#F9FAFE", border: `1px solid ${BORDER}` }}
              >
                <Value
                  name="Business phone number"
                  where="Shown at the top, next to 'From:'"
                  example="+1 555 141 2318"
                />
                <Value
                  name="Phone Number ID"
                  where="Below the phone number, labelled 'Phone number ID'"
                  example="123456789012345"
                />
                <Value
                  name="WhatsApp Business Account ID"
                  where="On the same page — the WABA ID"
                  example="987654321098765"
                />
              </div>

              <p className="mt-4">
                Keep this page open. You&apos;ll paste these into Fluxo
                next.
              </p>
            </>
          }
        />

        {/* Step 5 */}
        <Step
          n={5}
          title="Paste them into Fluxo"
          body={
            <>
              <p>
                Open Fluxo and go to{" "}
                <strong>Settings → WhatsApp connection</strong>.
              </p>
              <p className="mt-3">
                Paste the three values into the form and click{" "}
                <strong>Connect WhatsApp</strong>.
              </p>
              <p className="mt-3">
                That&apos;s it. Send yourself a test message to your
                WhatsApp Business number and you should see it appear in
                Fluxo&apos;s dashboard within seconds.
              </p>
            </>
          }
        />

        {/* Step 6 */}
        <Step
          n={6}
          title="Add yourself as a recipient (only for test numbers)"
          body={
            <>
              <p>
                If you&apos;re using Meta&apos;s free test number, only
                the phone numbers you list in Meta can receive messages
                from it.
              </p>
              <p className="mt-3">
                On the same <strong>API Setup</strong> page, scroll to{" "}
                <strong>To</strong> and click{" "}
                <strong>Manage phone number list</strong>.
              </p>
              <p className="mt-3">
                Add your own phone number and enter the code Meta texts
                you. Now you can send test messages from that number and
                they&apos;ll appear in Fluxo.
              </p>
              <p
                className="mt-3 text-xs"
                style={{ color: TEXT_MUTED }}
              >
                Note: This limit goes away once you connect a real
                business number instead of the test number.
              </p>
            </>
          }
        />

        {/* CTA */}
        <div
          className="mt-12 rounded-2xl p-8 text-center"
          style={{
            background: "linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%)",
            border: "1px solid #C7D2FE",
          }}
        >
          <h2
            className="text-2xl font-bold tracking-tight"
            style={{ color: TEXT_PRIMARY }}
          >
            Ready to connect?
          </h2>
          <p
            className="mx-auto mt-2 max-w-md text-sm"
            style={{ color: "#4338CA" }}
          >
            Paste your three values into Fluxo and you&apos;re live. If
            you get stuck, email us — we&apos;ll walk you through it.
          </p>
          <div className="mt-6 flex justify-center">
            <Link
              href={ctaHref}
              className="inline-flex items-center gap-2 rounded-lg px-6 py-3 text-sm font-semibold text-white transition-colors"
              style={{ background: ACCENT }}
            >
              {ctaLabel}
              <span>→</span>
            </Link>
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-16">
          <h2
            className="text-xl font-semibold tracking-tight"
            style={{ color: TEXT_PRIMARY }}
          >
            Common questions
          </h2>

          <div className="mt-6 flex flex-col gap-4">
            <Faq
              q="Is this free?"
              a="Yes. Meta's WhatsApp Business API is free to set up and to receive customer messages. You only pay Meta when you send business-initiated template messages (marketing), and even then, the first 1,000 conversations per month are free."
            />
            <Faq
              q="Can I use my personal WhatsApp number?"
              a="Yes, but you'll need to remove it from the regular WhatsApp app first. Meta requires the number to be dedicated to the business account. Many sellers buy a second SIM for this."
            />
            <Faq
              q="What if I already use WhatsApp Business (the app)?"
              a="The API is different from the app. You can either migrate the number to the API (recommended for shops handling many orders) or keep the app for personal use and register a second number for the API."
            />
            <Faq
              q="How long does the setup take?"
              a="About 5 minutes if you already have a Facebook account. Meta may take longer if it asks you to verify your business — but that's not required for the test number."
            />
            <Faq
              q="What are the phone number ID and WABA ID?"
              a="They're Meta's internal identifiers for your WhatsApp account. You don't need to remember them — you just paste them into Fluxo once, and Fluxo uses them for every message it sends or receives on your behalf."
            />
          </div>
        </div>

        {/* Footer */}
        <div
          className="mt-16 border-t pt-8 text-center text-sm"
          style={{ borderColor: BORDER, color: TEXT_MUTED }}
        >
          Still stuck?{" "}
          <a
            href="mailto:help@fluxo.app"
            style={{ color: ACCENT }}
          >
            help@fluxo.app
          </a>
        </div>
      </main>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function Step({
  n,
  title,
  body,
}: {
  n: number;
  title: string;
  body: React.ReactNode;
}) {
  return (
    <section className="mb-8">
      <div className="flex items-start gap-4">
        <span
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
          style={{ background: ACCENT }}
        >
          {n}
        </span>
        <div className="min-w-0 flex-1">
          <h2
            className="text-lg font-semibold tracking-tight"
            style={{ color: TEXT_PRIMARY }}
          >
            {title}
          </h2>
          <div
            className="mt-3 text-sm leading-relaxed"
            style={{ color: TEXT_SECONDARY }}
          >
            {body}
          </div>
        </div>
      </div>
    </section>
  );
}

function Value({
  name,
  where,
  example,
}: {
  name: string;
  where: string;
  example: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <div
        className="text-sm font-semibold"
        style={{ color: TEXT_PRIMARY }}
      >
        {name}
      </div>
      <div className="text-xs" style={{ color: TEXT_SECONDARY }}>
        {where}
      </div>
      <code
        className="mt-1 inline-block self-start rounded px-2 py-1 text-xs"
        style={{ background: "#FFFFFF", color: TEXT_PRIMARY, border: `1px solid ${BORDER}` }}
      >
        e.g. {example}
      </code>
    </div>
  );
}

function Faq({ q, a }: { q: string; a: string }) {
  return (
    <details
      className="rounded-xl bg-white p-4"
      style={{ border: `1px solid ${BORDER}` }}
    >
      <summary
        className="cursor-pointer select-none text-sm font-semibold"
        style={{ color: TEXT_PRIMARY }}
      >
        {q}
      </summary>
      <p
        className="mt-3 text-sm leading-relaxed"
        style={{ color: TEXT_SECONDARY }}
      >
        {a}
      </p>
    </details>
  );
}