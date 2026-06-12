import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface QueryStateProps {
  /** From React Query. */
  isLoading: boolean;
  isError: boolean;
  errorMessage?: string;
  /** True when the query succeeded but has nothing to show. */
  isEmpty: boolean;
  /** Skeleton(s) shown while loading. */
  loading: ReactNode;
  /** Empty-state content. */
  empty: {
    icon: LucideIcon;
    title: string;
    description: string;
    action?: ReactNode;
  };
  /** The happy path. */
  children: ReactNode;
}

/**
 * One consistent loading / error / empty / success pattern,
 * shared by every data view in the app.
 */
export function QueryState({
  isLoading,
  isError,
  errorMessage,
  isEmpty,
  loading,
  empty,
  children,
}: QueryStateProps) {
  if (isLoading) return <>{loading}</>;

  if (isError) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center py-12 text-center">
          <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="h-6 w-6 text-destructive" />
          </span>
          <p className="font-medium">Something went wrong</p>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            {errorMessage ?? "Couldn't load this data. Try refreshing the page."}
          </p>
        </CardContent>
      </Card>
    );
  }

  if (isEmpty) {
    const Icon = empty.icon;
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center py-14 text-center">
          <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-secondary">
            <Icon className="h-6 w-6 text-muted-foreground" />
          </span>
          <p className="font-medium">{empty.title}</p>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">{empty.description}</p>
          {empty.action && <div className="mt-4">{empty.action}</div>}
        </CardContent>
      </Card>
    );
  }

  return <>{children}</>;
}
