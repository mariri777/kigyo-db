import "server-only";

import { eq } from "drizzle-orm";
import type { Db } from "@/server/db/client";
import * as s from "@/server/db/schema";

export async function listUsers(db: Db) {
  return db
    .select({
      id: s.adminUsers.id,
      email: s.adminUsers.email,
      name: s.adminUsers.name,
      createdAt: s.adminUsers.createdAt,
    })
    .from(s.adminUsers)
    .orderBy(s.adminUsers.id);
}

export async function createUser(
  db: Db,
  opts: {
    email: string;
    name: string;
    passwordHash: string;
    passwordSalt: string;
    passwordIterations: number;
  },
): Promise<number> {
  const now = new Date().toISOString();
  const res = await db
    .insert(s.adminUsers)
    .values({
      email: opts.email,
      name: opts.name,
      passwordHash: opts.passwordHash,
      passwordSalt: opts.passwordSalt,
      passwordIterations: opts.passwordIterations,
      createdAt: now,
      updatedAt: now,
    })
    .returning({ id: s.adminUsers.id });
  return res[0].id;
}

export async function updateUserPassword(
  db: Db,
  userId: number,
  opts: {
    passwordHash: string;
    passwordSalt: string;
    passwordIterations: number;
  },
): Promise<void> {
  await db
    .update(s.adminUsers)
    .set({
      passwordHash: opts.passwordHash,
      passwordSalt: opts.passwordSalt,
      passwordIterations: opts.passwordIterations,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(s.adminUsers.id, userId));
}

export async function findUserById(db: Db, userId: number) {
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
    .where(eq(s.adminUsers.id, userId))
    .limit(1);
  return rows[0] ?? null;
}

export async function countUsers(db: Db): Promise<number> {
  const rows = await db.select({ id: s.adminUsers.id }).from(s.adminUsers);
  return rows.length;
}

export async function deleteUser(db: Db, userId: number): Promise<void> {
  await db.delete(s.adminUsers).where(eq(s.adminUsers.id, userId));
}
