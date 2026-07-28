import { createHash, randomBytes } from "node:crypto";
import type { FastifyReply, FastifyRequest } from "fastify";
import type { User } from "@prisma/client";
import { prisma } from "../db.js";
import { env } from "../env.js";

export const SESSION_COOKIE = "itopt_session";

/**
 * В куку уходит случайный секрет, в базу — только его SHA-256. Утечка дампа
 * базы не даёт возможности войти, а отозвать сессию можно мгновенно (в отличие
 * от JWT, который живёт до истечения срока).
 */
function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function expiryDate(): Date {
  return new Date(Date.now() + env.SESSION_TTL_DAYS * 24 * 60 * 60 * 1000);
}

export async function createSession(
  reply: FastifyReply,
  user: User,
  request: FastifyRequest,
): Promise<void> {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = expiryDate();

  await prisma.session.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(token),
      expiresAt,
      ip: request.ip,
      userAgent: request.headers["user-agent"]?.slice(0, 255),
    },
  });

  reply.setCookie(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: env.COOKIE_SECURE,
    domain: env.COOKIE_DOMAIN || undefined,
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const token = request.cookies[SESSION_COOKIE];
  if (token) {
    await prisma.session.updateMany({
      where: { tokenHash: hashToken(token), revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
  reply.clearCookie(SESSION_COOKIE, {
    path: "/",
    domain: env.COOKIE_DOMAIN || undefined,
  });
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string | null;
  role: User["role"];
}

/** Пользователь текущей сессии или null. Просроченные сессии не проходят. */
export async function resolveUser(
  request: FastifyRequest,
): Promise<AuthenticatedUser | null> {
  const token = request.cookies[SESSION_COOKIE];
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: true },
  });

  if (!session || session.revokedAt || session.expiresAt < new Date()) return null;
  if (session.user.disabledAt) return null;

  const { id, email, name, role } = session.user;
  return { id, email, name, role };
}

/** Убирает из базы мусор: истёкшие и отозванные сессии. */
export async function purgeExpiredSessions(): Promise<number> {
  const { count } = await prisma.session.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  });
  return count;
}
