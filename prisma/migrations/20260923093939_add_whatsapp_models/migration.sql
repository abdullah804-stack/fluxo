-- CreateTable
CREATE TABLE "WhatsAppAccount" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "phoneNumberId" TEXT NOT NULL,
    "wabaId" TEXT NOT NULL,
    "displayName" TEXT,
    "connectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WhatsAppAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "whatsappAccountId" TEXT NOT NULL,
    "waMessageId" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "fromNumber" TEXT NOT NULL,
    "toNumber" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "content" TEXT,
    "mediaUrl" TEXT,
    "mediaId" TEXT,
    "rawPayload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WhatsAppAccount_userId_key" ON "WhatsAppAccount"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "WhatsAppAccount_phoneNumber_key" ON "WhatsAppAccount"("phoneNumber");

-- CreateIndex
CREATE INDEX "WhatsAppAccount_userId_idx" ON "WhatsAppAccount"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Message_waMessageId_key" ON "Message"("waMessageId");

-- CreateIndex
CREATE INDEX "Message_whatsappAccountId_createdAt_idx" ON "Message"("whatsappAccountId", "createdAt");

-- CreateIndex
CREATE INDEX "Message_fromNumber_idx" ON "Message"("fromNumber");

-- AddForeignKey
ALTER TABLE "WhatsAppAccount" ADD CONSTRAINT "WhatsAppAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_whatsappAccountId_fkey" FOREIGN KEY ("whatsappAccountId") REFERENCES "WhatsAppAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
