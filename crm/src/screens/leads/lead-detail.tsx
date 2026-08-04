import { useEffect, useState, type FormEvent } from "react";
import { ApiError } from "@/api/client";
import {
  addNote,
  deleteLead,
  getLead,
  updateLead,
  type Lead,
  type Note,
} from "@/api/leads";
import { memberLabel, type TeamMember } from "@/api/team";
import { Button, ErrorNote, Modal, Textarea } from "@/components/ui";
import { formatDateTime } from "@/lib/dates";
import {
  LeadFields,
  leadToValues,
  valuesToInput,
  type LeadFormValues,
} from "./lead-form";

export function LeadDetail({
  leadId,
  team,
  onClose,
  onChanged,
}: {
  leadId: string;
  team: TeamMember[];
  onClose: () => void;
  /** Список наверху перезагружается сам: правка меняет и порядок, и фильтры. */
  onChanged: () => void;
}) {
  const [lead, setLead] = useState<Lead | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [values, setValues] = useState<LeadFormValues | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [noteDraft, setNoteDraft] = useState("");

  useEffect(() => {
    let cancelled = false;
    getLead(leadId)
      .then((data) => {
        if (cancelled) return;
        setLead(data.lead);
        setNotes(data.notes);
        setValues(leadToValues(data.lead));
      })
      .catch((cause: unknown) => {
        if (!cancelled) setError(describe(cause));
      });
    return () => {
      cancelled = true;
    };
  }, [leadId]);

  async function handleSave(event: FormEvent) {
    event.preventDefault();
    if (!values) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await updateLead(leadId, valuesToInput(values));
      setLead(updated);
      setValues(leadToValues(updated));
      onChanged();
    } catch (cause) {
      setError(describe(cause));
    } finally {
      setSaving(false);
    }
  }

  async function handleAddNote() {
    const body = noteDraft.trim();
    if (!body) return;
    setError(null);
    try {
      const note = await addNote(leadId, body);
      setNotes((current) => [...current, note]);
      setNoteDraft("");
    } catch (cause) {
      setError(describe(cause));
    }
  }

  async function handleDelete() {
    if (!window.confirm("Удалить лид? Заметки к нему тоже исчезнут.")) return;
    setError(null);
    try {
      await deleteLead(leadId);
      onChanged();
      onClose();
    } catch (cause) {
      setError(describe(cause));
    }
  }

  return (
    <Modal title={lead?.name ?? lead?.contact ?? "Лид"} onClose={onClose}>
      {!values && !error && <p className="text-muted-foreground text-sm">Загружаем…</p>}
      {error && <ErrorNote>{error}</ErrorNote>}

      {values && (
        <>
          <form onSubmit={handleSave}>
            <LeadFields values={values} onChange={setValues} team={team} />

            <div className="mt-5 flex items-center gap-2">
              <Button type="submit" disabled={saving}>
                {saving ? "Сохраняем…" : "Сохранить"}
              </Button>
              <Button type="button" variant="danger" onClick={() => void handleDelete()}>
                Удалить
              </Button>
            </div>
          </form>

          <section className="border-border mt-7 border-t pt-5">
            <h3 className="text-sm font-semibold">Заметки</h3>

            {notes.length > 0 && (
              <ul className="mt-3 space-y-3">
                {notes.map((note) => (
                  <li key={note.id} className="text-sm">
                    <p className="whitespace-pre-wrap">{note.body}</p>
                    <p className="text-muted-foreground mt-0.5 text-xs">
                      {memberLabel(note.author) || "Кто-то"} ·{" "}
                      {formatDateTime(note.createdAt)}
                    </p>
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-3">
              <Textarea
                value={noteDraft}
                onChange={(event) => setNoteDraft(event.target.value)}
                rows={2}
                placeholder="Позвонил, попросил счёт до пятницы"
              />
              <Button
                type="button"
                variant="ghost"
                className="mt-2 px-0"
                disabled={!noteDraft.trim()}
                onClick={() => void handleAddNote()}
              >
                Добавить заметку
              </Button>
            </div>
          </section>

          {lead && (
            <p className="text-muted-foreground mt-5 text-xs">
              Создан {formatDateTime(lead.createdAt)}
              {lead.owner && ` · ведёт ${memberLabel(lead.owner)}`}
            </p>
          )}
        </>
      )}
    </Modal>
  );
}

function describe(cause: unknown): string {
  return cause instanceof ApiError ? cause.message : "Что-то пошло не так";
}
