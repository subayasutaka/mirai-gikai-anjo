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
import { ANJO_PHOTOS } from "../shared/utils/photos";
import { CHAT_COPY } from "../shared/ui-text";
import { Furigana, getMarkdownReadings } from "./furigana";

const PHOTO_NOTE =
  "写真は内容を伝えるための参考素材です。安城市の実際の施設や、案件の当事者を撮影したものではありません。";
const PHOTO_LICENSE_NOTE = "商用利用可能な無料素材を使用しています。";

export async function AnjoShell({ children }: { children: ReactNode }) {
  const readings = await getMarkdownReadings(
    [
      ...Object.values(CHAT_COPY),
      PHOTO_NOTE,
      PHOTO_LICENSE_NOTE,
      "写真・素材について",
      "利用条件",
      ...Object.values(ANJO_PHOTOS).map((photo) => photo.alt),
    ].join("\n\n")
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
        <details className="anjo-photo-credits">
          <summary>
            <Furigana>写真・素材について</Furigana>
          </summary>
          <p>
            <Furigana>{PHOTO_NOTE}</Furigana>
          </p>
          <ul>
            {Object.values(ANJO_PHOTOS).map((photo) => (
              <li key={photo.src}>
                <Furigana>{photo.alt}</Furigana>（
                <a
                  href={photo.source}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {photo.author} / Pexels
                </a>
                ）
              </li>
            ))}
          </ul>
          <p>
            <Furigana>{PHOTO_LICENSE_NOTE}</Furigana>（
            <a
              href="https://www.pexels.com/license/"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Furigana>利用条件</Furigana>
            </a>
            ）
          </p>
        </details>
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
