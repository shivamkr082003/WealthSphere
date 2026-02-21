-- CreateEnum
CREATE TYPE "public"."GroupMemberRole" AS ENUM ('ADMIN', 'MEMBER');

-- CreateEnum
CREATE TYPE "public"."GroupStatus" AS ENUM ('ACTIVE', 'FINISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "public"."SplitType" AS ENUM ('EQUAL', 'EXACT', 'PERCENTAGE', 'SHARES');

-- CreateEnum
CREATE TYPE "public"."SettlementStatus" AS ENUM ('PENDING', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."InvitationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'EXPIRED');

-- CreateTable
CREATE TABLE "public"."groups" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "status" "public"."GroupStatus" NOT NULL DEFAULT 'ACTIVE',

    CONSTRAINT "groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."anonymous_members" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "anonymous_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."group_members" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "public"."GroupMemberRole" NOT NULL DEFAULT 'MEMBER',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "group_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."group_expenses" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "paidByUserId" TEXT,
    "paidByAnonymousMemberId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "amount" DECIMAL(65,30) NOT NULL,
    "category" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "receiptUrl" TEXT,
    "splitType" "public"."SplitType" NOT NULL DEFAULT 'EQUAL',
    "isSettled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "group_expenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."expense_shares" (
    "id" TEXT NOT NULL,
    "expenseId" TEXT NOT NULL,
    "userId" TEXT,
    "anonymousMemberId" TEXT,
    "amount" DECIMAL(65,30) NOT NULL,
    "isPaid" BOOLEAN NOT NULL DEFAULT false,
    "paidAt" TIMESTAMP(3),

    CONSTRAINT "expense_shares_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."settlements" (
    "id" TEXT NOT NULL,
    "fromUserId" TEXT,
    "toUserId" TEXT,
    "fromAnonymousMemberId" TEXT,
    "toAnonymousMemberId" TEXT,
    "amount" DECIMAL(65,30) NOT NULL,
    "description" TEXT,
    "status" "public"."SettlementStatus" NOT NULL DEFAULT 'PENDING',
    "settledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "settlements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."group_invitations" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "senderUserId" TEXT NOT NULL,
    "receiverUserId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "status" "public"."InvitationStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "group_invitations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "groups_createdById_idx" ON "public"."groups"("createdById");

-- CreateIndex
CREATE INDEX "anonymous_members_groupId_idx" ON "public"."anonymous_members"("groupId");

-- CreateIndex
CREATE INDEX "group_members_groupId_idx" ON "public"."group_members"("groupId");

-- CreateIndex
CREATE INDEX "group_members_userId_idx" ON "public"."group_members"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "group_members_groupId_userId_key" ON "public"."group_members"("groupId", "userId");

-- CreateIndex
CREATE INDEX "group_expenses_groupId_idx" ON "public"."group_expenses"("groupId");

-- CreateIndex
CREATE INDEX "group_expenses_paidByUserId_idx" ON "public"."group_expenses"("paidByUserId");

-- CreateIndex
CREATE INDEX "group_expenses_paidByAnonymousMemberId_idx" ON "public"."group_expenses"("paidByAnonymousMemberId");

-- CreateIndex
CREATE INDEX "group_expenses_date_idx" ON "public"."group_expenses"("date");

-- CreateIndex
CREATE INDEX "expense_shares_expenseId_idx" ON "public"."expense_shares"("expenseId");

-- CreateIndex
CREATE INDEX "expense_shares_userId_idx" ON "public"."expense_shares"("userId");

-- CreateIndex
CREATE INDEX "expense_shares_anonymousMemberId_idx" ON "public"."expense_shares"("anonymousMemberId");

-- CreateIndex
CREATE INDEX "settlements_fromUserId_idx" ON "public"."settlements"("fromUserId");

-- CreateIndex
CREATE INDEX "settlements_toUserId_idx" ON "public"."settlements"("toUserId");

-- CreateIndex
CREATE INDEX "settlements_fromAnonymousMemberId_idx" ON "public"."settlements"("fromAnonymousMemberId");

-- CreateIndex
CREATE INDEX "settlements_toAnonymousMemberId_idx" ON "public"."settlements"("toAnonymousMemberId");

-- CreateIndex
CREATE INDEX "settlements_status_idx" ON "public"."settlements"("status");

-- CreateIndex
CREATE INDEX "group_invitations_groupId_idx" ON "public"."group_invitations"("groupId");

-- CreateIndex
CREATE INDEX "group_invitations_senderUserId_idx" ON "public"."group_invitations"("senderUserId");

-- CreateIndex
CREATE INDEX "group_invitations_receiverUserId_idx" ON "public"."group_invitations"("receiverUserId");

-- CreateIndex
CREATE INDEX "group_invitations_email_idx" ON "public"."group_invitations"("email");

-- CreateIndex
CREATE UNIQUE INDEX "group_invitations_groupId_email_key" ON "public"."group_invitations"("groupId", "email");

-- AddForeignKey
ALTER TABLE "public"."groups" ADD CONSTRAINT "groups_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."anonymous_members" ADD CONSTRAINT "anonymous_members_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "public"."groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."group_members" ADD CONSTRAINT "group_members_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "public"."groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."group_members" ADD CONSTRAINT "group_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."group_expenses" ADD CONSTRAINT "group_expenses_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "public"."groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."group_expenses" ADD CONSTRAINT "group_expenses_paidByUserId_fkey" FOREIGN KEY ("paidByUserId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."group_expenses" ADD CONSTRAINT "group_expenses_paidByAnonymousMemberId_fkey" FOREIGN KEY ("paidByAnonymousMemberId") REFERENCES "public"."anonymous_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."expense_shares" ADD CONSTRAINT "expense_shares_expenseId_fkey" FOREIGN KEY ("expenseId") REFERENCES "public"."group_expenses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."expense_shares" ADD CONSTRAINT "expense_shares_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."expense_shares" ADD CONSTRAINT "expense_shares_anonymousMemberId_fkey" FOREIGN KEY ("anonymousMemberId") REFERENCES "public"."anonymous_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."settlements" ADD CONSTRAINT "settlements_fromUserId_fkey" FOREIGN KEY ("fromUserId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."settlements" ADD CONSTRAINT "settlements_toUserId_fkey" FOREIGN KEY ("toUserId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."settlements" ADD CONSTRAINT "settlements_fromAnonymousMemberId_fkey" FOREIGN KEY ("fromAnonymousMemberId") REFERENCES "public"."anonymous_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."settlements" ADD CONSTRAINT "settlements_toAnonymousMemberId_fkey" FOREIGN KEY ("toAnonymousMemberId") REFERENCES "public"."anonymous_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."group_invitations" ADD CONSTRAINT "group_invitations_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "public"."groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."group_invitations" ADD CONSTRAINT "group_invitations_senderUserId_fkey" FOREIGN KEY ("senderUserId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."group_invitations" ADD CONSTRAINT "group_invitations_receiverUserId_fkey" FOREIGN KEY ("receiverUserId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
