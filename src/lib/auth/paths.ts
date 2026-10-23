/** 로그인 없이 열리는 경로. /api/cron은 CRON_SECRET으로 따로 보호한다. */
const PUBLIC_PATHS = ['/login', '/auth', '/api/cron']

export function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))
}
