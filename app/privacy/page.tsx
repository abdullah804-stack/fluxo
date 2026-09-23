export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white p-8">
      <div className="max-w-3xl mx-auto prose">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Privacy Policy
        </h1>
        <p className="text-sm text-gray-500 mb-8">
          Last updated: {new Date().toLocaleDateString()}
        </p>

        <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">
          What we collect
        </h2>
        <p className="text-gray-700 mb-4">
          Fluxo processes WhatsApp messages that are sent to your business
          account. This includes message content, sender phone numbers,
          timestamps, and any media (images, audio) you receive. We use this
          data to extract business information (orders, customers, payments)
          on your behalf.
        </p>

        <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">
          How we use it
        </h2>
        <p className="text-gray-700 mb-4">
          All processing happens on our servers. We do not sell your data to
          third parties. We use AI models to understand message intent and
          extract structured information. Your business data remains yours.
        </p>

        <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">
          Data retention
        </h2>
        <p className="text-gray-700 mb-4">
          You can delete your account and all associated data at any time
          from your account settings. Deleted data is permanently removed
          within 30 days.
        </p>

        <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">
          Contact
        </h2>
        <p className="text-gray-700">
          For privacy questions, contact us at privacy@fluxo.app.
        </p>
      </div>
    </div>
  );
}