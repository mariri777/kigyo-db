import "server-only";

/**
 * 管理画面 WYSIWYG が POST してくる HTML 文字列を、許可タグだけに絞った
 * 安全な HTML 文字列に変換する。
 *
 * dangerouslySetInnerHTML で公開ページに埋め込むため、必ずサーバ側でかける。
 * Workers / Node どちらでも動かしたいので外部依存(DOMPurify 等)は使わず、
 * 手書きの軽量実装にしている。ブログ用途で十分な粒度。
 */

type Rule = {
  tag: string;
  allowedAttrs: string[];
  isVoid?: boolean;
};

const RULES: Record<string, Rule> = {
  p: { tag: "p", allowedAttrs: ["class"] },
  br: { tag: "br", allowedAttrs: [], isVoid: true },
  h2: { tag: "h2", allowedAttrs: ["class"] },
  h3: { tag: "h3", allowedAttrs: ["class"] },
  h4: { tag: "h4", allowedAttrs: ["class"] },
  strong: { tag: "strong", allowedAttrs: [] },
  b: { tag: "strong", allowedAttrs: [] },
  em: { tag: "em", allowedAttrs: [] },
  i: { tag: "em", allowedAttrs: [] },
  u: { tag: "u", allowedAttrs: [] },
  code: { tag: "code", allowedAttrs: ["class"] },
  pre: { tag: "pre", allowedAttrs: ["class"] },
  ul: { tag: "ul", allowedAttrs: ["class"] },
  ol: { tag: "ol", allowedAttrs: ["class"] },
  li: { tag: "li", allowedAttrs: ["class"] },
  blockquote: { tag: "blockquote", allowedAttrs: ["class"] },
  cite: { tag: "cite", allowedAttrs: ["class"] },
  hr: { tag: "hr", allowedAttrs: [], isVoid: true },
  div: { tag: "div", allowedAttrs: ["class"] },
  span: { tag: "span", allowedAttrs: ["class"] },
  aside: { tag: "aside", allowedAttrs: ["class"] },
  details: { tag: "details", allowedAttrs: ["class"] },
  summary: { tag: "summary", allowedAttrs: ["class"] },
  a: { tag: "a", allowedAttrs: ["href", "title", "rel", "target", "class"] },
  article: { tag: "article", allowedAttrs: ["class"] },
  table: { tag: "table", allowedAttrs: ["class"] },
  thead: { tag: "thead", allowedAttrs: ["class"] },
  tbody: { tag: "tbody", allowedAttrs: ["class"] },
  tr: { tag: "tr", allowedAttrs: ["class"] },
  th: { tag: "th", allowedAttrs: ["class", "scope"] },
  td: { tag: "td", allowedAttrs: ["class", "colspan", "rowspan"] },
};

