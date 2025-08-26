/*
  Warnings:

  - You are about to drop the column `accountId` on the `budgets` table. All the data in the column will be lost.
  - You are about to drop the column `endDate` on the `budgets` table. All the data in the column will be lost.
  - You are about to drop the column `period` on the `budgets` table. All the data in the column will be lost.
  - You are about to drop the column `startDate` on the `budgets` table. All the data in the column will be lost.
  - You are about to drop the column `notes` on the `transactions` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[userId]` on the table `budgets` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "public"."budgets" DROP COLUMN "accountId",
DROP COLUMN "endDate",
DROP COLUMN "period",
DROP COLUMN "startDate",
ADD COLUMN     "lastAlertSent" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "public"."transactions" DROP COLUMN "notes",
ADD COLUMN     "lastProcessed" TIMESTAMP(3);

-- DropEnum
DROP TYPE "public"."BudgetPeriod";

-- CreateIndex
CREATE UNIQUE INDEX "budgets_userId_key" ON "public"."budgets"("userId");
