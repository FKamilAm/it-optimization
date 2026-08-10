import { api } from "./client";
import type { Lead } from "./leads";
import type { Project } from "./projects";
import type { Task } from "./tasks";

/**
 * То же, что бот присылает утром. Один источник на сервере (`collectToday`) —
 * поэтому экран и сообщение в телеграме не могут разойтись.
 */
export interface TodaySnapshot {
  empty: boolean;
  leads: {
    overdue: Lead[];
    today: Lead[];
    orphanUrgent: Lead[];
    unclaimed: Lead[];
  };
  tasks: {
    overdue: Task[];
    today: Task[];
  };
  projects: {
    urgent: Project[];
    /** Помесячные проекты с пробелом в счетах — считает сервер. */
    unbilled: Project[];
  };
}

export async function getToday(): Promise<TodaySnapshot> {
  return api.get<TodaySnapshot>("/today");
}
