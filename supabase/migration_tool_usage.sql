-- =====================================================================
-- 공구 공정지정 + 공구 투입(수명 차감) 마이그레이션 (기존 프로젝트용)
-- schema.sql 실행한 프로젝트에서 이 파일만 추가 실행하세요.
-- =====================================================================

-- 공구 마스터에 사용 공정 지정
alter table tools add column if not exists process text;

-- 공구 투입 이력 (입고 LOT별 사용 횟수)
create table if not exists tool_usages (
  id            uuid primary key default uuid_generate_v4(),
  use_no        text,
  use_date      date default current_date,
  tool_code     text not null,
  lot_no        text,
  use_qty       numeric default 0,
  wo_no         text,
  process       text,
  worker        text,
  remark        text,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);
create index if not exists idx_toolusage_tool on tool_usages(tool_code);

drop trigger if exists trg_tool_usages_updated on tool_usages;
create trigger trg_tool_usages_updated before update on tool_usages
  for each row execute function set_updated_at();

alter table tool_usages enable row level security;
drop policy if exists "allow_all" on tool_usages;
create policy "allow_all" on tool_usages for all using (true) with check (true);
