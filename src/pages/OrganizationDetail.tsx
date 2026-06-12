import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Link as LinkIcon,
  Trash2,
  UserCheck,
  UserPlus,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { InviteMemberForm } from "@/components/InviteMemberForm";
import { MemberStatusBadge } from "@/components/MemberStatusBadge";
import { OrgTypeBadge } from "@/components/OrgTypeBadge";
import { QueryState } from "@/components/QueryState";
import { useOrganization } from "@/hooks/useOrganizations";
import { useActivateMember, useMembers, useRemoveMember } from "@/hooks/useMembers";
import { ORG_TYPES, orgDetail } from "@/lib/orgTypes";
import type { Member } from "@/lib/types";
import { formatDate } from "@/lib/utils";

function copyInviteLink(member: Member) {
  const url = `${window.location.origin}/accept-invite?token=${member.invite_token}`;
  navigator.clipboard
    .writeText(url)
    .then(() => toast.success("Invite link copied — share it with the member"))
    .catch(() => toast.error("Couldn't copy. Link: " + url));
}

export default function OrganizationDetail() {
  const { id } = useParams<{ id: string }>();
  const orgQuery = useOrganization(id);
  const membersQuery = useMembers(id);
  const activate = useActivateMember(id ?? "");
  const remove = useRemoveMember(id ?? "");

  if (orgQuery.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48 rounded-xl" />
      </div>
    );
  }

  if (orgQuery.isError || !orgQuery.data) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="font-medium">Organization not found</p>
          <p className="mt-1 text-sm text-muted-foreground">
            It may have been deleted, or you don't have access to it.
          </p>
          <Button asChild variant="outline" className="mt-4">
            <Link to="/">
              <ArrowLeft />
              Back to directory
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const org = orgQuery.data;
  const typeConfig = ORG_TYPES[org.type];
  const members = membersQuery.data ?? [];
  const activeCount = members.filter((m) => m.status === "active").length;

  return (
    <div className="space-y-6">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-2 mb-2">
          <Link to="/">
            <ArrowLeft />
            All organizations
          </Link>
        </Button>
        <div className={`rounded-xl border border-l-4 bg-card p-6 ${typeConfig.accentBorderClass}`}>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">{org.name}</h1>
            <OrgTypeBadge type={org.type} />
          </div>
          <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted-foreground">
            <span>
              {typeConfig.detailLabel}: <span className="text-foreground">{orgDetail(org)}</span>
            </span>
            <span>Created {formatDate(org.created_at)}</span>
            <span className="inline-flex items-center gap-1.5">
              <Users className="h-4 w-4" />
              {members.length} invited · {activeCount} active
            </span>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Members</CardTitle>
          <CardDescription>
            Invite people by email. Invitations are created securely on the
            server; copy a pending member's invite link and they can accept it
            themselves after signing up.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <InviteMemberForm organizationId={org.id} />

          <QueryState
            isLoading={membersQuery.isLoading}
            isError={membersQuery.isError}
            errorMessage={membersQuery.error?.message}
            isEmpty={members.length === 0}
            loading={<Skeleton className="h-32 rounded-md" />}
            empty={{
              icon: UserPlus,
              title: "No members yet",
              description: "Send the first invitation using the form above.",
            }}
          >
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Invited</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium">{member.email}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="capitalize">
                        {member.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <MemberStatusBadge status={member.status} />
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(member.invited_at)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="inline-flex gap-1">
                        {member.status === "invited" && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => copyInviteLink(member)}
                            >
                              <LinkIcon />
                              Copy invite link
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={activate.isPending}
                              onClick={() =>
                                activate.mutate(member.id, {
                                  onSuccess: () =>
                                    toast.success(`${member.email} is now active`),
                                  onError: (e) => toast.error(e.message),
                                })
                              }
                            >
                              <UserCheck />
                              Mark active
                            </Button>
                          </>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Remove ${member.email}`}
                          disabled={remove.isPending}
                          onClick={() =>
                            remove.mutate(member.id, {
                              onSuccess: () => toast.success(`Removed ${member.email}`),
                              onError: (e) => toast.error(e.message),
                            })
                          }
                        >
                          <Trash2 className="text-muted-foreground" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </QueryState>
        </CardContent>
      </Card>
    </div>
  );
}
