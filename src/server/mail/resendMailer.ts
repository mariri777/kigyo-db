import "server-only";

import type { Mailer, MailAddress, SendMailInput } from "./index";
import { formatAddress } from "./index";

/**
 * 本番用: Resend REST API (https://api.resend.com/emails)。
 * Workers から fetch するだけ。RESEND_API_KEY を env で受ける。
 *
 * 送信元ドメインは Resend の Domains で verified 済みであること。
 *   from: "noreply@kigyo.cho-super.com" 等
 */
const ENDPOINT = "https://api.resend.com/emails";

export function resendMailer(): Mailer {
  const apiKey = process.env.RESEND_API_KEY;
  return {
    async send(input: SendMailInput): Promise<void> {
      if (!apiKey) {
        throw new Error(
          "RESEND_API_KEY が未設定です。wrangler secret put RESEND_API_KEY で設定してください。",
        );
      }
      const body = {
        from: formatAddress(input.from),
        to: [formatAddress(input.to)],
        subject: input.subject,
        html: input.html,
        text: input.text,
        ...(input.replyTo ? { reply_to: [formatAddress(input.replyTo)] } : {}),
      };
      const res = await fetch(ENDPOINT, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const detail = await res.text().catch(() => "");
        throw new Error(
          `Resend に送信失敗 (${res.status} ${res.statusText}): ${detail.slice(0, 300)}`,
        );
      }
    },
  };
}
