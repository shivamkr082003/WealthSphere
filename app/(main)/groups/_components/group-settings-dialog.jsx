"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Settings,
  UserMinus,
  Archive,
  CheckCircle,
  Play,
  Trash2,
  Crown,
  Loader2,
} from "lucide-react";
import {
  updateGroupStatus,
  removeGroupMember,
  deleteGroup,
} from "@/actions/groups";
import { toast } from "sonner";
import useFetch from "@/hooks/use-fetch";

const statusOptions = [
  { value: "ACTIVE", label: "Active", icon: Play, color: "green" },
  { value: "FINISHED", label: "Finished", icon: CheckCircle, color: "blue" },
  { value: "ARCHIVED", label: "Archived", icon: Archive, color: "gray" },
];

export function GroupSettingsDialog({ group, currentUserId, isAdmin }) {
  const [open, setOpen] = useState(false);

  const { loading: updateStatusLoading, fn: updateStatusFn } =
    useFetch(updateGroupStatus);

  const { loading: removeMemberLoading, fn: removeMemberFn } =
    useFetch(removeGroupMember);

  const { loading: deleteGroupLoading, fn: deleteGroupFn } =
    useFetch(deleteGroup);

  const handleStatusChange = async (newStatus) => {
    try {
      await updateStatusFn(group.id, newStatus);
      toast.success(`Group status updated to ${newStatus.toLowerCase()}`);
    } catch (error) {
      toast.error("Failed to update group status");
    }
  };

  const handleRemoveMember = async (memberId, memberType = "user") => {
    if (window.confirm("Are you sure you want to remove this member?")) {
      try {
        await removeMemberFn(group.id, memberId, memberType);
        toast.success("Member removed successfully");
      } catch (error) {
        toast.error("Failed to remove member");
      }
    }
  };

  const handleDeleteGroup = async () => {
    if (
      window.confirm(
        "Are you sure? This will permanently delete the group and all its data. This action cannot be undone."
      )
    ) {
      try {
        await deleteGroupFn(group.id);
        toast.success("Group deleted successfully");
        setOpen(false);
        // Redirect to groups page
        window.location.href = "/groups";
      } catch (error) {
        toast.error("Failed to delete group");
      }
    }
  };

  const currentStatus =
    statusOptions.find((s) => s.value === group.status) || statusOptions[0];
  const StatusIcon = currentStatus.icon;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings className="h-4 w-4 mr-2" />
          Settings
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Group Settings
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Group Status */}
          {isAdmin && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <StatusIcon
                  className={`h-4 w-4 text-${currentStatus.color}-600`}
                />
                <h3 className="font-medium">Group Status</h3>
              </div>
              <Select
                value={group.status}
                onValueChange={handleStatusChange}
                disabled={updateStatusLoading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((status) => {
                    const Icon = status.icon;
                    return (
                      <SelectItem key={status.value} value={status.value}>
                        <div className="flex items-center gap-2">
                          <Icon
                            className={`h-4 w-4 text-${status.color}-600`}
                          />
                          {status.label}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Active: Group is ongoing • Finished: No new expenses • Archived:
                Read-only
              </p>
            </div>
          )}

          {/* Members Management */}
          <div className="space-y-3">
            <h3 className="font-medium flex items-center gap-2">
              Members (
              {group.members?.length + (group.anonymousMembers?.length || 0)})
            </h3>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {/* Registered Members */}
              {group.members?.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-2 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage
                        src={member.user.imageUrl}
                        alt={member.user.name}
                      />
                      <AvatarFallback className="text-xs">
                        {member.user.name?.charAt(0) ||
                          member.user.email?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          {member.user.name || member.user.email}
                        </span>
                        {member.role === "ADMIN" && (
                          <Crown className="h-3 w-3 text-yellow-500" />
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {member.user.email}
                      </span>
                    </div>
                  </div>

                  {isAdmin && member.user.id !== currentUserId && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveMember(member.id, "user")}
                      disabled={removeMemberLoading}
                    >
                      <UserMinus className="h-4 w-4 text-red-500" />
                    </Button>
                  )}
                </div>
              ))}

              {/* Anonymous Members */}
              {group.anonymousMembers?.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-2 border rounded-lg bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8 bg-gray-300">
                      <AvatarFallback className="text-xs">
                        {member.name?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          {member.name}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          Guest
                        </Badge>
                      </div>
                      {member.email && (
                        <span className="text-xs text-muted-foreground">
                          {member.email}
                        </span>
                      )}
                    </div>
                  </div>

                  {isAdmin && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveMember(member.id, "anonymous")}
                      disabled={removeMemberLoading}
                    >
                      <UserMinus className="h-4 w-4 text-red-500" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Danger Zone */}
          {isAdmin && (
            <div className="space-y-3 pt-4 border-t border-red-200">
              <h3 className="font-medium text-red-600 flex items-center gap-2">
                <Trash2 className="h-4 w-4" />
                Danger Zone
              </h3>
              <Button
                variant="destructive"
                size="sm"
                className="w-full"
                onClick={handleDeleteGroup}
                disabled={deleteGroupLoading}
              >
                {deleteGroupLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  "Delete Group Permanently"
                )}
              </Button>
              <p className="text-xs text-muted-foreground">
                This action cannot be undone. All expenses and data will be
                lost.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
