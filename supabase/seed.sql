-- =====================================================================
-- MES 샘플(예시) 데이터 — schema.sql 실행 후 SQL Editor 에서 실행
-- 기준정보 5건씩 + 영업·생산·자재·공구·품질 연계 데이터
-- 모든 INSERT는 ON CONFLICT DO NOTHING 으로 중복 실행 안전
-- 날짜는 현재일 기준 상대값
-- =====================================================================

-- ---------- 1-2 부서 (5) ----------
insert into departments (code, name, manager, phone, use_yn) values
  ('D100','경영지원팀','김대표','02-1000-1000', true),
  ('D200','영업팀','이영업','02-1000-2000', true),
  ('D300','생산팀','박생산','02-1000-3000', true),
  ('D400','품질팀','최품질','02-1000-4000', true),
  ('D500','자재팀','정자재','02-1000-5000', true)
on conflict (code) do nothing;

-- ---------- 1-1 사용자 (5) ----------
insert into users (login_id, password, name, department, position, role, email, phone, use_yn) values
  ('admin','admin','관리자','경영지원팀','대표','admin','admin@linktours.co.kr','010-1111-1111', true),
  ('sales01','1234','이영업','영업팀','팀장','manager','sales@linktours.co.kr','010-2222-2222', true),
  ('prod01','1234','박생산','생산팀','팀장','manager','prod@linktours.co.kr','010-3333-3333', true),
  ('qa01','1234','최품질','품질팀','주임','user','qa@linktours.co.kr','010-4444-4444', true),
  ('mat01','1234','정자재','자재팀','주임','user','mat@linktours.co.kr','010-5555-5555', true)
on conflict (login_id) do nothing;

-- ---------- 1-3 거래처 (5) ----------
insert into partners (code, name, biz_type, biz_no, ceo, manager, phone, email, address, use_yn) values
  ('C001','(주)현대정밀','매출처','123-45-67890','현대표','김구매','031-100-1000','buy@hd.com','경기도 화성시', true),
  ('C002','대성머티리얼','매입처','234-56-78901','대성표','이판매','032-200-2000','sell@ds.com','인천시 남동구', true),
  ('C003','삼우테크','매출처','345-67-89012','삼우표','박매니저','02-300-3000','info@sw.com','서울시 금천구', true),
  ('C004','한국외주가공','외주처','456-78-90123','한국표','정외주','041-400-4000','out@hk.com','충남 천안시', true),
  ('C005','동양스틸','매입처','567-89-01234','동양표','윤소재','051-500-5000','steel@dy.com','부산시 강서구', true)
on conflict (code) do nothing;

-- ---------- 1-4 품목 (5) ----------
insert into items (code, name, item_type, spec, unit, category, safety_stock, unit_price, partner, use_yn) values
  ('P-1001','브라켓 ASSY','완제품','120x80x15','EA','기구',100,12000,'(주)현대정밀', true),
  ('P-1002','커버 하우징','완제품','Ø95 H40','EA','기구',80,18500,'삼우테크', true),
  ('S-2001','가공 브라켓','반제품','120x80','EA','기구',150,6000,'', true),
  ('M-3001','AL 6061 판재','원자재','t15 1000x500','EA','소재',50,32000,'대성머티리얼', true),
  ('M-4001','볼트 M6x20','부자재','M6x20','EA','체결',1000,80,'동양스틸', true)
on conflict (code) do nothing;

-- ---------- 1-5 표준공정 (5) ----------
insert into processes (code, name, process_type, work_center, std_time, setup_time, use_yn) values
  ('OP10','CNC 황삭','가공','가공1라인',12,30, true),
  ('OP20','CNC 정삭','가공','가공1라인',18,25, true),
  ('OP30','조립','조립','조립라인',8,10, true),
  ('OP40','검사','검사','검사실',5,5, true),
  ('OP50','포장','포장','포장라인',3,5, true)
on conflict (code) do nothing;

