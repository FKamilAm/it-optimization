import type { Invoice } from "@prisma/client";
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { audit } from "../../audit.js";
import { requireTeam } from "../../auth/guard.js";
import { prisma } from "../../db.js";
import { invalidInput } from "../http.js";
import { invoiceBody } from "./dto.js";

/**
 * Счета и акты по проекту.
 *
 * CRM не выставляет документы — она помнит, за какой месяц что выставлено и
 * оплачено. Болит не рисование счёта, а «за апрель забыли», и закрывает это
 * список периодов плюс напоминание в утренней сводке.
 */

const projectParams = z.object({ id: z.string().uuid() });
const invoiceParams = z.object({ id: z.string().uuid(), invoiceId: z.string().uuid() });

export interface InvoiceDto {
  id: string;
  kind: "invoice" | "act";
  period: string;
  amount: number | null;
  issuedAt: string | null;
  paidAt: string | null;
  note: string | null;
}

export function toInvoiceDto(item: Invoice): InvoiceDto {
  return {
    id: item.id,
    kind: item.kind,
    period: item.period,
    amount: item.amount,
    issuedAt: item.issuedAt?.toISOString() ?? null,
    paidAt: item.paidAt?.toISOString() ?? null,
    note: item.note,
  };
}

async function projectExists(id: string): Promise<boolean> {
  return (await prisma.project.count({ where: { id, deletedAt: null } })) > 0;
}

const listQuery = z.object({
  /** unpaid — выставленные и неоплаченные; all — все подряд. */
  scope: z.enum(["unpaid", "all"]).default("unpaid"),
});

export async function invoiceRoutes(app: FastifyInstance): Promise<void> {
  /**
   * Все счета разом, поверх проектов.
   *
   * Без этого «кто нам должен» отвечается только обходом каждого проекта по
   * очереди — то есть не отвечается вовсе. Здесь же общая сумма долга.
   */
  app.get("/invoices", { preHandler: requireTeam }, async (request, reply) => {
    const query = listQuery.safeParse(request.query);
    if (!query.success) return invalidInput(reply, query.error);

    const invoices = await prisma.invoice.findMany({
      where: {
        kind: "invoice",
        project: { deletedAt: null },
        ...(query.data.scope === "unpaid" ? { paidAt: null } : {}),
      },
      orderBy: [{ period: "asc" }],
      include: {
        project: { select: { id: true, title: true, client: { select: { name: true } } } },
      },
      take: 500,
    });

    return reply.send({
      invoices: invoices.map((invoice) => ({
        ...toInvoiceDto(invoice),
        project: {
          id: invoice.project.id,
          title: invoice.project.title,
          client: invoice.project.client?.name ?? null,
        },
      })),
      // Сумма считается на сервере: клиент иначе сложил бы только то, что
      // попало в выдачу, и цифра врала бы при обрезке по take.
      total: invoices.reduce((sum, invoice) => sum + (invoice.amount ?? 0), 0),
    });
  });

  app.get("/projects/:id/invoices", { preHandler: requireTeam }, async (request, reply) => {
    const params = projectParams.safeParse(request.params);
    if (!params.success) return invalidInput(reply, params.error);
    if (!(await projectExists(params.data.id))) {
      return reply.code(404).send({ error: "Проект не найден" });
    }

    const invoices = await prisma.invoice.findMany({
      where: { projectId: params.data.id },
      // Свежие периоды сверху: чаще всего смотрят текущий месяц.
      orderBy: [{ period: "desc" }, { kind: "asc" }],
    });

    return reply.send({ invoices: invoices.map(toInvoiceDto) });
  });

  app.post("/projects/:id/invoices", { preHandler: requireTeam }, async (request, reply) => {
    const params = projectParams.safeParse(request.params);
    if (!params.success) return invalidInput(reply, params.error);

    const parsed = invoiceBody.safeParse(request.body);
    if (!parsed.success) return invalidInput(reply, parsed.error);

    if (!(await projectExists(params.data.id))) {
      return reply.code(404).send({ error: "Проект не найден" });
    }

    const input = parsed.data;
    // Уникальность (проект, вид, период) держит база. Ловим её здесь, чтобы
    // вместо «внутренней ошибки» человек увидел, что именно не так.
    const duplicate = await prisma.invoice.count({
      where: { projectId: params.data.id, kind: input.kind, period: input.period },
    });
    if (duplicate) {
      const what = input.kind === "invoice" ? "Счёт" : "Акт";
      return reply.code(409).send({ error: `${what} за ${input.period} уже заведён` });
    }

    const invoice = await prisma.invoice.create({
      data: {
        projectId: params.data.id,
        kind: input.kind,
        period: input.period,
        amount: input.amount ?? null,
        issuedAt: input.issuedAt ?? null,
        paidAt: input.paidAt ?? null,
        note: input.note ?? null,
      },
    });

    await audit(request, { entity: "invoices", entityId: invoice.id, action: "create" });
    return reply.code(201).send({ invoice: toInvoiceDto(invoice) });
  });

  app.patch(
    "/projects/:id/invoices/:invoiceId",
    { preHandler: requireTeam },
    async (request, reply) => {
      const params = invoiceParams.safeParse(request.params);
      if (!params.success) return invalidInput(reply, params.error);

      const parsed = invoiceBody.partial().safeParse(request.body);
      if (!parsed.success) return invalidInput(reply, parsed.error);

      const existing = await prisma.invoice.findFirst({
        where: { id: params.data.invoiceId, projectId: params.data.id },
      });
      if (!existing) return reply.code(404).send({ error: "Запись не найдена" });

      const input = parsed.data;
      const invoice = await prisma.invoice.update({
        where: { id: existing.id },
        data: {
          ...(input.kind !== undefined && { kind: input.kind }),
          ...(input.period !== undefined && { period: input.period }),
          ...(input.amount !== undefined && { amount: input.amount }),
          ...(input.issuedAt !== undefined && { issuedAt: input.issuedAt }),
          ...(input.paidAt !== undefined && { paidAt: input.paidAt }),
          ...(input.note !== undefined && { note: input.note }),
        },
      });

      await audit(request, { entity: "invoices", entityId: invoice.id, action: "update" });
      return reply.send({ invoice: toInvoiceDto(invoice) });
    },
  );

  app.delete(
    "/projects/:id/invoices/:invoiceId",
    { preHandler: requireTeam },
    async (request, reply) => {
      const params = invoiceParams.safeParse(request.params);
      if (!params.success) return invalidInput(reply, params.error);

      const existing = await prisma.invoice.findFirst({
        where: { id: params.data.invoiceId, projectId: params.data.id },
      });
      if (!existing) return reply.code(404).send({ error: "Запись не найдена" });

      // Жёстко, в отличие от остальных сущностей: ошибочно заведённый счёт —
      // это опечатка, а не история, и висеть в отчётах ему незачем.
      await prisma.invoice.delete({ where: { id: existing.id } });

      await audit(request, {
        entity: "invoices",
        entityId: existing.id,
        action: "delete",
        diff: { kind: existing.kind, period: existing.period },
      });
      return reply.code(204).send();
    },
  );
}
