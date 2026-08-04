import type { Client } from "@/api/clients";
import {
  PROJECT_STATUSES,
  PROJECT_STATUS_LABELS,
  type Project,
  type ProjectInput,
  type ProjectStatus,
} from "@/api/projects";
import { memberLabel, type TeamMember } from "@/api/team";
import { Field, Input, Select, Textarea } from "@/components/ui";
import { fromDateInputValue, toDateInputValue } from "@/lib/dates";

export interface ProjectFormValues {
  title: string;
  description: string;
  status: ProjectStatus;
  clientId: string;
  ownerId: string;
  startedDate: string;
  deadlineDate: string;
}

export function emptyProjectValues(defaults: { ownerId?: string }): ProjectFormValues {
  return {
    title: "",
    description: "",
    status: "planned",
    clientId: "",
    ownerId: defaults.ownerId ?? "",
    startedDate: "",
    deadlineDate: "",
  };
}

export function projectToValues(project: Project): ProjectFormValues {
  return {
    title: project.title,
    description: project.description ?? "",
    status: project.status,
    clientId: project.client?.id ?? "",
    ownerId: project.owner?.id ?? "",
    startedDate: toDateInputValue(project.startedAt),
    deadlineDate: toDateInputValue(project.deadline),
  };
}

export function valuesToProjectInput(values: ProjectFormValues): ProjectInput {
  return {
    title: values.title.trim(),
    description: values.description.trim() || null,
    status: values.status,
    clientId: values.clientId || null,
    ownerId: values.ownerId || null,
    startedAt: fromDateInputValue(values.startedDate),
    deadline: fromDateInputValue(values.deadlineDate),
  };
}

export function ProjectFields({
  values,
  onChange,
  team,
  clients,
}: {
  values: ProjectFormValues;
  onChange: (values: ProjectFormValues) => void;
  team: TeamMember[];
  clients: Client[];
}) {
  function set<K extends keyof ProjectFormValues>(key: K, value: ProjectFormValues[K]) {
    onChange({ ...values, [key]: value });
  }

  return (
    <div className="space-y-4">
      <Field label="Название">
        <Input
          value={values.title}
          onChange={(event) => set("title", event.target.value)}
          required
          autoFocus
          maxLength={200}
          placeholder="Корпоративный сайт · Интеграция с 1С"
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Статус">
          <Select
            value={values.status}
            onChange={(event) => set("status", event.target.value as ProjectStatus)}
          >
            {PROJECT_STATUSES.map((status) => (
              <option key={status} value={status}>
                {PROJECT_STATUS_LABELS[status]}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Кто ведёт">
          <Select
            value={values.ownerId}
            onChange={(event) => set("ownerId", event.target.value)}
          >
            <option value="">Никто</option>
            {team.map((member) => (
              <option key={member.id} value={member.id}>
                {memberLabel(member)}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <Field label="Клиент" hint="Можно оставить пустым — например, для своих проектов">
        <Select
          value={values.clientId}
          onChange={(event) => set("clientId", event.target.value)}
        >
          <option value="">Без клиента</option>
          {clients.map((client) => (
            <option key={client.id} value={client.id}>
              {client.name}
            </option>
          ))}
        </Select>
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Начали">
          <Input
            type="date"
            value={values.startedDate}
            onChange={(event) => set("startedDate", event.target.value)}
          />
        </Field>

        <Field label="Сдать до" hint="По нему проект попадает в «Просрочено»">
          <Input
            type="date"
            value={values.deadlineDate}
            onChange={(event) => set("deadlineDate", event.target.value)}
          />
        </Field>
      </div>

      <Field label="О чём проект">
        <Textarea
          value={values.description}
          onChange={(event) => set("description", event.target.value)}
          rows={3}
        />
      </Field>
    </div>
  );
}
