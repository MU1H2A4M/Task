import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type {
  AcceptInvitationResponse,
  InviteMemberResponse,
  Member,
  MemberRole,
} from "@/lib/types";

const MEMBER_COLUMNS =
  "id, organization_id, email, role, status, invited_by, invited_at, activated_at, user_id, invite_token";

/** Extracts the JSON error message an Edge Function returned. */
async function functionErrorMessage(
  error: unknown,
  fallback: string,
): Promise<string> {
  const ctx = (error as { context?: Response }).context;
  if (ctx instanceof Response) {
    try {
      const body = (await ctx.json()) as { error?: string };
      if (body.error) return body.error;
    } catch {
      /* keep fallback */
    }
  }
  return fallback;
}

/** Members of one organization (RLS scopes this to orgs the admin owns). */
export function useMembers(organizationId: string | undefined) {
  return useQuery({
    queryKey: ["members", organizationId],
    enabled: Boolean(organizationId),
    queryFn: async (): Promise<Member[]> => {
      const { data, error } = await supabase
        .from("members")
        .select(MEMBER_COLUMNS)
        .eq("organization_id", organizationId as string)
        .order("invited_at", { ascending: false });
      if (error) throw new Error(error.message);
      return (data ?? []) as Member[];
    },
  });
}

export interface InviteMemberInput {
  email: string;
  role: MemberRole;
}

/**
 * Invitations are created server-side by the `invite-member` Edge
 * Function. The members table has no client insert policy, so this
 * is the only write path — input is re-validated with Zod and org
 * ownership is re-verified on the server.
 */
export function useInviteMember(organizationId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: InviteMemberInput): Promise<InviteMemberResponse> => {
      const { data, error } = await supabase.functions.invoke<InviteMemberResponse>(
        "invite-member",
        {
          body: {
            organization_id: organizationId,
            email: input.email,
            role: input.role,
          },
        },
      );

      if (error) {
        throw new Error(
          await functionErrorMessage(error, "Failed to send invitation."),
        );
      }
      if (!data) throw new Error("Empty response from invite-member.");
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["members", organizationId] });
      void queryClient.invalidateQueries({ queryKey: ["organizations"] });
    },
  });
}

/** Stretch goal: invited user redeems their invite token. */
export function useAcceptInvitation() {
  return useMutation({
    mutationFn: async (token: string): Promise<AcceptInvitationResponse> => {
      const { data, error } =
        await supabase.functions.invoke<AcceptInvitationResponse>(
          "accept-invitation",
          { body: { token } },
        );
      if (error) {
        throw new Error(
          await functionErrorMessage(error, "Failed to accept invitation."),
        );
      }
      if (!data) throw new Error("Empty response from accept-invitation.");
      return data;
    },
  });
}

/** Admin can mark an invited member active (RLS-guarded update). */
export function useActivateMember(organizationId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (memberId: string): Promise<void> => {
      const { error } = await supabase
        .from("members")
        .update({ status: "active", activated_at: new Date().toISOString() })
        .eq("id", memberId);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["members", organizationId] });
    },
  });
}

export function useRemoveMember(organizationId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (memberId: string): Promise<void> => {
      const { error } = await supabase.from("members").delete().eq("id", memberId);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["members", organizationId] });
      void queryClient.invalidateQueries({ queryKey: ["organizations"] });
    },
  });
}
