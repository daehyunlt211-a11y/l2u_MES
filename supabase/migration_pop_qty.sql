-- =====================================================================
-- POP 공정 수량흐름(cascade) + 재작업 컬럼 추가 (기존 프로젝트용)
-- schema.sql/migration_pop.sql 실행한 프로젝트에서 이 파일만 추가 실행하세요.
-- =====================================================================

alter table work_order_processes add column if not exists input_qty numeric default 0;
alter table work_order_processes add column if not exists is_rework boolean default false;
