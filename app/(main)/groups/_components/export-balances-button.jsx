"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, FileText, Table } from "lucide-react";
import { toast } from "sonner";

export function ExportBalancesButton({ groupName, balances, settlements }) {
  const exportToCsv = () => {
    try {
      const csvData = [
        ["Member", "Total Paid", "Total Owed", "Net Balance"],
        ...balances.map((balance) => [
          balance.user.name || balance.user.email,
          balance.totalPaid?.toFixed(2) || "0.00",
          balance.totalOwed?.toFixed(2) || "0.00",
          balance.netBalance?.toFixed(2) || "0.00",
        ]),
        [], // Empty row
        ["Settlement Suggestions"],
        ["From", "To", "Amount"],
        ...settlements.map((settlement) => [
          settlement.from.name || settlement.from.email,
          settlement.to.name || settlement.to.email,
          settlement.amount.toFixed(2),
        ]),
      ];

      const csvContent =
        "data:text/csv;charset=utf-8," +
        csvData.map((row) => row.join(",")).join("\n");

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute(
        "download",
        `${groupName.replace(/[^a-z0-9]/gi, "_")}_balances.csv`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("Balances exported to CSV successfully!");
    } catch (error) {
      toast.error("Failed to export balances");
    }
  };

  const exportToJson = () => {
    try {
      const data = {
        groupName,
        exportDate: new Date().toISOString(),
        balances: balances.map((balance) => ({
          member: balance.user.name || balance.user.email,
          totalPaid: balance.totalPaid || 0,
          totalOwed: balance.totalOwed || 0,
          netBalance: balance.netBalance || 0,
        })),
        settlements: settlements.map((settlement) => ({
          from: settlement.from.name || settlement.from.email,
          to: settlement.to.name || settlement.to.email,
          amount: settlement.amount,
        })),
      };

      const jsonContent =
        "data:application/json;charset=utf-8," +
        encodeURIComponent(JSON.stringify(data, null, 2));

      const link = document.createElement("a");
      link.setAttribute("href", jsonContent);
      link.setAttribute(
        "download",
        `${groupName.replace(/[^a-z0-9]/gi, "_")}_balances.json`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("Balances exported to JSON successfully!");
    } catch (error) {
      toast.error("Failed to export balances");
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={exportToCsv}>
          <Table className="h-4 w-4 mr-2" />
          Export as CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportToJson}>
          <FileText className="h-4 w-4 mr-2" />
          Export as JSON
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
