-- Notion이 돌려주는 새 주소 형식(https://app.notion.com/p/…)도 카드의 notion_url로 허용한다.
-- Supabase 대시보드 → SQL Editor에서 0005 다음에 한 번 실행한다.

begin;

alter table public.kanban_cards
  drop constraint if exists kanban_cards_notion_url_check;

alter table public.kanban_cards
  add constraint kanban_cards_notion_url_check
  check (notion_url is null or notion_url ~* '^https://([a-z0-9-]+\.)*notion\.(so|site|com)(/|$)');

commit;
