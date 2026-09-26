-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "baseAmount" DOUBLE PRECISION,
ADD COLUMN     "exchangeRate" DOUBLE PRECISION,
ADD COLUMN     "exchangeRateDate" TIMESTAMP(3),
ADD COLUMN     "originalAmount" DOUBLE PRECISION,
ADD COLUMN     "originalCurrency" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "baseCurrency" TEXT NOT NULL DEFAULT 'USD';

-- CreateTable
CREATE TABLE "ExchangeRate" (
    "id" TEXT NOT NULL,
    "fromCode" TEXT NOT NULL,
    "toCode" TEXT NOT NULL,
    "rate" DOUBLE PRECISION NOT NULL,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExchangeRate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ExchangeRate_fromCode_toCode_fetchedAt_idx" ON "ExchangeRate"("fromCode", "toCode", "fetchedAt");

-- CreateIndex
CREATE UNIQUE INDEX "ExchangeRate_fromCode_toCode_key" ON "ExchangeRate"("fromCode", "toCode");
