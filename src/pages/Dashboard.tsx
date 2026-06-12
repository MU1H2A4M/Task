import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Building2, ChevronRight, Search, SearchX, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { CreateOrgDialog } from "@/components/CreateOrgDialog";
import { OrgTypeBadge } from "@/components/OrgTypeBadge";
import { QueryState } from "@/components/QueryState";
import { useOrganizations } from "@/hooks/useOrganizations";
import { ORG_TYPES, ORG_TYPE_LIST, orgDetail } from "@/lib/orgTypes";
import type { OrgType } from "@/lib/types";
import { formatDate } from "@/lib/utils";

type TypeFilter = OrgType | "all";

export default function Dashboard() {
  const { data: organizations, isLoading, isError, error } = useOrganizations();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");

  const filtered = useMemo(() => {
    const all = organizations ?? [];
    const q = search.trim().toLowerCase();
    return all.filter((org) => {
      const matchesType = typeFilter === "all" || org.type === typeFilter;
      const matchesSearch = q === "" || org.name.toLowerCase().includes(q);
      return matchesType && matchesSearch;
    });
  }, [organizations, search, typeFilter]);

  const hasAny = (organizations?.length ?? 0) > 0;
  const isFiltering = search.trim() !== "" || typeFilter !== "all";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Your organizations</h1>
          <p className="text-sm text-muted-foreground">
            Everything you've created, in one place. Click an organization to
            manage its members.
          </p>
        </div>
        <CreateOrgDialog />
      </div>

      {hasAny && (
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name…"
              className="pl-9"
              aria-label="Search organizations"
            />
          </div>
          <Select
            value={typeFilter}
            onValueChange={(v) => setTypeFilter(v as TypeFilter)}
          >
            <SelectTrigger className="sm:w-44" aria-label="Filter by type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              {ORG_TYPE_LIST.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <QueryState
        isLoading={isLoading}
        isError={isError}
        errorMessage={error?.message}
        isEmpty={!hasAny}
        loading={
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-36 rounded-xl" />
            ))}
          </div>
        }
        empty={{
          icon: Building2,
          title: "No organizations yet",
          description:
            "Create your first organization — a school, nonprofit, or business — and start inviting members.",
        }}
      >
        {filtered.length === 0 && isFiltering ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center py-14 text-center">
              <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-secondary">
                <SearchX className="h-6 w-6 text-muted-foreground" />
              </span>
              <p className="font-medium">No matches</p>
              <p className="mt-1 text-sm text-muted-foreground">
                No organizations match your search or filter. Try clearing them.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((org) => {
              const memberCount = org.members[0]?.count ?? 0;
              const accent = ORG_TYPES[org.type].accentBorderClass;
              return (
                <Link
                  key={org.id}
                  to={`/organizations/${org.id}`}
                  className="group rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <Card
                    className={`h-full border-l-4 ${accent} transition-shadow group-hover:shadow-md`}
                  >
                    <CardContent className="flex h-full flex-col justify-between gap-4 p-5">
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-semibold leading-tight">{org.name}</p>
                          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                        </div>
                        <OrgTypeBadge type={org.type} />
                        <p className="text-sm text-muted-foreground">{orgDetail(org)}</p>
                      </div>
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span className="inline-flex items-center gap-1.5">
                          <Users className="h-4 w-4" />
                          {memberCount} {memberCount === 1 ? "member" : "members"}
                        </span>
                        <span>Created {formatDate(org.created_at)}</span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </QueryState>
    </div>
  );
}
