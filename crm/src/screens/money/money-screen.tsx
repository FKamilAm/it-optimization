import { Wallet } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { ApiError } from "@/api/client";
import { listAllInvoices, type InvoiceWithProject, type Project } from "@/api/projects";
import { getToday } from "@/api/today";
import { Badge, EmptyState, ErrorNote } from "@/components/ui";
import { periodLabel } from "@/lib/dates";
import { money } from "@/lib/money";
import { Link } from "react-router";

/**
 * Деньги: что не выставлено и что не оплачено.
 *
 * Раньше на это отвечал только обход проектов по одному — то есть не отвечал.
 * Два блока намеренно разделены: невыставленный счёт зависит от нас, а
 * неоплаченный — от клиента, и делать с ними надо разное.
 */

export function MoneyScreen() {
  const [unpaid, setUnpaid] = useState<InvoiceWithProject[] | null>(null);
  const [total, setTotal] = useState(0);
  const [unbilled, setUnbilled] = useState<Project[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setError(null);
    listAllInvoices("unpaid")
      .then((result) => {
        setUnpaid(result.invoices);
        setTotal(result.total);
      })
      .catch((cause: unknown) => {
        setError(cause instanceof ApiError ? cause.message : "Не удалось загрузить");
        setUnpaid([]);
      });

    // Невыставленное считает сервер и отдаёт в сводке — второй источник тех же
    // данных разошёлся бы с первым.
    getToday()
      .then((snapshot) => setUnbilled(snapshot.projects.unbilled))
      .catch(() => setUnbilled([]));
  }, []);

  useEffect(load, [load]);

  // Ожидаемая сумма невыставленного: месяцы без счёта, умноженные на месячную.
  const expected = unbilled.reduce(
    (sum, project) => sum + (project.monthlyAmount ?? 0) * project.unbilledCount,
    0,
  );

  return (
    <section>
      <header>
        <h1 className="text-xl font-bold tracking-tight">Деньги</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Что не выставили мы и чего не заплатили нам.
        </p>
      </header>

      {error && (
        <div className="mt-4">
          <ErrorNote>{error}</ErrorNote>
        </div>
      )}

      <div className="mt-6 space-y-8">
        <div>
          <div className="flex items-baseline gap-2">
            <h2 className="text-danger text-sm font-semibold">Не выставлено</h2>
            <span className="text-muted-foreground text-xs">{unbilled.length}</span>
            {expected > 0 && (
              <span className="text-muted-foreground ml-auto text-sm">
                примерно {money(expected)}
              </span>
            )}
          </div>

          {unbilled.length === 0 ? (
            <p className="text-muted-foreground mt-2 text-sm">
              Все помесячные проекты выставлены.
            </p>
          ) : (
            <ul className="mt-2 space-y-2">
              {unbilled.map((project) => (
                <li
                  key={project.id}
                  className="border-border bg-danger-soft flex items-center gap-3 rounded-xl border px-3 py-2.5"
                >
                  <Link to="/projects" className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">
                      {project.title}
                    </span>
                    <span className="text-muted-foreground mt-0.5 block truncate text-xs">
                      {[
                        project.client?.name,
                        `с ${periodLabel(project.unbilledPeriod ?? "")}`,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                  </Link>
                  <Badge tone="danger">
                    {project.unbilledCount > 1
                      ? `${project.unbilledCount} мес.`
                      : "1 мес."}
                  </Badge>
                  {project.monthlyAmount !== null && (
                    <span className="text-sm font-medium">
                      {money(project.monthlyAmount * project.unbilledCount)}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <div className="flex items-baseline gap-2">
            <h2 className="text-warning text-sm font-semibold">Не оплачено</h2>
            <span className="text-muted-foreground text-xs">{unpaid?.length ?? 0}</span>
            {total > 0 && (
              <span className="ml-auto flex items-center gap-1.5 text-sm font-medium">
                <Wallet size={14} strokeWidth={2.5} />
                {money(total)}
              </span>
            )}
          </div>

          {unpaid === null ? (
            <p className="text-muted-foreground mt-2 text-sm">Загружаем…</p>
          ) : unpaid.length === 0 ? (
            <div className="mt-2">
              <EmptyState title="Долгов нет" note="Все выставленные счета оплачены." />
            </div>
          ) : (
            <ul className="mt-2 space-y-2">
              {unpaid.map((invoice) => (
                <li
                  key={invoice.id}
                  className="border-border bg-background flex items-center gap-3 rounded-xl border px-3 py-2.5"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">
                      {invoice.project.title}
                    </span>
                    <span className="text-muted-foreground mt-0.5 block truncate text-xs">
                      {[invoice.project.client, periodLabel(invoice.period)]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                  </span>
                  {invoice.amount !== null && (
                    <span className="text-sm font-medium">{money(invoice.amount)}</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
