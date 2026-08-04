import { api } from "./client";

export interface TeamMember {
  id: string;
  name: string | null;
  email: string;
}

export async function listTeam(): Promise<TeamMember[]> {
  const { team } = await api.get<{ team: TeamMember[] }>("/team");
  return team;
}

/** Имя для списков: оно необязательное, поэтому запасной вариант — почта. */
export function memberLabel(
  member: { name: string | null; email: string } | null,
): string {
  if (!member) return "";
  return member.name ?? member.email;
}
