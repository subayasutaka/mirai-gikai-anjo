"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { shouldAutoRetry } from "../shared/utils/auto-retry";

const RETRY_KEY = "anjo-auto-retry-at";

export function BillLoadError() {
  const [retrying, setRetrying] = useState(false);
  useEffect(() => {
    // 最初のアクセスでDBの応答が遅れたときは、1回だけ自動で読み直す。
    let last: string | null = null;
    try {
      last = sessionStorage.getItem(RETRY_KEY);
    } catch {
      return; // 記録できない環境では、くり返しを避けて手動に任せる。
    }
    if (!shouldAutoRetry(last, Date.now())) return;
    try {
      sessionStorage.setItem(RETRY_KEY, String(Date.now()));
    } catch {
      return;
    }
    setRetrying(true);
    const timer = setTimeout(() => window.location.reload(), 1_500);
    return () => clearTimeout(timer);
  }, []);
  return (
    <section className="anjo-panel" role="alert">
      <h1>議案を読み込めませんでした</h1>
      <p>
        {retrying
          ? "もう一度読み込んでいます。少しお待ちください。"
          : "議案のデータを読み込めませんでした。少し待ってから、もう一度お試しください。"}
      </p>
      <Button onClick={() => window.location.reload()}>もう一度読み込む</Button>
    </section>
  );
}
