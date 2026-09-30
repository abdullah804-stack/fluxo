/*
  Warnings:

  - You are about to drop the column `notifyIncomingMessages` on the `WhatsAppAccount` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "notifyIncomingMessages" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "WhatsAppAccount" DROP COLUMN "notifyIncomingMessages";
