import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

const nextConfig: NextConfig = {
  serverExternalPackages: ["kuromoji"],
  outputFileTracingIncludes: {
    // pnpmのリンク配下ではなく実体を含め、Vercelの配置ファイルの衝突を避ける。
    "/**": ["../node_modules/.pnpm/kuromoji@*/node_modules/kuromoji/dict/**/*"],
  },
  experimental: {
    serverSourceMaps: true,
  },
  typedRoutes: true,
  redirects: async () => [
    {
      // データ利用規約を /developers 配下へ移動した際の旧URL互換
      source: "/interview-data-terms",
      destination: "/developers/interview-data-terms",
      permanent: true,
    },
  ],
  turbopack: {
    root: "../",
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "127.0.0.1",
        pathname: "/storage/v1/object/public/bill-thumbnails/**",
      },
      {
        protocol: "http",
        hostname: "127.0.0.1",
        pathname: "/storage/v1/object/public/bill-thumbnails/**",
      },
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/bill-thumbnails/**",
      },
      ...(isDev
        ? [
            {
              protocol: "https" as const,
              hostname: "placehold.co",
            },
          ]
        : []),
    ],
    ...(isDev && {
      dangerouslyAllowSVG: true,
      contentDispositionType: "attachment" as const,
      contentSecurityPolicy:
        "default-src 'self'; script-src 'none'; sandbox;",
    }),
  },
};

export default nextConfig;
