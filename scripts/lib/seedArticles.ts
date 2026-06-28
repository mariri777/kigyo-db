/**
 * articles の seed 用ヘルパ。
 * Tiptap の JSON 表現と、それを v2 contentRenderer が描画したのに近い HTML を
 * 同じデータから生成する。
 */
import type Database from "better-sqlite3";

type Db = Database.Database;

export type SubjectKind = "company" | "industry" | "theme" | "metric";

export type Block =
  | { kind: "lead"; text: string }
  | { kind: "h2"; text: string }
  | { kind: "p"; text: string }
  | { kind: "callout"; title: string; text: string }
  | {
      kind: "table";
      caption?: string;
      headers: string[];
      rows: string[][];
    }
  | {
      kind: "stat-grid";
      items: { label: string; value: string; sub?: string }[];
    }
  | { kind: "ticker"; code: string };

export type SeedArticle = {
  slug: string;
  title: string;
  lede: string;
  categorySlug: string;
  subjectKind: SubjectKind;
  subjectRef: string;
  subjectName: string;
  heroImageKey?: string;
  heroImageAlt?: string;
  heroImageCredit?: string;
  blocks: Block[];
  tagSlugs: string[];
  companyCodes: string[];
  industrySlugs: string[];
  actions: { label: string; href: string; hint?: string }[];
  publishedAt: string; // YYYY-MM-DD
};

// ─── Tiptap JSON 生成 ─────────────────────────────────

export function toTiptapJson(blocks: Block[]): string {
  const content = blocks.map(blockToNode);
  return JSON.stringify({ type: "doc", content });
}

function blockToNode(b: Block): unknown {
  switch (b.kind) {
    case "lead":
      return { type: "lead", content: [{ type: "text", text: b.text }] };
    case "h2":
      return {
        type: "heading",
        attrs: { level: 2 },
        content: [{ type: "text", text: b.text }],
      };
    case "p":
      return { type: "paragraph", content: [{ type: "text", text: b.text }] };
    case "callout":
      return {
        type: "callout",
        attrs: { title: b.title },
        content: [
          {
            type: "paragraph",
            content: [{ type: "text", text: b.text }],
          },
        ],
      };
    case "table":
      // Tiptap StarterKit に table 拡張は入っていないため、
      // ここでは便宜上 paragraph で再現する (HTML 側で <table> として出す)
      return {
        type: "paragraph",
        content: [
          {
            type: "text",
            text: `表: ${b.caption ?? "(無題)"} — このプレビューは簡易表示です`,
          },
        ],
      };
    case "stat-grid":
      return {
        type: "statGrid",
        content: b.items.map((it) => ({
          type: "statGridItem",
          attrs: { label: it.label, sub: it.sub ?? "" },
          content: [{ type: "text", text: it.value }],
        })),
      };
    case "ticker":
      return { type: "ticker", attrs: { code: b.code } };
  }
}

// ─── HTML 生成 (派生キャッシュ用、表示は contentJson を優先) ───

