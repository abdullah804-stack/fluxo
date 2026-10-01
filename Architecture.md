# Fluxo — Architecture

This document describes how Fluxo is built: the pipeline, the data model, and the decisions behind them. Read it alongside the [README](./README.md).

---

## 1. High-level architecture

![High-level architecture](public/screenshots/diagrams/01-architecture.jpg)

**Deployment:** Vercel, with Fluid Compute. The webhook function is configured for 300-second execution.

**Database:** Neon Postgres, free tier, kept warm by a cron-job.org ping to `/api/health` every 4 minutes.

**Model strategy:** Text uses OpenRouter with runtime model discovery (self-healing against slug retirement). Voice and vision use Groq, which has more stable free tiers for those modalities.

---

## 2. The AI pipeline

### 2.1 Message ingestion

Every inbound WhatsApp message arrives at `/api/whatsapp/webhook` with an `x-hub-signature-256` header. The route:

1. Verifies the HMAC signature using `WHATSAPP_APP_SECRET`
2. Idempotently stores the message (`waMessageId` is unique — Meta retries get deduplicated)
3. Detects whether the sender is the owner (`fromNumber === account.phoneNumber`)
4. Routes by message type

If the sender is the owner and the text looks like a command (`quickCommandCheck` regex), it goes to the command pipeline. Otherwise, it goes to the extraction pipeline.

### 2.2 Customer message pipeline

