export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-page p-8">
      <div className="mx-auto max-w-3xl text-ink">
        <h1 className="mb-4 text-3xl font-bold text-ink">
          Privacy Policy
        </h1>
        <p className="mb-8 text-sm text-ink-3">
          Last updated: {new Date().toLocaleDateString()}
        </p>

        <h2 className="mb-3 mt-8 text-xl font-semibold text-ink">
          What we collect
        </h2>
        <p className="mb-4 text-ink-2">
          Fluxo processes WhatsApp messages that are sent to your business
          account. This includes message content, sender phone numbers,
          timestamps, and any media (images, audio) you receive. We use this
          data to extract business information (orders, customers, payments)
          on your behalf.
        </p>

        <h2 className="mb-3 mt-8 text-xl font-semibold text-ink">
          How we use it
        </h2>
        <p className="mb-4 text-ink-2">
          All processing happens on our servers. We do not sell your data to
          third parties. We use AI models to understand message intent and
          extract structured information. Your business data remains yours.
        </p>

        <h2 className="mb-3 mt-8 text-xl font-semibold text-ink">
          Data retention
        </h2>
        <p className="mb-4 text-ink-2">
          You can delete your account and all associated data at any time
          from your account settings. Deleted data is permanently removed
          within 30 days.
        </p>

        <h2 className="mb-3 mt-8 text-xl font-semibold text-ink">
          Contact
        </h2>
        <p className="text-ink-2">
          For privacy questions, contact us at privacy@fluxo.app.
        </p>
      </div>
    </div>
  );
}