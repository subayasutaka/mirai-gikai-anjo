import type { Metadata } from "next";
import NextTopLoader from "nextjs-toploader";
import type { ReactNode } from "react";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: "みらい議会＠安城 管理画面",
  description: "みらい議会＠安城の運営者用管理画面",
  robots: { index: false, follow: false },
  icons: { icon: "/anjo-icon.svg" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className={"antialiased"}>
        <NextTopLoader
          color="#3b82f6"
          initialPosition={0.08}
          crawlSpeed={200}
          height={3}
          crawl={true}
          showSpinner={false}
          easing="ease"
          speed={200}
        />
        {children}
        <Toaster />
      </body>
    </html>
  );
}
