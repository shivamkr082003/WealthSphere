"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X, Clock, Users } from "lucide-react";
import { acceptGroupInvitation } from "@/actions/groups";
import { toast } from "sonner";
import useFetch from "@/hooks/use-fetch";

export function InvitationCard({ invitation }) {
  const { id, group, sender, createdAt, expiresAt } = invitation;

  const { loading: acceptLoading, fn: acceptInvitationFn } = useFetch(
    acceptGroupInvitation
  );

  const handleAccept = async () => {
    try {
      await acceptInvitationFn(id);
      toast.success("Invitation accepted! You've joined the group.");
    } catch (error) {
      toast.error(error.message || "Failed to accept invitation");
    }
  };

  const handleReject = async () => {
    // TODO: Implement reject invitation
    toast.info("Reject functionality coming soon!");
  };

  const isExpiring = new Date(expiresAt) - new Date() < 24 * 60 * 60 * 1000; // Less than 24 hours

  return (
    <Card className="border-l-4 border-l-blue-500">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={group.imageUrl} alt={group.name} />
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                {group.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-lg">{group.name}</CardTitle>
              {group.description && (
                <p className="text-sm text-muted-foreground mt-1">
                  {group.description}
                </p>
              )}
            </div>
          </div>
          {isExpiring && (
            <Badge variant="destructive" className="text-xs">
              <Clock className="h-3 w-3 mr-1" />
              Expiring Soon
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Invitation Details */}
        <div className="flex items-center gap-2">
          <Avatar className="h-6 w-6">
            <AvatarImage src={sender.imageUrl} alt={sender.name} />
            <AvatarFallback className="text-xs bg-gradient-to-br from-gray-400 to-gray-600 text-white">
              {sender.name?.charAt(0).toUpperCase() ||
                sender.email?.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <p className="text-sm text-muted-foreground">
            Invited by{" "}
            <span className="font-medium">{sender.name || sender.email}</span>
          </p>
        </div>

        {/* Expiry Info */}
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            Expires {new Date(expiresAt).toLocaleDateString()}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            onClick={handleAccept}
            disabled={acceptLoading}
            className="flex-1 gap-2"
          >
            <Check className="h-4 w-4" />
            Accept
          </Button>
          <Button
            onClick={handleReject}
            variant="outline"
            className="flex-1 gap-2"
          >
            <X className="h-4 w-4" />
            Decline
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
