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
// ─── サンプル記事 10本 (拡張版: 読み応えのある本文) ───

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
      {
        kind: "p",
        text:
          "では、なぜ最終利益が4倍以上になるのか。答えは単純で、2024年に米国会計基準を採用して以降、保有する株式や債券の時価評価が、そのまま損益計算書の利益に流れ込む構造になっているからだ。これは別に新しい話ではなく、SBGの利益はこの数年、ずっとこの構造で語られている。",
      },
      {
        kind: "p",
        text:
          "ここで重要なのは、評価益は「売って初めて現金になる」性質だということ。実際に現金が動いていない以上、自社株買いや配当の原資にはなりにくい。今期の自社株買い枠が前年比で増えていないのも、この事情と無関係ではない。",
      },
      { kind: "ticker", code: "9984" },
      { kind: "h2", text: "Armの評価益、2.8兆円の出どころ" },
      {
        kind: "p",
        text:
          "今回の最高益のうち、Arm関連の評価益は約2.8兆円。残りはOpenAI関連、それから中国Alibabaや米系SaaSの評価益が積み上がる構図だ。Armを売れば現金になるが、売った瞬間にAI投資のストーリーは崩れる。今のSBGは「Armを売らないことで価値を作っている」フェーズに入っている、という言い方が一番しっくりくる。",
      },
      {
        kind: "p",
        text:
          "ただし、評価益の中身が「数字遊び」かというと、そうでもない。Arm単体のFY2026 Q4売上は前年比+39%、ロイヤリティ売上は+47%。AIサーバ向けのCSS(Compute Subsystems)ライセンスが効いている。契約された実需が、評価額に追いついてきた、というのが正確だろう。",
      },
      {
        kind: "table",
        caption: "Arm セグメント別売上 (FY2026 通期、概算 / 百万ドル)",
        headers: ["セグメント", "売上", "前年比", "コメント"],
        rows: [
          ["ライセンス", "1,840", "+22%", "AIサーバ向け CSS の長期契約が積み上がる"],
          ["ロイヤリティ", "2,420", "+47%", "v9 比率上昇 (40% → 60% 目線)"],
          ["その他", "180", "+9%", "サポート・教育"],
          ["合計", "4,440", "+34%", "—"],
        ],
      },
      {
        kind: "p",
        text:
          "Arm の PER は 70 倍超だが、ロイヤリティ売上が+47%で伸び続けている限り、「成長で説明できる範囲」と言えなくはない。一方で、AI 投資バブルへの警戒感が市場全体に出てくると、最初に売られるのもこの手の高 PER 銘柄だ。Arm の評価益が SBG の決算を支えている以上、Arm 株の下落は SBG の決算にそのまま跳ね返る。",
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
          "数字で言えば、保有5% × 3,800億ドル ≒ 190億ドル(約2.9兆円)が現在の簿価。前回ラウンドからの差分1.8兆円が、今期の評価益として乗っている。仮にOpenAIの次回ラウンドが評価額の引き下げで終われば、1兆円規模の評価損が一発で来る計算になる。",
      },
      { kind: "h2", text: "市場が見ているのは「次の現金化」" },
      {
        kind: "p",
        text:
          "決算翌日のSBG株は+0.8%。最高益にしては鈍い反応で、市場は「数字より、次に何を売るか」を見ている。Arm の追加売却か、OpenAI 株式の一部売却か、Alibaba の処分か。どれも「現金化のタイミング」次第で、今期の利益とは別軸で株価が動く要素になる。",
      },
      {
        kind: "p",
        text:
          "結論として、今期の「過去最高益」は事実だが、その大部分が時価評価で、本業のキャッシュは横ばい。AI 投資のストーリーが続く限り評価益は維持されるが、何かが折れた瞬間に同じ仕組みで反対側に振れる。SBG をどう見るかは、結局のところ「Arm と OpenAI を信じるか」の問題に収束する。",
      },
    ],
    tagSlugs: ["ai-investment", "semiconductor"],
    companyCodes: ["9984"],
    industrySlugs: ["information-tech"],
    actions: [],
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
      {
        kind: "stat-grid",
        items: [
          { label: "HBM3E 比率", value: "60%", sub: "2026Q1" },
          { label: "HBM4 比率", value: "8%", sub: "立ち上がり" },
          { label: "設備投資総額", value: "$48B", sub: "前年比 +28%" },
          { label: "歩留り (TSV)", value: "92%", sub: "+4pt" },
        ],
      },
      { kind: "h2", text: "工程別の設備投資配分" },
      {
        kind: "p",
        text:
          "HBM は通常の DRAM と違い、TSV (Through Silicon Via) という縦方向の配線工程が品質を決める。ここの歩留りが 90% を超えるか超えないかで、装置メーカーが受注できる規模が一桁変わる。今期は SK Hynix と Micron が TSV 歩留りを 92% まで上げてきており、装置発注の質が変わっている。",
      },
      {
        kind: "p",
        text:
          "前工程は東エレと愛知電機の検査・成膜需要が伸びる。後工程ではアドバンテスト・SCREEN の取り分が前期比で再配分される見込み。装置発注は受注から納入まで 9〜12 ヶ月のリードタイムがあるため、今期の発注は 2027 年の収益に効いてくる。",
      },
      { kind: "ticker", code: "8035" },
      {
        kind: "table",
        caption: "HBM 装置メーカー 4社の受注前提 (FY2026 推定)",
        headers: ["企業", "受注 (億円)", "前年比", "主領域"],
        rows: [
          ["東京エレクトロン", "8,400", "+18%", "成膜・エッチング"],
          ["SCREEN", "3,200", "+7%", "洗浄"],
          ["アドバンテスト", "5,100", "+24%", "テスタ"],
          ["愛知電機", "1,200", "+38%", "検査・搬送"],
        ],
      },
      { kind: "h2", text: "HBM4 で何が変わるか" },
      {
        kind: "p",
        text:
          "HBM4 ではバスを 2,048-bit に倍増させる仕様変更が入る。これにより、メモリスタックの組み付け工程が複雑化し、組立・検査工程の単価が 1.4 倍程度に上がる見込み。装置1台あたりの売価が上がる一方で、台数は HBM3E から横ばい。「単価アップ × 台数横ばい」の構図は SCREEN にとっては逆風だ。",
      },
      {
        kind: "callout",
        title: "ここで賭けが入る",
        text:
          "HBM4 量産が 2027 上期にずれ込めば、その分の設備投資は 2027 年に集中する。先回りで装置を発注している東エレの戦略が当たれば一強の構図になるが、ずれ込めば「先行投資した分の在庫」を抱える。",
      },
      { kind: "h2", text: "投資判断: 装置メーカーは年内に決まる" },
      {
        kind: "p",
        text:
          "HBM4 量産のタイミングを最初に発表するのは TSMC か Hynix のどちらかになる。その発表のタイミングで、装置メーカーの株価は一気に動く。今は東エレが先行しているが、SCREEN は逆に「割安側」として見るタイミングが来るかもしれない。",
      },
    ],
    tagSlugs: ["hbm", "semiconductor"],
    companyCodes: ["8035"],
    industrySlugs: ["semiconductor"],
    actions: [],
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
          "資源市況の天井打ちが見え始めた中、非資源セグメントの厚みが商社4社の Q1 を分けた。三菱と伊藤忠が予想を超え、住友はやや力不足。",
      },
      { kind: "h2", text: "Q1 純利益の比較" },
      {
        kind: "stat-grid",
        items: [
          { label: "三菱商事", value: "¥234B", sub: "前年比 +8%" },
          { label: "三井物産", value: "¥198B", sub: "+3%" },
          { label: "伊藤忠商事", value: "¥218B", sub: "+12%" },
          { label: "住友商事", value: "¥142B", sub: "-9%" },
        ],
      },
      {
        kind: "p",
        text:
          "三菱商事は天然ガス事業の貢献が継続。LNG 長期契約が円安効果も乗ってドル建てで増益。一方で住友商事は資源依存が高く、Q1だけ見ると利益が前年比で2割減。住友は「次の事業の柱」を作り切れていない、という構造的な弱さがそのまま出た形だ。",
      },
      {
        kind: "p",
        text:
          "伊藤忠の強さは非資源比率の高さに尽きる。CITIC への持分法投資、ファミマ事業、繊維・食料の安定。資源価格に左右されない収益体質が、Q1 のような市況変動局面で効いてくる。",
      },
      { kind: "ticker", code: "8058" },
      { kind: "h2", text: "セグメント別の利益寄与" },
      {
        kind: "table",
        caption: "セグメント別の利益貢献 (Q1, 主要セグメントのみ / 億円)",
        headers: ["企業", "資源", "非資源", "資源/全体"],
        rows: [
          ["三菱商事", "1,420", "920", "61%"],
          ["三井物産", "1,180", "800", "60%"],
          ["伊藤忠商事", "640", "1,540", "29%"],
          ["住友商事", "920", "500", "65%"],
        ],
      },
      {
        kind: "callout",
        title: "ここで賭けが入る",
        text:
          "資源価格が再上昇すれば住友が一気に巻き返す。資源軟化が続けば伊藤忠の非資源モデルが評価される。どちらに張るかで保有比率が180度変わる。",
      },
      { kind: "h2", text: "投資判断" },
      {
        kind: "p",
        text:
          "PER で見ると 4 社とも 10 倍前後、株価指標的にはどれも割安。ただし還元方針が会社ごとに違う。三菱と伊藤忠は自社株買い枠を拡大、三井と住友は据え置き。総還元利回りで見れば三菱・伊藤忠が頭一つ抜けている。",
      },
      {
        kind: "p",
        text:
          "短期で見れば資源軟化のシナリオに沿って伊藤忠優位だが、長期で見ると三菱の安定感が買われやすい。住友はバリュー狙いで「割安の罠」を承知の上で入るならアリだが、構造改革のニュースが出るまで上値は重い。",
      },
    ],
    tagSlugs: ["resource", "consumer"],
    companyCodes: ["8058"],
    industrySlugs: ["trading"],
    actions: [],
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
          "ニデックの今期決算で目を引いたのは利益の絶対値ではなく、車載モーターセグメントの構造調整に踏み込んだという経営判断のほう。",
      },
      { kind: "h2", text: "減損後の利益構成" },
      {
        kind: "stat-grid",
        items: [
          { label: "通期純利益", value: "¥420B", sub: "前年比 -32%" },
          { label: "車載減損", value: "¥240B", sub: "一時要因" },
          { label: "実質純利益", value: "¥660B", sub: "減損戻し後" },
          { label: "ROE", value: "11.8%", sub: "前年 14.2%" },
        ],
      },
      {
        kind: "p",
        text:
          "車載モーターの減損で前期は赤字寄りだったが、今期は構造改革後の収益力が見え始める。減損を除外した実質利益は 6,600 億円程度で、これは過去最高益圏に近い。市場はこの「減損後の本来の収益力」を見落としている節がある。",
      },
      {
        kind: "p",
        text:
          "永守重信会長の発言の語調も変わってきた。前期までの「目標必達」の強い言い回しから、「事業の再構築には時間がかかる」という現実主義に近いトーンに。ポスト永守体制の準備が、財務だけでなく言葉のレベルでも進んでいる。",
      },
      { kind: "ticker", code: "6594" },
      { kind: "h2", text: "車載モーターの構造改革" },
      {
        kind: "p",
        text:
          "中国 EV 向けの車載モーターは、過剰生産能力と価格競争に巻き込まれていた。今回の減損は中国メキシコ拠点の固定資産を一気に償却する判断で、来期以降の減価償却負担が大きく減る。これがそのまま営業利益率の改善につながる。",
      },
      {
        kind: "table",
        caption: "車載モーター セグメント別の見通し (FY2027)",
        headers: ["セグメント", "売上", "営業利益率", "コメント"],
        rows: [
          ["小型モーター", "¥1.2T", "12%", "安定収益源"],
          ["車載", "¥640B", "5%", "減損後で利益率回復"],
          ["家電", "¥420B", "9%", "横ばい"],
          ["産機・商業", "¥380B", "11%", "AI データセンタ向けが伸長"],
        ],
      },
      {
        kind: "callout",
        title: "ここで賭けが入る",
        text:
          "中国 EV 市場の価格競争が落ち着けば、車載モーターの利益率は回復する。逆に競争激化が続けば、追加減損のリスクは残る。「もう底」と見るか「まだ底ではない」と見るかの分岐。",
      },
      { kind: "h2", text: "投資判断: バリュー狙いのチャンス" },
      {
        kind: "p",
        text:
          "PER は減損後の利益で見ると 8 倍前後、PBR も 1.2 倍と過去 10 年で最低水準。アナリストコンセンサスはまだ慎重だが、構造改革が一巡したタイミングで再評価が入りやすい。配当方針も維持されており、待っている間の利回りも悪くない。",
      },
    ],
    tagSlugs: ["ev", "governance"],
    companyCodes: ["6594"],
    industrySlugs: ["electric"],
    actions: [],
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
          "配当性向 = 配当総額 / 当期純利益。シンプルな指標だが、業種を超えて比較するとミスリードを起こしやすい。理由は2つある: (1) 業界によって「再投資の必要量」が違う、(2) 資本構成 (借入 vs 自己資本) で還元の余地が変わる。",
      },
      { kind: "h2", text: "成長企業に高い配当性向は不健全" },
      {
        kind: "p",
        text:
          "IT/SaaS の中央値が 12% なのは、利益のほとんどを再投資に回すから。逆に SaaS で配当性向 50% という会社があったら「成長余地が無くなった」と読むのが普通だ。Microsoft や Google でさえ、配当性向はそれぞれ 25%、20% 程度。",
      },
      {
        kind: "callout",
        title: "ここで賭けが入る",
        text:
          "成長余地のない企業が高配当性向を出し続けても、それは「資本効率を諦めている」と読める。逆に成熟業種で低すぎる配当性向は「内部留保の使途が見えない」と批判される。",
      },
      { kind: "h2", text: "業種別の妥当な水準" },
      {
        kind: "table",
        caption: "業種別 配当性向の妥当ゾーン (一般論)",
        headers: ["業種", "妥当ゾーン", "理由"],
        rows: [
          ["銀行", "40-60%", "新規投資が少ない、自己資本規制で利益は還元しやすい"],
          ["商社", "30-40%", "資源投資の継続が必要、ただし安定収益部分は還元"],
          ["不動産", "60-80%", "REIT 型で利益の大半を分配する構造"],
          ["IT/SaaS", "0-20%", "再投資が主、配当は補助的"],
          ["小売", "25-40%", "出店投資と還元のバランス"],
          ["製薬", "30-50%", "新薬投資のサイクルに依存"],
        ],
      },
      { kind: "h2", text: "実例で見る: ファーストリテイリングの配当性向" },
      {
        kind: "p",
        text:
          "ファーストリテイリングの配当性向は 30% 前後で長らく安定している。小売としては平均よりやや低いが、海外出店投資を継続している企業としては妥当な水準。仮にこれが 50% に上がれば、それは「海外展開の打ち止め」のサインと読める。",
      },
      {
        kind: "p",
        text:
          "数字を見るときは、必ず「業界平均」と「自社過去5年平均」の両方と比較すること。一つの数字を絶対値で評価しても、何も分からない。",
      },
    ],
    tagSlugs: ["dividend", "primer"],
    companyCodes: [],
    industrySlugs: [],
    actions: [],
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
      {
        kind: "stat-grid",
        items: [
          { label: "中国販売台数", value: "1.42M", sub: "前年比 -12%" },
          { label: "中国市場シェア", value: "5.8%", sub: "前年 6.4%" },
          { label: "BEV 構成比", value: "8%", sub: "前年 4%" },
          { label: "中国営業利益", value: "¥820B", sub: "前年比 -18%" },
        ],
      },
      { kind: "h2", text: "BYDとの提携は何が変わるか" },
      {
        kind: "p",
        text:
          "BEV の技術供与を含む包括提携で、現地仕様車の開発期間が短縮される見込み。利益率は薄くなるが、台数は維持できるシナリオ。トヨタにとっては利益率の犠牲を払ってでも中国市場での存在感を保つ、という戦略的判断だ。",
      },
      {
        kind: "p",
        text:
          "提携の中身は (1) BYD の Blade Battery を採用した中国向け BEV を共同開発、(2) 上海拠点を共用してコスト構造を最適化、(3) BYD の販売ネットワークの一部を活用、の 3 点。実質的には「BYD ブランドではないが BYD の中身が入った車」を売る形になる。",
      },
      { kind: "ticker", code: "7203" },
      { kind: "h2", text: "他地域への影響は限定的" },
      {
        kind: "p",
        text:
          "日本・北米・欧州市場では引き続きトヨタ独自のハイブリッド戦略を維持。BYD 提携は中国市場限定の戦術と位置付ける。これは「トヨタが BEV に舵を切った」という解釈とは違う。",
      },
      {
        kind: "table",
        caption: "地域別の販売台数推移 (千台、トヨタ単体)",
        headers: ["地域", "前期", "今期", "前年比"],
        rows: [
          ["日本", "1,420", "1,480", "+4%"],
          ["北米", "2,310", "2,420", "+5%"],
          ["欧州", "1,180", "1,210", "+3%"],
          ["中国", "1,610", "1,420", "-12%"],
          ["その他", "2,840", "2,920", "+3%"],
        ],
      },
      {
        kind: "callout",
        title: "ここで賭けが入る",
        text:
          "BYD 提携で中国市場のシェアが下げ止まるかは、来年の四半期決算次第。下げ止まれば「正しい判断」、下げ続ければ「BYD に飲み込まれる」シナリオもありうる。",
      },
      { kind: "h2", text: "投資判断: 中国減速を「もう織り込み済み」で見る" },
      {
        kind: "p",
        text:
          "トヨタ株は中国販売減のニュースをすでに織り込んでおり、年初来でも横ばい圏。北米市場の伸びと、配当利回り 2.4% という安定感で底堅さは保たれている。中国の下げ止まりが明確になれば、再評価のタイミング。",
      },
    ],
    tagSlugs: ["ev", "china"],
    companyCodes: ["7203"],
    industrySlugs: ["auto"],
    actions: [],
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
        kind: "stat-grid",
        items: [
          { label: "東電 ROE", value: "4.2%", sub: "再稼働前提" },
          { label: "中電 ROE", value: "9.8%", sub: "再稼働前提" },
          { label: "東電 PBR", value: "0.6倍" },
          { label: "中電 PBR", value: "1.0倍" },
        ],
      },
      {
        kind: "p",
        text:
          "東電は柏崎刈羽の再稼働で固定費が改善するが、震災コストの償却が引き続き残る。中部電は浜岡の再稼働が ROE に直接効く構造。同じ再稼働でも、片や「赤字を黒字に近づける」、片や「黒字をさらに上げる」という効き方の違い。",
      },
      { kind: "h2", text: "燃料費の節約効果" },
      {
        kind: "p",
        text:
          "原発1基あたりの燃料費節約額は年間 800〜1,200 億円。中部電は浜岡 3 号機・4 号機が再稼働すれば 2,000 億円規模の節約。東電も柏崎刈羽 6・7 号機で同水準の節約が見込めるが、これは「過去の高コスト火力発電からの転換」というだけで、新規収益にはならない。",
      },
      {
        kind: "table",
        caption: "再稼働シナリオの利益インパクト (年額、億円)",
        headers: ["項目", "東京電力", "中部電力"],
        rows: [
          ["燃料費節約", "+1,800", "+2,000"],
          ["減価償却負担", "-600", "-200"],
          ["賠償・廃炉費", "-1,200", "—"],
          ["純利益インパクト", "+0", "+1,800"],
        ],
      },
      {
        kind: "callout",
        title: "ここで賭けが入る",
        text:
          "東電の再稼働は「赤字解消」のシナリオで、ストーリーは強い。中部電の再稼働は「ROE 上振れ」で実利が大きい。ストーリーを買うか、実利を買うか。",
      },
      { kind: "h2", text: "投資判断" },
      {
        kind: "p",
        text:
          "短期的な株価インパクトは東電のほうが大きい (再稼働ニュース自体のサプライズが強い)。ただし長期で見れば、中部電の方が利益と株価の整合が取れる。配当再開のタイミングも中部電が先になる公算が大きい。",
      },
    ],
    tagSlugs: ["energy", "dividend"],
    companyCodes: [],
    industrySlugs: ["energy"],
    actions: [],
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
          "自社株買いの発表額は四半期で過去最大の3.4兆円。配当含めた総還元性向は2024年比で6pt上昇。市場のテーマが「成長」から「還元」に明確に切り替わってきている。",
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
          "銀行は資本余力の還元という流れ。バーゼル規制の改定で必要 CET1 比率が安定し、超過資本を株主に返す動きが本格化した。商社は資源高一服を受けた還元強化で、PBR 1 倍割れ脱却を意識した動き。情報・通信は SBG が押し上げているが、他の通信キャリアも追随する気配がある。",
      },
      { kind: "h2", text: "個別の自社株買い発表 (Q1 上位)" },
      {
        kind: "table",
        caption: "Q1 自社株買い発表額 上位5社 (億円)",
        headers: ["企業", "発表額", "発行済比", "備考"],
        rows: [
          ["三菱UFJ", "5,000", "3.8%", "通期 1兆円計画の一部"],
          ["トヨタ", "4,500", "1.4%", "業績連動"],
          ["三菱商事", "3,200", "3.1%", "PBR 1倍維持"],
          ["NTT", "3,000", "1.0%", "通信キャリア最大"],
          ["伊藤忠", "2,400", "3.2%", "総還元 40% 目標"],
        ],
      },
      { kind: "h2", text: "総還元性向 30% は新しい床" },
      {
        kind: "p",
        text:
          "東証の PBR 1 倍割れ企業への圧力 (2023 年〜) が、今やほぼ全業種に「総還元性向 30% は最低限」という空気を作った。3% 配当 + 1% 自社株買い = 総還元利回り 4% という構造が、東証プライムの中央値になりつつある。",
      },
      {
        kind: "callout",
        title: "ここで賭けが入る",
        text:
          "総還元利回りが 5% を超えた銘柄は、利下げ局面で買われやすい。金利上昇局面でも 4% を維持できれば下値が固い。「総還元 4% 以上」のスクリーニングは、現状の市場で最も実用的。",
      },
      { kind: "h2", text: "投資判断のヒント" },
      {
        kind: "p",
        text:
          "総還元性向だけ見て買うと罠にハマる。「配当性向 + 自社株買い」のうち、自社株買いは経営判断で来期止めることができる。安定して還元する銀行・商社と、業績連動で動く製造業を区別すること。",
      },
    ],
    tagSlugs: ["dividend", "buyback"],
    companyCodes: [],
    industrySlugs: [],
    actions: [],
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
      {
        kind: "p",
        text:
          "防衛省の防衛装備の長期契約案件が積み上がる。注目は次期戦闘機 (GCAP)、宇宙関連、誘導弾。これら 3 分野で受注残全体の 60% を占める。長期契約は通常 5〜10 年で売上が分散するため、受注残 2.3 倍は「向こう 2 年分の売上が確保されている」状態を意味する。",
      },
      {
        kind: "p",
        text:
          "中計では防衛セグメントの利益率を 8% で見ている。実際は今期 9.1% を達成しており、来期以降の上方修正が現実的になってきた。",
      },
      { kind: "h2", text: "セグメント別の利益寄与" },
      {
        kind: "table",
        caption: "セグメント別 (Q1 / 億円)",
        headers: ["セグメント", "売上", "営業利益", "前年比"],
        rows: [
          ["エナジー", "3,200", "280", "+8%"],
          ["プラント・インフラ", "2,800", "180", "+12%"],
          ["物流・冷熱", "1,200", "100", "+5%"],
          ["航空・防衛・宇宙", "2,400", "220", "+34%"],
        ],
      },
      {
        kind: "callout",
        title: "ここで賭けが入る",
        text:
          "防衛予算の枠は政治的にコミットされており、向こう 5 年は減らない前提。一方で、次期戦闘機の予算配分や、米国との共同開発の進捗で、収益のタイミングは前後する。",
      },
      { kind: "h2", text: "投資判断: 中計の保守的前提が買い材料" },
      {
        kind: "p",
        text:
          "三菱重工の株価は年初来 +28%。市場は防衛テーマでの上振れを既に評価しているが、中計の利益率前提が 8% で固定されているため、上方修正の余地はまだ残っている。下値は配当利回り 1.8% と自社株買いで支えられる構造。",
      },
    ],
    tagSlugs: ["defense", "infrastructure"],
    companyCodes: [],
    industrySlugs: ["machinery"],
    actions: [],
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
      { kind: "h2", text: "EPS 下振れの内訳" },
      {
        kind: "stat-grid",
        items: [
          { label: "EPS 実績", value: "¥1,420", sub: "コンセンサス -3%" },
          { label: "海外売上比率", value: "62%", sub: "前年 58%" },
          { label: "海外粗利率", value: "48%", sub: "前年 52%" },
          { label: "ヘッジ損失", value: "¥18B", sub: "為替評価" },
        ],
      },
      {
        kind: "p",
        text:
          "海外売上比率が上がり、本来なら粗利率は改善するはずだった。ところが、ドル建ての仕入を円高方向にヘッジしていたが、円安基調が続いた結果、ヘッジコストが粗利を圧迫した形。",
      },
      { kind: "ticker", code: "9983" },
      { kind: "h2", text: "為替ヘッジの効き方" },
      {
        kind: "p",
        text:
          "ファストリは過去 3 年で円高方向のヘッジを段階的に積んでいた。これは仕入原価を安定させる目的だったが、結果として円安局面でヘッジ評価損が膨らむ。来期はヘッジ期間が満了し、自然と影響は剥落する見込み。",
      },
      {
        kind: "table",
        caption: "地域別の粗利率推移 (UNIQLO)",
        headers: ["地域", "前期", "今期", "差分"],
        rows: [
          ["日本", "53.2%", "53.8%", "+0.6pt"],
          ["大中華圏", "50.1%", "49.4%", "-0.7pt"],
          ["北米", "48.4%", "46.2%", "-2.2pt"],
          ["EU", "49.6%", "47.8%", "-1.8pt"],
        ],
      },
      {
        kind: "callout",
        title: "ここで賭けが入る",
        text:
          "為替前提が来期で正常化すれば、粗利率は反発する。今の下振れは構造ではなく一時要因と見るのが筋。",
      },
      { kind: "h2", text: "投資判断" },
      {
        kind: "p",
        text:
          "決算翌日の株価反応は -5%。市場は「ヘッジ要因」を構造問題と取り違えて売っている可能性が高い。海外出店ペースは維持、北米の店舗あたり売上は前年比 +12%。中身は健全。為替正常化を待てるなら、押し目の典型。",
      },
    ],
    tagSlugs: ["retail", "fx"],
    companyCodes: ["9983"],
    industrySlugs: ["retail"],
    actions: [],
  },
];
