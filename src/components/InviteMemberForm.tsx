import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useInviteMember } from "@/hooks/useMembers";

const inviteSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .email("Enter a valid email address")
    .max(254, "Email is too long"),
  role: z.enum(["admin", "member"]),
});

type InviteValues = z.infer<typeof inviteSchema>;

interface InviteMemberFormProps {
  organizationId: string;
}

export function InviteMemberForm({ organizationId }: InviteMemberFormProps) {
  const invite = useInviteMember(organizationId);

  const form = useForm<InviteValues>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { email: "", role: "member" },
  });

  const onSubmit = form.handleSubmit((values) => {
    invite.mutate(values, {
      onSuccess: (result) => {
        toast.success(
          result.email_sent
            ? `Invitation sent to ${result.member.email}`
            : `Invitation created for ${result.member.email}`,
        );
        form.reset();
      },
      onError: (error) => toast.error(error.message),
    });
  });

  return (
    <form
      onSubmit={(e) => void onSubmit(e)}
      className="flex flex-col gap-2 sm:flex-row sm:items-start"
      noValidate
    >
      <div className="flex-1 space-y-1">
        <Label htmlFor="invite-email" className="sr-only">
          Member email
        </Label>
        <Input
          id="invite-email"
          type="email"
          placeholder="member@example.com"
          autoComplete="off"
          {...form.register("email")}
        />
        {form.formState.errors.email?.message && (
          <p className="text-sm text-destructive">
            {form.formState.errors.email.message}
          </p>
        )}
      </div>
      <Controller
        control={form.control}
        name="role"
        render={({ field }) => (
          <Select value={field.value} onValueChange={field.onChange}>
            <SelectTrigger className="sm:w-32" aria-label="Role">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="member">Member</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
            </SelectContent>
          </Select>
        )}
      />
      <Button type="submit" disabled={invite.isPending}>
        {invite.isPending ? <Loader2 className="animate-spin" /> : <Send />}
        Invite member
      </Button>
    </form>
  );
}
