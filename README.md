# Org Console — Admin Dashboard

A small, production-minded admin dashboard where an authenticated admin can
create organizations of different types, invite members by email, and browse
the organizations they manage.

Built with **React 18 + TypeScript (strict)**, **Vite (SWC)**, **React Router
v6**, **TanStack React Query**, **React Hook Form + Zod**, **Tailwind CSS +
shadcn/ui**, **Lucide icons**, and **Supabase** (Postgres, Auth, Edge
Functions, RLS).

---

## Live deployments & test credentials

| Environment | Branch | URL |
|---|---|---|
| Production | `main` | <!-- paste your production Vercel URL here --> |
| Development | `development` | <!-- paste your preview Vercel URL here --> |

**Seeded admin credentials** (for reviewers — do not reuse elsewhere):

```
email:    reviewer@example.com     <!-- replace with the account you seed -->
password: <set your own>
```

## Branching strategy

- `main` — production. Deploys the Production Vercel URL. Only receives code
  via pull requests from `development`.
- `development` — integration branch. Deploys the Development/Preview Vercel
  URL. Feature branches (`feat/...`, `fix/...`) branch off `development` and
  merge back via pull request.
- Flow for any change: `feat/x` → PR → `development` (preview verifies it) →
  PR → `main` (production release).

## Write-up

**What I'd do with another day**
- A Playwright end-to-end test covering sign-in → create org → invite →
  accept-invitation, run against a disposable Supabase project in CI.
- Real email delivery (Resend) at the marked plug-in point in
  `invite-member`, with a resend-invitation action in the UI.
- A members view for non-owner users (an accepted member currently has no
  org-scoped read access by design — RLS is owner-only per the spec; I'd add
  a `members can read own membership + org name` policy).
- Pagination on the directory and members list; optimistic updates for
  invite/remove.

**Shortcuts taken**
- Every signup is provisioned as an app-level admin via a DB trigger — fine
  for a self-serve assessment, would be an allowlist in production.
- "Mark active" lets the admin manually activate a member, simulating
  acceptance without email; the token-based accept flow exists alongside it.
- Email sending is stubbed (the spec allows it); the DB record is the source
  of truth and the send step is clearly marked.

**Tradeoffs**
- Type-specific fields are real columns + a CHECK constraint instead of a
  `jsonb` blob: more rigid, but the database enforces the same rule as the
  Zod schema, which the spec values.
- Invitations are server-side only (no INSERT policy on `members`): slightly
  more moving parts than a client insert, but the trust boundary is clean
  and auditable.
- Client-side search/filter on the directory: trivially correct at this data
  size; would move to server-side `ilike` + indexes with real data volumes.

## Features → requirements mapping

| Requirement | Where |
|---|---|
| Admin sign-up / sign-in, protected routes | `src/pages/SignIn.tsx`, `SignUp.tsx`, `src/components/ProtectedRoute.tsx`. A database trigger provisions every new signup as an `admin` profile; `ProtectedRoute` requires both a session **and** an admin profile before rendering anything. Unauthenticated visitors are redirected to `/sign-in`. |
| Organization creation, 3+ types, type drives behavior | `src/components/CreateOrgDialog.tsx`. Types: **School**, **Nonprofit**, **Business**. The type changes (a) the required form field (student capacity / registration number / industry) via a Zod **discriminated union**, (b) the badge + accent color shown throughout the UI, and (c) a database **CHECK constraint** enforcing the same rule server-side. |
| Member invitations with status | `src/components/InviteMemberForm.tsx` → `invite-member` Edge Function → members table. Members render in a table with `invited` / `active` status, and the admin can mark them active or remove them. |
| Organization directory | `src/pages/Dashboard.tsx` lists all orgs owned by the signed-in admin (with member counts); clicking through opens `src/pages/OrganizationDetail.tsx`. |
| Edge Function (server-side logic) | `supabase/functions/invite-member/index.ts`. The `members` table has **no client INSERT policy**, so creating an invitation is impossible from the browser — it must go through this function, which re-verifies org ownership with the caller's JWT. |
| RLS on every table | `supabase/migrations/` — RLS enabled on `profiles`, `organizations`, `members`; every policy is scoped to `auth.uid()`. |
| Dark mode (next-themes) | `src/components/ThemeToggle.tsx` + `ThemeProvider` in `App.tsx`; toggle lives in the header, system theme respected by default. |
| Shared loading / empty / error pattern | `src/components/QueryState.tsx` — one component renders the skeleton, error card, or empty state for every data view (directory + members list). |
| Server-side validation | Org creation is re-checked by DB CHECK constraints; both Edge Functions re-validate their input with **Zod on the server** (`npm:zod`). |
| Roles (stretch) | Invitations carry a role (`admin` / `member`), chosen at invite time and shown in the members table. |
| Accept-invitation flow (stretch) | Copy a pending member's invite link → invited person opens `/accept-invite?token=...`, signs up/in, accepts → their `user_id` is linked and status flips to `active` via the `accept-invitation` Edge Function. |
| Directory search / filter (stretch) | Name search + type filter on the dashboard, client-side over the RLS-scoped result set. |
| Real FKs and constraints | Same migration: FKs with `on delete cascade`, unique constraints, CHECK constraints, indexes. |

## Data model

```
auth.users ──1:1── profiles (admin)
                      │ owner_id
                      ▼
                organizations ── type ∈ {school, nonprofit, business}
                      │              CHECK: exactly one matching detail column set
                      │ organization_id
                      ▼
                   members ── status ∈ {invited, active}
                              UNIQUE (organization_id, email)
```

## Setup

### 1. Supabase project

