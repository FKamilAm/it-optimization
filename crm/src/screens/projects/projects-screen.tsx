import { Plus } from "lucide-react";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { ApiError } from "@/api/client";
import { listClients, type Client } from "@/api/clients";
import {
  CLOSED_PROJECT_STATUSES,
  createProject,
  deleteProject,
  listProjects,
  PROJECT_STATUSES,
  PROJECT_STATUS_LABELS,
  reorderProjects,
  updateProject,
  workTypeLabel,
  type Project,
  type ProjectFilters,
  type ProjectStatus,
} from "@/api/projects";
import { Board, type BoardColumn } from "@/components/board";
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
import { ProjectInvoices } from "./project-invoices";

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
  const [view, setView] = useState<"list" | "board">("list");
  const [tab, setTab] = useState<TabKey>("all");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [projects, setProjects] = useState<Project[] | null>(null);
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
    // Доске нужны все колонки разом, поэтому срез вкладки на ней не применяется.
    const filters: ProjectFilters =
      view === "board" ? { scope: "all" } : { ...active.filters };
    if (debouncedSearch) filters.search = debouncedSearch;

    setError(null);
    listProjects(filters)
      .then(setProjects)
      .catch((cause: unknown) => {
        setError(cause instanceof ApiError ? cause.message : "Не удалось загрузить");
        setProjects([]);
      });
  }, [tab, view, debouncedSearch]);

  useEffect(load, [load]);

  useEffect(() => {
    listClients()
      .then(setClients)
      .catch(() => setClients([]));
  }, []);

  /**
   * Перенос карточки: сначала статус, потом порядок колонки — сервер при смене
   * статуса ставит проект в конец, и перестановка обязана идти после.
   */
  async function moveProject(status: ProjectStatus, ids: string[]) {
    const moved = projects?.find(
      (project) => ids.includes(project.id) && project.status !== status,
    );
    try {
      if (moved) await updateProject(moved.id, { status });
      await reorderProjects(status, ids);
      load();
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "Не удалось перенести");
      load();
    }
  }

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
        <div className="border-border ml-auto flex overflow-hidden rounded-lg border">
          {(["list", "board"] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setView(mode)}
              className={cn(
                "px-3 py-1.5 text-sm font-medium transition",
                view === mode
                  ? "bg-accent-soft text-foreground"
                  : "text-muted-foreground hover:bg-muted",
              )}
            >
              {mode === "list" ? "Список" : "Доска"}
            </button>
          ))}
        </div>
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Поиск"
          className="w-full sm:w-56"
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
        ) : view === "board" ? (
          <Board
            columns={
              PROJECT_STATUSES.map((status) => ({
                key: status,
                label: PROJECT_STATUS_LABELS[status],
                items: projects.filter((project) => project.status === status),
              })) satisfies BoardColumn<Project>[]
            }
            onMove={(columnKey, ids) => void moveProject(columnKey as ProjectStatus, ids)}
            renderCard={(project) => (
              <button
                type="button"
                onClick={() => setEditing(project)}
                className="w-full text-left"
              >
                <span className="block text-sm font-medium">{project.title}</span>
                <span className="text-muted-foreground mt-1 block truncate text-xs">
                  {[
                    project.client?.name,
                    project.developers.length ? project.developers.join(", ") : null,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </span>
                <span className="mt-1.5 flex flex-wrap gap-1">
                  {project.deadline && (
                    <Badge tone={describeDeadline(project.deadline).tone}>
                      {describeDeadline(project.deadline).label}
                    </Badge>
                  )}
                  {project.unbilledPeriod && (
                    <Badge tone="danger">счёт за {project.unbilledPeriod}</Badge>
                  )}
                </span>
              </button>
            )}
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
          clients={clients}
          initial={emptyProjectValues()}
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
          clients={clients}
          projectId={editing.id}
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
              project.developers.length
                ? project.developers.join(", ")
                : "никто не ведёт",
              workTypeLabel(project.workType) || null,
              project.taskCount > 0
                ? `задач ${project.openTaskCount}/${project.taskCount}`
                : null,
            ]
              .filter(Boolean)
              .join(" · ")}
          </span>
        </div>

        {project.unbilledPeriod && (
          <Badge tone="danger" className="mt-0.5">
            счёт за {project.unbilledPeriod}
          </Badge>
        )}
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
  clients,
  projectId,
  onClose,
  onSubmit,
  onDelete,
}: {
  title: string;
  initial: ProjectFormValues;
  clients: Client[];
  /** Есть только у сохранённого проекта — счета вешать не на что, пока его нет. */
  projectId?: string;
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
        <ProjectFields values={values} onChange={setValues} clients={clients} />

        {projectId && (
          <div className="mt-4">
            <ProjectInvoices projectId={projectId} />
          </div>
        )}

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
