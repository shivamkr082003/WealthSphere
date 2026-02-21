import { Suspense } from "react";
import React from "react";
import { getUserAccounts } from "@/actions/dashboard";
import { getDashboardData } from "@/actions/dashboard";
import { getCurrentBudget } from "@/actions/budget";
import { AccountCard } from "./_components/account-card";
import { CreateAccountDrawer } from "@/components/create-account-drawer";
import { BudgetProgress } from "./_components/budget-progress";
import { DatabaseStatus } from "@/components/database-status";
import { Card, CardContent } from "@/components/ui/card";
import { Plus } from "lucide-react";
import { DashboardOverview } from "./_components/transaction-overview";
import { DashboardFallback } from "./_components/dashboard-fallback";
import { DashboardSkeleton } from "@/components/ui/loading";
import { currentUser } from "@clerk/nextjs/server";
import ProtectedRoute from "./protected-route";

// Separate components for better loading states
async function AccountsSection() {
  const accounts = await getUserAccounts().catch((err) => {
    console.error("Error fetching accounts:", err);
    return [];
  });

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <CreateAccountDrawer>
        <Card className="hover:shadow-md transition-shadow cursor-pointer border-dashed">
          <CardContent className="flex flex-col items-center justify-center text-muted-foreground h-full pt-5">
            <Plus className="h-10 w-10 mb-2" />
            <p className="text-sm font-medium">Add New Account</p>
          </CardContent>
        </Card>
      </CreateAccountDrawer>
      {accounts.length > 0 &&
        accounts?.map((account) => (
          <AccountCard key={account.id} account={account} />
        ))}
    </div>
  );
}

async function BudgetSection() {
  const accounts = await getUserAccounts().catch(() => []);
  const defaultAccount = accounts?.find((account) => account.isDefault);

  let budgetData = null;
  if (defaultAccount) {
    try {
      budgetData = await getCurrentBudget(defaultAccount.id);
    } catch (error) {
      console.error("Error fetching budget:", error);
    }
  }

  return (
    <BudgetProgress
      initialBudget={budgetData?.budget}
      currentExpenses={budgetData?.currentExpenses || 0}
    />
  );
}

async function OverviewSection() {
  const [accounts = [], transactions = []] = await Promise.all([
    getUserAccounts().catch(() => []),
    getDashboardData().catch(() => []),
  ]);

  return (
    <DashboardOverview accounts={accounts} transactions={transactions || []} />
  );
}

export default async function DashboardPage() {
  // First verify the user is authenticated
  const user = await currentUser();
  if (!user) {
    return <ProtectedRoute />;
  }

  return (
    <div className="space-y-8">
      {/* Database Status */}
      <Suspense fallback={<div>Checking database connection...</div>}>
        <DatabaseStatus />
      </Suspense>

      {/* Budget Progress */}
      <Suspense
        fallback={<div className="h-24 bg-gray-100 rounded animate-pulse" />}
      >
        <BudgetSection />
      </Suspense>

      {/* Dashboard Overview */}
      <Suspense
        fallback={<div className="h-40 bg-gray-100 rounded animate-pulse" />}
      >
        <OverviewSection />
      </Suspense>

      {/* Accounts Grid */}
      <Suspense
        fallback={
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-32 bg-gray-100 rounded animate-pulse" />
            ))}
          </div>
        }
      >
        <AccountsSection />
      </Suspense>
    </div>
  );
}
