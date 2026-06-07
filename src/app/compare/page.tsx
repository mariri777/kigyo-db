import { CompareView } from "@/components/CompareView";

export const metadata = {
  title: "銘柄を並べて比較",
  description:
    "最大 3 銘柄を選んで、基本情報・AI 評価・指標・成長フェーズ・リスクプロファイルを横並びで確認。違いを自動抽出。",
};

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<{ codes?: string }>;
}) {
  const { codes } = await searchParams;
  const initialCodes = codes
    ? codes
        .split(",")
        .map((c) => c.trim())
        .filter(Boolean)
        .slice(0, 3)
    : [];
  return <CompareView initialCodes={initialCodes} />;
}
