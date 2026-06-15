-- =====================================================================
-- 검사기준 평가방법 + 검사실적 상세 마이그레이션 (기존 프로젝트용)
-- schema.sql 을 이미 실행한 프로젝트에서 이 파일만 추가 실행하세요.
-- =====================================================================

-- 1) 검사기준에 평가방법(정량적/정성적) 컬럼 추가
alter table inspection_standards add column if not exists eval_method text default '정량적';

-- 2) 자재입고 기본 상태를 '입고예정'으로 (신규 등록 시 화면 버튼으로 입고완료)
alter table material_inbounds alter column status set default '입고예정';

-- 3) 검사 실적 상세(항목별 측정/판정) 테이블
create table if not exists inspection_details (
  id            uuid primary key default uuid_generate_v4(),
  inspect_no    text not null,
  inspect_kind  text,
  item_code     text,
  inspect_item  text,
  eval_method   text,
  spec_value    text,
  tolerance     text,
  measured      text,
  judgment      text,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);
create index if not exists idx_idet_no on inspection_details(inspect_no);

drop trigger if exists trg_inspection_details_updated on inspection_details;
create trigger trg_inspection_details_updated
  before update on inspection_details
  for each row execute function set_updated_at();

alter table inspection_details enable row level security;
drop policy if exists "allow_all" on inspection_details;
create policy "allow_all" on inspection_details for all using (true) with check (true);
