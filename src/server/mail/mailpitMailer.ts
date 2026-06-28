import "server-only";

import type { Mailer, MailAddress, SendMailInput } from "./index";

/**
 * ローカル開発用: docker-compose 上の mailpit に HTTP API で送る。
 * SMTP よりも Workers 親和性が高い (fetch だけで済む)。
 *
 * 受信メールは http://localhost:8025 で確認できる。
 *
 * mailpit の HTTP API:
 *   POST http://localhost:8025/api/v1/send
 *   body: { From, To, Cc, Bcc, Subject, Text, HTML, Headers }
 */
const DEFAULT_URL = "http://localhost:8025/api/v1/send";

function toMailpitAddress(addr: MailAddress): { Email: string; Name: string } {
  if (typeof addr === "string") return { Email: addr, Name: "" };
  return { Email: addr.email, Name: addr.name ?? "" };
}

export function mailpitMailer(): Mailer {
  const endpoint = process.env.MAILPIT_API_URL ?? DEFAULT_URL;
  return {
    async send(input: SendMailInput): Promise<void> {
      const body = {
        From: toMailpitAddress(input.from),
        To: [toMailpitAddress(input.to)],
        Subject: input.subject,
        Text: input.text,
        HTML: input.html,
        ...(input.replyTo
          ? { ReplyTo: [toMailpitAddress(input.replyTo)] }
          : {}),
      };
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const detail = await res.text().catch(() => "");
        throw new Error(
          `mailpit に送信失敗 (${res.status} ${res.statusText}): ${detail.slice(0, 300)}`,
        );
      }
    },
  };
}
