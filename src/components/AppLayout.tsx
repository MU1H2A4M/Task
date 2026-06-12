import { Link, Outlet } from "react-router-dom";
import { Building2, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/hooks/useAuth";

export function AppLayout() {
  const { profile, signOut } = useAuth();

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b bg-card/90 backdrop-blur">
        <div className="container flex h-14 items-center justify-between">
          <Link
            to="/"
            className="flex items-center gap-2 font-semibold tracking-tight text-foreground"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Building2 className="h-4 w-4" />
            </span>
            Org Console
          </Link>
          <div className="flex items-center gap-3">
            {profile && (
              <span className="hidden text-sm text-muted-foreground sm:inline">
                {profile.email}
              </span>
            )}
            <ThemeToggle />
            <Button variant="outline" size="sm" onClick={() => void signOut()}>
              <LogOut />
              Sign out
            </Button>
          </div>
        </div>
      </header>
      <main className="container py-8">
        <Outlet />
      </main>
    </div>
  );
}
