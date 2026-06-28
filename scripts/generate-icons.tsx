import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

/**
 * 超!企業DB のファビコン生成。
 *
 * コンセプト: サイト名のシグネチャ「超!」をそのままアイコンに。
 *   - 黒プレート (#0a0a0a) = SITE_THEME_COLOR と一致、サイト chrome の地と揃う
 *   - 白の「超」 = 強い情報量、判別性
 *   - 緑の「!」 (#10b981) = v2 のアクセントカラー (BrandMark の貫通線と同色)。
 *     文字としての視覚的な「とんがり」と、emerald のアクセントを一致させる。
 *
 * 角丸はあえて付けない。
 * - icon-32  : ブラウザタブはそもそも角丸不要
 * - icon-192 / icon-512: PWA は purpose:"any" 扱いで OS 側がそのまま使う
 * - apple-icon : iOS が自動で squircle マスクを当てるので二重に丸まる事故を避ける
 */

const PUBLIC_DIR = join(process.cwd(), "public");

const COLORS = {
  plate: "#0a0a0a",
  kanji: "#fafafa",
  bang: "#10b981",
} as const;

async function loadFont(): Promise<ArrayBuffer> {
  // 旧 CSS API + 旧 UA で TTF(truetype) サブセットを取得。next/og の Node 版は woff2 を読めない。
  // 「超」と「!」(半角 U+0021) のサブセットだけを引く。
  // フォントは RocknRoll One: 太めゴシックでロックなキャラクター。
  // 「超!」のシグネチャー感をブラウザタブサイズでも保てる重さがある。
  const text = encodeURIComponent("超!");
  const cssUrl = `https://fonts.googleapis.com/css?family=RocknRoll+One&text=${text}`;
  const css = await fetch(cssUrl, {
    headers: { "User-Agent": "Mozilla/4.0" },
  }).then((r) => r.text());
  const match = css.match(/url\((https:[^)]+)\)\s+format\('truetype'\)/);
  if (!match) throw new Error("TTF font url not found in Google Fonts CSS");
  return fetch(match[1]).then((r) => r.arrayBuffer());
}

type Spec = {
  file: string;
  size: number;
  /** 文字サイズの調整係数 (size に対する比率)。 */
  fontRatio: number;
};

async function render(spec: Spec, fontData: ArrayBuffer) {
  const fontSize = Math.round(spec.size * spec.fontRatio);

  // Satori の alignItems:center は EM box (アセンダ/ディセンダ込み) で中央を計算する。
  // 和文は EM box の上側に余白があるので、純粋な center だと描画ピクセルが下に寄る。
  // paddingBottom で文字を上に押し戻し、視覚中心をプレート中心に合わせる。
  // (補正量はフォントの EM 設計依存。フォントを差し替えたら再調整する)
  const verticalNudge = Math.round(fontSize * 0.13);
  // 「超」は左下に画 (走) が広がり、相対的に「!」は細いので、塊の視覚重心が左寄り
  // になる。paddingLeft で塊全体を右に押し戻して横方向の視覚中心を取る。
  const horizontalNudge = Math.round(fontSize * 0.08);

  const response = new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: COLORS.plate,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            fontFamily: "RocknRollOne",
            fontSize,
            fontWeight: 400,
            lineHeight: 1,
            paddingBottom: verticalNudge,
            paddingLeft: horizontalNudge,
          }}
        >
          {/* 「超」を「!」より大きくして、サイト名のシグネチャ感をさらに立てる。
              marginRight を負にして「!」との隙間を少し詰める。 */}
          <span
            style={{
              color: COLORS.kanji,
              fontSize: Math.round(fontSize * 1.25),
              marginRight: -Math.round(fontSize * 0.05),
            }}
          >
            超
          </span>
          {/*
            「!」だけ右斜めに傾けて少し大きく。
            transform は box の占有領域に影響しないので、塊全体の幅は変わらない。
            transformOrigin を中央に置いてバランス維持。
          */}
          <span
            style={{
              color: COLORS.bang,
              fontSize: Math.round(fontSize * 1.15),
              transform: "rotate(7.5deg)",
              transformOrigin: "50% 50%",
              display: "flex",
            }}
          >
            !
          </span>
        </div>
      </div>
    ),
    {
      width: spec.size,
      height: spec.size,
      fonts: [
        {
          name: "RocknRollOne",
          data: fontData,
          weight: 400,
          style: "normal",
        },
      ],
    },
  );
  const buf = Buffer.from(await response.arrayBuffer());
  const out = join(PUBLIC_DIR, spec.file);
  await writeFile(out, buf);
  console.log(`  ${spec.file}  ${spec.size}x${spec.size}  ${buf.byteLength.toLocaleString()} B`);
}

async function main() {
  console.log("fetching RocknRoll One …");
  const fontData = await loadFont();
  console.log(`  font: ${fontData.byteLength.toLocaleString()} B`);
  console.log("writing icons …");
  // fontRatio はプレート幅に対する文字サイズ比。
  // RocknRoll One はストロークが太く、0.55 程度でプレートに収まる。
  await render({ file: "icon-32.png", size: 32, fontRatio: 0.55 }, fontData);
  await render({ file: "icon-192.png", size: 192, fontRatio: 0.55 }, fontData);
  await render({ file: "icon-512.png", size: 512, fontRatio: 0.55 }, fontData);
  await render({ file: "apple-icon.png", size: 180, fontRatio: 0.55 }, fontData);
  console.log("done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
