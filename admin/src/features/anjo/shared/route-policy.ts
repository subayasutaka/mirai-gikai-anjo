export function isAnjoAdminRoute(pathname: string): boolean {
  return (
    [
      "/",
      "/login",
      "/api/auth/callback",
      "/bills",
      "/bills/new",
      "/diet-sessions",
      "/tags",
      "/admins",
      "/pilot",
      "/contents",
      "/contents/new",
    ].includes(pathname) ||
    /^\/bills\/[0-9a-f-]{36}\/(edit|contents\/edit)$/i.test(pathname) ||
    /^\/contents\/[0-9a-f-]{36}\/edit$/i.test(pathname)
  );
}
