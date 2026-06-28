import "server-only";

import { getDb } from "@/server/db/client";
import {
  createPasswordReset,
  deleteAllUserSessions,
  findUsablePasswordReset,
  findUserByEmail,
  markPasswordResetUsed,
  updateUserPassword,
} from "@/server/repo/authRepo";
import {
  generateResetToken,
  hashPassword,
  sha256Hex,
} from "@/server/auth/password";
import { getMailer } from "@/server/mail";
import { SITE_NAME, SITE_URL } from "@/shared/site";

const RESET_TTL_MIN = 30;

const FROM_EMAIL =
  process.env.MAIL_FROM_EMAIL ?? "noreply@kigyo.cho-super.com";
const FROM_NAME = process.env.MAIL_FROM_NAME ?? `${SITE_NAME} 管理画面`;

/**
 * メール本文に埋め込むリンクの origin。
 *   - 明示の MAIL_BASE_URL が最優先(例: 開発時 "http://localhost:3000")
 *   - 無ければ dev は localhost:3000、prod は SITE_URL
 */
function resolveMailBaseUrl(): string {
  const explicit = process.env.MAIL_BASE_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, "");
  if (process.env.NODE_ENV !== "production") return "http://localhost:3000";
  return SITE_URL.replace(/\/$/, "");
}

/**
 * リセットリクエストの結果。メール送信の成否はユーザーに教えない
 * (アカウント列挙攻撃対策)。常に「メールを送信しました」と返す。
 */
export async function requestPasswordReset(rawEmail: string): Promise<void> {
  const email = rawEmail.trim().toLowerCase();
  if (!email) return;
  const db = await getDb();
  const user = await findUserByEmail(db, email);
  if (!user) {
    // 不在ユーザーでも処理時間を揃えるため軽くスリープしてから return
    await sleepMs(120);
    return;
  }
  const rawToken = generateResetToken();
  const tokenHash = await sha256Hex(rawToken);
  const expires = new Date(Date.now() + RESET_TTL_MIN * 60 * 1000);
  await createPasswordReset(db, {
    id: tokenHash,
    userId: user.id,
    expiresAt: expires.toISOString(),
  });

  const link = `${resolveMailBaseUrl()}/admin/password/reset/${rawToken}`;
  const mailer = getMailer();
  await mailer.send({
    to: { email: user.email, name: user.name },
    from: { email: FROM_EMAIL, name: FROM_NAME },
    subject: `${SITE_NAME} のパスワードを再設定する`,
    text: renderResetTextEmail({ link, ttlMin: RESET_TTL_MIN }),
    html: renderResetHtmlEmail({ link, ttlMin: RESET_TTL_MIN }),
  });
}

export type CompleteResetOk = { ok: true };
export type CompleteResetErr = {
  ok: false;
  error: "invalid_token" | "weak_password";
};
export type CompleteResetResult = CompleteResetOk | CompleteResetErr;

/**
 * リセット完了処理。
 *   - rawToken を sha256 して DB を引く
 *   - 期限内 + 未使用 なら新パスワードを保存し、当該ユーザーの全セッションを破棄
 */
export async function completePasswordReset(
  rawToken: string,
  newPassword: string,
): Promise<CompleteResetResult> {
  if (newPassword.length < 8) {
    return { ok: false, error: "weak_password" };
  }
  const db = await getDb();
  const tokenHash = await sha256Hex(rawToken);
  const reset = await findUsablePasswordReset(db, tokenHash);
  if (!reset) return { ok: false, error: "invalid_token" };

  const hash = await hashPassword(newPassword);
  await updateUserPassword(db, reset.userId, hash);
  await markPasswordResetUsed(db, reset.id);
  await deleteAllUserSessions(db, reset.userId);
  return { ok: true };
}

function sleepMs(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function renderResetTextEmail(opts: { link: string; ttlMin: number }): string {
  return [
    `${SITE_NAME} 管理画面のパスワード再設定リクエストを受け付けました。`,
    "",
    "下記のリンクから新しいパスワードを設定してください。",
    opts.link,
    "",
    `このリンクは ${opts.ttlMin} 分間のみ有効です。`,
    "",
    "心当たりがない場合は、このメールを無視してください。",
    "",
    `— ${SITE_NAME}`,
  ].join("\n");
}

function renderResetHtmlEmail(opts: { link: string; ttlMin: number }): string {
  return `<!doctype html>
<html lang="ja">
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.7; color: #111; max-width: 560px; margin: 32px auto; padding: 0 16px;">
  <h1 style="font-size: 18px; margin: 0 0 16px;">${SITE_NAME} 管理画面のパスワード再設定</h1>
  <p>下記ボタンから新しいパスワードを設定してください。</p>
  <p style="margin: 24px 0;">
    <a href="${opts.link}" style="display: inline-block; background: #111; color: #fff; padding: 12px 20px; border-radius: 6px; text-decoration: none; font-weight: bold;">パスワードを再設定する</a>
  </p>
  <p style="font-size: 13px; color: #555;">
    ボタンが押せない場合は、以下の URL を直接ブラウザに貼り付けてください。<br>
    <a href="${opts.link}" style="color: #2563eb; word-break: break-all;">${opts.link}</a>
  </p>
  <p style="font-size: 13px; color: #555;">このリンクは ${opts.ttlMin} 分間のみ有効です。心当たりがない場合は、このメールを無視してください。</p>
  <p style="font-size: 12px; color: #888; margin-top: 32px;">— ${SITE_NAME}</p>
</body>
</html>`;
}
