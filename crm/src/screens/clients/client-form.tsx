import { Plus, X } from "lucide-react";
import {
  CONTACT_TYPES,
  type Client,
  type ClientContact,
  type ClientInput,
} from "@/api/clients";
import { Field, Input, Select, Textarea } from "@/components/ui";

export interface ClientFormValues {
  name: string;
  inn: string;
  site: string;
  contacts: ClientContact[];
  notes: string;
}

export function emptyClientValues(): ClientFormValues {
  return { name: "", inn: "", site: "", contacts: [], notes: "" };
}

export function clientToValues(client: Client): ClientFormValues {
  return {
    name: client.name,
    inn: client.inn ?? "",
    site: client.site ?? "",
    contacts: client.contacts.map((contact) => ({ ...contact })),
    notes: client.notes ?? "",
  };
}

export function valuesToClientInput(values: ClientFormValues): ClientInput {
  return {
    name: values.name.trim(),
    inn: values.inn.trim() || null,
    site: values.site.trim() || null,
    // Пустые строки отсеиваем здесь: сервер их отвергнет, а человек не поймёт,
    // какая именно из пяти строк контакта пустая.
    contacts: values.contacts.filter((contact) => contact.value.trim() !== ""),
    notes: values.notes.trim() || null,
  };
}

export function ClientFields({
  values,
  onChange,
}: {
  values: ClientFormValues;
  onChange: (values: ClientFormValues) => void;
}) {
  function set<K extends keyof ClientFormValues>(key: K, value: ClientFormValues[K]) {
    onChange({ ...values, [key]: value });
  }

  function setContact(index: number, patch: Partial<ClientContact>) {
    set(
      "contacts",
      values.contacts.map((contact, current) =>
        current === index ? { ...contact, ...patch } : contact,
      ),
    );
  }

  return (
    <div className="space-y-4">
      <Field label="Название">
        <Input
          value={values.name}
          onChange={(event) => set("name", event.target.value)}
          required
          autoFocus
          maxLength={200}
          placeholder="ООО «Ромашка» · Иван Петров"
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="ИНН" hint="По нему клиент опознаётся в документах">
          <Input
            value={values.inn}
            onChange={(event) => set("inn", event.target.value)}
            maxLength={20}
            inputMode="numeric"
          />
        </Field>

        <Field label="Сайт">
          <Input
            value={values.site}
            onChange={(event) => set("site", event.target.value)}
            maxLength={200}
            placeholder="example.ru"
          />
        </Field>
      </div>

      <div>
        <span className="mb-1.5 block text-sm font-medium">Контакты</span>
        <div className="space-y-2">
          {values.contacts.map((contact, index) => (
            <div key={index} className="flex items-center gap-2">
              <Select
                value={contact.type}
                onChange={(event) => setContact(index, { type: event.target.value })}
                className="w-32 shrink-0"
              >
                {CONTACT_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </Select>
              <Input
                value={contact.value}
                onChange={(event) => setContact(index, { value: event.target.value })}
                maxLength={200}
                placeholder="+7 999 000-00-00"
              />
              <button
                type="button"
                onClick={() =>
                  set(
                    "contacts",
                    values.contacts.filter((_, current) => current !== index),
                  )
                }
                aria-label="Убрать контакт"
                className="text-muted-foreground hover:bg-muted hover:text-foreground shrink-0 rounded-lg p-2 transition"
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() =>
            set("contacts", [...values.contacts, { type: "phone", value: "" }])
          }
          className="text-muted-foreground hover:text-foreground mt-2 inline-flex items-center gap-1.5 text-sm font-medium transition"
        >
          <Plus size={15} strokeWidth={2.5} />
          Добавить контакт
        </button>
      </div>

      <Field label="Заметки">
        <Textarea
          value={values.notes}
          onChange={(event) => set("notes", event.target.value)}
          rows={3}
          placeholder="Как платят, кто принимает решения, чего не любят"
        />
      </Field>
    </div>
  );
}
