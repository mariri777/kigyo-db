import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

const PUBLIC_DIR = join(process.cwd(), "public");

async function loadNotoSansJpBlack(): Promise<ArrayBuffer> {
  // 旧 CSS API + 旧 UA で TTF(truetype) サブセットを取得。next/og の Node 版は woff2 を読めない。
  const cssUrl = "https://fonts.googleapis.com/css?family=Noto+Sans+JP:900&text=%E8%B6%85";
  const css = await fetch(cssUrl, {
    headers: { "User-Agent": "Mozilla/4.0" },
  }).then((r) => r.text());
  const match = css.match(/url\((https:[^)]+)\)\s+format\('truetype'\)/);
  if (!match) throw new Error("TTF font url not found in Google Fonts CSS");
  return fetch(match[1]).then((r) => r.arrayBuffer());
}

type Spec = {
  file: string;
  width: number;
  height: number;
  fontSize: number;
  borderRadius?: number;
};

async function render(spec: Spec, fontData: ArrayBuffer) {
  const response = new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0a0a0a",
          ...(spec.borderRadius ? { borderRadius: spec.borderRadius } : {}),
        }}
      >
        <div
          style={{
            display: "flex",
            fontFamily: "NotoSansJP",
            fontSize: spec.fontSize,
            fontWeight: 900,
            color: "#fafafa",
            lineHeight: 1,
            marginTop: 4,
          }}
        >
          超
        </div>
      </div>
    ),
    {
      width: spec.width,
      height: spec.height,
      fonts: [
        {
          name: "NotoSansJP",
          data: fontData,
          weight: 900,
          style: "normal",
        },
      ],
    },
  );
  const buf = Buffer.from(await response.arrayBuffer());
  const out = join(PUBLIC_DIR, spec.file);
  await writeFile(out, buf);
  console.log(`  ${spec.file}  ${spec.width}x${spec.height}  ${buf.byteLength.toLocaleString()} B`);
}

async function main() {
  console.log("fetching Noto Sans JP Black …");
  const fontData = await loadNotoSansJpBlack();
  console.log(`  font: ${fontData.byteLength.toLocaleString()} B`);
  console.log("writing icons …");
  await render({ file: "icon-32.png", width: 32, height: 32, fontSize: 30 }, fontData);
  await render({ file: "icon-192.png", width: 192, height: 192, fontSize: 180 }, fontData);
  await render({ file: "icon-512.png", width: 512, height: 512, fontSize: 480 }, fontData);
  await render(
    { file: "apple-icon.png", width: 180, height: 180, fontSize: 170, borderRadius: 40 },
    fontData,
  );
  console.log("done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
