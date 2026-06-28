// seed 用のパスワードハッシュヘルパ。Node の crypto.pbkdf2Sync を使う同期版。
// 同じ PBKDF2-SHA256 / iter / output サイズで Workers 側 (src/server/auth/password.ts)
// と等価なハッシュを生成する。

import { pbkdf2Sync, randomBytes } from "node:crypto";

// Cloudflare Workers の SubtleCrypto は >100000 で NotSupportedError を投げるため
// password 検証側 (src/server/auth/password.ts) と揃えて 100000 に固定する。
export const PBKDF2_ITERATIONS = 100_000;
export const PBKDF2_HASH = "sha256";
export const PBKDF2_KEYLEN = 32;
export const PBKDF2_SALT_LEN = 16;

export function pbkdf2HashSyncForSeed(password: string): {
  hashB64: string;
  saltB64: string;
  iterations: number;
} {
  // seed は決定論的にしたいので salt を password ベースで固定する。
  // (本番運用では Web Crypto 側の rng salt を使う)
  const salt = Buffer.alloc(PBKDF2_SALT_LEN);
  // 固定 salt: "kigyo-seed-salt0" の utf8 16 byte
  const SEED = Buffer.from("kigyo-seed-salt0", "utf8");
  SEED.copy(salt, 0, 0, Math.min(SEED.length, PBKDF2_SALT_LEN));

  const hash = pbkdf2Sync(
    Buffer.from(password, "utf8"),
    salt,
    PBKDF2_ITERATIONS,
    PBKDF2_KEYLEN,
    PBKDF2_HASH,
  );
  return {
    hashB64: hash.toString("base64"),
    saltB64: salt.toString("base64"),
    iterations: PBKDF2_ITERATIONS,
  };
}

/** ランダム salt 付きハッシュ。本番 admin 作成のために残しておく(現状は seed では未使用)。 */
export function pbkdf2HashSyncRandom(password: string): {
  hashB64: string;
  saltB64: string;
  iterations: number;
} {
  const salt = randomBytes(PBKDF2_SALT_LEN);
  const hash = pbkdf2Sync(
    Buffer.from(password, "utf8"),
    salt,
    PBKDF2_ITERATIONS,
    PBKDF2_KEYLEN,
    PBKDF2_HASH,
  );
  return {
    hashB64: hash.toString("base64"),
    saltB64: salt.toString("base64"),
    iterations: PBKDF2_ITERATIONS,
  };
}
