import { Check, Plus } from "lucide-react";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { ApiError } from "@/api/client";
import { listProjects, type Project } from "@/api/projects";
import {
  createTask,
  deleteTask,
  listTasks,
  TASK_STATUS_LABELS,
  updateTask,
  type Task,
  type TaskFilters,
} from "@/api/tasks";
import { Badge, Button, EmptyState, ErrorNote, Input, Modal } from "@/components/ui";
import { describeDeadline } from "@/lib/dates";
import { cn } from "@/lib/cn";
import { DEVELOPERS } from "@/lib/developers";
import {
  emptyTaskValues,
  TaskFields,
  taskToValues,
  valuesToTaskInput,
  type TaskFormValues,
} from "./task-form";

/**
 * Срезы списка. Вкладки «Мои» нет намеренно: исполнители значатся именами, а не
 * учётными записями, поэтому связать вошедшего с именем нельзя. Вместо неё —
 * выбор исполнителя рядом с поиском.
 */
const TABS = [
  { key: "all", label: "Все", filters: { scope: "all" } },
  { key: "overdue", label: "Просрочено", filters: { overdue: true } },
  { key: "open", label: "Открытые", filters: { scope: "open" } },
  { key: "done", label: "Готово", filters: { scope: "closed" } },
] as const satisfies readonly { key: string; label: string; filters: TaskFilters }[];

type TabKey = (typeof TABS)[number]["key"];

export function TasksScreen() {
  const [tab, setTab] = useState<TabKey>("all");
  /** Фильтр по исполнителю: «мои» без учётных записей не выразить. */
  const [developer, setDeveloper] = useState("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [tasks, setTasks] = useState<Task[] | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const load = useCallback(() => {
    const active = TABS.find((item) => item.key === tab) ?? TABS[0];
    const filters: TaskFilters = { ...active.filters };
    if (developer) filters.developer = developer;
    if (debouncedSearch) filters.search = debouncedSearch;

    setError(null);
    listTasks(filters)
      .then(setTasks)
      .catch((cause: unknown) => {
        setError(cause instanceof ApiError ? cause.message : "Не удалось загрузить");
        setTasks([]);
      });
  }, [tab, developer, debouncedSearch]);

  useEffect(load, [load]);

  useEffect(() => {
    // Список проектов нужен только для выпадающего списка в форме, поэтому
    // берём открытые: закрытому проекту новые задачи не заводят.
    listProjects({ scope: "open" })
      .then(setProjects)
      .catch(() => setProjects([]));
  }, []);

  async function toggleDone(task: Task) {
    const next = task.status === "done" ? "todo" : "done";
    // Меняем сразу на месте: галочка должна отзываться мгновенно, иначе список
    // «моргает» на каждый клик.
    setTasks((current) =>
      current === null
        ? null
        : current.map((item) => (item.id === task.id ? { ...item, status: next } : item)),
    );
    try {
      await updateTask(task.id, { status: next });
      load();
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "Не удалось сохранить");
      load();
    }
  }

  return (
    <section>
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold tracking-tight">Задачи</h1>
        <Button onClick={() => setCreating(true)}>
          <Plus size={16} strokeWidth={2.5} />
          Новая задача
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
        <select
          value={developer}
          onChange={(event) => setDeveloper(event.target.value)}
          className="border-border bg-background ml-auto rounded-lg border px-3 py-1.5 text-sm outline-none"
        >
          <option value="">Все исполнители</option>
          {DEVELOPERS.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
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
        {tasks === null ? (
          <p className="text-muted-foreground text-sm">Загружаем…</p>
        ) : tasks.length === 0 ? (
          <EmptyState
            title={tab === "overdue" ? "Ничего не горит" : "Пока пусто"}
            note={
              tab === "overdue"
                ? "Задач с истёкшим сроком нет."
                : "Заведите первую задачу — кнопка справа сверху."
            }
          />
        ) : (
          <ul className="divide-border divide-y">
            {tasks.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                onToggle={() => void toggleDone(task)}
                onOpen={() => setEditing(task)}
              />
            ))}
          </ul>
        )}
      </div>

      {creating && (
        <TaskModal
          title="Новая задача"
          projects={projects}
          initial={emptyTaskValues({})}
          onClose={() => setCreating(false)}
          onSubmit={async (values) => {
            await createTask(valuesToTaskInput(values));
            setCreating(false);
            load();
          }}
        />
      )}

      {editing && (
        <TaskModal
          title="Задача"
          projects={projects}
          initial={taskToValues(editing)}
          onClose={() => setEditing(null)}
          onSubmit={async (values) => {
            await updateTask(editing.id, valuesToTaskInput(values));
            setEditing(null);
            load();
          }}
          onDelete={async () => {
            await deleteTask(editing.id);
            setEditing(null);
            load();
          }}
        />
      )}
    </section>
  );
}

function TaskRow({
  task,
  onToggle,
  onOpen,
}: {
  task: Task;
  onToggle: () => void;
  onOpen: () => void;
}) {
  const done = task.status === "done" || task.status === "cancelled";
  const deadline = task.dueAt && !done ? describeDeadline(task.dueAt) : null;

  return (
    <li className="flex items-start gap-3 py-3">
      <button
        type="button"
        onClick={onToggle}
        aria-label={done ? "Вернуть в работу" : "Отметить выполненной"}
        className={cn(
          "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md border transition",
          done
            ? "border-success bg-success text-white"
            : "border-border hover:border-accent",
        )}
      >
        {done && <Check size={13} strokeWidth={3} />}
      </button>

      <button type="button" onClick={onOpen} className="min-w-0 flex-1 text-left">
        <span
          className={cn(
            "block truncate text-sm font-medium",
            done && "text-muted-foreground line-through",
          )}
        >
          {task.priority === "high" && !done && "❗ "}
          {task.title}
        </span>
        <span className="text-muted-foreground mt-0.5 block truncate text-xs">
          {[
            task.project?.title,
            task.developers.length ? task.developers.join(", ") : "ничья",
            done ? TASK_STATUS_LABELS[task.status] : null,
          ]
            .filter(Boolean)
            .join(" · ")}
        </span>
      </button>

      {deadline && (
        <Badge tone={deadline.tone} className="mt-0.5 max-w-56 truncate">
          {deadline.label}
        </Badge>
      )}
    </li>
  );
}

function TaskModal({
  title,
  initial,
  projects,
  onClose,
  onSubmit,
  onDelete,
}: {
  title: string;
  initial: TaskFormValues;
  projects: Project[];
  onClose: () => void;
  onSubmit: (values: TaskFormValues) => Promise<void>;
  onDelete?: () => Promise<void>;
}) {
  const [values, setValues] = useState<TaskFormValues>(initial);
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
    if (!confirm("Удалить задачу?")) return;
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
        <TaskFields values={values} onChange={setValues} projects={projects} />

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
