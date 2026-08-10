import { useCallback, useEffect, useState } from "react";
import { ApiError } from "@/api/client";
import type { Note } from "@/api/leads";
import { Button, ErrorNote, Textarea } from "@/components/ui";
import { formatDateTime } from "@/lib/dates";

/**
 * Заметки к записи — одинаково у лида, проекта, задачи и клиента.
 *
 * Хранятся одной полиморфной таблицей на сервере, поэтому и здесь один
 * компонент: четыре копии этой формы разошлись бы поведением на второй правке.
 * Загрузка и отправка приходят снаружи — компонент не знает, к чему привязан.
 */
export function NotesPanel({
  load,
  add,
  hint,
}: {
  load: () => Promise<Note[]>;
  add: (body: string) => Promise<Note>;
  hint?: string;
}) {
  const [notes, setNotes] = useState<Note[] | null>(null);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const refresh = useCallback(() => {
    setError(null);
    load()
      .then(setNotes)
      .catch((cause: unknown) => {
        setError(cause instanceof ApiError ? cause.message : "Не удалось загрузить");
        setNotes([]);
      });
  }, [load]);

  useEffect(refresh, [refresh]);

  async function submit() {
    const body = draft.trim();
    if (!body) return;

    setSaving(true);
    setError(null);
    try {
      const note = await add(body);
      // Дописываем в конец, не перезагружая список: хронология сверху вниз, и
      // ответ сервера уже содержит автора и время.
      setNotes((current) => [...(current ?? []), note]);
      setDraft("");
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "Не удалось сохранить");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="border-border border-t pt-4">
      <span className="text-sm font-medium">Заметки</span>

      {notes === null ? (
        <p className="text-muted-foreground mt-2 text-sm">Загружаем…</p>
      ) : notes.length === 0 ? (
        <p className="text-muted-foreground mt-2 text-sm">
          {hint ?? "Пока пусто. Здесь удобно держать то, что не влезает в поля."}
        </p>
      ) : (
        <ul className="mt-2 space-y-2">
          {notes.map((note) => (
            <li key={note.id} className="bg-muted/50 rounded-lg px-3 py-2">
              <p className="text-sm whitespace-pre-wrap">{note.body}</p>
              <p className="text-muted-foreground mt-1 text-xs">
                {note.author?.name ?? note.author?.email ?? "—"} ·{" "}
                {formatDateTime(note.createdAt)}
              </p>
            </li>
          ))}
        </ul>
      )}

      {error && (
        <div className="mt-3">
          <ErrorNote>{error}</ErrorNote>
        </div>
      )}

      <div className="mt-3 space-y-2">
        <Textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          rows={2}
          placeholder="Что обсудили, о чём договорились"
        />
        {/* type="button": форма записи снаружи, и submit сохранил бы её целиком. */}
        <Button
          type="button"
          onClick={() => void submit()}
          disabled={saving || !draft.trim()}
        >
          {saving ? "Сохраняем…" : "Добавить"}
        </Button>
      </div>
    </div>
  );
}