1. Create a free project at [supabase.com](https://supabase.com).
2. Apply the migrations **in order** — either:
   - **SQL editor**: run the contents of
     `supabase/migrations/20260612000000_init.sql`, then
     `supabase/migrations/20260613000000_member_roles_and_acceptance.sql`, or
   - **CLI**:
     ```bash
     supabase login
     supabase link --project-ref <YOUR-PROJECT-REF>
     supabase db push
     ```

### 2. Deploy the Edge Function

```bash
supabase functions deploy invite-member
supabase functions deploy accept-invitation
```

No extra secrets are required — the function uses the `SUPABASE_URL`,
`SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` that Supabase injects
into every deployed function automatically.

### 3. Frontend

```bash
cp .env.example .env   # fill in your project URL + anon key (Settings → API)
npm install
npm run dev
```

> Tip: for the fastest demo loop, disable "Confirm email" under
> **Authentication → Providers → Email** in the Supabase dashboard so sign-up
> creates a session immediately. With confirmation on, the app handles it
> gracefully (it asks you to confirm, then sign in).

### 4. Try it

1. Visit `http://localhost:5173/sign-up` and create an account — the database
   trigger provisions it as an admin.
2. Create organizations of each type and notice the required field changes.
3. Open an organization and invite members by email; watch them appear with
   `invited` status. Mark one active.
4. Open `http://localhost:5173/` in a private window — you're redirected to
   sign-in.

## Security notes (what we'd want a reviewer to check)

- **RLS everywhere.** All three tables have RLS enabled. `organizations`
  policies compare `owner_id = auth.uid()`; `members` policies require an
  `EXISTS` check against an organization the caller owns. One admin can never
  read another admin's orgs or members — even with a valid JWT and direct
  PostgREST calls.
- **Invitations can't be forged client-side.** `members` has SELECT / UPDATE /
  DELETE policies but deliberately **no INSERT policy**. The only insert path
  is the `invite-member` Edge Function running with the service role, which:
  authenticates the caller's JWT, verifies they own the target org (returning
  404 — not 403 — to avoid leaking org existence), validates/normalizes the
  email, and rejects duplicates (with a unique-constraint race fallback).
- **Type rules are enforced twice.** The Zod discriminated union validates in
  the form, and the `organizations_type_details` CHECK constraint enforces the
  identical rule in Postgres, so a hand-crafted API call can't create a
  School without a capacity.
- **Profiles are immutable from the client.** They're created by a
  `security definer` trigger on `auth.users`; the client can only read its own
  row.

## Troubleshooting

| Symptom | Fix |
|---|---|
| Setup screen saying "connect your Supabase project" | Your `.env` is missing or has wrong variable names. Copy `.env.example` → `.env`, paste your Project URL + anon key, restart `npm run dev`. |
| Sign-up succeeds but you're sent back to sign-in | "Confirm email" is enabled in Supabase (**Authentication → Providers → Email**). Either click the link in the confirmation email, or disable confirmation for local testing. |
| "Admin access required" after signing in | The migration's trigger wasn't applied before you signed up, so no profile row exists. Run the migration, then either re-register with a new email or insert a row manually: `insert into public.profiles (id, email) select id, email from auth.users;` |
| Inviting a member fails with a network/404 error | The Edge Function isn't deployed. Run `supabase functions deploy invite-member` (after `supabase link`). |
| Creating an organization fails with a constraint error | The migration wasn't applied, or was applied to a different project than the one in your `.env`. |
| `npm run dev` fails to start | Check `node -v` — Node 18 or newer is required. |

## Development vs production environments

Use a separate free Supabase project per environment and let Vite pick the
right credentials by mode:

```
.env.development   # loaded by `npm run dev`
.env.production    # loaded by `npm run build`
```

Each file contains the same two `VITE_SUPABASE_*` variables pointing at the
respective project. Apply the same migrations + functions to both projects
(`supabase link --project-ref <ref> && supabase db push && supabase functions
deploy ...`). A plain `.env` works as a shared fallback for both modes.

## Decisions & deviations from the suggested model

- **Table name `members` instead of `organization_members`** — same shape as
  the suggested model (`organization_id`, nullable `user_id`, `email`,
  `status`, `role`, `invited_at`, `activated_at` as the join timestamp), just
  a shorter name. Renaming would be a one-line migration.
- **Everyone who signs up is an app-level admin** (via the profiles trigger),
  which satisfies "restricted to admin users" for a self-serve assessment app;
  org-level `role` on members is separate and set per invitation. In a real
  product, app-admin provisioning would be an allowlist or manual flag.
- **Email delivery is intentionally stubbed** — the spec says a database
  record is sufficient. The exact plug-in point is marked with a
  `EMAIL DELIVERY PLUGS IN HERE` comment in
  `supabase/functions/invite-member/index.ts`; meanwhile the **copy invite
  link** button on pending members exercises the full accept flow without
  email.
- **No Playwright test** — left out in favor of keeping the core flows
  complete within the time budget; the accept-invitation flow doubles as a
  manual end-to-end check (sign-up → create org → invite → accept).

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Vite dev server |
| `npm run build` | Strict `tsc` type-check + production build |
| `npm run preview` | Preview the production build |

## Project structure

```
supabase/
  migrations/                          # 2 migrations: schema + RLS + trigger, then roles/tokens
  functions/invite-member/             # Deno Edge Function (create invitation, Zod-validated)
  functions/accept-invitation/         # Deno Edge Function (redeem invite token)
src/
  lib/         supabase client, shared types, org-type config
  hooks/       useAuth (context), useOrganizations, useMembers (React Query)
  components/  ProtectedRoute, AppLayout, dialogs/forms, shadcn ui/
  pages/       SignIn, SignUp, Dashboard, OrganizationDetail, NotFound
```
