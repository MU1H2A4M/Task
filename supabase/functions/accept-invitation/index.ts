

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://esm.sh/zod@3.23.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const acceptSchema = z.object({
  token: z.string().uuid("Invalid invitation token"),
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  // --- 1. Authenticate the caller -------------------------------
  const authHeader = req.headers.get("Authorization") ?? "";
  const callerClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const {
    data: { user },
    error: userError,
  } = await callerClient.auth.getUser();

  if (userError || !user || !user.email) {
    return json({ error: "Not authenticated" }, 401);
  }

  
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  const parsed = acceptSchema.safeParse(raw);
  if (!parsed.success) {
    return json(
      { error: parsed.error.issues[0]?.message ?? "Invalid token" },
      400,
    );
  }
  const { token } = parsed.data;

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });


  const { data: member, error: memberError } = await admin
    .from("members")
    .select(
      "id, organization_id, email, role, status, user_id, organizations(name)",
    )
    .eq("invite_token", token)
    .maybeSingle();

  if (memberError) {
    return json({ error: "Failed to look up invitation" }, 500);
  }
  if (!member) {
    return json({ error: "This invitation doesn't exist or was revoked" }, 404);
  }

  const orgRelation = member.organizations as
    | { name: string }
    | { name: string }[]
    | null;
  const organizationName = Array.isArray(orgRelation)
    ? (orgRelation[0]?.name ?? "the organization")
    : (orgRelation?.name ?? "the organization");


  if (member.email.toLowerCase() !== user.email.toLowerCase()) {
    return json(
      { error: "This invitation was sent to a different email address" },
      403,
    );
  }


  if (member.status === "active" && member.user_id === user.id) {
    return json({
      organization_name: organizationName,
      role: member.role,
      already_accepted: true,
    });
  }


  const { error: updateError } = await admin
    .from("members")
    .update({
      user_id: user.id,
      status: "active",
      activated_at: new Date().toISOString(),
    })
    .eq("id", member.id);

  if (updateError) {
    return json({ error: "Failed to accept invitation" }, 500);
  }

  return json({
    organization_name: organizationName,
    role: member.role,
    already_accepted: false,
  });
});
