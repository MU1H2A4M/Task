export type OrgType = "school" | "nonprofit" | "business";
export type MemberStatus = "invited" | "active";
export type MemberRole = "admin" | "member";

export interface Profile {
  id: string;
  email: string;
  role: "admin";
  created_at: string;
}

export interface Organization {
  id: string;
  owner_id: string;
  name: string;
  type: OrgType;
  student_capacity: number | null;
  registration_number: string | null;
  industry: string | null;
  created_at: string;
}

/** Directory rows include an aggregated member count. */
export interface OrganizationWithCount extends Organization {
  members: { count: number }[];
}

export interface Member {
  id: string;
  organization_id: string;
  email: string;
  role: MemberRole;
  status: MemberStatus;
  invited_by: string;
  invited_at: string;
  activated_at: string | null;
  user_id: string | null;
  invite_token: string;
}

export interface InviteMemberResponse {
  member: Member;
  email_sent: boolean;
}

export interface AcceptInvitationResponse {
  organization_name: string;
  role: MemberRole;
  already_accepted: boolean;
}
