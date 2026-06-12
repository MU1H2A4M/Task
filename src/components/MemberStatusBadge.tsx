import { CheckCircle2, MailOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { MemberStatus } from "@/lib/types";

export function MemberStatusBadge({ status }: { status: MemberStatus }) {
  if (status === "active") {
    return (
      <Badge
        variant="outline"
        className="bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:ring-emerald-900"
      >
        <CheckCircle2 className="h-3 w-3" />
        Active
      </Badge>
    );
  }
  return (
    <Badge
      variant="outline"
      className="bg-slate-50 text-slate-600 ring-1 ring-inset ring-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-700"
    >
      <MailOpen className="h-3 w-3" />
      Invited
    </Badge>
  );
}
