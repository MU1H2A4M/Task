const { createClient } = (await import("https://esm.sh/@supabase/supabase-js@2")) as any;
const { z } = (await import("https://esm.sh/zod@3.23.8")) as any;

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

const inviteSchema = z.object({
  organization_id: z.string().uuid("organization_id must be a UUID"),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("A valid email address is required")
    .max(254),
  role: z.enum(["admin", "member"]).default("member"),
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

  
  const authHeader = req.headers.get("Authorization") ?? "";
  const callerClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const {
    data: { user },
    error: userError,
  } = await callerClient.auth.getUser();

  if (userError || !user) {
    return json({ error: "Not authenticated" }, 401);
  }

  
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  const parsed = inviteSchema.safeParse(raw);
  if (!parsed.success) {
    const message =
      parsed.error.issues[0]?.message ?? "Invalid invitation payload";
    return json({ error: message }, 400);
  }
  const { organization_id: organizationId, email, role } = parsed.data;

  
  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });


  const { data: org, error: orgError } = await admin
    .from("organizations")
    .select("id, owner_id, name")
    .eq("id", organizationId)
    .maybeSingle();

  if (orgError) {
    return json({ error: "Failed to look up organization" }, 500);
  }
  if (!org || org.owner_id !== user.id) {
  
    return json({ error: "Organization not found" }, 404);
  }


  const { data: existing, error: existingError } = await admin
    .from("members")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("email", email)
    .maybeSingle();

  if (existingError) {
    return json({ error: "Failed to check existing members" }, 500);
  }
  if (existing) {
    return json({ error: "This email has already been invited" }, 409);
  }

  
  const { data: member, error: insertError } = await admin
    .from("members")
    .insert({
      organization_id: organizationId,
      email,
      role,
      status: "invited",
      invited_by: user.id,
    })
    .select(
      "id, organization_id, email, role, status, invited_at, activated_at, user_id, invite_token",
    )
    .single();

  if (insertError) {
    
    if (insertError.code === "23505") {
      return json({ error: "This email has already been invited" }, 409);
    }
    return json({ error: "Failed to create invitation" }, 500);
  }

  let email_sent = false;
  try {
    const { error: inviteError } = await admin.auth.admin.inviteUserByEmail(
      email,
      { data: { invited_to_org: org.name } },
    );
    email_sent = !inviteError;
  } catch {
    email_sent = false;
  }

  return json({ member, email_sent }, 201);
});
