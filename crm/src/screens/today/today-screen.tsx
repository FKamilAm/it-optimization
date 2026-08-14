import { Check } from "lucide-react";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { ApiError } from "@/api/client";
import type { Credential } from "@/api/credentials";
import type { Lead } from "@/api/leads";
import type { Project } from "@/api/projects";
import { updateTask, type Task } from "@/api/tasks";
import { getToday, type TodaySnapshot } from "@/api/today";
import { useCurrentUser } from "@/auth/auth-context";
import { Badge, EmptyState, ErrorNote } from "@/components/ui";
import { cn } from "@/lib/cn";
import { describeDeadline, periodLabel } from "@/lib/dates";
import { fee, money } from "@/lib/money";
import { Link } from "react-router";

/**
 * Главный экран: что горит прямо сейчас. Ровно то же, что бот присылает в
 * девять утра, — бот закрывает утро, экран нужен в течение дня.
 *
 * Порядок блоков не случаен: сверху то, что уже просрочено, снизу то, что ещё
 * можно успеть. Ничьи лиды идут выше своих задач — потерянный лид стоит дороже
 * сдвинутой задачи.
 */
export function TodayScreen() {
  const user = useCurrentUser();
  const [snapshot, setSnapshot] = useState<TodaySnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setError(null);
    getToday()
      .then(setSnapshot)
      .catch((cause: unknown) => {
        setError(cause instanceof ApiError ? cause.message : "Не удалось загрузить");
      });
  }, []);

  useEffect(load, [load]);

  async function completeTask(task: Task) {
    setSnapshot((current) =>
      current === null
        ? null
        : {
            ...current,
            tasks: {
              overdue: current.tasks.overdue.filter((item) => item.id !== task.id),
              today: current.tasks.today.filter((item) => item.id !== task.id),
            },
          },
    );
    try {
      await updateTask(task.id, { status: "done" });
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "Не удалось сохранить");
      load();
    }
  }

  const greeting = user.name ? `Привет, ${user.name}` : "Сегодня";

  return (
    <section>
      <header>
        <h1 className="text-xl font-bold tracking-tight">{greeting}</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          То же, что бот присылает утром. Пусто — значит всё под контролем.
        </p>
      </header>

      {error && (
        <div className="mt-4">
          <ErrorNote>{error}</ErrorNote>
        </div>
      )}

      {snapshot === null ? (
        <p className="text-muted-foreground mt-6 text-sm">Загружаем…</p>
      ) : snapshot.empty ? (
        <div className="mt-6">
          <EmptyState
            title="Ничего не горит"
            note="Ни просроченных лидов, ни задач на сегодня. Свободны."
          />
        </div>
      ) : (
        <div className="mt-6 space-y-7">
          <Block
            title="Лиды просрочены"
            items={snapshot.leads.overdue}
            tone="danger"
            render={(lead) => <LeadLine key={lead.id} lead={lead} showDeadline />}
          />
          <Block
            title="Лиды на сегодня"
            items={snapshot.leads.today}
            render={(lead) => <LeadLine key={lead.id} lead={lead} showDeadline />}
          />
          <Block
            title="Ничьи, срок наступил"
            items={snapshot.leads.orphanUrgent}
            tone="danger"
            note="Не в чьём-то личном списке — про них не вспомнит никто"
            render={(lead) => <LeadLine key={lead.id} lead={lead} showDeadline />}
          />
          <Block
            title="Никто не взял"
            items={snapshot.leads.unclaimed}
            tone="danger"
            note="Пришли, но исполнителя и срока нет"
            render={(lead) => <LeadLine key={lead.id} lead={lead} />}
          />
          <Block
            title="Задачи просрочены"
            items={snapshot.tasks.overdue}
            tone="danger"
            render={(task) => (
              <TaskLine
                key={task.id}
                task={task}
                showDeadline
                onComplete={() => void completeTask(task)}
              />
            )}
          />
          <Block
            title="Задачи на сегодня"
            items={snapshot.tasks.today}
            render={(task) => (
              <TaskLine
                key={task.id}
                task={task}
                onComplete={() => void completeTask(task)}
              />
            )}
          />
          <Block
            title="Проекты — подходит срок"
            items={snapshot.projects.urgent}
            render={(project) => <ProjectLine key={project.id} project={project} />}
          />
          <Block
            title="Пора продлевать"
            items={snapshot.credentials.expiring}
            note="Домены, хостинг и подписки со сроком в ближайшие две недели"
            render={(item) => <CredentialLine key={item.id} item={item} />}
          />
          <Block
            title="Счета не выставлены"
            items={snapshot.projects.unbilled}
            tone="danger"
            note="Помесячные проекты, по которым есть пропущенный месяц"
            render={(project) => <UnbilledLine key={project.id} project={project} />}
          />
        </div>
      )}
    </section>
  );
}

