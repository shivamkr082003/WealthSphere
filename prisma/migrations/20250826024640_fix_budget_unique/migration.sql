/*
  Warnings:

  - Added the required column `accountId` to the `budgets` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."budgets" ADD COLUMN     "accountId" TEXT NOT NULL;
