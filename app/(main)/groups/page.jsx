import { getUserGroups, getUserInvitations } from "@/actions/groups";
import { CreateGroupDialog } from "./_components/create-group-dialog";
import { GroupCard } from "./_components/group-card";
import { InvitationCard } from "./_components/invitation-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Plus, Mail } from "lucide-react";

export default async function GroupsPage() {
  const [groups, invitations] = await Promise.all([
    getUserGroups(),
    getUserInvitations(),
  ]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-title">Groups</h1>
          <p className="text-muted-foreground">
            Manage your shared expenses with friends and family
          </p>
        </div>
        <CreateGroupDialog />
      </div>

      {/* Pending Invitations */}
      {invitations.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-blue-600" />
            <h2 className="text-xl font-semibold">Pending Invitations</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {invitations.map((invitation) => (
              <InvitationCard key={invitation.id} invitation={invitation} />
            ))}
          </div>
        </div>
      )}

      {/* Groups */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-green-600" />
          <h2 className="text-xl font-semibold">Your Groups</h2>
        </div>

        {groups.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No groups yet</h3>
              <p className="text-muted-foreground text-center mb-4">
                Create your first group to start sharing expenses with others
              </p>
              <CreateGroupDialog />
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {groups.map((group) => (
              <GroupCard key={group.id} group={group} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
