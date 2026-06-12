import { Badge } from "@/components/ui/badge";
import { ORG_TYPES } from "@/lib/orgTypes";
import type { OrgType } from "@/lib/types";

interface OrgTypeBadgeProps {
  type: OrgType;
}

/** Type-specific badge: each org type gets its own icon and hue. */
export function OrgTypeBadge({ type }: OrgTypeBadgeProps) {
  const config = ORG_TYPES[type];
  const Icon = config.icon;
  return (
    <Badge variant="outline" className={config.badgeClass}>
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
}
