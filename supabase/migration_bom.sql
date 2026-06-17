-- =====================================================================
-- BOM관리 추가 마이그레이션 (기존 프로젝트용)
-- schema.sql 을 이미 실행한 프로젝트에서 이 파일만 추가 실행하세요.
-- 모품목(완제품/반제품) ↔ 구성품(자재/반제품) 소요량
-- =====================================================================

create table if not exists boms (
  id              uuid primary key default uuid_generate_v4(),
  item_code       text not null,
  component_code  text not null,
  component_name  text,
  qty             numeric default 0,
  unit            text default 'EA',
  remark          text,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now(),
  unique (item_code, component_code)
);
create index if not exists idx_bom_item on boms(item_code);

drop trigger if exists trg_boms_updated on boms;
create trigger trg_boms_updated before update on boms
  for each row execute function set_updated_at();

alter table boms enable row level security;
drop policy if exists "allow_all" on boms;
create policy "allow_all" on boms for all using (true) with check (true);
