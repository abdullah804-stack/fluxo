-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "whatsappAccountId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL,
    "category" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Product_whatsappAccountId_active_idx" ON "Product"("whatsappAccountId", "active");

-- CreateIndex
CREATE INDEX "Product_whatsappAccountId_name_idx" ON "Product"("whatsappAccountId", "name");

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_whatsappAccountId_fkey" FOREIGN KEY ("whatsappAccountId") REFERENCES "WhatsAppAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
