import {
  CLOSED_STATUSES,
  LEAD_CHANNELS,
  LEAD_STATUS_LABELS,
  LEAD_STATUSES,
  type Lead,
  type LeadInput,
  type LeadStatus,
} from "@/api/leads";
import { memberLabel, type TeamMember } from "@/api/team";
import { Field, Input, Select, Textarea } from "@/components/ui";
import { fromDateInputValue, toDateInputValue } from "@/lib/dates";
import { SERVICES } from "@/lib/services";

/**
 * Форма держит строки, а не готовый запрос: `<input>` умеет работать только со
 * строками, и попытка хранить здесь `Date | null` превращает каждый обработчик
 * в разбор пустого значения.
 */
export interface LeadFormValues {
  name: string;
  contact: string;
  message: string;
  channel: string;
  service: string;
  status: LeadStatus;
  ownerId: string;
  nextActionDate: string;
  nextActionNote: string;
  lostReason: string;
}

export function emptyLeadValues(defaultOwnerId = ""): LeadFormValues {
  return {
    name: "",
    contact: "",
    message: "",
    channel: "",
    service: "",
    status: "new",
    ownerId: defaultOwnerId,
    nextActionDate: "",
    nextActionNote: "",
    lostReason: "",
  };
}

export function leadToValues(lead: Lead): LeadFormValues {
  return {
    name: lead.name ?? "",
    contact: lead.contact,
    message: lead.message ?? "",
    channel: lead.channel ?? "",
    service: lead.service ?? "",
    status: lead.status,
    ownerId: lead.owner?.id ?? "",
    nextActionDate: toDateInputValue(lead.nextActionAt),
    nextActionNote: lead.nextActionNote ?? "",
    lostReason: lead.lostReason ?? "",
  };
}

/** Пустая строка из формы значит «не заполнено» — на сервер уходит null. */
export function valuesToInput(values: LeadFormValues): LeadInput {
  return {
    name: values.name.trim() || null,
    contact: values.contact.trim(),
    message: values.message.trim() || null,
    channel: values.channel || null,
    service: values.service || null,
    status: values.status,
    ownerId: values.ownerId || null,
    nextActionAt: fromDateInputValue(values.nextActionDate),
    nextActionNote: values.nextActionNote.trim() || null,
    lostReason: values.lostReason.trim() || null,
  };
}

export function LeadFields({
  values,
  onChange,
  team,
}: {
  values: LeadFormValues;
  onChange: (values: LeadFormValues) => void;
  team: TeamMember[];
}) {
  const set = <K extends keyof LeadFormValues>(key: K, value: LeadFormValues[K]) =>
    onChange({ ...values, [key]: value });

  const closed = CLOSED_STATUSES.includes(values.status);

  return (
    <div className="space-y-4">
      <Field label="Контакт" hint="Телефон, почта или ник — как с ним связаться">
        <Input
          value={values.contact}
          onChange={(event) => set("contact", event.target.value)}
          required
          placeholder="@ivanov или +7 999 123-45-67"
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Имя">
          <Input
            value={values.name}
            onChange={(event) => set("name", event.target.value)}
            placeholder="Необязательно"
          />
        </Field>

        <Field label="Откуда пришёл">
          <Select
            value={values.channel}
            onChange={(event) => set("channel", event.target.value)}
          >
            <option value="">Не указано</option>
            {LEAD_CHANNELS.map((channel) => (
              <option key={channel.value} value={channel.value}>
                {channel.label}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <Field label="Услуга" hint="Отвечает на вопрос, какие услуги приносят обращения">
        <Select
          value={values.service}
          onChange={(event) => set("service", event.target.value)}
        >
          <option value="">Не определились</option>
          {SERVICES.map((service) => (
            <option key={service.key} value={service.key}>
              {service.label}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Что нужно">
        <Textarea
          value={values.message}
          onChange={(event) => set("message", event.target.value)}
          rows={3}
          placeholder="Своими словами: что просит, какой бюджет, когда надо"
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Статус">
          <Select
            value={values.status}
            onChange={(event) => set("status", event.target.value as LeadStatus)}
          >
            {LEAD_STATUSES.map((status) => (
              <option key={status} value={status}>
                {LEAD_STATUS_LABELS[status]}
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

      {/* У закрытого лида следующего шага нет — сервер всё равно снимет дату,
          и показывать поле значит обещать то, чего не будет. */}
      {closed ? (
        values.status === "lost" && (
          <Field
            label="Почему отказ"
            hint="Через полгода это единственное, что вспомнится"
          >
            <Input
              value={values.lostReason}
              onChange={(event) => set("lostReason", event.target.value)}
              placeholder="Дорого / нашли других / пропал"
            />
          </Field>
        )
      ) : (
        <div className="grid gap-4 sm:grid-cols-[9rem_1fr]">
          <Field label="Следующий шаг" hint="Пусто — напоминания не будет">
            <Input
              type="date"
              value={values.nextActionDate}
              onChange={(event) => set("nextActionDate", event.target.value)}
            />
          </Field>

          {/* Без описания напоминание сообщает только срок, и всё равно
              приходится открывать карточку, чтобы вспомнить, о чём речь. */}
          <Field label="Что сделать" hint="Попадёт в напоминание вместе с датой">
            <Input
              value={values.nextActionNote}
              onChange={(event) => set("nextActionNote", event.target.value)}
              maxLength={200}
              placeholder="Позвонить · отправить смету · напомнить про счёт"
            />
          </Field>
        </div>
      )}
    </div>
  );
}
