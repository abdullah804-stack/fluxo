// app/dashboard/settings/page.tsx
import { getCtx } from "../_lib";
import { PageHeader } from "../_components/PageHeader";
import { CurrencySettings } from "./CurrencySettings";
import { BusinessInfo } from "./BusinessInfo";
import { DisconnectButton } from "./DisconnectButton";
import { DraftNotificationsToggle } from "./DraftNotificationsToggle";
import { IncomingNotificationsToggle } from "./IncomingNotificationsToggle";
import { HighValueThresholdInput } from "./HighValueThresholdInput";
import { ConnectWhatsApp } from "./ConnectWhatsApp";
const BORDER = "#E6EAF5";
const LINE_SOFT = "#F3F5FB";
const TEXT_PRIMARY = "#0B1220";
const TEXT_SECONDARY = "#556075";
const TEXT_MUTED = "#8B95AB";
const ACCENT = "#3B6BFF";
const DANGER = "#EF4444";

export default async function Settings() {
  const { user, account } = await getCtx();
  const baseCurrency =
    (user as { baseCurrency?: string }).baseCurrency ?? "USD";

  const card: React.CSSProperties = {
    borderRadius: 16,
    border: `1px solid ${BORDER}`,
    background: "#FFFFFF",
    padding: 24,
    boxShadow: "0 1px 2px 0 rgba(11, 18, 24, 0.04)",
  };

  const row = (k: string, v: React.ReactNode) => (
    <div
      className="flex items-center justify-between gap-4 py-3 text-sm"
      style={{ borderBottom: `1px solid ${LINE_SOFT}` }}
    >
      <dt style={{ color: TEXT_SECONDARY }}>{k}</dt>
      <dd className="text-right" style={{ color: TEXT_PRIMARY }}>
        {v}
      </dd>
    </div>
  );

  return (
    <>
      <PageHeader
        title="Settings"
        subtitle="Your connection and business details. Your data stays yours."
      />

      <div className="flex max-w-2xl flex-col gap-5">
        {/* WhatsApp connection */}
        <section style={card} className="fade-up">
          <h2
            className="mb-3 text-base font-semibold tracking-tight"
            style={{ color: TEXT_PRIMARY }}
          >
            WhatsApp connection
          </h2>

                    {account ? (
            <dl>
              {row("Number", <span className="tnum">{account.phoneNumber}</span>)}
              {row(
                "Phone number ID",
                <span className="tnum">{account.phoneNumberId}</span>
              )}
              {row("WABA ID", <span className="tnum">{account.wabaId}</span>)}
              {row(
                "Connected",
                account.connectedAt.toLocaleDateString("en-US", {
                  dateStyle: "medium",
                })
              )}
            </dl>
          ) : (
            <ConnectWhatsApp />
          )}
        </section>

        {/* Business info */}
        <section style={{ ...card, animationDelay: "50ms" }} className="fade-up">
          <h2
            className="mb-1 text-base font-semibold tracking-tight"
            style={{ color: TEXT_PRIMARY }}
          >
            Business info
          </h2>
          <p className="mb-4 text-sm" style={{ color: TEXT_SECONDARY }}>
            How your business appears in the app.
          </p>
          <BusinessInfo initialDisplayName={account?.displayName ?? ""} />
        </section>

        {/* Currency */}
        <section style={{ ...card, animationDelay: "100ms" }} className="fade-up">
          <h2
            className="mb-1 text-base font-semibold tracking-tight"
            style={{ color: TEXT_PRIMARY }}
          >
            Currency
          </h2>
          <p className="mb-4 text-sm" style={{ color: TEXT_SECONDARY }}>
            Your base currency for reports and totals. Orders in other
            currencies are converted automatically.
          </p>
          <CurrencySettings initialBaseCurrency={baseCurrency} />
        </section>
                  {/* Draft notifications */}
        <section
          style={{ ...card, animationDelay: "125ms" }}
          className="fade-up"
        >
          <h2
            className="mb-1 text-base font-semibold tracking-tight"
            style={{ color: TEXT_PRIMARY }}
          >
            Draft notifications
          </h2>
          <p className="mb-4 text-sm" style={{ color: TEXT_SECONDARY }}>
            When a customer asks a question, Fluxo drafts a reply and
            pings you on WhatsApp. You copy it, edit if needed, and
            send. Off by default.
          </p>
          <DraftNotificationsToggle
            initialEnabled={user.draftNotifications ?? false}
          />
        </section>

        
        {/* Incoming message notifications */}
        <section
          style={{ ...card, animationDelay: "130ms" }}
          className="fade-up"
        >
          <h2
            className="mb-1 text-base font-semibold tracking-tight"
            style={{ color: TEXT_PRIMARY }}
          >
            Incoming message alerts
          </h2>
          <p className="mb-4 text-sm" style={{ color: TEXT_SECONDARY }}>
            Get a short WhatsApp ping on your own number whenever a
            customer sends an order, question, complaint, or payment.
            Off by default.
          </p>
          <IncomingNotificationsToggle
            initialEnabled={
              (user as { notifyIncomingMessages?: boolean }).notifyIncomingMessages ??
              false
            }
          />
        </section>

        
        {/* High-value order alerts */}
        <section
          style={{ ...card, animationDelay: "135ms" }}
          className="fade-up"
        >
          <h2
            className="mb-1 text-base font-semibold tracking-tight"
            style={{ color: TEXT_PRIMARY }}
          >
            High-value order alerts
          </h2>
          <p className="mb-4 text-sm" style={{ color: TEXT_SECONDARY }}>
            When a new order exceeds your threshold, Fluxo pings you on
            WhatsApp right away. Off by default.
          </p>
          <HighValueThresholdInput
            initialThreshold={
              (user as { highValueThreshold?: number | null })
                .highValueThreshold ?? null
            }
            baseCurrency={baseCurrency}
          />
        </section>
        {/* Danger zone */}
        {account && (
          <section
            style={{
              ...card,
              animationDelay: "150ms",
              borderColor: "rgba(239, 68, 68, 0.25)",
            }}
            className="fade-up"
          >
            <h2
              className="mb-1 text-base font-semibold tracking-tight"
              style={{ color: DANGER }}
            >
              Danger zone
            </h2>
            <p className="mb-4 text-sm" style={{ color: TEXT_SECONDARY }}>
              Disconnecting stops new messages from being tracked. Existing
              orders and customers are kept.
            </p>
            <DisconnectButton phoneNumber={account.phoneNumber} />
          </section>
        )}
      </div>
    </>
  );
}