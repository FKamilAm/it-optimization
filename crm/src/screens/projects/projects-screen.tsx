import { CalendarDays, Plus, Wallet } from "lucide-react";
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
import { Board, type BoardColumn, type ColumnTone } from "@/components/board";
import { PersonChips } from "@/components/person-chip";
import { Badge, Button, EmptyState, ErrorNote, Input, Modal } from "@/components/ui";
import { cn } from "@/lib/cn";
import { describeDeadline, formatDate } from "@/lib/dates";
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

const COLUMN_TONE: Record<string, ColumnTone> = {
  planned: "neutral",
  active: "accent",
  on_hold: "warning",
  done: "success",
  cancelled: "neutral",
};

/**
 * Карточка проекта на доске.
 *
 * Заливка означает, что горит. Невыставленный счёт стоит выше срока намеренно:
 * сдвинутый дедлайн переживём, а забытый счёт — это недополученные деньги, и
 * заметить его больше негде.
 */
function projectTone(project: Project): { card: string; pill: string } {
  const closed = (CLOSED_PROJECT_STATUSES as readonly string[]).includes(project.status);
  if (closed) return { card: "bg-muted/60", pill: "bg-background text-muted-foreground" };
  if (project.unbilledPeriod) {
    return { card: "bg-danger-soft", pill: "bg-danger text-white" };
  }

  const deadline = project.deadline ? describeDeadline(project.deadline) : null;
  if (deadline?.tone === "danger") {
    return { card: "bg-danger-soft", pill: "bg-danger text-white" };
  }
  if (deadline?.tone === "warning") {
    return { card: "bg-warning-soft", pill: "bg-warning text-white" };
  }
  return { card: "bg-background", pill: "bg-muted text-muted-foreground" };
}

function ProjectCard({ project, onOpen }: { project: Project; onOpen: () => void }) {
  const closed = (CLOSED_PROJECT_STATUSES as readonly string[]).includes(project.status);
  const deadline =
    project.deadline && !closed ? describeDeadline(project.deadline) : null;
  const tone = projectTone(project);
  const doneTasks = project.taskCount - project.openTaskCount;

  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn("flex w-full flex-col gap-2.5 p-3.5 text-left", tone.card)}
    >
      <span className="flex flex-wrap items-center gap-1.5">
        {project.deadline && !closed && (
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium",
              tone.pill,
            )}
          >
            <CalendarDays size={11} strokeWidth={2.5} />
            {deadline ? deadline.label : formatDate(project.deadline)}
          </span>
        )}
        {project.unbilledPeriod && (
          <span className="bg-danger inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium text-white">
            <Wallet size={11} strokeWidth={2.5} />
            счёт за {project.unbilledPeriod}
          </span>
        )}
      </span>

      <span className="text-sm leading-snug font-semibold">{project.title}</span>

      {(project.client || project.workType) && (
        <span className="text-muted-foreground truncate text-xs">
          {[project.client?.name, workTypeLabel(project.workType)]
            .filter(Boolean)
            .join(" · ")}
        </span>
      )}

      {/* Полоса выполнения вместо «задач 3/7»: доля закрытого читается мгновенно,
          а точные числа остаются подписью рядом. */}
      {project.taskCount > 0 && (
        <span className="block">
          <span className="bg-foreground/10 block h-1 overflow-hidden rounded-full">
            <span
              className="bg-success block h-full rounded-full transition-all"
              style={{ width: `${(doneTasks / project.taskCount) * 100}%` }}
            />
          </span>
          <span className="text-muted-foreground mt-1 block text-[11px]">
            задач {doneTasks} из {project.taskCount}
          </span>
        </span>
      )}

      {project.developers.length > 0 && (
        <span className="border-foreground/10 mt-0.5 flex items-center gap-2 border-t pt-2.5">
          <PersonChips names={project.developers} />
        </span>
      )}
    </button>
  );
}

export function ProjectsScreen() {
  const [view, setView] = useState<"list" | "board">("list");
  const [tab, setTab] = useState<TabKey>("all");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [projects, setProjects] = useState<Project[] | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  /** Колонка, из которой нажали «+» — проект заводится сразу в ней. */
  const [prefillStatus, setPrefillStatus] = useState<ProjectStatus | null>(null);
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

    // Двигаем на месте до ответа сервера — иначе карточка успевает вернуться
    // в исходную колонку и мигнуть, будто перенос не принят.
    setProjects((current) =>
      current === null
        ? null
        : current.map((project) =>
            project.id === moved?.id
              ? { ...project, status, position: ids.indexOf(project.id) }
              : ids.includes(project.id)
                ? { ...project, position: ids.indexOf(project.id) }
                : project,
          ),
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
            onAdd={(columnKey) => {
              setPrefillStatus(columnKey as ProjectStatus);
              setCreating(true);
            }}
            columns={
              PROJECT_STATUSES.map((status) => ({
                key: status,
                label: PROJECT_STATUS_LABELS[status],
                tone: COLUMN_TONE[status],
                items: projects.filter((project) => project.status === status),
              })) satisfies BoardColumn<Project>[]
            }
            onMove={(columnKey, ids) => void moveProject(columnKey as ProjectStatus, ids)}
            renderCard={(project) => (
              <ProjectCard project={project} onOpen={() => setEditing(project)} />
            )}
          />
        ) : (
          <ul className="space-y-2">
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
          initial={{
            ...emptyProjectValues(),
            ...(prefillStatus ? { status: prefillStatus } : {}),
          }}
          onClose={() => {
            setCreating(false);
            setPrefillStatus(null);
          }}
          onSubmit={async (values) => {
            await createProject(valuesToProjectInput(values));
            setCreating(false);
            setPrefillStatus(null);
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
        className="border-border bg-background hover:border-accent-border flex w-full items-start gap-3 rounded-xl border px-3 py-2.5 text-left transition hover:shadow-sm"
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
