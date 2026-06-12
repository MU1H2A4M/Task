import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateOrganization } from "@/hooks/useOrganizations";
import { ORG_TYPE_LIST, ORG_TYPES } from "@/lib/orgTypes";
import type { OrgType } from "@/lib/types";

const nameSchema = z
  .string()
  .trim()
  .min(2, "Name must be at least 2 characters")
  .max(100, "Name must be 100 characters or fewer");

/**
 * The organization's type changes which detail field is required —
 * mirrored 1:1 by a CHECK constraint in the database.
 */
const createOrgSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("school"),
    name: nameSchema,
    student_capacity: z
      .string()
      .trim()
      .min(1, "Enter the student capacity")
      .regex(/^\d+$/, "Must be a whole number")
      .refine((v) => Number(v) > 0, "Must be greater than zero"),
  }),
  z.object({
    type: z.literal("nonprofit"),
    name: nameSchema,
    registration_number: z
      .string()
      .trim()
      .min(3, "Registration number must be at least 3 characters"),
  }),
  z.object({
    type: z.literal("business"),
    name: nameSchema,
    industry: z.string().trim().min(2, "Industry must be at least 2 characters"),
  }),
]);

type CreateOrgValues = z.infer<typeof createOrgSchema>;

export function CreateOrgDialog() {
  const [open, setOpen] = useState(false);
  const createOrg = useCreateOrganization();

  const form = useForm<CreateOrgValues>({
    resolver: zodResolver(createOrgSchema),
    defaultValues: { type: "school", name: "" } as CreateOrgValues,
  });

  const selectedType = form.watch("type");
  const typeConfig = ORG_TYPES[selectedType];

  const onSubmit = form.handleSubmit((values) => {
    const input =
      values.type === "school"
        ? {
            type: values.type,
            name: values.name,
            student_capacity: Number(values.student_capacity),
          }
        : values.type === "nonprofit"
          ? {
              type: values.type,
              name: values.name,
              registration_number: values.registration_number,
            }
          : { type: values.type, name: values.name, industry: values.industry };

    createOrg.mutate(input, {
      onSuccess: (org) => {
        toast.success(`Created ${org.name}`);
        form.reset({ type: "school", name: "" } as CreateOrgValues);
        setOpen(false);
      },
      onError: (error) => toast.error(error.message),
    });
  });

  const handleTypeChange = (value: string) => {
    form.setValue("type", value as OrgType, { shouldValidate: false });
    form.clearErrors();
  };

  const errors = form.formState.errors as Record<
    string,
    { message?: string } | undefined
  >;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus />
          New organization
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create an organization</DialogTitle>
          <DialogDescription>
            Pick a type — each type asks for a different detail.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={(e) => void onSubmit(e)} className="space-y-4" noValidate>
          <div className="space-y-2">
            <Label htmlFor="org-name">Name</Label>
            <Input
              id="org-name"
              placeholder="e.g. Hillside Academy"
              autoComplete="off"
              {...form.register("name")}
            />
            {errors["name"]?.message && (
              <p className="text-sm text-destructive">{errors["name"].message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="org-type">Type</Label>
            <Select value={selectedType} onValueChange={handleTypeChange}>
              <SelectTrigger id="org-type">
                <SelectValue placeholder="Select a type" />
              </SelectTrigger>
              <SelectContent>
                {ORG_TYPE_LIST.map((t) => {
                  const Icon = t.icon;
                  return (
                    <SelectItem key={t.value} value={t.value}>
                      <span className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        {t.label}
                      </span>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">{typeConfig.description}</p>
          </div>

          {selectedType === "school" && (
            <div className="space-y-2">
              <Label htmlFor="org-capacity">{typeConfig.detailLabel}</Label>
              <Input
                id="org-capacity"
                type="number"
                min={1}
                placeholder={typeConfig.detailPlaceholder}
                {...form.register("student_capacity")}
              />
              {errors["student_capacity"]?.message && (
                <p className="text-sm text-destructive">
                  {errors["student_capacity"].message}
                </p>
              )}
            </div>
          )}

          {selectedType === "nonprofit" && (
            <div className="space-y-2">
              <Label htmlFor="org-reg">{typeConfig.detailLabel}</Label>
              <Input
                id="org-reg"
                placeholder={typeConfig.detailPlaceholder}
                autoComplete="off"
                {...form.register("registration_number")}
              />
              {errors["registration_number"]?.message && (
                <p className="text-sm text-destructive">
                  {errors["registration_number"].message}
                </p>
              )}
            </div>
          )}

          {selectedType === "business" && (
            <div className="space-y-2">
              <Label htmlFor="org-industry">{typeConfig.detailLabel}</Label>
              <Input
                id="org-industry"
                placeholder={typeConfig.detailPlaceholder}
                autoComplete="off"
                {...form.register("industry")}
              />
              {errors["industry"]?.message && (
                <p className="text-sm text-destructive">{errors["industry"].message}</p>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={createOrg.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createOrg.isPending}>
              {createOrg.isPending && <Loader2 className="animate-spin" />}
              Create organization
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
