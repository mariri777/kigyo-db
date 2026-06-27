"use client";

import { useEffect, useState } from "react";

/**
 * 予測カードの「残り時間」をライブ表示するクライアントコンポーネント。
 *
 * SSG 時は target との差分が固定（生成時点の差）になるが、
 * マウント後は 1 秒ごとに更新する。
 */
export function Countdown({ target }: { target: string }) {
  const [now, setNow] = useState<number>(() => new Date(target).getTime() - 1);

  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const diffMs = new Date(target).getTime() - now;
  const expired = diffMs <= 0;

  if (expired) {
    // 締切を過ぎたが、まだ結果は出ていない（または出たばかりの）状態。
    // 「結果発表」は誤解を招きやすいので「答え合わせ待ち」と表現。
    return (
      <span className="inline-flex items-center gap-1.5 text-[11px] font-bold tabular text-foreground">
        <span className="inline-block w-1.5 h-1.5 rounded-full bg-foreground animate-pulse" />
        答え合わせ待ち
      </span>
    );
  }

  const totalSec = Math.floor(diffMs / 1000);
  const days = Math.floor(totalSec / 86400);
  const hours = Math.floor((totalSec % 86400) / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;

  // 表示は粒度を「直近に近づくほど細かく」する
  // 1 日以上 → 残り X 日 Y 時間
  // 1 時間以上 → 残り X 時間 Y 分
  // それ以下 → 残り MM:SS
  let body: React.ReactNode;
  if (days >= 1) {
    body = (
      <>
        <span className="tabular">{days}</span>
        <span className="text-foreground/60 mx-0.5">日</span>
        <span className="tabular">{hours}</span>
        <span className="text-foreground/60 mx-0.5">時間</span>
      </>
    );
  } else if (hours >= 1) {
    body = (
      <>
        <span className="tabular">{hours}</span>
        <span className="text-foreground/60 mx-0.5">時間</span>
        <span className="tabular">{String(minutes).padStart(2, "0")}</span>
        <span className="text-foreground/60 mx-0.5">分</span>
      </>
    );
  } else {
    body = (
      <>
        <span className="tabular tabular-nums">{String(minutes).padStart(2, "0")}</span>
        <span className="text-foreground/60">:</span>
        <span className="tabular tabular-nums">{String(seconds).padStart(2, "0")}</span>
      </>
    );
  }

  // 5 分以内はインジケーターを点滅させて切迫感を出す（カラーは ASCII モノクロのため変えない）
  const imminent = totalSec <= 5 * 60;

  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-foreground">
      <span
        className={`inline-block w-1.5 h-1.5 rounded-full bg-foreground ${
          imminent ? "animate-pulse" : ""
        }`}
      />
      残り {body}
    </span>
  );
}
