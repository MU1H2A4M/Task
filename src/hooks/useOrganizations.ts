import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type {
  Organization,
  OrganizationWithCount,
  OrgType,
} from "@/lib/types";

const ORG_COLUMNS =
  "id, owner_id, name, type, student_capacity, registration_number, industry, created_at";

/** All organizations created by the signed-in admin (RLS-scoped). */
export function useOrganizations() {
  return useQuery({
    queryKey: ["organizations"],
    queryFn: async (): Promise<OrganizationWithCount[]> => {
      const { data, error } = await supabase
        .from("organizations")
        .select(`${ORG_COLUMNS}, members(count)`)
        .order("created_at", { ascending: false });
      if (error) throw new Error(error.message);
      return (data ?? []) as OrganizationWithCount[];
    },
  });
}

export function useOrganization(id: string | undefined) {
  return useQuery({
    queryKey: ["organizations", id],
    enabled: Boolean(id),
    queryFn: async (): Promise<Organization | null> => {
      const { data, error } = await supabase
        .from("organizations")
        .select(ORG_COLUMNS)
        .eq("id", id as string)
        .maybeSingle();
      if (error) throw new Error(error.message);
      return data as Organization | null;
    },
  });
}

export interface CreateOrganizationInput {
  name: string;
  type: OrgType;
  student_capacity?: number;
  registration_number?: string;
  industry?: string;
}

export function useCreateOrganization() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateOrganizationInput): Promise<Organization> => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("You must be signed in.");

      const row = {
        owner_id: user.id,
        name: input.name,
        type: input.type,
        student_capacity:
          input.type === "school" ? (input.student_capacity ?? null) : null,
        registration_number:
          input.type === "nonprofit" ? (input.registration_number ?? null) : null,
        industry: input.type === "business" ? (input.industry ?? null) : null,
      };

      const { data, error } = await supabase
        .from("organizations")
        .insert(row)
        .select(ORG_COLUMNS)
        .single();

      if (error) {
        if (error.code === "23505") {
          throw new Error("You already have an organization with that name.");
        }
        throw new Error(error.message);
      }
      return data as Organization;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["organizations"] });
    },
  });
}
