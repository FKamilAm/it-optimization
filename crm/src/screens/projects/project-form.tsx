import type { Client } from "@/api/clients";
import {
  PROJECT_STATUSES,
  PROJECT_STATUS_LABELS,
  WORK_TYPES,
  type Project,
  type ProjectInput,
  type ProjectStatus,
} from "@/api/projects";
import { DeveloperPicker } from "@/components/developer-picker";
import { Field, Input, Select, Textarea } from "@/components/ui";
import { fromDateInputValue, toDateInputValue } from "@/lib/dates";

export interface ProjectFormValues {
  title: string;
  description: string;
  status: ProjectStatus;
  clientId: string;
  developers: string[];
  startedDate: string;
  deadlineDate: string;

  hosting: string;
  workType: string;
  contractNumber: string;
  contractDate: string;
  actDate: string;
  billingMonthly: boolean;
  /** Строкой, а не числом: пустое поле ввода — это "", а не 0. */
  monthlyAmount: string;
}

export function emptyProjectValues(): ProjectFormValues {
  return {
    title: "",
    description: "",
    status: "planned",
    clientId: "",
    developers: [],
    startedDate: "",
    deadlineDate: "",
    hosting: "",
    workType: "",
    contractNumber: "",
    contractDate: "",
    actDate: "",
    billingMonthly: false,
    monthlyAmount: "",
  };
}

export function projectToValues(project: Project): ProjectFormValues {
  return {
    title: project.title,
    description: project.description ?? "",
    status: project.status,
    clientId: project.client?.id ?? "",
    developers: project.developers,
    startedDate: toDateInputValue(project.startedAt),
    deadlineDate: toDateInputValue(project.deadline),
    hosting: project.hosting ?? "",
    workType: project.workType ?? "",
    contractNumber: project.contractNumber ?? "",
    contractDate: toDateInputValue(project.contractDate),
    actDate: toDateInputValue(project.actDate),
    billingMonthly: project.billingMonthly,
    monthlyAmount: project.monthlyAmount === null ? "" : String(project.monthlyAmount),
  };
}

export function valuesToProjectInput(values: ProjectFormValues): ProjectInput {
  return {
    title: values.title.trim(),
    description: values.description.trim() || null,
    status: values.status,
    clientId: values.clientId || null,
    developers: values.developers,
    startedAt: fromDateInputValue(values.startedDate),
    deadline: fromDateInputValue(values.deadlineDate),
    hosting: values.hosting.trim() || null,
    workType: values.workType || null,
    contractNumber: values.contractNumber.trim() || null,
    contractDate: fromDateInputValue(values.contractDate),
    actDate: fromDateInputValue(values.actDate),
    billingMonthly: values.billingMonthly,
    // Пустое поле — это «не задано», а не ноль рублей.
    monthlyAmount: values.monthlyAmount.trim() ? Number(values.monthlyAmount) : null,
  };
}

export function ProjectFields({
  values,
  onChange,
  clients,
}: {
  values: ProjectFormValues;
  onChange: (values: ProjectFormValues) => void;
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

        <Field label="Клиент" hint="Можно оставить пустым — например, для своих">
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
      </div>

      <DeveloperPicker
        value={values.developers}
        onChange={(next) => set("developers", next)}
        hint="Попадёт в утреннюю сводку в общий чат"
      />

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

      <div className="border-border space-y-4 border-t pt-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Хостинг" hint="Где размещён и на чьём аккаунте">
            <Input
              value={values.hosting}
              onChange={(event) => set("hosting", event.target.value)}
              maxLength={200}
              placeholder="reg.ru, аккаунт клиента"
            />
          </Field>

          <Field label="Вид работы">
            <Select
              value={values.workType}
              onChange={(event) => set("workType", event.target.value)}
            >
              <option value="">Не указан</option>
              {WORK_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Договор №">
            <Input
              value={values.contractNumber}
              onChange={(event) => set("contractNumber", event.target.value)}
              maxLength={60}
              placeholder="12/2026"
            />
          </Field>

          <Field label="Дата договора">
            <Input
              type="date"
              value={values.contractDate}
              onChange={(event) => set("contractDate", event.target.value)}
            />
          </Field>

          <Field label="Дата акта">
            <Input
              type="date"
              value={values.actDate}
              onChange={(event) => set("actDate", event.target.value)}
            />
          </Field>
        </div>

        <label className="flex cursor-pointer items-start gap-2.5">
          <input
            type="checkbox"
            checked={values.billingMonthly}
            onChange={(event) => set("billingMonthly", event.target.checked)}
            className="accent-accent mt-0.5 size-4 shrink-0"
          />
          <span className="text-sm">
            Счёт каждый месяц
            <span className="text-muted-foreground mt-0.5 block text-sm">
              Бот напомнит в общем чате, если за текущий месяц счёта ещё нет
            </span>
          </span>
        </label>

        {values.billingMonthly && (
          <Field label="Сумма в месяц" hint="Рубли, целыми. Можно оставить пустым">
            <Input
              value={values.monthlyAmount}
              onChange={(event) =>
                set("monthlyAmount", event.target.value.replace(/[^\d]/g, ""))
              }
              inputMode="numeric"
              placeholder="45000"
            />
          </Field>
        )}
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
