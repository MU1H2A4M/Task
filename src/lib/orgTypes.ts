import { GraduationCap, HeartHandshake, Briefcase } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { OrgType, Organization } from "@/lib/types";

interface OrgTypeConfig {
  value: OrgType;
  label: string;
  icon: LucideIcon;
  /** Badge + accent styling, distinct per type. */
  badgeClass: string;
  accentBorderClass: string;
  /** Label for the type-specific detail field. */
  detailLabel: string;
  detailPlaceholder: string;
  description: string;
}

export const ORG_TYPES: Record<OrgType, OrgTypeConfig> = {
  school: {
    value: "school",
    label: "School",
    icon: GraduationCap,
    badgeClass: "bg-indigo-50 text-indigo-700 ring-1 ring-inset ring-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:ring-indigo-900",
    accentBorderClass: "border-l-indigo-500",
    detailLabel: "Student capacity",
    detailPlaceholder: "e.g. 450",
    description: "Requires a student capacity (positive number).",
  },
  nonprofit: {
    value: "nonprofit",
    label: "Nonprofit",
    icon: HeartHandshake,
    badgeClass: "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:ring-emerald-900",
    accentBorderClass: "border-l-emerald-500",
    detailLabel: "Registration number",
    detailPlaceholder: "e.g. NP-2024-00871",
    description: "Requires an official registration number.",
  },
  business: {
    value: "business",
    label: "Business",
    icon: Briefcase,
    badgeClass: "bg-amber-50 text-amber-800 ring-1 ring-inset ring-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:ring-amber-900",
    accentBorderClass: "border-l-amber-500",
    detailLabel: "Industry",
    detailPlaceholder: "e.g. Logistics",
    description: "Requires an industry.",
  },
};

export const ORG_TYPE_LIST = Object.values(ORG_TYPES);

/** The type-specific detail shown next to an organization. */
export function orgDetail(org: Organization): string {
  switch (org.type) {
    case "school":
      return `${org.student_capacity ?? "—"} students`;
    case "nonprofit":
      return `Reg. ${org.registration_number ?? "—"}`;
    case "business":
      return org.industry ?? "—";
  }
}