-- ---------- 1-7 공구 (5) ----------
insert into tools (code, name, tool_type, spec, maker, life_count, unit, safety_stock, location, use_yn) values
  ('T-001','엔드밀 Ø10','절삭','Ø10 4날','YG-1',500,'EA',10,'공구실 A-1', true),
  ('T-002','드릴 Ø6.8','절삭','Ø6.8 HSS','OSG',800,'EA',15,'공구실 A-2', true),
  ('T-003','버니어캘리퍼스','측정','0-150mm','Mitutoyo',0,'EA',5,'검사실', true),
  ('T-004','조립지그 A','지그','P-1001용','자체제작',0,'EA',2,'조립라인', true),
  ('T-005','마이크로미터','측정','0-25mm','Mitutoyo',0,'EA',5,'검사실', true)
on conflict (code) do nothing;

-- ---------- 1-8 설비 (5) ----------
insert into equipments (code, name, equip_type, model, maker, work_center, install_date, status, use_yn) values
  ('CNC-01','MCT 머시닝센터 1호기','가공기','DNM-500','두산','가공1라인','2021-03-15','정상', true),
  ('CNC-02','MCT 머시닝센터 2호기','가공기','DNM-500','두산','가공1라인','2021-03-15','정상', true),
  ('ASSY-01','조립스테이션 1호','조립기','AS-100','자체','조립라인','2022-06-01','정상', true),
  ('CMM-01','3차원측정기','검사기','CRYSTA-574','Mitutoyo','검사실','2020-11-20','점검', true),
  ('PKG-01','자동포장기','기타','PK-200','한성','포장라인','2023-02-10','정상', true)
on conflict (code) do nothing;

-- ---------- 1-6 제품별표준공정 (라우팅) ----------
insert into item_processes (item_code, process_code, seq, process_name, std_time, equipment) values
  ('P-1001','OP10',10,'CNC 황삭',12,'CNC-01'),
  ('P-1001','OP20',20,'CNC 정삭',18,'CNC-02'),
  ('P-1001','OP30',30,'조립',8,'ASSY-01'),
  ('P-1001','OP40',40,'검사',5,'CMM-01'),
  ('P-1002','OP10',10,'CNC 황삭',14,'CNC-01'),
  ('P-1002','OP30',20,'조립',10,'ASSY-01'),
  ('S-2001','OP10',10,'CNC 황삭',12,'CNC-01'),
  ('S-2001','OP20',20,'CNC 정삭',16,'CNC-02')
on conflict do nothing;

-- ---------- 1-5b 공정별 사용설비 ----------
insert into process_equipments (process_code, equipment_code, equipment_name) values
  ('OP10','CNC-01','MCT 머시닝센터 1호기'),
  ('OP10','CNC-02','MCT 머시닝센터 2호기'),
  ('OP20','CNC-01','MCT 머시닝센터 1호기'),
  ('OP20','CNC-02','MCT 머시닝센터 2호기'),
  ('OP30','ASSY-01','조립스테이션 1호'),
  ('OP40','CMM-01','3차원측정기'),
  ('OP50','PKG-01','자동포장기')
on conflict do nothing;

-- ---------- 1-9 BOM ----------
insert into boms (item_code, component_code, component_name, qty, unit) values
  ('P-1001','S-2001','가공 브라켓',1,'EA'),
  ('P-1001','M-4001','볼트 M6x20',4,'EA'),
  ('P-1002','M-3001','AL 6061 판재',1,'EA'),
  ('P-1002','M-4001','볼트 M6x20',6,'EA'),
  ('S-2001','M-3001','AL 6061 판재',1,'EA')
on conflict (item_code, component_code) do nothing;

-- ---------- 2-1 수주 (5) ----------
insert into sales_orders (order_no, order_date, partner, item_code, item_name, spec, unit, order_qty, unit_price, amount, due_date, status) values
  ('SO-2406-001', current_date-5, '(주)현대정밀','P-1001','브라켓 ASSY','120x80x15','EA',500,12000,6000000, current_date+10,'생산중'),
  ('SO-2406-002', current_date-3, '삼우테크','P-1002','커버 하우징','Ø95 H40','EA',300,18500,5550000, current_date+14,'접수'),
  ('SO-2406-003', current_date-1, '(주)현대정밀','P-1001','브라켓 ASSY','120x80x15','EA',200,12000,2400000, current_date+20,'접수'),
  ('SO-2406-004', current_date-2, '삼우테크','P-1002','커버 하우징','Ø95 H40','EA',150,18500,2775000, current_date+18,'접수'),
  ('SO-2406-005', current_date-6, '(주)현대정밀','S-2001','가공 브라켓','120x80','EA',400,6000,2400000, current_date+9,'완료')
