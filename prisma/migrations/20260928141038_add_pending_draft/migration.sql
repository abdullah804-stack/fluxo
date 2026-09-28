-- CreateTable
CREATE TABLE "PendingDraft" (
    "id" TEXT NOT NULL,
    "whatsappAccountId" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "customerPhone" TEXT NOT NULL,
    "customerName" TEXT,
    "draftText" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PendingDraft_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PendingDraft_messageId_key" ON "PendingDraft"("messageId");

-- CreateIndex
CREATE INDEX "PendingDraft_whatsappAccountId_status_idx" ON "PendingDraft"("whatsappAccountId", "status");

-- CreateIndex
CREATE INDEX "PendingDraft_whatsappAccountId_customerName_idx" ON "PendingDraft"("whatsappAccountId", "customerName");

-- CreateIndex
CREATE INDEX "PendingDraft_whatsappAccountId_createdAt_idx" ON "PendingDraft"("whatsappAccountId", "createdAt");

-- AddForeignKey
ALTER TABLE "PendingDraft" ADD CONSTRAINT "PendingDraft_whatsappAccountId_fkey" FOREIGN KEY ("whatsappAccountId") REFERENCES "WhatsAppAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
