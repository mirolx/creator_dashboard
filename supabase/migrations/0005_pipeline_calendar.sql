-- 칸반 5단계 파이프라인 + 카드별 일정 + 보관(아카이브)
-- Supabase 대시보드 → SQL Editor에서 0004 다음에 한 번 실행한다. (새 코드를 배포하기 전에)

begin;

-- 1) 기존 status check 제약 제거 (이름이 다를 수 있어 pg_constraint에서 찾아 지운다)
do $$
declare
  c record;
begin
  for c in
    select conname
    from pg_constraint
    where conrelid = 'public.kanban_cards'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%status%'
  loop
    execute format('alter table public.kanban_cards drop constraint %I', c.conname);
  end loop;
end $$;

-- 2) 기존 값을 새 단계로 옮긴다
update public.kanban_cards
set status = case status
  when 'shot' then 'shoot'
  when 'editing' then 'edit'
  when 'review' then 'edit'
  when 'uploaded' then 'published'
  else status
end;

-- 3) 새 check 제약
alter table public.kanban_cards
  add constraint kanban_cards_status_check
  check (status in ('idea', 'shoot', 'edit', 'scheduled', 'published'));

-- 4) 새 컬럼
alter table public.kanban_cards
  add column notion_page_id text,
  add column shoot_on date,
  add column edit_due_on date,
  add column upload_on date,
  add column archived_at timestamptz;

commit;