export function toHtml(blocks: Block[]): string {
  return blocks.map(blockToHtml).join("\n");
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function blockToHtml(b: Block): string {
  switch (b.kind) {
    case "lead":
      return `<p data-lead="true" class="v2-lead">${escapeHtml(b.text)}</p>`;
    case "h2":
      return `<h2>${escapeHtml(b.text)}</h2>`;
    case "p":
      return `<p>${escapeHtml(b.text)}</p>`;
    case "callout":
      return `<aside data-callout="warn" data-title="${escapeHtml(b.title)}"><strong>${escapeHtml(b.title)}</strong><p>${escapeHtml(b.text)}</p></aside>`;
    case "table": {
      const head = b.headers.map((h) => `<th>${escapeHtml(h)}</th>`).join("");
      const body = b.rows
        .map(
          (r) =>
            `<tr>${r.map((c) => `<td>${escapeHtml(c)}</td>`).join("")}</tr>`,
        )
        .join("");
      const cap = b.caption ? `<caption>${escapeHtml(b.caption)}</caption>` : "";
      return `<table>${cap}<thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`;
    }
    case "stat-grid": {
      const cells = b.items
        .map(
          (it) =>
            `<div data-stat="item" data-label="${escapeHtml(it.label)}" data-sub="${escapeHtml(it.sub ?? "")}"><div>${escapeHtml(it.label)}</div><div>${escapeHtml(it.value)}</div>${it.sub ? `<div>${escapeHtml(it.sub)}</div>` : ""}</div>`,
        )
        .join("");
      return `<div data-stat-grid="true">${cells}</div>`;
    }
    case "ticker":
      return `<div data-ticker="${escapeHtml(b.code)}">[ticker code=${escapeHtml(b.code)}]</div>`;
  }
}

// ─── DB 投入 ────────────────────────────────────────────

export function insertArticles(
  db: Db,
  articles: SeedArticle[],
  authorId: number,
): void {
  // categories slug → id
  const cats = db
    .prepare("SELECT id, slug FROM categories")
    .all() as { id: number; slug: string }[];
  const catId = new Map(cats.map((c) => [c.slug, c.id]));

  for (const a of articles) {
    const categoryId = catId.get(a.categorySlug);
    if (!categoryId) throw new Error(`unknown category slug: ${a.categorySlug}`);
    const contentJson = toTiptapJson(a.blocks);
    const contentHtml = toHtml(a.blocks);
    const readMinutes = Math.max(
      1,
      Math.round(
        a.blocks
          .map((b) => {
            if (b.kind === "p" || b.kind === "lead" || b.kind === "h2")
              return b.text.length;
            if (b.kind === "callout") return b.title.length + b.text.length;
            return 30;
          })
          .reduce((s, n) => s + n, 0) / 400,
      ),
    );
    const now = new Date().toISOString();
    const actionsJson = JSON.stringify(a.actions);

    const res = db
      .prepare(
        `INSERT INTO articles (
          slug, title, lede,
          hero_image_key, hero_image_alt, hero_image_credit,
          subject_kind, subject_ref, subject_name,
          content_json, content_html, read_minutes,
          actions_json, category_id, status,
          published_at, scheduled_at, author_id,
          created_at, updated_at
        ) VALUES (?,?,?, ?,?,?, ?,?,?, ?,?,?, ?,?,?, ?,?,?, ?,?)`,
      )
      .run(
        a.slug,
        a.title,
        a.lede,
        a.heroImageKey ?? null,
        a.heroImageAlt ?? null,
        a.heroImageCredit ?? null,
        a.subjectKind,
        a.subjectRef,
        a.subjectName,
        contentJson,
        contentHtml,
        readMinutes,
        actionsJson,
        categoryId,
        "published",
        a.publishedAt,
        null,
        authorId,
        now,
        now,
      );
    const articleId = Number(res.lastInsertRowid);

    // 関連企業
    a.companyCodes.forEach((code, i) => {
      db.prepare(
        "INSERT INTO article_companies (article_id, code, position) VALUES (?,?,?)",
      ).run(articleId, code, i);
    });
    // 関連業界
    a.industrySlugs.forEach((slug, i) => {
      db.prepare(
        "INSERT INTO article_industries (article_id, industry_slug, position) VALUES (?,?,?)",
      ).run(articleId, slug, i);
    });
    // タグ (なければ作成 → article_tags 関連付け)
    for (const tagSlug of a.tagSlugs) {
      let row = db
        .prepare("SELECT id FROM tags WHERE slug = ?")
        .get(tagSlug) as { id: number } | undefined;
      if (!row) {
        const r = db
          .prepare(
            "INSERT INTO tags (slug, name, created_at) VALUES (?,?,?)",
          )
          .run(tagSlug, tagSlug, now);
        row = { id: Number(r.lastInsertRowid) };
      }
      db.prepare(
        "INSERT INTO article_tags (article_id, tag_id) VALUES (?,?)",
      ).run(articleId, row.id);
    }
  }
}

// ─── サンプル記事 10本 ──────────────────────────────────

export const sampleArticles: SeedArticle[] = [
  {
    slug: "softbank-ai-quality",
    title: "ソフトバンクGの最高益、本当に「最高益」と呼んでいいのか",
    lede:
      "通期5.7兆円。数字は派手だが、8割は時価評価益で、本業のキャッシュは前期比+2%とほぼ横ばい。表面と中身の温度差を、いつもの粒度で分けて読む。",
    categorySlug: "earnings",
    subjectKind: "company",
    subjectRef: "9984",
    subjectName: "ソフトバンクグループ",
    heroImageKey: "photo-1518770660439-4636190af475",
    heroImageCredit: "Photo · Taylor Vick / Unsplash",
    publishedAt: "2026-06-28",
    blocks: [
      {
        kind: "lead",
        text:
          "「過去最高益」と聞いて、まず最初にやることが2つある。営業キャッシュフローを開くことと、評価益の欄を見ることだ。ソフトバンクGの2026年3月期通期は、この2つを開いた瞬間に、表面の数字と話の重心がずれていた。",
      },
      {
        kind: "stat-grid",
        items: [
          { label: "通期純利益", value: "¥5.7T", sub: "前年比 +312%" },
          { label: "うち時価評価益", value: "¥4.6T", sub: "全体の 80%" },
          { label: "営業CF", value: "¥0.7T", sub: "前期比 +2%" },
          { label: "LTV (NAV比)", value: "12.4%", sub: "前期 14.8%" },
        ],
      },
      { kind: "h2", text: "数字は最高益、現金は横ばい" },
      {
        kind: "p",
        text:
          "決算説明会で孫正義会長は「AI時代の助走は終わり、いよいよ離陸期に入った」と言い切った。その言葉の力強さは置いておくとして、営業キャッシュフローを見ると7,200億円、前年比でわずか+2%。本業のキャッシュ創出は、安定はしているが、伸びてはいない。",
      },
      { kind: "ticker", code: "9984" },
      { kind: "h2", text: "Armの評価益、2.8兆円の出どころ" },
      {
        kind: "p",
        text:
          "今回の最高益のうち、Arm関連の評価益は約2.8兆円。残りはOpenAI関連、それから中国Alibabaや米系SaaSの評価益が積み上がる構図だ。",
      },
      { kind: "h2", text: "OpenAI評価益1.8兆円、危ういのはこっち" },
      {
        kind: "callout",
        title: "ここで賭けが入る",
        text:
          "OpenAI評価益は「直近ラウンドの評価額」を写しているだけだ。次回ラウンドが下がれば、同じロジックで評価損が出る。上振れも下振れも非対称ではなく、対称に効く。",
      },
      {
        kind: "p",
        text:
          "数字で言えば、保有5% × 3,800億ドル ≒ 190億ドル(約2.9兆円)が現在の簿価。前回ラウンドからの差分1.8兆円が、今期の評価益として乗っている。",
      },
    ],
    tagSlugs: ["ai-investment", "semiconductor"],
    companyCodes: ["9984"],
    industrySlugs: ["information-tech"],
    actions: [
      {
        label: "ソフトバンクGの詳細",
        href: "/v2/stocks/9984",
        hint: "PER / 株主構成 / 配当 / 10年史",
      },
      {
        label: "業界:情報・通信",
        href: "/v2/articles",
        hint: "583社の比較",
      },
      { label: "テーマ:AI投資", href: "/v2/articles", hint: "同テーマ 12本" },
    ],
  },
  {
    slug: "tel-hbm-equipment-share",
    title: "HBM3E vs HBM4 — 装置メーカー4社の取り分はどう変わるか",
    lede:
      "TSV工程の歩留り改善で東エレと愛知電機の検査需要が伸びる。SCREENとアドバンの取り分の組み替えを、工程ごとの設備投資配分で読み解く。",
    categorySlug: "theme_dive",
    subjectKind: "theme",
    subjectRef: "semiconductor",
    subjectName: "半導体",
    heroImageKey: "photo-1591488320449-011701bb6704",
    publishedAt: "2026-06-26",
    blocks: [
      {
        kind: "lead",
        text:
          "HBM4 量産が前倒しになる気配が出てきた。装置メーカー4社の取り分は、HBM3E 時代と比べて非対称に動く可能性が高い。",
      },
      { kind: "h2", text: "工程別の設備投資配分" },
      {
        kind: "p",
        text:
          "前工程はTSV (Through Silicon Via) の歩留り改善が鍵。東エレと愛知電機の検査・成膜需要が伸びる。後工程ではアドバンテスト・SCREEN の取り分が前期比で再配分される見込み。",
      },
      { kind: "ticker", code: "8035" },
      {
        kind: "stat-grid",
        items: [
          { label: "HBM3E 比率", value: "60%", sub: "2026Q1" },
          { label: "HBM4 比率", value: "8%", sub: "立ち上がり" },
          { label: "設備投資総額", value: "$48B", sub: "前年比 +28%" },
          { label: "歩留り (TSV)", value: "92%", sub: "+4pt" },
        ],
      },
      { kind: "h2", text: "取り分の組み替え" },
      {
        kind: "p",
        text:
          "歩留り改善で工程数が減ると、装置の単価ではなく台数が効く。長期契約の組み方で、SCREENが微妙に不利になるシナリオが見える。",
      },
    ],
    tagSlugs: ["hbm", "semiconductor"],
    companyCodes: ["8035"],
    industrySlugs: ["semiconductor"],
    actions: [
      { label: "東京エレクトロンの詳細", href: "/v2/stocks/8035", hint: "8035" },
      {
        label: "テーマ:半導体",
        href: "/v2/articles",
        hint: "47記事 / 32銘柄",
      },
      {
        label: "前回: HBM3E 装置別シェア",
        href: "/v2/articles",
        hint: "1ヶ月前 / 同シリーズ",
      },
    ],
  },
  {
    slug: "trading-house-q1-overview",
    title: "商社4社のQ1、資源と非資源で「読み筋」が割れた",
    lede:
      "三菱・三井・伊藤忠・住友のQ1決算が出揃った。資源価格軟化を非資源で吸収できるかが分水嶺。",
    categorySlug: "industry_overview",
    subjectKind: "industry",
    subjectRef: "trading-house",
    subjectName: "総合商社",
    heroImageKey: "photo-1554224155-6726b3ff858f",
    publishedAt: "2026-06-27",
    blocks: [
      {
        kind: "lead",
        text:
          "資源市況の天井打ちが見え始めた中、非資源セグメントの厚みが商社4社の Q1 を分けた。",
      },
      { kind: "h2", text: "セグメント別利益寄与" },
      {
        kind: "p",
        text:
          "三菱商事は天然ガス事業の貢献が継続。一方で住友商事は資源依存が高く、Q1だけ見ると利益が前年比で2割減。",
      },
      { kind: "ticker", code: "8058" },
      {
        kind: "callout",
        title: "ここで賭けが入る",
        text:
          "資源価格が再上昇すれば住友が一気に巻き返す。資源軟化が続けば伊藤忠の非資源モデルが評価される。どちらに張るかで保有比率が180度変わる。",
      },
    ],
    tagSlugs: ["resource", "consumer"],
    companyCodes: ["8058"],
    industrySlugs: ["trading"],
    actions: [
      {
        label: "業界:商社",
        href: "/v2/articles",
        hint: "総合商社 7社の横並び",
      },
      { label: "三菱商事の詳細", href: "/v2/stocks/8058", hint: "8058" },
      {
        label: "テーマ:資源市況",
        href: "/v2/articles",
        hint: "同テーマ 24本",
      },
    ],
  },
  {
    slug: "nidec-post-nagamori",
    title: "ニデック、永守体制から実質的な「ポスト永守」へ",
    lede:
      "車載モーターの構造調整に踏み込んだ。減損後の収益力は意外に底堅く、市場の織り込みは前向き不足に見える。",
    categorySlug: "earnings",
    subjectKind: "company",
    subjectRef: "6594",
    subjectName: "ニデック",
    heroImageKey: "photo-1487754180451-c456f719a1fc",
    publishedAt: "2026-06-24",
    blocks: [
      {
        kind: "lead",
        text:
          "ニデックの今期決算で目を引いたのは利益の絶対値ではなく、車載モーターセグメントの構造調整。",
      },
      { kind: "h2", text: "減損後の利益構成" },
      {
        kind: "p",
        text:
          "車載モーターの減損で前期は赤字寄りだったが、今期は構造改革後の収益力が見え始める。",
      },
      { kind: "ticker", code: "6594" },
    ],
    tagSlugs: ["ev", "governance"],
    companyCodes: ["6594"],
    industrySlugs: ["electric"],
    actions: [
      { label: "ニデックの詳細", href: "/v2/stocks/6594", hint: "6594" },
      { label: "業界:電気機器", href: "/v2/articles", hint: "248社" },
      {
        label: "テーマ:車載モーター",
        href: "/v2/articles",
        hint: "同テーマ 8本",
      },
    ],
  },
  {
    slug: "payout-ratio-primer",
    title: "配当性向の「健全な水準」は業界で全然違う",
    lede:
      "配当性向30%が普通、と言われるのは銀行・商社の話で、IT・成長企業に当てはめると意味がない。",
    categorySlug: "primer",
    subjectKind: "metric",
    subjectRef: "payout-ratio",
    subjectName: "配当性向",
    heroImageKey: "photo-1559526324-4b87b5e36e44",
    publishedAt: "2026-06-25",
    blocks: [
      {
        kind: "lead",
        text:
          "配当性向の「健全な水準」は業種で大きく違う。IT 25%と銀行 50%を同じ物差しで測ると判断を誤る。",
      },
      { kind: "h2", text: "業界別中央値" },
      {
        kind: "stat-grid",
        items: [
          { label: "銀行", value: "48%", sub: "中央値" },
          { label: "総合商社", value: "32%", sub: "中央値" },
          { label: "IT/SaaS", value: "12%", sub: "中央値" },
          { label: "東証全体", value: "31%", sub: "中央値" },
        ],
      },
      {
        kind: "p",
        text:
          "成長企業は再投資の余地が大きく、低い配当性向こそ健全。逆に成熟業種は配当性向が低すぎると資本効率の議論が立つ。",
      },
    ],
    tagSlugs: ["dividend", "primer"],
    companyCodes: [],
    industrySlugs: [],
    actions: [
      {
        label: "業界別配当性向の一覧",
        href: "/v2/articles",
        hint: "33業種の中央値",
      },
      {
        label: "トヨタの配当方針",
        href: "/v2/stocks/7203",
        hint: "総還元利回りの推移",
      },
      {
        label: "プライマー一覧",
        href: "/v2/articles",
        hint: "指標の読み方シリーズ",
      },
    ],
  },
  {
    slug: "toyota-china-shift",
    title: "トヨタ、中国EV戦略の組み替え。「BYDと組む」の意味",
    lede:
      "中国市場での販売台数減を受け、トヨタは現地パートナーシップ戦略を再構築。BYDとの提携深化が表面化。",
    categorySlug: "earnings",
    subjectKind: "company",
    subjectRef: "7203",
    subjectName: "トヨタ自動車",
    heroImageKey: "photo-1542362567-b07e54358753",
    publishedAt: "2026-06-23",
    blocks: [
      {
        kind: "lead",
        text:
          "トヨタの中国販売は前年比 -12%。これに対するトヨタの答えは、自社単独ではなく「現地と組む」だった。",
      },
      { kind: "h2", text: "BYDとの提携は何が変わるか" },
      {
        kind: "p",
        text:
          "BEV の技術供与を含む包括提携で、現地仕様車の開発期間が短縮される見込み。利益率は薄くなるが、台数は維持できるシナリオ。",
      },
      { kind: "ticker", code: "7203" },
    ],
    tagSlugs: ["ev", "china"],
    companyCodes: ["7203"],
    industrySlugs: ["auto"],
    actions: [
      { label: "トヨタの詳細", href: "/v2/stocks/7203", hint: "7203" },
      { label: "業界:輸送用機器", href: "/v2/articles", hint: "92社" },
      { label: "テーマ:中国市場", href: "/v2/articles" },
    ],
  },
  {
    slug: "tepco-restart-roe",
    title: "東京電力 vs 中部電力 — 原発再稼働で本当に勝つのは誰か",
    lede:
      "柏崎刈羽の再稼働は確実視されつつあるが、ROEで効くのは中部の浜岡。",
    categorySlug: "theme_dive",
    subjectKind: "theme",
    subjectRef: "energy",
    subjectName: "電力・送配電",
    heroImageKey: "photo-1473341304170-971dccb5ac1e",
    publishedAt: "2026-06-22",
    blocks: [
      {
        kind: "lead",
        text:
          "原発再稼働の話題が出るとき、東京電力と中部電力では「同じ再稼働」でも収益への効き方が異なる。",
      },
      { kind: "h2", text: "ROEへの効き方" },
      {
        kind: "p",
        text:
          "東電は柏崎刈羽の再稼働で固定費が改善するが、震災コストの償却が引き続き残る。中部電は浜岡の再稼働が ROE に直接効く構造。",
      },
    ],
    tagSlugs: ["energy", "dividend"],
    companyCodes: [],
    industrySlugs: ["energy"],
    actions: [
      { label: "テーマ:電力", href: "/v2/articles", hint: "18記事 / 15銘柄" },
      { label: "業界:電気・ガス", href: "/v2/articles" },
      { label: "再稼働の歴史", href: "/v2/articles" },
    ],
  },
  {
    slug: "buyback-trend-2026q1",
    title: "Q1 自社株買い、過去最大の3.4兆円。性向40%超のセクター",
    lede:
      "2026年1-3月の自社株買い発表総額は3.4兆円で四半期過去最大。総還元性向40%を超えるセクターも。",
    categorySlug: "industry_overview",
    subjectKind: "metric",
    subjectRef: "total-return-yield",
    subjectName: "総還元利回り",
    publishedAt: "2026-06-20",
    blocks: [
      {
        kind: "lead",
        text:
          "自社株買いの発表額は四半期で過去最大の3.4兆円。配当含めた総還元性向は2024年比で6pt上昇。",
      },
      { kind: "h2", text: "セクター別の総還元性向" },
      {
        kind: "stat-grid",
        items: [
          { label: "銀行", value: "62%" },
          { label: "総合商社", value: "44%" },
          { label: "情報・通信", value: "38%" },
          { label: "電気機器", value: "29%" },
        ],
      },
      {
        kind: "p",
        text:
          "銀行は資本余力の還元という流れ、商社は資源高一服を受けた還元強化。情報・通信は SBG が押し上げている。",
      },
    ],
    tagSlugs: ["dividend", "buyback"],
    companyCodes: [],
    industrySlugs: [],
    actions: [
      { label: "総還元利回り一覧", href: "/v2/articles" },
      { label: "プライマー: 配当性向", href: "/v2/articles" },
      { label: "テーマ:株主還元", href: "/v2/articles" },
    ],
  },
  {
    slug: "mitsubishi-defense-orders",
    title: "三菱重工、防衛セグメント受注前年比+34%。中計の控えめ前提が効く",
    lede:
      "防衛省の長期契約案件が今期に積み上がり、三菱重工の防衛セグメント受注は前年比+34%。",
    categorySlug: "earnings",
    subjectKind: "company",
    subjectRef: "7011",
    subjectName: "三菱重工業",
    heroImageKey: "photo-1446776877081-d282a0f896e2",
    publishedAt: "2026-06-19",
    blocks: [
      {
        kind: "lead",
        text:
          "防衛は受注の積み上がりが先行し、利益化は後追い。三菱重工の中計前提は控えめなので、上方修正余地は残る。",
      },
      { kind: "h2", text: "受注残の推移" },
      {
        kind: "stat-grid",
        items: [
          { label: "防衛 受注残", value: "¥1.8T", sub: "前年比 +42%" },
          { label: "受注/売上比", value: "2.3x" },
          { label: "営業利益率", value: "9.1%", sub: "前年 7.4%" },
          { label: "受注期間平均", value: "4.2年" },
        ],
      },
    ],
    tagSlugs: ["defense", "infrastructure"],
    companyCodes: [],
    industrySlugs: ["machinery"],
    actions: [
      { label: "三菱重工の詳細", href: "/v2/stocks/7011", hint: "7011" },
      { label: "テーマ:防衛", href: "/v2/articles" },
      { label: "業界:機械", href: "/v2/articles", hint: "234社" },
    ],
  },
  {
    slug: "first-retail-fx-headwind",
    title: "ファーストリテイリング、海外UNIQLOの粗利率に異変",
    lede:
      "北米とEUの構成比上昇で本来は上がるはずの粗利が、為替ヘッジで相殺された。",
    categorySlug: "earnings",
    subjectKind: "company",
    subjectRef: "9983",
    subjectName: "ファーストリテイリング",
    heroImageKey: "photo-1441986300917-64674bd600d8",
    publishedAt: "2026-06-18",
    blocks: [
      {
        kind: "lead",
        text:
          "ファストリの今四半期 EPS はコンセンサスを3%下振れ。原因は為替ヘッジで、構造ではない。",
      },
      { kind: "h2", text: "為替ヘッジの効き方" },
      {
        kind: "p",
        text:
          "ドル建ての仕入を円高方向にヘッジしていたが、円安基調が続いた結果ヘッジコストが粗利を圧迫した形。",
      },
      {
        kind: "callout",
        title: "ここで賭けが入る",
        text:
          "為替前提が来期で正常化すれば、粗利率は反発する。今の下振れは構造ではなく一時要因と見るのが筋。",
      },
    ],
    tagSlugs: ["retail", "fx"],
    companyCodes: ["9983"],
    industrySlugs: ["retail"],
    actions: [
      {
        label: "ファーストリテイリングの詳細",
        href: "/v2/stocks/9983",
        hint: "9983",
      },
      { label: "業界:小売", href: "/v2/articles", hint: "320社" },
      { label: "テーマ:為替", href: "/v2/articles" },
    ],
  },
];
