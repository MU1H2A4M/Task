import type { ReactNode } from "react";
import { Settings2 } from "lucide-react";
import { isSupabaseConfigured } from "@/lib/supabase";

/**
 * Blocks the whole app with clear setup instructions when the
 * Supabase environment variables are missing, instead of letting
 * the app crash to a blank white screen.
 */
export function ConfigGate({ children }: { children: ReactNode }) {
  if (isSupabaseConfigured) return <>{children}</>;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="w-full max-w-lg rounded-xl border bg-card p-8 shadow">
        <span className="mb-4 flex h-10 w-10 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <Settings2 className="h-5 w-5" />
        </span>
        <h1 className="text-xl font-semibold tracking-tight">
          Almost there — connect your Supabase project
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          The app can't find its Supabase credentials. Follow these steps and
          you'll be up in about a minute:
        </p>
        <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm">
          <li>
            In the project root, copy <code className="rounded bg-muted px-1 py-0.5">.env.example</code> to{" "}
            <code className="rounded bg-muted px-1 py-0.5">.env</code>
          </li>
          <li>
            In your Supabase dashboard, open <strong>Project Settings → API</strong> and copy the
            Project URL and anon public key into the two variables
          </li>
          <li>
            Restart the dev server (<code className="rounded bg-muted px-1 py-0.5">npm run dev</code>)
          </li>
        </ol>
        <p className="mt-4 text-xs text-muted-foreground">
          Also make sure you've run the SQL migration in{" "}
          <code className="rounded bg-muted px-1 py-0.5">supabase/migrations/</code> and deployed the{" "}
          <code className="rounded bg-muted px-1 py-0.5">invite-member</code> Edge Function — see the README.
        </p>
      </div>
    </div>
  );
}
