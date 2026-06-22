-- =====================================================================
-- MES 시스템 데이터베이스 스키마 (Supabase / PostgreSQL)
-- 실행 방법: Supabase 대시보드 > SQL Editor 에 붙여넣고 실행
-- =====================================================================

-- 확장
create extension if not exists "uuid-ossp";

-- 공통: updated_at 자동 갱신 트리거 함수
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- =====================================================================
-- 1. 기준정보관리
-- =====================================================================

-- 1-2 부서관리
create table if not exists departments (
  id          uuid primary key default uuid_generate_v4(),
  code        text unique not null,
  name        text not null,
  parent_id   uuid references departments(id),
  manager     text,
  phone       text,
  use_yn      boolean default true,
  remark      text,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- 1-1 사용자관리
create table if not exists users (
  id          uuid primary key default uuid_generate_v4(),
  login_id    text unique not null,
  password    text,                            -- 로그인 비밀번호 (운영 시 해시/__Supabase Auth 권장)
  name        text not null,
  department  text,
  position    text,
  role        text default 'user',            -- admin / manager / user
  email       text,
  phone       text,
  use_yn      boolean default true,
  remark      text,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- 1-3 거래처관리
create table if not exists partners (
  id          uuid primary key default uuid_generate_v4(),
  code        text unique not null,
  name        text not null,
  biz_type    text,                            -- 매출처 / 매입처 / 외주처
  biz_no      text,                            -- 사업자등록번호
  ceo         text,
  manager     text,
  phone       text,
  email       text,
  address     text,
  use_yn      boolean default true,
  remark      text,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- 1-4 품목관리
create table if not exists items (
  id            uuid primary key default uuid_generate_v4(),
  code          text unique not null,
  name          text not null,
  item_type     text,                          -- 완제품 / 반제품 / 원자재 / 부자재
  spec          text,
  unit          text default 'EA',
  category      text,
  safety_stock  numeric default 0,
  unit_price    numeric default 0,
  partner       text,                           -- 주거래처
  use_yn        boolean default true,
  remark        text,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- 1-5 표준공정관리
create table if not exists processes (
  id            uuid primary key default uuid_generate_v4(),
  code          text unique not null,
  name          text not null,
  process_type  text,                           -- 가공 / 조립 / 검사 / 포장
  work_center   text,                           -- 작업장
  std_time      numeric default 0,              -- 표준작업시간(분)
  setup_time    numeric default 0,              -- 준비시간(분)
  use_yn        boolean default true,
  remark        text,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- 1-6 제품별표준공정관리 (라우팅)
create table if not exists item_processes (
  id            uuid primary key default uuid_generate_v4(),
  item_code     text not null,
  process_code  text not null,
  seq           int default 10,                 -- 공정순서
  process_name  text,
  std_time      numeric default 0,
  equipment     text,
  remark        text,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now(),
  unique (item_code, seq, process_code)
);

-- 1-7 공구관리 (마스터)
create table if not exists tools (
  id            uuid primary key default uuid_generate_v4(),
  code          text unique not null,
  name          text not null,
  tool_type     text,                           -- 절삭 / 측정 / 지그 / 기타
  spec          text,
  maker         text,
  life_count    int default 0,                  -- 수명(횟수)
  unit          text default 'EA',
  safety_stock  numeric default 0,
  location      text,
  use_yn        boolean default true,
  remark        text,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- 1-8 설비관리
create table if not exists equipments (
  id            uuid primary key default uuid_generate_v4(),
  code          text unique not null,
  name          text not null,
  equip_type    text,                           -- 가공기 / 조립기 / 검사기 / 기타
  model         text,
  maker         text,
  work_center   text,
  install_date  date,
  status        text default '정상',            -- 정상 / 점검 / 고장 / 비가동
  use_yn        boolean default true,
  remark        text,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- 1-9 BOM관리 (모품목 ↔ 구성품/소요량)
create table if not exists boms (
  id              uuid primary key default uuid_generate_v4(),
  item_code       text not null,                  -- 모품목(완제품/반제품)
  component_code  text not null,                  -- 구성품(자재/반제품)
  component_name  text,
  qty             numeric default 0,              -- 소요량(모품목 1개당)
  unit            text default 'EA',
  remark          text,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now(),
  unique (item_code, component_code)
);
create index if not exists idx_bom_item on boms(item_code);

-- 1-5b 공정별 사용설비 (표준공정 ↔ 설비 N:M)
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

-- =====================================================================
-- 2. 영업관리
-- =====================================================================

-- 2-1 수주관리
create table if not exists sales_orders (
  id            uuid primary key default uuid_generate_v4(),
  order_no      text unique not null,
  order_date    date default current_date,
  partner       text,                           -- 매출처
  item_code     text,
  item_name     text,
  spec          text,
  unit          text default 'EA',
  order_qty     numeric default 0,
  unit_price    numeric default 0,
  amount        numeric default 0,
  due_date      date,                           -- 납기일
  status        text default '접수',            -- 접수 / 생산중 / 완료 / 취소
  remark        text,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- 2-2 납품관리
create table if not exists deliveries (
  id            uuid primary key default uuid_generate_v4(),
  delivery_no   text unique not null,
  delivery_date date default current_date,
  order_no      text,
  partner       text,
  item_code     text,
  item_name     text,
  delivery_qty  numeric default 0,
  unit_price    numeric default 0,
  amount        numeric default 0,
  status        text default '납품완료',        -- 출고예정 / 납품완료
  remark        text,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- =====================================================================
-- 3. 생산관리
-- =====================================================================

-- 3-1 생산계획관리
create table if not exists production_plans (
  id            uuid primary key default uuid_generate_v4(),
  plan_no       text unique not null,
  plan_date     date default current_date,
  order_no      text,
  item_code     text,
  item_name     text,
  plan_qty      numeric default 0,
  start_date    date,
  end_date      date,
  line          text,                           -- 생산라인
  status        text default '계획',            -- 계획 / 진행 / 완료 / 보류
  remark        text,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- 3-2 작업지시관리
create table if not exists work_orders (
  id            uuid primary key default uuid_generate_v4(),
  wo_no         text unique not null,
  wo_date       date default current_date,
  plan_no       text,
  item_code     text,
  item_name     text,
  order_qty     numeric default 0,
  process       text,                           -- 공정
  equipment     text,
  worker        text,
  line          text,
  start_date    date,
  due_date      date,
  status        text default '대기',            -- 대기 / 작업중 / 완료 / 중단
  remark        text,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- 3-3 생산실적
create table if not exists production_results (
  id            uuid primary key default uuid_generate_v4(),
  result_no     text unique not null,
  result_date   date default current_date,
  wo_no         text,
  item_code     text,
  item_name     text,
  process       text,
  equipment     text,
  worker        text,
  good_qty      numeric default 0,              -- 양품수량
  defect_qty    numeric default 0,              -- 불량수량
  work_time     numeric default 0,              -- 작업시간(분)
  status        text default '완료',
  remark        text,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- 3-5 POP 작업지시별 공정 진행(시작/종료) 추적
create table if not exists work_order_processes (
  id            uuid primary key default uuid_generate_v4(),
  wo_no         text not null,
  item_code     text,
  seq           int default 10,
  process_code  text,
  process_name  text,
  equipment     text,
  worker        text,
  status        text default '대기',            -- 대기 / 진행 / 완료
  start_at      timestamptz,
  end_at        timestamptz,
  input_qty     numeric default 0,              -- 투입수량(이전 공정 양품에서 cascade)
  good_qty      numeric default 0,
  defect_qty    numeric default 0,
  work_time     numeric default 0,
  is_rework     boolean default false,          -- 재작업 공정 단계 여부
  remark        text,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);
create index if not exists idx_wop_wo on work_order_processes(wo_no);

-- =====================================================================
-- 4. 자재관리
-- =====================================================================

-- 4-1 자재입고관리
create table if not exists material_inbounds (
  id            uuid primary key default uuid_generate_v4(),
  inbound_no    text unique not null,
  inbound_date  date default current_date,
  partner       text,
  item_code     text,
  item_name     text,
  spec          text,
  unit          text default 'EA',
  inbound_qty   numeric default 0,
  unit_price    numeric default 0,
  amount        numeric default 0,
  warehouse     text,
  lot_no        text,
  status        text default '입고예정',        -- 입고예정 / 입고완료(화면 버튼으로 처리)
  remark        text,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- 4-2 자재반출관리(출고)
create table if not exists material_outbounds (
  id            uuid primary key default uuid_generate_v4(),
  outbound_no   text unique not null,
  outbound_date date default current_date,
  item_code     text,
  item_name     text,
  unit          text default 'EA',
  outbound_qty  numeric default 0,
  wo_no         text,                           -- 작업지시번호
  warehouse     text,
  purpose       text,                           -- 생산투입 / 외주 / 반품
  worker        text,
  remark        text,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- 4-3 자재현황 (재고: 입고-반출 집계 뷰)
create or replace view material_stocks as
select
  coalesce(i.item_code, o.item_code)                          as item_code,
  max(coalesce(i.item_name, o.item_name))                     as item_name,
  coalesce(sum(i.inbound_qty), 0)                             as in_qty,
  coalesce(sum(o.outbound_qty), 0)                            as out_qty,
  coalesce(sum(i.inbound_qty), 0) - coalesce(sum(o.outbound_qty), 0) as stock_qty
from material_inbounds i
full outer join material_outbounds o on i.item_code = o.item_code
group by coalesce(i.item_code, o.item_code);

-- =====================================================================
-- 5. 공구관리 (운영)
-- =====================================================================

-- 5-2 공구 입/출고관리
create table if not exists tool_movements (
  id            uuid primary key default uuid_generate_v4(),
  move_no       text unique not null,
  move_date     date default current_date,
  move_type     text default '입고',            -- 입고 / 출고
  tool_code     text,
  tool_name     text,
  qty           numeric default 0,
  worker        text,
  equipment     text,                           -- 사용설비
  location      text,
  remark        text,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- 5-3 공구 폐기관리
create table if not exists tool_disposals (
  id            uuid primary key default uuid_generate_v4(),
  disposal_no   text unique not null,
  disposal_date date default current_date,
  tool_code     text,
  tool_name     text,
  qty           numeric default 0,
  reason        text,                           -- 수명초과 / 파손 / 마모 / 기타
  worker        text,
  remark        text,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- 5-1 공구재고 (입고-출고-폐기 집계 뷰)
create or replace view tool_stocks as
select
  t.code                                                       as tool_code,
  t.name                                                       as tool_name,
  t.tool_type,
  t.safety_stock,
  coalesce(sum(case when m.move_type='입고' then m.qty else 0 end),0) as in_qty,
  coalesce(sum(case when m.move_type='출고' then m.qty else 0 end),0) as out_qty,
  coalesce(d.disposal_qty,0)                                   as disposal_qty,
  coalesce(sum(case when m.move_type='입고' then m.qty else 0 end),0)
    - coalesce(sum(case when m.move_type='출고' then m.qty else 0 end),0)
    - coalesce(d.disposal_qty,0)                               as stock_qty
from tools t
left join tool_movements m on t.code = m.tool_code
left join (select tool_code, sum(qty) disposal_qty from tool_disposals group by tool_code) d
  on t.code = d.tool_code
group by t.code, t.name, t.tool_type, t.safety_stock, d.disposal_qty;

-- =====================================================================
-- 6. 품질관리
-- =====================================================================

-- 6-1 검사기준관리
create table if not exists inspection_standards (
  id            uuid primary key default uuid_generate_v4(),
  std_no        text unique not null,
  item_code     text,
  item_name     text,
  inspect_type  text default '수입검사',        -- 수입검사 / 공정검사 / 출하검사
  inspect_item  text,                           -- 검사항목
  eval_method   text default '정량적',          -- 정량적(숫자) / 정성적(문자)
  spec_value    text,                           -- 규격값(정량) 또는 판정기준(정성)
  tolerance     text,                           -- 허용공차(정량)
  method        text,                           -- 검사방법
  equipment     text,                           -- 측정장비
  use_yn        boolean default true,
  remark        text,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- 6-1b 검사 실적 상세 (검사기준 항목별 측정/판정 결과)
create table if not exists inspection_details (
  id            uuid primary key default uuid_generate_v4(),
  inspect_no    text not null,                  -- 부모 검사번호
  inspect_kind  text,                           -- 수입검사 / 출하검사
  item_code     text,
  inspect_item  text,                           -- 검사항목
  eval_method   text,                           -- 정량적 / 정성적
  spec_value    text,
  tolerance     text,
  measured      text,                           -- 측정값(정량) 또는 관측결과(정성)
  judgment      text,                           -- 합격 / 불합격
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);
create index if not exists idx_idet_no on inspection_details(inspect_no);

-- 6-2 수입검사
create table if not exists incoming_inspections (
  id            uuid primary key default uuid_generate_v4(),
  inspect_no    text unique not null,
  inspect_date  date default current_date,
  inbound_no    text,
  partner       text,
  item_code     text,
  item_name     text,
  lot_no        text,
  inspect_qty   numeric default 0,
  good_qty      numeric default 0,
  defect_qty    numeric default 0,
  inspector     text,
  result        text default '합격',            -- 합격 / 불합격 / 조건부합격
  remark        text,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- 6-3 부적합관리
create table if not exists nonconformances (
  id            uuid primary key default uuid_generate_v4(),
  ncr_no        text unique not null,
  occur_date    date default current_date,
  process       text,                           -- 발생공정
  item_code     text,
  item_name     text,
  defect_type   text,                           -- 불량유형
  defect_qty    numeric default 0,
  cause         text,                           -- 원인
  action        text,                           -- 조치사항
  action_type   text default '폐기',            -- 폐기 / 재작업 / 특채 / 반품
  worker        text,
  status        text default '처리중',          -- 처리중 / 완료
  remark        text,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- 6-4 출하검사
create table if not exists shipping_inspections (
  id            uuid primary key default uuid_generate_v4(),
  inspect_no    text unique not null,
  inspect_date  date default current_date,
  order_no      text,
  partner       text,
  item_code     text,
  item_name     text,
  inspect_qty   numeric default 0,
  good_qty      numeric default 0,
  defect_qty    numeric default 0,
  inspector     text,
  result        text default '합격',            -- 합격 / 불합격
  remark        text,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- =====================================================================
-- updated_at 트리거 일괄 적용
-- =====================================================================
do $$
declare t text;
begin
  for t in
    select unnest(array[
      'departments','users','partners','items','processes','item_processes',
      'tools','equipments','sales_orders','deliveries','production_plans',
      'work_orders','production_results','material_inbounds','material_outbounds',
      'tool_movements','tool_disposals','inspection_standards','incoming_inspections',
      'nonconformances','shipping_inspections','work_order_processes','process_equipments',
      'inspection_details','boms'
    ])
  loop
    execute format('drop trigger if exists trg_%I_updated on %I;', t, t);
    execute format('create trigger trg_%I_updated before update on %I for each row execute function set_updated_at();', t, t);
  end loop;
end $$;

-- =====================================================================
-- RLS (개발 단계: anon 전체 허용. 운영 전 정책 강화 필요)
-- =====================================================================
do $$
declare t text;
begin
  for t in
    select unnest(array[
      'departments','users','partners','items','processes','item_processes',
      'tools','equipments','sales_orders','deliveries','production_plans',
      'work_orders','production_results','material_inbounds','material_outbounds',
      'tool_movements','tool_disposals','inspection_standards','incoming_inspections',
      'nonconformances','shipping_inspections','work_order_processes','process_equipments',
      'inspection_details','boms'
    ])
  loop
    execute format('alter table %I enable row level security;', t);
    execute format('drop policy if exists "allow_all" on %I;', t);
    execute format('create policy "allow_all" on %I for all using (true) with check (true);', t);
  end loop;
end $$;
