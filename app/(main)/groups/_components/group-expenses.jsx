"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Receipt, Calendar, User, DollarSign } from "lucide-react";

export function GroupExpenses({ expenses }) {
  if (expenses.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Receipt className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No expenses yet</h3>
          <p className="text-muted-foreground text-center">
            Add your first expense to start tracking shared costs
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {expenses.map((expense) => (
        <Card key={expense.id}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="bg-blue-50 p-2 rounded-lg">
                  <Receipt className="h-5 w-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium">{expense.title}</h3>
                    <Badge variant="outline" className="text-xs">
                      {expense.category}
                    </Badge>
                  </div>
                  {expense.description && (
                    <p className="text-sm text-muted-foreground mb-2">
                      {expense.description}
                    </p>
                  )}
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(expense.date)}
                    </div>
                    <div className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      Paid by{" "}
                      {expense.paidBy?.name ||
                        expense.paidBy?.email ||
                        expense.paidByAnonymous?.name ||
                        expense.paidByAnonymous?.email ||
                        "Unknown"}
                    </div>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold">
                  {formatCurrency(expense.amount)}
                </p>
                <p className="text-sm text-muted-foreground">
                  {expense.splitType.toLowerCase()} split
                </p>
              </div>
            </div>

            {/* Expense shares */}
            <div className="mt-4 pt-4 border-t">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Split between:</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {expense.shares.map((share) => {
                  const participant = share.user || share.anonymousMember;
                  if (!participant) return null;

                  return (
                    <div
                      key={share.id}
                      className="flex items-center gap-2 text-sm"
                    >
                      <Avatar className="h-6 w-6">
                        <AvatarImage
                          src={participant.imageUrl}
                          alt={participant.name}
                        />
                        <AvatarFallback className="text-xs">
                          {participant.name?.charAt(0) ||
                            participant.email?.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-muted-foreground">
                        {participant.name || participant.email}
                      </span>
                      <span className="font-medium">
                        {formatCurrency(share.amount)}
                      </span>
                      {share.isPaid && (
                        <Badge variant="secondary" className="text-xs">
                          Paid
                        </Badge>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