on conflict (order_no) do nothing;

-- ---------- 2-2 납품 ----------
insert into deliveries (delivery_no, delivery_date, order_no, partner, item_code, item_name, delivery_qty, unit_price, amount, status) values
  ('DL-2406-001', current_date-2, 'SO-2406-001','(주)현대정밀','P-1001','브라켓 ASSY',200,12000,2400000,'납품완료'),
  ('DL-2406-002', current_date-1, 'SO-2406-005','(주)현대정밀','S-2001','가공 브라켓',400,6000,2400000,'납품완료')
on conflict (delivery_no) do nothing;

-- ---------- 3-1 생산계획 ----------
insert into production_plans (plan_no, plan_date, order_no, item_code, item_name, plan_qty, start_date, end_date, line, status) values
  ('PP-2406-001', current_date-4, 'SO-2406-001','P-1001','브라켓 ASSY',500, current_date-3, current_date+7,'가공1라인','진행'),
  ('PP-2406-002', current_date-2, 'SO-2406-002','P-1002','커버 하우징',300, current_date+1, current_date+12,'가공1라인','계획'),
  ('PP-2406-003', current_date-1, 'SO-2406-003','P-1001','브라켓 ASSY',200, current_date+2, current_date+15,'가공2라인','계획')
on conflict (plan_no) do nothing;

-- ---------- 3-2 작업지시 ----------
insert into work_orders (wo_no, wo_date, plan_no, item_code, item_name, order_qty, process, equipment, worker, line, start_date, due_date, status) values
  ('WO-2406-001', current_date-3, 'PP-2406-001','P-1001','브라켓 ASSY',500,'CNC 황삭','MCT 머시닝센터 1호기','박생산','가공1라인', current_date-3, current_date+2,'작업중'),
  ('WO-2406-002', current_date-3, 'PP-2406-001','P-1001','브라켓 ASSY',500,'CNC 정삭','MCT 머시닝센터 2호기','박생산','가공1라인', current_date-1, current_date+4,'대기'),
  ('WO-2406-003', current_date-1, 'PP-2406-002','P-1002','커버 하우징',300,'CNC 황삭','MCT 머시닝센터 1호기','박생산','가공1라인', current_date+1, current_date+8,'대기')
on conflict (wo_no) do nothing;

-- ---------- 3-3 생산실적 ----------
insert into production_results (result_no, result_date, wo_no, item_code, item_name, process, equipment, worker, good_qty, defect_qty, work_time, status) values
  ('PR-2406-001', current_date-2, 'WO-2406-001','P-1001','브라켓 ASSY','CNC 황삭','MCT 머시닝센터 1호기','박생산',240,10,480,'완료'),
  ('PR-2406-002', current_date-1, 'WO-2406-001','P-1001','브라켓 ASSY','CNC 황삭','MCT 머시닝센터 1호기','박생산',250,5,460,'완료'),
  ('PR-2406-003', current_date,   'WO-2406-001','P-1001','브라켓 ASSY','CNC 황삭','MCT 머시닝센터 1호기','박생산',120,3,230,'완료')
on conflict (result_no) do nothing;

-- ---------- 4-1 자재입고 ----------
insert into material_inbounds (inbound_no, inbound_date, partner, item_code, item_name, spec, unit, inbound_qty, unit_price, amount, warehouse, lot_no, status) values
  ('MI-2406-001', current_date-6, '대성머티리얼','M-3001','AL 6061 판재','t15 1000x500','EA',100,32000,3200000,'자재창고1','LOT-A001','입고완료'),
  ('MI-2406-002', current_date-4, '동양스틸','M-4001','볼트 M6x20','M6x20','EA',5000,80,400000,'자재창고1','LOT-B001','입고완료'),
  ('MI-2406-003', current_date-2, '대성머티리얼','M-3001','AL 6061 판재','t15 1000x500','EA',60,32000,1920000,'자재창고1','LOT-A002','입고완료')
