"use client";
import { Button } from "@/components/ui/button";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <section className="anjo-panel">
      <h1>資料を読み込めませんでした</h1>
      <p>接続を確認して、もう一度お試しください。</p>
      <Button onClick={reset}>もう一度読み込む</Button>
    </section>
  );
}