/** href のスキームを安全なものに限定。javascript: / data: / vbscript: を明示拒否。 */
function safeHref(value: string): string | null {
  // 制御文字混じりの `java\tscript:` 形式の bypass を防ぐため、
  // ASCII 制御文字と空白文字を全て除去してからスキームを判定する。
  const v = value.replace(/[\x00-\x1F\x7F\s]/g, "");
  if (v.length === 0) return null;
  if (/^(javascript|data|vbscript|file):/i.test(v)) return null;
  if (v.startsWith("/") || v.startsWith("#")) return v;
  if (/^https?:\/\//i.test(v)) return v;
  if (/^mailto:/i.test(v)) return v;
  return null;
}

/** rel 属性に許容するキーワード */
const REL_ALLOWLIST = new Set([
  "noopener",
  "noreferrer",
  "nofollow",
  "external",
  "ugc",
  "sponsored",
]);

function sanitizeRel(value: string): string | null {
  const tokens = value
    .split(/\s+/)
    .map((t) => t.toLowerCase())
    .filter((t) => REL_ALLOWLIST.has(t));
  if (tokens.length === 0) return null;
  return Array.from(new Set(tokens)).join(" ");
}

function escapeText(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeAttr(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
}

type Token =
  | { kind: "text"; value: string }
  | {
      kind: "open" | "void";
      tag: string;
      attrs: Record<string, string>;
    }
  | { kind: "close"; tag: string };

const TAG_RE =
  /<\/?\s*([a-zA-Z][a-zA-Z0-9]*)((?:\s+[a-zA-Z_:][-a-zA-Z0-9_:]*(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+))?)*)\s*\/?\s*>/g;
const ATTR_RE = /([a-zA-Z_:][-a-zA-Z0-9_:]*)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g;

function tokenize(html: string): Token[] {
  const tokens: Token[] = [];
  let lastIndex = 0;
  let m: RegExpExecArray | null;
  TAG_RE.lastIndex = 0;
  while ((m = TAG_RE.exec(html)) !== null) {
    if (m.index > lastIndex) {
      tokens.push({ kind: "text", value: html.slice(lastIndex, m.index) });
    }
    const raw = m[0];
    const tag = m[1].toLowerCase();
    const rest = m[2] ?? "";
    const isClose = raw.startsWith("</");
    const isSelfClosing = raw.endsWith("/>");
    if (isClose) {
      tokens.push({ kind: "close", tag });
    } else {
      const attrs: Record<string, string> = {};
      ATTR_RE.lastIndex = 0;
      let am: RegExpExecArray | null;
      while ((am = ATTR_RE.exec(rest)) !== null) {
        const name = am[1].toLowerCase();
        // 危険属性 (on*, formaction, xlink:* 等) は完全に捨てる
        if (
          name.startsWith("on") ||
          name === "formaction" ||
          name.startsWith("xlink:") ||
          name.startsWith("xml:")
        ) {
          continue;
        }
        const value = am[2] ?? am[3] ?? am[4] ?? "";
        attrs[name] = value;
      }
      const rule = RULES[tag];
      const isVoid = isSelfClosing || rule?.isVoid;
      tokens.push({ kind: isVoid ? "void" : "open", tag, attrs });
    }
    lastIndex = m.index + raw.length;
  }
  if (lastIndex < html.length) {
    tokens.push({ kind: "text", value: html.slice(lastIndex) });
  }
  return tokens;
}

/**
 * 中身ごと完全に取り除く要素 (allowlist 外でも text として残したくないもの)。
 * SVG/MATH は属性経由で onload や xlink:href = javascript: 等の XSS 経路があるため
 * テキストだけ残すのも危険。完全削除する。
 */
const DROP_BLOCKS = [
  "script",
  "style",
  "iframe",
  "object",
  "embed",
  "svg",
  "math",
  "frame",
  "frameset",
  "noscript",
  "template",
] as const;

const DROP_BLOCK_RE = new RegExp(
  `<\\s*(${DROP_BLOCKS.join("|")})\\b[\\s\\S]*?<\\/\\s*\\1\\s*>`,
  "gi",
);
/** 単発の self-closing 危険要素 (link/base/meta) */
const DROP_VOID_RE = /<\s*(link|base|meta)\b[^>]*\/?>/gi;

/**
 * 安全な HTML 部分集合に正規化して返す。
 * - 許可外タグは取り除き、子テキストだけ残す
 * - 許可外属性は捨てる
 * - <script> <style> <iframe> 等のリスクある要素は完全削除
 */
export function sanitizePostHtml(html: string): string {
  const stripped = html
    .replace(DROP_BLOCK_RE, "")
    .replace(DROP_VOID_RE, "")
    .replace(/<!--[\s\S]*?-->/g, "");

  const tokens = tokenize(stripped);
  const out: string[] = [];
  const openStack: string[] = [];

  for (const t of tokens) {
    if (t.kind === "text") {
      out.push(escapeText(t.value));
      continue;
    }
    if (t.kind === "open" || t.kind === "void") {
      const rule = RULES[t.tag];
      if (!rule) {
        // 許可外タグはタグだけ削除して中身は残す
        continue;
      }
      const safeAttrs: string[] = [];
      for (const k of rule.allowedAttrs) {
        const v = t.attrs[k];
        if (v == null) continue;
        const cleaned = v.replace(/[\r\n\t]/g, " ");
        if (k === "href") {
          const safe = safeHref(cleaned);
          if (!safe) continue;
          safeAttrs.push(`href="${escapeAttr(safe)}"`);
        } else if (k === "target") {
          if (cleaned === "_blank") {
            safeAttrs.push('target="_blank"');
          }
        } else if (k === "rel") {
          const safeRel = sanitizeRel(cleaned);
          if (safeRel) safeAttrs.push(`rel="${escapeAttr(safeRel)}"`);
        } else {
          safeAttrs.push(`${k}="${escapeAttr(cleaned.slice(0, 256))}"`);
        }
      }

      // <a target="_blank"> は rel="noopener noreferrer" を強制
      if (rule.tag === "a") {
        const hasRel = safeAttrs.some((a) => a.startsWith("rel="));
        const hasBlank = safeAttrs.some((a) => a === 'target="_blank"');
        if (hasBlank && !hasRel) {
          safeAttrs.push('rel="noopener noreferrer"');
        }
      }

      const attrStr = safeAttrs.length > 0 ? " " + safeAttrs.join(" ") : "";
      if (t.kind === "void") {
        out.push(`<${rule.tag}${attrStr} />`);
      } else {
        out.push(`<${rule.tag}${attrStr}>`);
        openStack.push(rule.tag);
      }
      continue;
    }
    if (t.kind === "close") {
      const rule = RULES[t.tag];
      if (!rule) continue;
      const idx = openStack.lastIndexOf(rule.tag);
      if (idx === -1) continue;
      while (openStack.length > idx) {
        const tag = openStack.pop()!;
        out.push(`</${tag}>`);
      }
    }
  }
  while (openStack.length > 0) {
    const tag = openStack.pop()!;
    out.push(`</${tag}>`);
  }
  return out.join("");
}
