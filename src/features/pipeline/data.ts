import { tableData } from '@/lib/tableData'
import type { KanbanCard } from '@/lib/types'

export const kanbanData = tableData<KanbanCard>('kanban_cards')

export const byPosition = (a: KanbanCard, b: KanbanCard) => a.position - b.position