![Customer message pipeline](public/screenshots/diagrams/02-pipeline.jpg)
Text message
↓
Build context: business name, base currency, phone country code,
catalogue summary (from seller's Product table)
↓
extractMessage() ──► OpenRouter (JSON mode)
↓
ExtractedMessage {
intent, confidence, language,
customer: { name, phone },
order: { items, total, currency, currency_confidence,
payment_method, address, scheduled_at },
question, complaint, status_reference, notes
}
↓
Persist extractedData on the Message row
↓
If intent === "order" and confidence ≥ 0.7:
│
├─► Find or create Customer by phone
│
├─► Catalogue lookup: for each item with no price, fuzzy match
│ against Product table. Fill in prices from matches.
│ Recompute total if the extractor didn't provide one.
│
├─► Currency conversion: if the extracted currency differs from
│ the seller's base currency, look up the exchange rate
│ (24h cached) and store originalAmount, originalCurrency,
│ baseAmount, exchangeRate, exchangeRateDate.
│
├─► Parse scheduled_at into a Date
│
└─► Create Order row
│
├─► notifyHighValueOrder() (if baseAmount ≥ threshold)
└─► notifyIncomingMessage() (if owner has alerts enabled)

If intent === "question" and owner has draft notifications enabled:
└─► notifyOwnerWithDraft() → generateDraftReply() → ping owner



### 2.3 Voice pipeline
Audio message
↓
Download media from Meta (media ID → temp URL → bytes)
↓
Groq Whisper (large-v3-turbo) with a prompt hint to prefer
Roman/Latin script over Devanagari
↓
Store transcription as Message.content with a [voice] prefix
↓
Run the same extractInBackground() path as text



### 2.4 Image pipeline
Image message
↓
Download media from Meta
↓
Encode as base64 data URL
↓
Groq vision (Qwen3.8-27b) with a JSON-constrained prompt
↓
Analysis {
imageType: "payment_screenshot" | "product_photo" | "delivery_proof" | ...,
payment: { amount, currency, method, recipient, reference },
...
}
↓
Store imageAnalysis on the Message row
↓
If imageType === "payment_screenshot" with confidence ≥ 0.7:
└─► Find the customer, find their latest unpaid order,
mark it paid


### 2.5 Owner command pipeline
Owner types a message
↓
quickCommandCheck() — fast regex match against known patterns
↓
parseCommand() ──► OpenRouter (JSON mode)
↓
ParsedCommand {
intent: one of ~20 values,
confidence,
params: { customer_name, status, query }
}
↓
Deterministic executor — a switch on intent:
summary, list_pending, list_unpaid, list_repeat, weekly_report,
mark_shipped, mark_delivered, cancel, mark_paid,
invoice, remind, remind_one,
send_draft, edit_draft, skip_draft, list_drafts,
list_products, search, help
↓
Format reply, send via Meta Cloud API



Every command is a pure function of the parsed intent and the database state. **The AI never decides what to do — it only describes what the owner wants. Code decides what happens.**

### 2.6 Draft approval loop

![Draft approval loop](public/screenshots/diagrams/04-draft-loop.jpg)
Customer question
↓
generateDraftReply() → context: business, tone (past outgoing
messages), customer orders, catalogue
↓
Store draft on Message.draftReply and create a PendingDraft row
↓
Ping the owner with a short preview + three commands
↓
Owner replies with one of:
send [name] → approveAndSendDraft() → WhatsApp to customer
edit [name] [t] → editDraftText() → re-ping for confirmation
skip [name] → skipDraft() → status = "skipped"
↓
Cron at 00:00 UTC expires stale pending drafts (24h TTL)


---

## 3. Data model

![Data model](public/screenshots/diagrams/03-data-model.jpg)

Nine Prisma models. The schema lives at `prisma/schema.prisma`.

### User
The business owner. Holds settings (`baseCurrency`, `draftNotifications`, `notifyIncomingMessages`, `highValueThreshold`), business metadata (`businessName`, `businessType`), and Auth.js fields.

### Account, Session, VerificationToken
Standard Auth.js v5 tables.

### WhatsAppAccount
One per User. Stores `phoneNumber`, `phoneNumberId`, `wabaId`, `displayName`. Every message, customer, order, product, and pending draft is scoped through this row.

### Message
The raw log of every inbound and outbound message. Contains:
- `rawPayload` — the full Meta webhook body, kept for audit
- `extractedData` — the JSON returned by the extractor
- `imageAnalysis` — the JSON returned by the vision model
- `draftReply` — the last AI-generated draft for this message

### Customer
Unique per `(whatsappAccountId, phone)`. Names get filled in when the extractor finds them; the phone number is always the identity.

### Order
The structured unit of business. Contains items (JSONB), total, currency, payment method, payment status, delivery status, `recipientName` (from the AI — different from the phone owner), `scheduledAt`, `lastRemindedAt`, and the full currency-conversion set (`originalAmount`, `originalCurrency`, `baseAmount`, `exchangeRate`, `exchangeRateDate`).

### Product and ProductVariant
The seller's catalogue. A Product has a base price. Optional ProductVariants (size, colour, weight) carry their own prices and optional stock.

### PendingDraft
The state machine for the AI-draft approval loop. `status` is `pending`, `sent`, `skipped`, or `expired`. `expiresAt` is set to creation + 24h.

### ExchangeRate
A simple key-value cache: `fromCode → toCode → rate`, refreshed once per day from exchangerate-api.com with USD as the pivot currency.

---

## 4. Key design decisions

### 4.1 AI interprets, code executes

The AI's output is always **data**, never executable. Extraction returns a JSON object with a strict shape. The command parser returns an intent and params. Every downstream effect is applied by deterministic TypeScript code with explicit validation.

**Why:** LLMs hallucinate. Deterministic code doesn't. If the AI says "mark delivered" for a customer that doesn't exist, the code returns "no customer found" — it doesn't invent a customer. Every business action is auditable and reproducible.

### 4.2 Idempotency everywhere

Meta retries slow webhooks. Fluxo's webhook stores a `waMessageId` uniqueness constraint. If a retry arrives, the second insert fails silently and the route returns 200. This prevents duplicate orders and duplicate sends.

### 4.3 Background processing

The webhook response is decoupled from the AI work. The 200 is returned as soon as the message is stored, and processing continues after. On Vercel, unawaited promises die with the function, so the code `await`s long-running work and the function is configured with a 300-second `maxDuration`.

### 4.4 Runtime model discovery

Hardcoded model slugs go stale. OpenRouter retires free models without notice. Fluxo fetches the current free-model list at runtime (`lib/ai/openrouter-models.ts`), filters for JSON-mode-capable text models with sufficient context, caches the result for 24 hours, and falls back to a hardcoded safe list if discovery fails.

**Why:** Self-healing against provider churn. The alternative is a code change every time a slug retires.

### 4.5 Currency normalization

Every order stores both its original currency (what the customer said) and a base-currency equivalent (what the seller thinks in). All sums in the dashboard, reports, and commands use `baseAmount` — never raw `total`. Orders whose conversion failed are excluded from sums and counted separately, so nothing is silently dropped.

### 4.6 The customer is a phone number, not a name

Customers are uniquely identified by `(whatsappAccountId, phone)`. Names are mutable metadata. This matches how the real world works: "Sara" and "Sara Baji" from the same number are the same customer. The AI-extracted name is stored separately on the Order as `recipientName` to preserve the distinction between "who ordered" and "who is being sent to".

### 4.7 Serverless-first, local-dev second

Everything runs on Vercel. There's no self-hosted server. Development happens locally against the same Neon database, with ngrok as the webhook tunnel. When a feature ships, it ships to production, and the demo can be recorded from any device without a laptop being on.

---

## 5. Security and reliability

### Signature verification
Every webhook POST is signed by Meta. Fluxo verifies the HMAC SHA-256 using `WHATSAPP_APP_SECRET` before parsing the body. Unsigned requests get 403.

### Idempotency
`Message.waMessageId` is unique. Duplicate webhooks are dropped silently. The same applies to `PendingDraft.messageId`, so a draft can't be approved twice.

### Scoped queries
Every Prisma query from the dashboard and API is scoped by `whatsappAccountId` derived from the logged-in user. A user cannot read or modify another account's data even if they know an ID.

### Failure recovery
- **Vision model fails:** the image is stored, `imageAnalysis` is null, nothing else runs
- **Extraction fails:** the message is stored, `extractedData` is null, the raw payload is preserved for retry
- **Draft generation fails:** the owner gets no ping, the message still shows on the dashboard
- **Send fails (Meta `#131030`):** the failure is logged, the pending draft stays `pending`, the owner can retry
- **Neon is asleep:** the health check cron keeps it warm; a cold start costs ~5-10s but never fails permanently

### No secrets in the client
Every credential (`WHATSAPP_ACCESS_TOKEN`, `OPENROUTER_API_KEY`, etc.) is server-only. No API route returns them. The client only ever sees derived data.

---

## 6. Known limitations

- **Vercel Hobby tier** caps function execution at 300 seconds with Fluid Compute. A cold Neon start plus two sequential AI calls can approach this limit for very complex messages.
- **Free AI models** are rate-limited. Multiple messages in the same minute can exhaust the shared pool. The runtime discovery layer retries the next candidate, but there's no paid fallback, so occasionally a draft or extraction will fail.
- **Free OpenRouter models** occasionally return safety meta-comments like "User Safety: safe". These are filtered and treated as failures; the next model in the list is tried.
- **The Meta test number** has a 5-recipient whitelist. Production numbers don't.
- **No auto-send.** Every AI-drafted reply requires an owner approval via `send [name]`. This is intentional — it's the trust boundary.

---

## 7. Repository layout
fluxo/
├── app/
│ ├── api/
│ │ ├── account/ user settings endpoints
│ │ ├── auth/ Auth.js routes
│ │ ├── cron/ scheduled jobs (weekly report, draft expiry)
│ │ ├── messages/ AI-draft endpoints
│ │ ├── orders/ order status endpoint
│ │ ├── products/ catalogue CRUD
│ │ ├── signup/ credential signup
│ │ └── whatsapp/ webhook, connect, media
│ ├── dashboard/ 11 pages (overview, orders, customers, ...)
│ ├── onboarding/ 2-step wizard
│ ├── setup-guide/ public WhatsApp setup walkthrough
│ ├── login/ signup/ auth pages
│ └── page.tsx landing page
├── lib/
│ ├── ai/ client, prompts, extract, draft-reply,
│ │ commands, vision, transcribe, models
│ ├── currency/ convert
│ ├── invoice/ template, generate
│ ├── products/ queries, lookup, catalogue-context
│ ├── reports/ weekly
│ ├── whatsapp/ send, media, drafts, reminders,
│ │ notify-draft, notify-incoming, notify-high-value
│ └── prisma.ts shared client
├── prisma/
│ ├── schema.prisma
│ └── migrations/
├── public/screenshots/
├── auth.ts
├── vercel.json
└── package.json



---

## 8. Further reading

- The runtime model discovery: `lib/ai/openrouter-models.ts`
- The extractor prompt: `lib/ai/prompts.ts`
- The command parser prompt: `lib/ai/command-prompts.ts`
- The drafting prompt: `lib/ai/draft-reply.ts`
- The webhook (the entry point): `app/api/whatsapp/webhook/route.ts`
- The data model: `prisma/schema.prisma`