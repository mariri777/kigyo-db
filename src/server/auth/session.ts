import "server-only";

import { cache } from "react";
import { cookies } from "next/headers";
import { getDb } from "@/server/db/client";
import {
  createSession as repoCreateSession,
  deleteSession as repoDeleteSession,
  findActiveSession,
} from "@/server/repo/authRepo";
import { generateSessionId } from "@/server/auth/password";

export const SESSION_COOKIE = "kigyo_admin_session";
const SESSION_TTL_SEC = 60 * 60 * 24 * 14; // 14 日

export type CurrentAdmin = {
  userId: number;
  email: string;
  name: string;
  sessionId: string;
};

/**
 * 同一リクエスト内では複数の Server Component/Action から呼ばれても D1 を 1 回しか叩かない。
 * admin 配下では layout / page の両方が呼ぶことが多い。
 */
export const getCurrentAdmin = cache(async (): Promise<CurrentAdmin | null> => {
  const store = await cookies();
  const sid = store.get(SESSION_COOKIE)?.value;
  if (!sid) return null;
  try {
    const db = await getDb();
    const sess = await findActiveSession(db, sid);
    if (!sess) return null;
    return {
      userId: sess.userId,
      email: sess.email,
      name: sess.name,
      sessionId: sess.id,
    };
  } catch {
    // D1 が一時的に開けない (seed 直後の dev サーバ等) 場合は未ログイン扱い。
    // ガード対象ページは /admin/login へリダイレクトするので安全側に倒す。
    return null;
  }
});

export async function requireAdmin(): Promise<CurrentAdmin> {
  const admin = await getCurrentAdmin();
  if (!admin) {
    // Server Component / Server Action / Route Handler から呼ばれる前提。
    // Server Action 内なら try/catch でハンドリングできる Error を投げる。
    throw new UnauthorizedError();
  }
  return admin;
}

export class UnauthorizedError extends Error {
  constructor() {
    super("Unauthorized");
    this.name = "UnauthorizedError";
  }
}

export async function startSessionForUser(userId: number): Promise<void> {
  const db = await getDb();
  const id = generateSessionId();
  const expires = new Date(Date.now() + SESSION_TTL_SEC * 1000);
  await repoCreateSession(db, {
    id,
    userId,
    expiresAt: expires.toISOString(),
  });
  const store = await cookies();
  store.set(SESSION_COOKIE, id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    expires,
  });
}

export async function endCurrentSession(): Promise<void> {
  const store = await cookies();
  const sid = store.get(SESSION_COOKIE)?.value;
  if (sid) {
    try {
      const db = await getDb();
      await repoDeleteSession(db, sid);
    } catch {
      // DB 削除に失敗しても cookie だけは消す
    }
  }
  store.set(SESSION_COOKIE, "", { maxAge: 0, path: "/" });
}
