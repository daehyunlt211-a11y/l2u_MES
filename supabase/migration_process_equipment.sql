-- =====================================================================
-- 공정별 사용설비 추가 마이그레이션
-- schema.sql 을 이미 실행한 프로젝트에서 이 파일만 추가 실행하세요.
-- 표준공정 ↔ 설비(설비호기) N:M 연결. POP 공정 시작 시 설비 선택 범위로 사용됨.
-- =====================================================================

create table if not exists process_equipments (
  id              uuid primary key default uuid_generate_v4(),
  process_code    text not null,
  equipment_code  text not null,
  equipment_name  text,
  remark          text,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now(),
  unique (process_code, equipment_code)
);
create index if not exists idx_pe_proc on process_equipments(process_code);

drop trigger if exists trg_process_equipments_updated on process_equipments;
create trigger trg_process_equipments_updated
  before update on process_equipments
  for each row execute function set_updated_at();

alter table process_equipments enable row level security;
drop policy if exists "allow_all" on process_equipments;
create policy "allow_all" on process_equipments for all using (true) with check (true);
