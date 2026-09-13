export function isAnjoWebRoute(path: string): boolean {
  return (
    [
      "/",
      "/bills",
      "/privacy",
      "/terms",
      "/api/anjo-chat",
      "/api/revalidate",
      "/robots.txt",
      "/sitemap.xml",
      "/manifest.json",
    ].includes(path) ||
    /^\/contents\/[0-9a-f-]{36}$/i.test(path) ||
    /^\/bills\/[0-9a-f-]{36}$/i.test(path) ||
    /^\/preview\/bills\/[0-9a-f-]{36}$/i.test(path)
  );
}
