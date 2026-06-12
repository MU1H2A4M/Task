import { useState } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { CheckCircle2, Loader2, MailQuestion, PartyPopper } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useAcceptInvitation } from "@/hooks/useMembers";
import type { AcceptInvitationResponse } from "@/lib/types";

/**
 * Stretch goal: the page an invited person lands on from their
 * invite link (/accept-invite?token=...). If they're signed out,
 * they're routed to sign-up/sign-in and brought back here; once
 * signed in, redeeming the token links their auth user to the
 * member row and flips its status to active.
 */
export default function AcceptInvite() {
  const [params] = useSearchParams();
  const token = params.get("token");
  const { session, isLoading } = useAuth();
  const location = useLocation();
  const accept = useAcceptInvitation();
  const [result, setResult] = useState<AcceptInvitationResponse | null>(null);

  const fullPath = `${location.pathname}${location.search}`;

  const shell = (content: React.ReactNode) => (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md animate-fade-in-up">{content}</Card>
    </div>
  );

  if (isLoading) {
    return shell(
      <CardContent className="flex justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </CardContent>,
    );
  }

  if (!token) {
    return shell(
      <>
        <CardHeader>
          <MailQuestion className="mb-2 h-8 w-8 text-muted-foreground" />
          <CardTitle>Invitation link is incomplete</CardTitle>
          <CardDescription>
            This page needs an invitation token. Double-check the link you were
            sent, or ask the organization admin to share it again.
          </CardDescription>
        </CardHeader>
      </>,
    );
  }

  if (!session) {
    return shell(
      <>
        <CardHeader>
          <CardTitle>You've been invited</CardTitle>
          <CardDescription>
            Sign in — or create an account with the email this invitation was
            sent to — and we'll bring you right back here to accept it.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex gap-2">
          <Button asChild className="flex-1">
            <Link to="/sign-up" state={{ from: { pathname: fullPath } }}>
              Create account
            </Link>
          </Button>
          <Button asChild variant="outline" className="flex-1">
            <Link to="/sign-in" state={{ from: { pathname: fullPath } }}>
              Sign in
            </Link>
          </Button>
        </CardContent>
      </>,
    );
  }

  if (result) {
    return shell(
      <>
        <CardHeader>
          <PartyPopper className="mb-2 h-8 w-8 text-primary" />
          <CardTitle>
            {result.already_accepted ? "Already a member" : "Invitation accepted"}
          </CardTitle>
          <CardDescription>
            You're an active {result.role} of{" "}
            <span className="font-medium text-foreground">
              {result.organization_name}
            </span>
            .
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild className="w-full">
            <Link to="/">Go to your dashboard</Link>
          </Button>
        </CardContent>
      </>,
    );
  }

  return shell(
    <>
      <CardHeader>
        <CheckCircle2 className="mb-2 h-8 w-8 text-primary" />
        <CardTitle>Accept your invitation</CardTitle>
        <CardDescription>
          You're signed in as{" "}
          <span className="font-medium text-foreground">{session.user.email}</span>.
          Accepting will activate your membership.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {accept.isError && (
          <p className="text-sm text-destructive">{accept.error.message}</p>
        )}
        <Button
          className="w-full"
          disabled={accept.isPending}
          onClick={() =>
            accept.mutate(token, { onSuccess: (data) => setResult(data) })
          }
        >
          {accept.isPending && <Loader2 className="animate-spin" />}
          Accept invitation
        </Button>
      </CardContent>
    </>,
  );
}
