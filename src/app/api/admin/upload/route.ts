/**
 * 画像アップロード API (admin 認証必須)。
 *
 * POST multipart/form-data:
 *   file:   File (image/*)
 *   prefix: "articles" など (省略時 "articles")
 *
 * Response 200:
 *   { key: "articles/2026/06/uuid.jpg", url: "https://.../articles/2026/06/uuid.jpg" }
 *
 * Response 401/415/413/500:
 *   { error: "..." }
 */
import { NextResponse } from "next/server";
import { getCurrentAdmin } from "@/server/auth/session";
import { generateMediaKey, putObject } from "@/server/media/storage";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
  "image/svg+xml",
]);
const ALLOWED_PREFIXES = new Set(["articles"]);

export async function POST(req: Request): Promise<Response> {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json(
      { error: "invalid form-data" },
      { status: 400 },
    );
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "file missing" }, { status: 400 });
  }
  if (file.size === 0) {
    return NextResponse.json({ error: "empty file" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: `file too large (max ${MAX_BYTES} bytes)` },
      { status: 413 },
    );
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json(
      { error: `unsupported content-type: ${file.type}` },
      { status: 415 },
    );
  }

  const prefixRaw = String(form.get("prefix") ?? "articles");
  const prefix = ALLOWED_PREFIXES.has(prefixRaw) ? prefixRaw : "articles";
  const key = generateMediaKey(prefix, file.name);

  const buf = Buffer.from(await file.arrayBuffer());

  try {
    const { url } = await putObject(key, buf, file.type);
    return NextResponse.json({ key, url });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "upload failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
