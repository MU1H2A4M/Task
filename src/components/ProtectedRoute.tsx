import { Navigate, Outlet, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

/**
 * Gates everything inside it behind an authenticated *admin*.
 * - No session -> redirect to /sign-in (preserving the target).
 * - Session but no admin profile -> blocked.
 */
export function ProtectedRoute() {
  const { session, profile, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" aria-label="Loading" />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/sign-in" state={{ from: location }} replace />;
  }

  if (!profile || profile.role !== "admin") {
    return (
      <div className="flex min-h-screen items-center justify-center px-6 text-center">
        <div>
          <p className="text-lg font-semibold">Admin access required</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Your account isn't provisioned as an admin. Contact support or sign
            in with an admin account.
          </p>
        </div>
      </div>
    );
  }

  return <Outlet />;
}
