-- =====================================================================
-- 중복 방지 UNIQUE 제약 추가 (기존 프로젝트용)
-- 시드(seed.sql)를 두 번 실행해도 라우팅·공정설비가 중복되지 않도록 합니다.
-- ⚠️ 실행 전 중복 데이터가 있으면 제약 추가가 실패합니다.
--    아래 dedup 블록이 중복을 먼저 제거한 뒤 제약을 추가합니다.
-- =====================================================================

-- 1) item_processes 중복 제거 (item_code, seq, process_code 동일 → 1건만 유지)
delete from item_processes a using item_processes b
where a.ctid < b.ctid
  and a.item_code   is not distinct from b.item_code
  and a.seq         is not distinct from b.seq
  and a.process_code is not distinct from b.process_code;

alter table item_processes drop constraint if exists item_processes_item_code_seq_process_code_key;
alter table item_processes add  constraint item_processes_item_code_seq_process_code_key
  unique (item_code, seq, process_code);

-- 2) process_equipments 중복 제거 (process_code, equipment_code 동일 → 1건만 유지)
delete from process_equipments a using process_equipments b
where a.ctid < b.ctid
  and a.process_code   is not distinct from b.process_code
  and a.equipment_code is not distinct from b.equipment_code;

alter table process_equipments drop constraint if exists process_equipments_process_code_equipment_code_key;
alter table process_equipments add  constraint process_equipments_process_code_equipment_code_key
  unique (process_code, equipment_code);
