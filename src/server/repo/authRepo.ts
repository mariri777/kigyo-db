import "server-only";

import { and, eq, gt, ne } from "drizzle-orm";
import type { Db } from "@/server/db/client";
import * as s from "@/server/db/schema";

export type AdminUserRow = {
  id: number;
  email: string;
  name: string;
  passwordHash: string;
  passwordSalt: string;
  passwordIterations: number;
};

export async function findUserByEmail(
  db: Db,
  email: string,
): Promise<AdminUserRow | null> {
  const rows = await db
    .select({
      id: s.adminUsers.id,
      email: s.adminUsers.email,
      name: s.adminUsers.name,
      passwordHash: s.adminUsers.passwordHash,
      passwordSalt: s.adminUsers.passwordSalt,
      passwordIterations: s.adminUsers.passwordIterations,
    })
    .from(s.adminUsers)
    .where(eq(s.adminUsers.email, email))
    .limit(1);
  return rows[0] ?? null;
}

export async function createSession(
  db: Db,
  opts: { id: string; userId: number; expiresAt: string },
): Promise<void> {
  const now = new Date().toISOString();
  await db.insert(s.adminSessions).values({
    id: opts.id,
    userId: opts.userId,
    createdAt: now,
    expiresAt: opts.expiresAt,
  });
}

export async function findActiveSession(
  db: Db,
  id: string,
): Promise<{ id: string; userId: number; expiresAt: string; name: string; email: string } | null> {
  const nowIso = new Date().toISOString();
  const rows = await db
    .select({
      id: s.adminSessions.id,
      userId: s.adminSessions.userId,
      expiresAt: s.adminSessions.expiresAt,
      name: s.adminUsers.name,
      email: s.adminUsers.email,
    })
    .from(s.adminSessions)
    .innerJoin(s.adminUsers, eq(s.adminUsers.id, s.adminSessions.userId))
    .where(and(eq(s.adminSessions.id, id), gt(s.adminSessions.expiresAt, nowIso)))
    .limit(1);
  return rows[0] ?? null;
}

export async function deleteSession(db: Db, id: string): Promise<void> {
  await db.delete(s.adminSessions).where(eq(s.adminSessions.id, id));
}

/**
 * 指定ユーザーのセッションを「現セッション以外」全削除する。
 * パスワード変更後、盗まれている可能性のある古いセッションを締め出すために使う。
 */
export async function deleteUserSessionsExcept(
  db: Db,
  userId: number,
  keepSessionId: string,
): Promise<void> {
  await db
    .delete(s.adminSessions)
    .where(
      and(
        eq(s.adminSessions.userId, userId),
        ne(s.adminSessions.id, keepSessionId),
      ),
    );
}
