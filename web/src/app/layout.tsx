import "./globals.css";
import { ANJO_SITE } from "@mirai-gikai/shared/anjo/config";
import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_WEB_URL || "http://localhost:3000"
  ),
  title: ANJO_SITE.name,
  description:
    "安城市の公開議案を原資料とやさしい説明で読む、すば康貴個人による非公式実証。",
  icons: { icon: "/anjo-icon.svg" },
  robots: { index: false, follow: false },
  openGraph: {
    title: ANJO_SITE.name,
    description: "個人による非公式実証",
    images: ["/anjo-ogp.png"],
  },
};
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#b9eb54",
};
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
