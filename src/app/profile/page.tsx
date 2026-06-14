import type { Metadata } from "next";
import { listPredictions } from "@/content/predictions";
import { ProfileClient } from "./ProfileClient";

export const metadata: Metadata = {
  title: "マイ予測 — あなたの的中率と AI との対戦成績",
  description:
    "あなたが投票した予測の履歴・的中率を表示します。データはこのブラウザにのみ保存され、サーバーには送信されません。",
  robots: { index: false, follow: false },
  alternates: { canonical: "/profile" },
};

export default function ProfilePage() {
  const predictions = listPredictions();
  return <ProfileClient predictions={predictions} />;
}
