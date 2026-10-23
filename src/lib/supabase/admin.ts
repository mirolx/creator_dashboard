import { createClient } from '@supabase/supabase-js'

/** 서비스 롤 클라이언트 — RLS를 우회한다. 크론처럼 로그인 없이 도는 서버 코드에서만 쓴다. */
export function createAdminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!key) throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set')
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
