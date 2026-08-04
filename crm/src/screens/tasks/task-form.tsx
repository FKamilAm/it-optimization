import type { Project } from "@/api/projects";
import {
  TASK_PRIORITIES,
  TASK_PRIORITY_LABELS,
  TASK_STATUSES,
  TASK_STATUS_LABELS,
  type Task,
  type TaskInput,
  type TaskPriority,
  type TaskStatus,
} from "@/api/tasks";
import { memberLabel, type TeamMember } from "@/api/team";
import { Field, Input, Select, Textarea } from "@/components/ui";
import { fromDateInputValue, toDateInputValue } from "@/lib/dates";

export interface TaskFormValues {
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  projectId: string;
  assigneeId: string;
  dueDate: string;
}

export function emptyTaskValues(defaults: {
  assigneeId?: string;
  projectId?: string;
}): TaskFormValues {
  return {
    title: "",
    description: "",
    status: "todo",
    priority: "normal",
    projectId: defaults.projectId ?? "",
    // По умолчанию задача на себя: чаще всего заводят себе, а «ничья» задача
    // не попадёт ни в чей утренний список.
    assigneeId: defaults.assigneeId ?? "",
    dueDate: "",
  };
}

export function taskToValues(task: Task): TaskFormValues {
  return {
    title: task.title,
    description: task.description ?? "",
    status: task.status,
    priority: task.priority,
    projectId: task.project?.id ?? "",
    assigneeId: task.assignee?.id ?? "",
    dueDate: toDateInputValue(task.dueAt),
  };
}

export function valuesToTaskInput(values: TaskFormValues): TaskInput {
  return {
    title: values.title.trim(),
    description: values.description.trim() || null,
    status: values.status,
    priority: values.priority,
    projectId: values.projectId || null,
    assigneeId: values.assigneeId || null,
    dueAt: fromDateInputValue(values.dueDate),
  };
}

export function TaskFields({
  values,
  onChange,
  team,
  projects,
}: {
  values: TaskFormValues;
  onChange: (values: TaskFormValues) => void;
  team: TeamMember[];
  projects: Project[];
}) {
  function set<K extends keyof TaskFormValues>(key: K, value: TaskFormValues[K]) {
    onChange({ ...values, [key]: value });
  }

  return (
    <div className="space-y-4">
      <Field label="Что сделать">
        <Input
          value={values.title}
          onChange={(event) => set("title", event.target.value)}
          required
          autoFocus
          maxLength={300}
          placeholder="Сверстать главную · выставить счёт · продлить домен"
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Статус">
          <Select
            value={values.status}
            onChange={(event) => set("status", event.target.value as TaskStatus)}
          >
            {TASK_STATUSES.map((status) => (
              <option key={status} value={status}>
                {TASK_STATUS_LABELS[status]}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Важность">
          <Select
            value={values.priority}
            onChange={(event) => set("priority", event.target.value as TaskPriority)}
          >
            {TASK_PRIORITIES.map((priority) => (
              <option key={priority} value={priority}>
                {TASK_PRIORITY_LABELS[priority]}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Исполнитель" hint="Пусто — задача не попадёт ни в чей список">
          <Select
            value={values.assigneeId}
            onChange={(event) => set("assigneeId", event.target.value)}
          >
            <option value="">Никто</option>
            {team.map((member) => (
              <option key={member.id} value={member.id}>
                {memberLabel(member)}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Срок" hint="Пусто — напоминания не будет">
          <Input
            type="date"
            value={values.dueDate}
            onChange={(event) => set("dueDate", event.target.value)}
          />
        </Field>
      </div>

      <Field label="Проект" hint="Не всякая задача относится к проекту — это нормально">
        <Select
          value={values.projectId}
          onChange={(event) => set("projectId", event.target.value)}
        >
          <option value="">Без проекта</option>
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.title}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Подробности">
        <Textarea
          value={values.description}
          onChange={(event) => set("description", event.target.value)}
          rows={3}
        />
      </Field>
    </div>
  );
}