on conflict (inbound_no) do nothing;

-- ---------- 4-2 자재반출 ----------
insert into material_outbounds (outbound_no, outbound_date, item_code, item_name, unit, outbound_qty, wo_no, warehouse, purpose, worker) values
  ('MO-2406-001', current_date-3, 'M-3001','AL 6061 판재','EA',40,'WO-2406-001','자재창고1','생산투입','박생산'),
  ('MO-2406-002', current_date-2, 'M-4001','볼트 M6x20','EA',2000,'WO-2406-001','자재창고1','생산투입','박생산')
on conflict (outbound_no) do nothing;

-- ---------- 5-2 공구 입/출고 ----------
insert into tool_movements (move_no, move_date, move_type, tool_code, tool_name, qty, worker, equipment, location) values
  ('TM-2406-001', current_date-6, '입고','T-001','엔드밀 Ø10',20,'정자재',null,'공구실 A-1'),
  ('TM-2406-002', current_date-3, '출고','T-001','엔드밀 Ø10',4,'박생산','MCT 머시닝센터 1호기',null),
  ('TM-2406-003', current_date-5, '입고','T-002','드릴 Ø6.8',30,'정자재',null,'공구실 A-2')
on conflict (move_no) do nothing;

-- ---------- 5-3 공구 폐기 ----------
insert into tool_disposals (disposal_no, disposal_date, tool_code, tool_name, qty, reason, worker) values
  ('TD-2406-001', current_date-1, 'T-001','엔드밀 Ø10',2,'수명초과','박생산')
on conflict (disposal_no) do nothing;

-- ---------- 6-1 검사기준 (정량/정성 평가방법 포함) ----------
insert into inspection_standards (std_no, item_code, item_name, inspect_type, eval_method, inspect_item, spec_value, tolerance, method, equipment, use_yn) values
  ('IS-001','P-1001','브라켓 ASSY','출하검사','정량적','전장','120','0.1','버니어캘리퍼스','버니어캘리퍼스', true),
  ('IS-002','P-1001','브라켓 ASSY','출하검사','정성적','외관/도장','스크래치·이물 없음','','육안','', true),
  ('IS-003','M-3001','AL 6061 판재','수입검사','정량적','두께','15','0.05','마이크로미터','마이크로미터', true),
  ('IS-004','M-3001','AL 6061 판재','수입검사','정성적','표면상태','흠집 없음','','육안','', true),
  ('IS-005','P-1002','커버 하우징','출하검사','정량적','외경','95','0.1','버니어캘리퍼스','버니어캘리퍼스', true)
on conflict (std_no) do nothing;

-- ---------- 6-2 수입검사 ----------
insert into incoming_inspections (inspect_no, inspect_date, inbound_no, partner, item_code, item_name, lot_no, inspect_qty, good_qty, defect_qty, inspector, result) values
  ('II-2406-001', current_date-6, 'MI-2406-001','대성머티리얼','M-3001','AL 6061 판재','LOT-A001',100,98,2,'최품질','합격')
on conflict (inspect_no) do nothing;

-- ---------- 6-3 부적합 ----------
insert into nonconformances (ncr_no, occur_date, process, item_code, item_name, defect_type, defect_qty, cause, action, action_type, worker, status) values
  ('NC-2406-001', current_date-2, 'CNC 황삭','P-1001','브라켓 ASSY','치수불량',10,'공구마모','공구교체 후 재작업','재작업','박생산','완료')
on conflict (ncr_no) do nothing;

-- ---------- 6-4 출하검사 ----------
insert into shipping_inspections (inspect_no, inspect_date, order_no, partner, item_code, item_name, inspect_qty, good_qty, defect_qty, inspector, result) values
  ('SI-2406-001', current_date-2, 'SO-2406-001','(주)현대정밀','P-1001','브라켓 ASSY',200,200,0,'최품질','합격')
on conflict (inspect_no) do nothing;
