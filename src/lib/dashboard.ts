import { requireUser } from '@/lib/auth/requireUser'
import { createClient } from '@/lib/supabase/server'
import type { WorkspaceTable } from '@/lib/types'

export async function listRows<T>(workspaceId: string, table: WorkspaceTable): Promise<T[]> {
  await requireUser()
  const supabase = await createClient()
  const { data, error } = await supabase.from(table).select('*').eq('workspace_id', workspaceId)
  if (error) throw new Error(`${table}: ${error.message}`)
  return (data ?? []) as T[]
}