function Block<T>({
  title,
  items,
  render,
  tone = "neutral",
  note,
}: {
  title: string;
  items: T[];
  render: (item: T) => ReactNode;
  tone?: "neutral" | "danger";
  note?: string;
}) {
  if (items.length === 0) return null;

  return (
    <div>
      <div className="flex items-baseline gap-2">
        <h2 className={cn("text-sm font-semibold", tone === "danger" && "text-danger")}>
          {title}
        </h2>
        <span className="text-muted-foreground text-xs">{items.length}</span>
      </div>
      {note && <p className="text-muted-foreground mt-0.5 text-xs">{note}</p>}
      <ul className="divide-border mt-2 divide-y">{items.map(render)}</ul>
    </div>
  );
}

function LeadLine({ lead, showDeadline }: { lead: Lead; showDeadline?: boolean }) {
  const deadline =
    showDeadline && lead.nextActionAt ? describeDeadline(lead.nextActionAt) : null;

  return (
    <li className="flex items-start gap-3 py-2.5">
      <Link to="/leads" className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium">
          {lead.nextActionNote?.trim() || lead.name?.trim() || lead.contact}
        </span>
        <span className="text-muted-foreground mt-0.5 block truncate text-xs">
          {[lead.nextActionNote?.trim() ? lead.name?.trim() || lead.contact : null]
            .filter(Boolean)
            .join(" · ") || lead.contact}
        </span>
      </Link>
      {deadline && <Badge tone={deadline.tone}>{deadline.label}</Badge>}
    </li>
  );
}

function TaskLine({
  task,
  showDeadline,
  onComplete,
}: {
  task: Task;
  showDeadline?: boolean;
  onComplete: () => void;
}) {
  const deadline = showDeadline && task.dueAt ? describeDeadline(task.dueAt) : null;

  return (
    <li className="flex items-start gap-3 py-2.5">
      <button
        type="button"
        onClick={onComplete}
        aria-label="Отметить выполненной"
        className="border-border hover:border-accent mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md border transition"
      >
        <Check size={13} strokeWidth={3} className="opacity-0 hover:opacity-40" />
      </button>
      <Link to="/tasks" className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium">
          {task.priority === "high" && "❗ "}
          {task.title}
        </span>
        {task.project && (
          <span className="text-muted-foreground mt-0.5 block truncate text-xs">
            {task.project.title}
          </span>
        )}
      </Link>
      {deadline && <Badge tone={deadline.tone}>{deadline.label}</Badge>}
    </li>
  );
}

/**
 * Счёт, о котором забыли, — это не срок, а недополученные деньги, поэтому
 * справа стоит сумма, а не подпись к дате. Число месяцев важнее самого раннего
 * из них: один месяц — забывчивость, четыре — потерянные деньги.
 */
function UnbilledLine({ project }: { project: Project }) {
  return (
    <li className="flex items-start gap-3 py-2.5">
      <Link to="/money" className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium">{project.title}</span>
        <span className="text-muted-foreground mt-0.5 block truncate text-xs">
          {[project.client?.name, `с ${periodLabel(project.unbilledPeriod ?? "")}`]
            .filter(Boolean)
            .join(" · ")}
        </span>
      </Link>
      <Badge tone="danger">{`${project.unbilledCount} мес.`}</Badge>
      {project.monthlyAmount !== null && (
        <span className="text-sm font-medium">
          {money(project.monthlyAmount * project.unbilledCount)}
        </span>
      )}
    </li>
  );
}

/**
 * Продление показывается как обычный срок: истёкший домен так же ломает работу,
 * как просроченная задача, и выделять его отдельным видом строки незачем.
 */
function CredentialLine({ item }: { item: Credential }) {
  const deadline = item.renewsAt ? describeDeadline(item.renewsAt) : null;

  return (
    <li className="flex items-start gap-3 py-2.5">
      <Link to="/credentials" className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium">{item.service}</span>
        <span className="text-muted-foreground mt-0.5 block truncate text-xs">
          {[item.login, item.owner ?? "ни на кого не оформлен", item.secretHint]
            .filter(Boolean)
            .join(" · ")}
        </span>
      </Link>
      {item.amount != null && (
        <span className="shrink-0 text-sm font-medium">
          {fee(item.amount, item.monthlyFee)}
        </span>
      )}
      {deadline && <Badge tone={deadline.tone}>{deadline.label}</Badge>}
    </li>
  );
}

function ProjectLine({ project }: { project: Project }) {
  const deadline = project.deadline ? describeDeadline(project.deadline) : null;

  return (
    <li className="flex items-start gap-3 py-2.5">
      <Link to="/projects" className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium">{project.title}</span>
        <span className="text-muted-foreground mt-0.5 block truncate text-xs">
          {[
            project.client?.name,
            project.developers.length ? project.developers.join(", ") : "никто не ведёт",
            project.openTaskCount > 0 ? `открытых задач ${project.openTaskCount}` : null,
          ]
            .filter(Boolean)
            .join(" · ")}
        </span>
      </Link>
      {deadline && <Badge tone={deadline.tone}>{deadline.label}</Badge>}
    </li>
  );
}
