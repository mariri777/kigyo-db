import "server-only";

/**
 * PBKDF2-SHA256 によるパスワードハッシュ。
 *
 * Workers の Web Crypto SubtleCrypto は scrypt をサポートしないため、
 * PBKDF2-SHA256(100,000 iter, 32 byte 出力) を採用する。Node の crypto.pbkdf2Sync と
 * 等価なので、seed (scripts/lib/passwordSeed.ts) で書き込んだハッシュをそのまま
 * 検証できる。
 *
 * 反復回数は Workers の SubtleCrypto 制約(>100000 で NotSupportedError)に揃える。
 *
 * 保存形式は base64(hash), base64(salt), iter の 3 カラム。将来 iter を増やしたとき
 * もカラムごとに保持しているので互換性を保てる。
 */

const PBKDF2_HASH = "SHA-256";
const PBKDF2_KEYLEN_BITS = 32 * 8; // 32 bytes
const SALT_LEN = 16;
export const PBKDF2_ITERATIONS = 100_000;

function bytesToBase64(bytes: Uint8Array): string {
  // Workers / Node どちらも btoa が使えないケース対策
  let s = "";
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  if (typeof btoa === "function") return btoa(s);
  // Node 互換 (next dev / scripts 等)
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Buffer } = require("node:buffer") as typeof import("node:buffer");
  return Buffer.from(bytes).toString("base64");
}

function base64ToBytes(b64: string): Uint8Array {
  if (typeof atob === "function") {
    const bin = atob(b64);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Buffer } = require("node:buffer") as typeof import("node:buffer");
  return new Uint8Array(Buffer.from(b64, "base64"));
}

async function pbkdf2(
  password: string,
  salt: Uint8Array,
  iterations: number,
): Promise<Uint8Array> {
  const enc = new TextEncoder();
  const passwordBuf = enc.encode(password);
  // TS の lib.dom 型では SubtleCrypto は厳格な ArrayBuffer を要求するため、
  // Uint8Array をそのまま渡すと SharedArrayBuffer 互換性で文句を言われる。
  // Buffer の中身を新規 ArrayBuffer にコピーして渡す。
  const passwordBytes = new Uint8Array(passwordBuf.byteLength);
  passwordBytes.set(passwordBuf);
  const saltCopy = new Uint8Array(salt.byteLength);
  saltCopy.set(salt);
  const key = await crypto.subtle.importKey(
    "raw",
    passwordBytes.buffer,
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: PBKDF2_HASH, salt: saltCopy.buffer, iterations },
    key,
    PBKDF2_KEYLEN_BITS,
  );
  return new Uint8Array(bits);
}

export async function hashPassword(password: string): Promise<{
  hashB64: string;
  saltB64: string;
  iterations: number;
}> {
  const salt = new Uint8Array(SALT_LEN);
  crypto.getRandomValues(salt);
  const hash = await pbkdf2(password, salt, PBKDF2_ITERATIONS);
  return {
    hashB64: bytesToBase64(hash),
    saltB64: bytesToBase64(salt),
    iterations: PBKDF2_ITERATIONS,
  };
}

/** タイミング攻撃耐性のある定数時間バイト比較。 */
function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

export async function verifyPassword(
  password: string,
  expected: { hashB64: string; saltB64: string; iterations: number },
): Promise<boolean> {
  const salt = base64ToBytes(expected.saltB64);
  const expectedHash = base64ToBytes(expected.hashB64);
  const actual = await pbkdf2(password, salt, expected.iterations);
  return timingSafeEqual(actual, expectedHash);
}

/** セッション ID(URL セーフな 32 文字) */
export function generateSessionId(): string {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  let s = "";
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  const b64 = typeof btoa === "function" ? btoa(s) : bytesToBase64(bytes);
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/**
 * パスワードリセット用トークン(URL セーフな base64url、32 byte entropy)。
 * 生トークンはメール本文に出し、DB には sha256 のみ保存する。
 */
export function generateResetToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  let s = "";
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  const b64 = typeof btoa === "function" ? btoa(s) : bytesToBase64(bytes);
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** SHA-256 で生トークン → 16 進文字列。DB の id 列に保存する用。 */
export async function sha256Hex(input: string): Promise<string> {
  const enc = new TextEncoder().encode(input);
  const buf = await crypto.subtle.digest("SHA-256", enc);
  const bytes = new Uint8Array(buf);
  let hex = "";
  for (let i = 0; i < bytes.length; i++) {
    hex += bytes[i].toString(16).padStart(2, "0");
  }
  return hex;
}
