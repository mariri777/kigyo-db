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

/** パスワードリセット: 全セッション破棄 */
export async function deleteAllUserSessions(
  db: Db,
  userId: number,
): Promise<void> {
  await db.delete(s.adminSessions).where(eq(s.adminSessions.userId, userId));
}

/**
 * パスワードリセットトークンを 1 件追加。
 * id = sha256(raw token) hex を保存する(生 token は DB に残さない)。
 */
export async function createPasswordReset(
  db: Db,
  opts: { id: string; userId: number; expiresAt: string },
): Promise<void> {
  const now = new Date().toISOString();
  await db.insert(s.adminPasswordResets).values({
    id: opts.id,
    userId: opts.userId,
    createdAt: now,
    expiresAt: opts.expiresAt,
    usedAt: null,
  });
}

/**
 * パスワードリセットトークンを引いて、使えるかどうか判定して返す。
 *   - 期限切れ → null
 *   - 使用済み → null
 *   - 有効   → userId を返す
 */
export async function findUsablePasswordReset(
  db: Db,
  id: string,
): Promise<{ id: string; userId: number } | null> {
  const nowIso = new Date().toISOString();
  const rows = await db
    .select({
      id: s.adminPasswordResets.id,
      userId: s.adminPasswordResets.userId,
      usedAt: s.adminPasswordResets.usedAt,
      expiresAt: s.adminPasswordResets.expiresAt,
    })
    .from(s.adminPasswordResets)
    .where(eq(s.adminPasswordResets.id, id))
    .limit(1);
  const r = rows[0];
  if (!r) return null;
  if (r.usedAt) return null;
  if (r.expiresAt <= nowIso) return null;
  return { id: r.id, userId: r.userId };
}

/** トークンを「使用済み」マークする(同 id でもう一度使えなくする)。 */
export async function markPasswordResetUsed(
  db: Db,
  id: string,
): Promise<void> {
  const now = new Date().toISOString();
  await db
    .update(s.adminPasswordResets)
    .set({ usedAt: now })
    .where(eq(s.adminPasswordResets.id, id));
}

/** ユーザーのパスワードを更新する。 */
export async function updateUserPassword(
  db: Db,
  userId: number,
  hash: { hashB64: string; saltB64: string; iterations: number },
): Promise<void> {
  const now = new Date().toISOString();
  await db
    .update(s.adminUsers)
    .set({
      passwordHash: hash.hashB64,
      passwordSalt: hash.saltB64,
      passwordIterations: hash.iterations,
      updatedAt: now,
    })
    .where(eq(s.adminUsers.id, userId));
}
