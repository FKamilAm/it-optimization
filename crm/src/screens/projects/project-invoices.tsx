import { Plus, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { ApiError } from "@/api/client";
import {
  createInvoice,
  deleteInvoice,
  INVOICE_KIND_LABELS,
  listInvoices,
  updateInvoice,
  type Invoice,
  type InvoiceKind,
} from "@/api/projects";
import { Badge, Button, ErrorNote, Input, Select } from "@/components/ui";
import { cn } from "@/lib/cn";
import { CurrencySelect } from "@/components/currency-select";
import { periodLabel } from "@/lib/dates";
import { money, parseAmount, sanitizeAmount, type Currency } from "@/lib/money";

/**
 * Счета и акты по проекту.
 *
 * CRM документы не выставляет — она помнит, за какой месяц что выставлено и
 * оплачено. Болит не рисование счёта, а «за апрель забыли», и закрывает это
 * список периодов плюс напоминание бота в общем чате.
 */

/** Текущий месяц как ГГГГ-ММ — им заполняется поле по умолчанию. */
function thisPeriod(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function formatAmount(minor: number | null, currency: Currency): string {
  return minor === null ? "" : money(minor, currency);
}

export function ProjectInvoices({
  projectId,
  defaultCurrency,
}: {
  projectId: string;
  /** Валюта проекта: счёт почти всегда в ней же, но поменять можно. */
  defaultCurrency: Currency;
}) {
  const [items, setItems] = useState<Invoice[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [kind, setKind] = useState<InvoiceKind>("invoice");
  const [period, setPeriod] = useState(thisPeriod());
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState<Currency>(defaultCurrency);
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    setError(null);
    listInvoices(projectId)
      .then(setItems)
      .catch((cause: unknown) => {
        setError(cause instanceof ApiError ? cause.message : "Не удалось загрузить");
        setItems([]);
      });
  }, [projectId]);

  useEffect(load, [load]);

  async function add() {
    setError(null);
    setSaving(true);
    try {
      await createInvoice(projectId, {
        kind,
        period,
        amountMinor: parseAmount(amount),
        currency,
        // Заводят запись обычно в день выставления — ставим сегодня, чтобы не
        // заполнять ещё одно поле.
        issuedAt: new Date().toISOString(),
      });
      setAmount("");
      setAdding(false);
      load();
    } catch (cause) {
      // Повтор за тот же период сервер отклоняет с внятным текстом — показываем
      // его как есть.
      setError(cause instanceof ApiError ? cause.message : "Не удалось сохранить");
    } finally {
      setSaving(false);
    }
  }

  async function togglePaid(invoice: Invoice) {
    try {
      await updateInvoice(projectId, invoice.id, {
        paidAt: invoice.paidAt ? null : new Date().toISOString(),
      });
      load();
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "Не удалось сохранить");
    }
  }

  async function remove(invoice: Invoice) {
    if (!confirm(`Удалить ${INVOICE_KIND_LABELS[invoice.kind].toLowerCase()}?`)) return;
    try {
      await deleteInvoice(projectId, invoice.id);
      load();
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "Не удалось удалить");
    }
  }

  return (
    <div className="border-border border-t pt-4">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium">Счета и акты</span>
        <Button type="button" variant="ghost" onClick={() => setAdding((it) => !it)}>
          <Plus size={15} strokeWidth={2.5} />
          Добавить
        </Button>
      </div>

      {adding && (
        <div className="bg-muted/50 mt-3 flex flex-wrap items-end gap-2 rounded-lg p-2.5">
          <Select
            value={kind}
            onChange={(event) => setKind(event.target.value as InvoiceKind)}
            className="w-28"
          >
            <option value="invoice">Счёт</option>
            <option value="act">Акт</option>
          </Select>
          <Input
            type="month"
            value={period}
            onChange={(event) => setPeriod(event.target.value)}
            className="w-40"
          />
          <Input
            value={amount}
            onChange={(event) => setAmount(sanitizeAmount(event.target.value))}
            inputMode="numeric"
            placeholder="Сумма"
            className="w-32"
          />
          <CurrencySelect value={currency} onChange={setCurrency} />
          {/* type="button": форма проекта снаружи, и submit сохранил бы её. */}
          <Button type="button" onClick={() => void add()} disabled={saving}>
            {saving ? "…" : "Готово"}
          </Button>
        </div>
      )}

      {error && (
        <div className="mt-3">
          <ErrorNote>{error}</ErrorNote>
        </div>
      )}

      <div className="mt-3">
        {items === null ? (
          <p className="text-muted-foreground text-sm">Загружаем…</p>
        ) : items.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            Пока ничего. Отметьте выставленный счёт — и бот перестанет напоминать про этот
            месяц.
          </p>
        ) : (
          <ul className="divide-border divide-y">
            {items.map((invoice) => (
              <li key={invoice.id} className="flex items-center gap-3 py-2">
                <button
                  type="button"
                  onClick={() => void togglePaid(invoice)}
                  className="min-w-0 flex-1 text-left"
                  title={
                    invoice.paidAt ? "Снять отметку об оплате" : "Отметить оплаченным"
                  }
                >
                  <span className="block text-sm">
                    <span
                      className={cn(
                        "font-medium",
                        invoice.kind === "act" && "text-muted-foreground",
                      )}
                    >
                      {INVOICE_KIND_LABELS[invoice.kind]}
                    </span>{" "}
                    за {periodLabel(invoice.period)}
                    {invoice.amountMinor !== null &&
                      ` — ${formatAmount(invoice.amountMinor, invoice.currency)}`}
                  </span>
                </button>

                <Badge tone={invoice.paidAt ? "success" : "warning"}>
                  {invoice.paidAt ? "оплачен" : "не оплачен"}
                </Badge>

                <button
                  type="button"
                  onClick={() => void remove(invoice)}
                  aria-label="Удалить"
                  className="text-muted-foreground hover:bg-muted hover:text-danger shrink-0 rounded-lg p-1.5 transition"
                >
                  <X size={15} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
