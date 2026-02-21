"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Copy, Link, Check, RefreshCw } from "lucide-react";
import { generateGroupInviteLink } from "@/actions/groups";
import { toast } from "sonner";
import useFetch from "@/hooks/use-fetch";

export function InviteLinkDialog({ groupId }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const {
    loading: generateLoading,
    fn: generateLinkFn,
    data: linkData,
  } = useFetch(generateGroupInviteLink);

  const handleGenerateLink = async () => {
    try {
      await generateLinkFn(groupId);
      if (linkData?.success) {
        toast.success("Invite link generated successfully!");
      }
    } catch (error) {
      toast.error("Failed to generate invite link");
    }
  };

  const handleCopyLink = async () => {
    if (linkData?.data?.inviteUrl) {
      await navigator.clipboard.writeText(linkData.data.inviteUrl);
      setCopied(true);
      toast.success("Invite link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatExpiryDate = (date) => {
    return new Date(date).toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Link className="h-4 w-4 mr-2" />
          Invite Link
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share Invite Link</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Generate a shareable link that anyone can use to join this group.
            The link will expire in 7 days.
          </p>

          {!linkData?.data?.inviteUrl ? (
            <Button
              onClick={handleGenerateLink}
              disabled={generateLoading}
              className="w-full"
            >
              {generateLoading && (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              )}
              Generate Invite Link
            </Button>
          ) : (
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="invite-url">Invite URL</Label>
                <div className="flex">
                  <Input
                    id="invite-url"
                    value={linkData.data.inviteUrl}
                    readOnly
                    className="flex-1"
                  />
                  <Button
                    size="sm"
                    className="ml-2"
                    onClick={handleCopyLink}
                    variant={copied ? "default" : "outline"}
                  >
                    {copied ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="text-xs text-muted-foreground">
                <p>
                  <strong>Expires:</strong>{" "}
                  {formatExpiryDate(linkData.data.expiresAt)}
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleGenerateLink}
                  disabled={generateLoading}
                  variant="outline"
                  size="sm"
                  className="flex-1"
                >
                  {generateLoading && (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  Generate New Link
                </Button>
                <Button
                  onClick={handleCopyLink}
                  size="sm"
                  className="flex-1"
                  variant={copied ? "default" : "secondary"}
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy Link
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
