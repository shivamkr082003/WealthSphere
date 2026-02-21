"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, Clock, UserPlus, Eye, EyeOff } from "lucide-react";
import { InviteUserDialog } from "./invite-user-dialog";
import { InviteLinkDialog } from "./invite-link-dialog";

export function MemberStatus({ groupDetails, currentUserId }) {
  const { members, anonymousMembers = [] } = groupDetails;

  // Simulate last seen data (in a real app, you'd track this)
  const getLastSeen = (memberId) => {
    // Simulate some members having seen recently, others not
    const recentViewers = [currentUserId]; // Current user always seen
    return recentViewers.includes(memberId);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Who has seen this group?
          </CardTitle>
          <div className="flex items-center gap-2">
            <InviteUserDialog groupId={groupDetails.id} />
            <InviteLinkDialog groupId={groupDetails.id} />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Registered Members */}
          {members.map((member) => {
            const hasSeenRecently = getLastSeen(member.user.id);
            const isCurrentUser = member.user.id === currentUserId;

            return (
              <div
                key={member.id}
                className={`flex items-center justify-between p-3 rounded-lg border ${
                  isCurrentUser ? "bg-blue-50 border-blue-200" : "bg-gray-50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage
                      src={member.user.imageUrl}
                      alt={member.user.name}
                    />
                    <AvatarFallback>
                      {member.user.name?.charAt(0) ||
                        member.user.email?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium flex items-center gap-2">
                      {member.user.name || member.user.email}
                      {isCurrentUser && (
                        <Badge variant="secondary" className="text-xs">
                          You
                        </Badge>
                      )}
                      {member.role === "ADMIN" && (
                        <Badge variant="outline" className="text-xs">
                          Admin
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-gray-600">
                      {member.user.email}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {hasSeenRecently ? (
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle className="h-5 w-5" />
                      <span className="text-sm font-medium">
                        {isCurrentUser ? "You" : "Seen"}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-gray-400">
                      <Clock className="h-5 w-5" />
                      <span className="text-sm">Not seen</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Anonymous Members */}
          {anonymousMembers.map((member) => (
            <div
              key={member.id}
              className="flex items-center justify-between p-3 rounded-lg border bg-orange-50 border-orange-200"
            >
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-orange-200 text-orange-700">
                    {member.name?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium flex items-center gap-2">
                    {member.name}
                    <Badge
                      variant="outline"
                      className="text-xs border-orange-300 text-orange-700"
                    >
                      Guest
                    </Badge>
                  </div>
                  <div className="text-sm text-gray-600">
                    {member.email || "No email provided"}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 text-orange-600">
                  <EyeOff className="h-5 w-5" />
                  <span className="text-sm">Needs invite</span>
                </div>
              </div>
            </div>
          ))}

          {/* Add Member Prompt */}
          <div className="mt-4 p-4 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
            <div className="text-center">
              <UserPlus className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600 mb-3">
                Add more people to split expenses with
              </p>
              <div className="flex items-center justify-center gap-2">
                <InviteUserDialog groupId={groupDetails.id}>
                  <Button variant="outline" size="sm">
                    <UserPlus className="h-4 w-4 mr-1" />
                    Invite by Email
                  </Button>
                </InviteUserDialog>
                <InviteLinkDialog groupId={groupDetails.id}>
                  <Button variant="outline" size="sm">
                    Share Link
                  </Button>
                </InviteLinkDialog>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
