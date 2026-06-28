"use client";

/**
 * /api/admin/upload に File を投げてアップロードする。
 * 成功すると DB に保存する key を返す。
 *
 * 失敗時は throw する (呼び出し側で UI 表示)。
 */
export async function uploadImage(file: File): Promise<{ key: string; url: string }> {
  if (!file.type.startsWith("image/")) {
    throw new Error(`画像ファイルではありません: ${file.type || "unknown"}`);
  }
  const form = new FormData();
  form.append("file", file);
  const res = await fetch("/api/admin/upload", {
    method: "POST",
    body: form,
  });
  if (!res.ok) {
    let msg = `アップロードに失敗しました (HTTP ${res.status})`;
    try {
      const j = (await res.json()) as { error?: string };
      if (j.error) msg = j.error;
    } catch {
      // ignore
    }
    throw new Error(msg);
  }
  return (await res.json()) as { key: string; url: string };
}
