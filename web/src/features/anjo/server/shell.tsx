import "server-only";
import { ANJO_SITE } from "@mirai-gikai/shared/anjo/config";
import { Landmark } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { routes } from "@/lib/routes";
import {
  ReadingControls,
  ReadingPreferences,
} from "../client/reading-preferences";
import { CHAT_COPY } from "../shared/ui-text";
import { Furigana, getMarkdownReadings } from "./furigana";

export async function AnjoShell({ children }: { children: ReactNode }) {
  const readings = await getMarkdownReadings(
    Object.values(CHAT_COPY).join("\n\n")
  ).catch(() => ({}));
  return (
    <ReadingPreferences readings={{ ...readings }}>
      <a href="#main-content" className="sr-only focus:not-sr-only">
        <Furigana>{"本文へ移動"}</Furigana>
      </a>
      <header className="anjo-header">
        <Link href={routes.home()} className="anjo-logo">
          <span className="anjo-logo-mark">
            <Landmark size={27} aria-hidden="true" />
          </span>
          <span className="anjo-logo-word">
            <Furigana>{"みらい議会"}</Furigana>
            <span className="anjo-logo-location">
              <Furigana>{"＠安城"}</Furigana>
            </span>
          </span>
        </Link>
        <ReadingControls />
      </header>
      <div className="anjo-unofficial">
        <span className="anjo-live-dot" />
        <Furigana>すば康貴 個人による非公式実証</Furigana>
      </div>
      <main id="main-content" className="anjo-main">
        {children}
      </main>
      <footer className="anjo-footer">
        <p className="anjo-footer-brand">
          <Furigana>{"みらい議会"}</Furigana>
          <span className="anjo-logo-location">
            <Furigana>{"＠安城"}</Furigana>
          </span>
        </p>
        <p className="font-bold">
          <Furigana>{`運営：${ANJO_SITE.operator}`}</Furigana>
        </p>
        <p>
          <Furigana>{ANJO_SITE.disclaimer}</Furigana>
        </p>
        <p>
          <Furigana>
            説明文は公開資料をもとにCodexが下書きし、運営者が確認・更新します。原資料と異なる場合は原資料を優先してください。ふりがなは自動で付けるため、読みが正しくないことがあります。
          </Furigana>
        </p>
        <nav className="flex flex-wrap gap-5">
          <Link href={routes.privacy()}>
            <Furigana>{"データの取り扱い"}</Furigana>
          </Link>
          <Link href={routes.terms()}>
            <Furigana>{"利用について"}</Furigana>
          </Link>
          <a href={ANJO_SITE.sourceCode}>
            <Furigana>{"改変ソース（AGPL-3.0）"}</Furigana>
          </a>
          <a href="https://gikai.team-mir.ai/">
            <Furigana>{"開発元「みらい議会」"}</Furigana>
          </a>
        </nav>
      </footer>
    </ReadingPreferences>
  );
}
