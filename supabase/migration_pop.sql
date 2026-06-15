-- =====================================================================
-- POP(생산시점관리) 추가 마이그레이션
-- schema.sql 을 이미 실행한 프로젝트에서 이 파일만 추가 실행하세요.
-- 작업지시별 공정 진행(시작/종료) 추적 테이블
-- =====================================================================

create table if not exists work_order_processes (
  id            uuid primary key default uuid_generate_v4(),
  wo_no         text not null,                  -- 작업지시번호
  item_code     text,
  seq           int default 10,                 -- 공정순서
  process_code  text,
  process_name  text,
  equipment     text,
  worker        text,
  status        text default '대기',            -- 대기 / 진행 / 완료
  start_at      timestamptz,                    -- 공정 시작시각
  end_at        timestamptz,                    -- 공정 종료시각
  good_qty      numeric default 0,              -- 양품수량
  defect_qty    numeric default 0,              -- 불량수량
  work_time     numeric default 0,              -- 작업시간(분)
  remark        text,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

create index if not exists idx_wop_wo on work_order_processes(wo_no);

-- updated_at 트리거 (set_updated_at 함수는 schema.sql 에서 생성됨)
drop trigger if exists trg_work_order_processes_updated on work_order_processes;
create trigger trg_work_order_processes_updated
  before update on work_order_processes
  for each row execute function set_updated_at();

-- RLS (개발 단계: anon 전체 허용)
alter table work_order_processes enable row level security;
drop policy if exists "allow_all" on work_order_processes;
create policy "allow_all" on work_order_processes for all using (true) with check (true);
