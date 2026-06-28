import "server-only";

import { mailpitMailer } from "./mailpitMailer";
import { resendMailer } from "./resendMailer";

export type MailAddress = string | { email: string; name?: string };

export type SendMailInput = {
  to: MailAddress;
  from: MailAddress;
  subject: string;
  html: string;
  text: string;
  replyTo?: MailAddress;
};

export type Mailer = {
  send(input: SendMailInput): Promise<void>;
};

/**
 * Mailer を 1 つ返す。
 *   - MAIL_TRANSPORT=mailpit (default in dev): mailpit HTTP API
 *   - MAIL_TRANSPORT=resend (default in prod): Resend REST API
 * いずれも fetch ベース。Workers でも Node でも同じコードが動く。
 */
export function getMailer(): Mailer {
  const transport = resolveTransport();
  return transport === "resend" ? resendMailer() : mailpitMailer();
}

function resolveTransport(): "resend" | "mailpit" {
  const explicit = process.env.MAIL_TRANSPORT?.toLowerCase();
  if (explicit === "resend") return "resend";
  if (explicit === "mailpit") return "mailpit";
  // 明示が無ければ NODE_ENV で判断
  return process.env.NODE_ENV === "production" ? "resend" : "mailpit";
}

export function formatAddress(addr: MailAddress): string {
  if (typeof addr === "string") return addr;
  return addr.name ? `${addr.name} <${addr.email}>` : addr.email;
}
