"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Users, Receipt, DollarSign } from "lucide-react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";

export function GroupCard({ group }) {
  const { id, name, description, imageUrl, members, _count } = group;

  // Calculate total member count (registered + anonymous)
  const totalMemberCount = _count.members + (_count.anonymousMembers || 0);

  // Get member initials for avatar display
  const memberInitials = members
    .slice(0, 3)
    .map(
      (member) =>
        member.user.name?.charAt(0).toUpperCase() ||
        member.user.email?.charAt(0).toUpperCase() ||
        "?"
    );

  return (
    <Link href={`/groups/${id}`}>
      <Card className="hover:shadow-lg transition-shadow cursor-pointer">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarImage src={imageUrl} alt={name} />
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                  {name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-lg">{name}</CardTitle>
                {description && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {description}
                  </p>
                )}
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Members */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {totalMemberCount} member{totalMemberCount !== 1 ? "s" : ""}
              </span>
            </div>
            <div className="flex -space-x-2">
              {members.slice(0, 3).map((member, index) => (
                <Avatar
                  key={member.id}
                  className="h-6 w-6 border-2 border-white"
                >
                  <AvatarImage
                    src={member.user.imageUrl}
                    alt={member.user.name}
                  />
                  <AvatarFallback className="text-xs bg-gradient-to-br from-gray-400 to-gray-600 text-white">
                    {memberInitials[index]}
                  </AvatarFallback>
                </Avatar>
              ))}
              {members.length > 3 && (
                <div className="h-6 w-6 rounded-full bg-muted border-2 border-white flex items-center justify-center">
                  <span className="text-xs font-medium">
                    +{members.length - 3}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Expenses */}
          <div className="flex items-center gap-2">
            <Receipt className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {_count.expenses} expense{_count.expenses !== 1 ? "s" : ""}
            </span>
          </div>

          {/* Status Badge */}
          <div className="flex justify-between items-center">
            <Badge variant="secondary" className="text-xs">
              Active
            </Badge>
            <span className="text-xs text-muted-foreground">
              Tap to view details
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
