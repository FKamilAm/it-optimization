import { Plus } from "lucide-react";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { ApiError } from "@/api/client";
import { listClients, type Client } from "@/api/clients";
import {
  CLOSED_PROJECT_STATUSES,
  createProject,
  deleteProject,
  listProjects,
  PROJECT_STATUS_LABELS,
  updateProject,
  type Project,
  type ProjectFilters,
} from "@/api/projects";
import { listTeam, memberLabel, type TeamMember } from "@/api/team";
import { useCurrentUser } from "@/auth/auth-context";
import { Badge, Button, EmptyState, ErrorNote, Input, Modal } from "@/components/ui";
import { cn } from "@/lib/cn";
import { describeDeadline } from "@/lib/dates";
import {
  emptyProjectValues,
  ProjectFields,
  projectToValues,
  valuesToProjectInput,
  type ProjectFormValues,
} from "./project-form";

const TABS = [
  { key: "all", label: "Все", filters: { scope: "all" } },
  { key: "open", label: "В работе", filters: { scope: "open" } },
  { key: "overdue", label: "Просрочено", filters: { overdue: true } },
  { key: "closed", label: "Закрытые", filters: { scope: "closed" } },
] as const satisfies readonly { key: string; label: string; filters: ProjectFilters }[];

type TabKey = (typeof TABS)[number]["key"];

const STATUS_TONE: Record<string, "neutral" | "accent" | "warning" | "success"> = {
  planned: "neutral",
  active: "accent",
  on_hold: "warning",
  done: "success",
  cancelled: "neutral",
};

export function ProjectsScreen() {
  const user = useCurrentUser();
  const [tab, setTab] = useState<TabKey>("all");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [projects, setProjects] = useState<Project[] | null>(null);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const load = useCallback(() => {
    const active = TABS.find((item) => item.key === tab) ?? TABS[0];
    const filters: ProjectFilters = { ...active.filters };
    if (debouncedSearch) filters.search = debouncedSearch;

    setError(null);
    listProjects(filters)
      .then(setProjects)
      .catch((cause: unknown) => {
        setError(cause instanceof ApiError ? cause.message : "Не удалось загрузить");
        setProjects([]);
      });
  }, [tab, debouncedSearch]);

  useEffect(load, [load]);

  useEffect(() => {
    listTeam()
      .then(setTeam)
      .catch(() => setTeam([]));
    listClients()
      .then(setClients)
      .catch(() => setClients([]));
  }, []);

  return (
    <section>
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold tracking-tight">Проекты</h1>
        <Button onClick={() => setCreating(true)}>
          <Plus size={16} strokeWidth={2.5} />
          Новый проект
        </Button>
      </header>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        {TABS.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setTab(item.key)}
            className={cn(
              "rounded-lg px-3 py-1.5 text-sm font-medium transition",
              tab === item.key
                ? "bg-accent-soft text-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {item.label}
          </button>
        ))}
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Поиск"
          className="ml-auto w-full sm:w-56"
        />
      </div>

      {error && (
        <div className="mt-4">
          <ErrorNote>{error}</ErrorNote>
        </div>
      )}

      <div className="mt-5">
        {projects === null ? (
          <p className="text-muted-foreground text-sm">Загружаем…</p>
        ) : projects.length === 0 ? (
          <EmptyState
            title="Пока пусто"
            note="Проект — это работа, у которой есть начало и конец. Заведите первый."
          />
        ) : (
          <ul className="divide-border divide-y">
            {projects.map((project) => (
              <ProjectRow
                key={project.id}
                project={project}
                onOpen={() => setEditing(project)}
              />
            ))}
          </ul>
        )}
      </div>

      {creating && (
        <ProjectModal
          title="Новый проект"
          team={team}
          clients={clients}
          initial={emptyProjectValues({ ownerId: user.id })}
          onClose={() => setCreating(false)}
          onSubmit={async (values) => {
            await createProject(valuesToProjectInput(values));
            setCreating(false);
            load();
          }}
        />
      )}

      {editing && (
        <ProjectModal
          title="Проект"
          team={team}
          clients={clients}
          initial={projectToValues(editing)}
          onClose={() => setEditing(null)}
          onSubmit={async (values) => {
            await updateProject(editing.id, valuesToProjectInput(values));
            setEditing(null);
            load();
          }}
          onDelete={async () => {
            await deleteProject(editing.id);
            setEditing(null);
            load();
          }}
        />
      )}
    </section>
  );
}

function ProjectRow({ project, onOpen }: { project: Project; onOpen: () => void }) {
  const closed = (CLOSED_PROJECT_STATUSES as readonly string[]).includes(project.status);
  const deadline =
    project.deadline && !closed ? describeDeadline(project.deadline) : null;

  return (
    <li>
      <button
        type="button"
        onClick={onOpen}
        className="hover:bg-muted flex w-full items-start gap-3 rounded-lg px-2 py-3 text-left transition"
      >
        <div className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium">{project.title}</span>
          <span className="text-muted-foreground mt-0.5 block truncate text-xs">
            {[
              project.client?.name,
              project.owner ? memberLabel(project.owner) : null,
              project.taskCount > 0
                ? `задач ${project.openTaskCount}/${project.taskCount}`
                : null,
            ]
              .filter(Boolean)
              .join(" · ") || "без клиента"}
          </span>
        </div>

        {deadline && (
          <Badge tone={deadline.tone} className="mt-0.5">
            {deadline.label}
          </Badge>
        )}
        <Badge tone={STATUS_TONE[project.status] ?? "neutral"} className="mt-0.5">
          {PROJECT_STATUS_LABELS[project.status]}
        </Badge>
      </button>
    </li>
  );
}

function ProjectModal({
  title,
  initial,
  team,
  clients,
  onClose,
  onSubmit,
  onDelete,
}: {
  title: string;
  initial: ProjectFormValues;
  team: TeamMember[];
  clients: Client[];
  onClose: () => void;
  onSubmit: (values: ProjectFormValues) => Promise<void>;
  onDelete?: () => Promise<void>;
}) {
  const [values, setValues] = useState<ProjectFormValues>(initial);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await onSubmit(values);
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "Не удалось сохранить");
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!onDelete) return;
    if (!confirm("Удалить проект? Его задачи тоже скроются.")) return;
    setError(null);
    setSaving(true);
    try {
      await onDelete();
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "Не удалось удалить");
      setSaving(false);
    }
  }

  return (
    <Modal title={title} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <ProjectFields
          values={values}
          onChange={setValues}
          team={team}
          clients={clients}
        />

        {error && (
          <div className="mt-4">
            <ErrorNote>{error}</ErrorNote>
          </div>
        )}

        <div className="mt-5 flex items-center gap-2">
          <Button type="submit" disabled={saving}>
            {saving ? "Сохраняем…" : "Сохранить"}
          </Button>
          <Button type="button" variant="ghost" onClick={onClose}>
            Отмена
          </Button>
          {onDelete && (
            <Button
              type="button"
              variant="danger"
              className="ml-auto"
              onClick={() => void handleDelete()}
              disabled={saving}
            >
              Удалить
            </Button>
          )}
        </div>
      </form>
    </Modal>
  );
}
