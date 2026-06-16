// 데모 모드 초기 샘플 데이터 (Supabase 미연결 시 localStorage 시드)
const today = new Date();
const d = (offset = 0) => {
  const x = new Date(today); x.setDate(x.getDate() + offset);
  return x.toISOString().slice(0, 10);
};

export const SEED = {
  departments: [
    { code: 'D100', name: '경영지원팀', manager: '김대표', phone: '02-1000-1000', use_yn: true },
    { code: 'D200', name: '영업팀', manager: '이영업', phone: '02-1000-2000', use_yn: true },
    { code: 'D300', name: '생산팀', manager: '박생산', phone: '02-1000-3000', use_yn: true },
    { code: 'D400', name: '품질팀', manager: '최품질', phone: '02-1000-4000', use_yn: true },
    { code: 'D500', name: '자재팀', manager: '정자재', phone: '02-1000-5000', use_yn: true },
  ],
  users: [
    { login_id: 'admin', password: 'admin', name: '관리자', department: '경영지원팀', position: '대표', role: 'admin', email: 'admin@linktours.co.kr', phone: '010-1111-1111', use_yn: true },
    { login_id: 'sales01', password: '1234', name: '이영업', department: '영업팀', position: '팀장', role: 'manager', email: 'sales@linktours.co.kr', phone: '010-2222-2222', use_yn: true },
    { login_id: 'prod01', password: '1234', name: '박생산', department: '생산팀', position: '팀장', role: 'manager', email: 'prod@linktours.co.kr', phone: '010-3333-3333', use_yn: true },
    { login_id: 'qa01', password: '1234', name: '최품질', department: '품질팀', position: '주임', role: 'user', email: 'qa@linktours.co.kr', phone: '010-4444-4444', use_yn: true },
    { login_id: 'mat01', password: '1234', name: '정자재', department: '자재팀', position: '주임', role: 'user', email: 'mat@linktours.co.kr', phone: '010-5555-5555', use_yn: true },
  ],
  partners: [
    { code: 'C001', name: '(주)현대정밀', biz_type: '매출처', biz_no: '123-45-67890', ceo: '현대표', manager: '김구매', phone: '031-100-1000', email: 'buy@hd.com', address: '경기도 화성시', use_yn: true },
    { code: 'C002', name: '대성머티리얼', biz_type: '매입처', biz_no: '234-56-78901', ceo: '대성표', manager: '이영업', phone: '032-200-2000', email: 'sell@ds.com', address: '인천시 남동구', use_yn: true },
    { code: 'C003', name: '삼우테크', biz_type: '매출처', biz_no: '345-67-89012', ceo: '삼우표', manager: '박매니저', phone: '02-300-3000', email: 'info@sw.com', address: '서울시 금천구', use_yn: true },
    { code: 'C004', name: '한국외주가공', biz_type: '외주처', biz_no: '456-78-90123', ceo: '한국표', manager: '정외주', phone: '041-400-4000', email: 'out@hk.com', address: '충남 천안시', use_yn: true },
    { code: 'C005', name: '동양스틸', biz_type: '매입처', biz_no: '567-89-01234', ceo: '동양표', manager: '윤소재', phone: '051-500-5000', email: 'steel@dy.com', address: '부산시 강서구', use_yn: true },
  ],
  items: [
    { code: 'P-1001', name: '브라켓 ASSY', item_type: '완제품', spec: '120x80x15', unit: 'EA', category: '기구', safety_stock: 100, unit_price: 12000, partner: '(주)현대정밀', use_yn: true },
    { code: 'P-1002', name: '커버 하우징', item_type: '완제품', spec: 'Ø95 H40', unit: 'EA', category: '기구', safety_stock: 80, unit_price: 18500, partner: '삼우테크', use_yn: true },
    { code: 'S-2001', name: '가공 브라켓', item_type: '반제품', spec: '120x80', unit: 'EA', category: '기구', safety_stock: 150, unit_price: 6000, partner: '', use_yn: true },
    { code: 'M-3001', name: 'AL 6061 판재', item_type: '원자재', spec: 't15 1000x500', unit: 'EA', category: '소재', safety_stock: 50, unit_price: 32000, partner: '대성머티리얼', use_yn: true },
    { code: 'M-3002', name: 'SUS304 봉재', item_type: '원자재', spec: 'Ø100 L1000', unit: 'EA', category: '소재', safety_stock: 30, unit_price: 45000, partner: '대성머티리얼', use_yn: true },
    { code: 'M-4001', name: '볼트 M6x20', item_type: '부자재', spec: 'M6x20', unit: 'EA', category: '체결', safety_stock: 1000, unit_price: 80, partner: '대성머티리얼', use_yn: true },
  ],
  processes: [
    { code: 'OP10', name: 'CNC 황삭', process_type: '가공', work_center: '가공1라인', std_time: 12, setup_time: 30, use_yn: true },
    { code: 'OP20', name: 'CNC 정삭', process_type: '가공', work_center: '가공1라인', std_time: 18, setup_time: 25, use_yn: true },
    { code: 'OP30', name: '조립', process_type: '조립', work_center: '조립라인', std_time: 8, setup_time: 10, use_yn: true },
    { code: 'OP40', name: '검사', process_type: '검사', work_center: '검사실', std_time: 5, setup_time: 5, use_yn: true },
    { code: 'OP50', name: '포장', process_type: '포장', work_center: '포장라인', std_time: 3, setup_time: 5, use_yn: true },
  ],
  item_processes: [
    { item_code: 'P-1001', process_code: 'OP10', seq: 10, process_name: 'CNC 황삭', std_time: 12, equipment: 'CNC-01' },
    { item_code: 'P-1001', process_code: 'OP20', seq: 20, process_name: 'CNC 정삭', std_time: 18, equipment: 'CNC-02' },
    { item_code: 'P-1001', process_code: 'OP30', seq: 30, process_name: '조립', std_time: 8, equipment: 'ASSY-01' },
    { item_code: 'P-1001', process_code: 'OP40', seq: 40, process_name: '검사', std_time: 5, equipment: 'CMM-01' },
    { item_code: 'P-1002', process_code: 'OP10', seq: 10, process_name: 'CNC 황삭', std_time: 14, equipment: 'CNC-01' },
    { item_code: 'P-1002', process_code: 'OP30', seq: 20, process_name: '조립', std_time: 10, equipment: 'ASSY-01' },
  ],
  process_equipments: [
    { process_code: 'OP10', equipment_code: 'CNC-01', equipment_name: 'MCT 머시닝센터 1호기' },
    { process_code: 'OP10', equipment_code: 'CNC-02', equipment_name: 'MCT 머시닝센터 2호기' },
    { process_code: 'OP20', equipment_code: 'CNC-01', equipment_name: 'MCT 머시닝센터 1호기' },
    { process_code: 'OP20', equipment_code: 'CNC-02', equipment_name: 'MCT 머시닝센터 2호기' },
    { process_code: 'OP30', equipment_code: 'ASSY-01', equipment_name: '조립스테이션 1호' },
    { process_code: 'OP40', equipment_code: 'CMM-01', equipment_name: '3차원측정기' },
    { process_code: 'OP50', equipment_code: 'PKG-01', equipment_name: '자동포장기' },
  ],
  tools: [
    { code: 'T-001', name: '엔드밀 Ø10', tool_type: '절삭', spec: 'Ø10 4날', maker: 'YG-1', life_count: 500, unit: 'EA', safety_stock: 10, location: '공구실 A-1', use_yn: true },
    { code: 'T-002', name: '드릴 Ø6.8', tool_type: '절삭', spec: 'Ø6.8 HSS', maker: 'OSG', life_count: 800, unit: 'EA', safety_stock: 15, location: '공구실 A-2', use_yn: true },
    { code: 'T-003', name: '버니어캘리퍼스', tool_type: '측정', spec: '0-150mm', maker: 'Mitutoyo', life_count: 0, unit: 'EA', safety_stock: 5, location: '검사실', use_yn: true },
    { code: 'T-004', name: '조립지그 A', tool_type: '지그', spec: 'P-1001용', maker: '자체제작', life_count: 0, unit: 'EA', safety_stock: 2, location: '조립라인', use_yn: true },
    { code: 'T-005', name: '마이크로미터', tool_type: '측정', spec: '0-25mm', maker: 'Mitutoyo', life_count: 0, unit: 'EA', safety_stock: 5, location: '검사실', use_yn: true },
  ],
  equipments: [
    { code: 'CNC-01', name: 'MCT 머시닝센터 1호기', equip_type: '가공기', model: 'DNM-500', maker: '두산', work_center: '가공1라인', install_date: '2021-03-15', status: '정상', use_yn: true },
    { code: 'CNC-02', name: 'MCT 머시닝센터 2호기', equip_type: '가공기', model: 'DNM-500', maker: '두산', work_center: '가공1라인', install_date: '2021-03-15', status: '정상', use_yn: true },
    { code: 'ASSY-01', name: '조립스테이션 1호', equip_type: '조립기', model: 'AS-100', maker: '자체', work_center: '조립라인', install_date: '2022-06-01', status: '정상', use_yn: true },
    { code: 'CMM-01', name: '3차원측정기', equip_type: '검사기', model: 'CRYSTA-574', maker: 'Mitutoyo', work_center: '검사실', install_date: '2020-11-20', status: '점검', use_yn: true },
    { code: 'PKG-01', name: '자동포장기', equip_type: '기타', model: 'PK-200', maker: '한성', work_center: '포장라인', install_date: '2023-02-10', status: '정상', use_yn: true },
  ],
  sales_orders: [
    { order_no: 'SO-2406-001', order_date: d(-5), partner: '(주)현대정밀', item_code: 'P-1001', item_name: '브라켓 ASSY', spec: '120x80x15', unit: 'EA', order_qty: 500, unit_price: 12000, amount: 6000000, due_date: d(10), status: '생산중' },
    { order_no: 'SO-2406-002', order_date: d(-3), partner: '삼우테크', item_code: 'P-1002', item_name: '커버 하우징', spec: 'Ø95 H40', unit: 'EA', order_qty: 300, unit_price: 18500, amount: 5550000, due_date: d(14), status: '접수' },
    { order_no: 'SO-2406-003', order_date: d(-1), partner: '(주)현대정밀', item_code: 'P-1001', item_name: '브라켓 ASSY', spec: '120x80x15', unit: 'EA', order_qty: 200, unit_price: 12000, amount: 2400000, due_date: d(20), status: '접수' },
  ],
  deliveries: [
    { delivery_no: 'DL-2406-001', delivery_date: d(-2), order_no: 'SO-2406-001', partner: '(주)현대정밀', item_code: 'P-1001', item_name: '브라켓 ASSY', delivery_qty: 200, unit_price: 12000, amount: 2400000, status: '납품완료' },
  ],
  production_plans: [
    { plan_no: 'PP-2406-001', plan_date: d(-4), order_no: 'SO-2406-001', item_code: 'P-1001', item_name: '브라켓 ASSY', plan_qty: 500, start_date: d(-3), end_date: d(7), line: '가공1라인', status: '진행' },
    { plan_no: 'PP-2406-002', plan_date: d(-2), order_no: 'SO-2406-002', item_code: 'P-1002', item_name: '커버 하우징', plan_qty: 300, start_date: d(1), end_date: d(12), line: '가공1라인', status: '계획' },
  ],
  work_orders: [
    { wo_no: 'WO-2406-001', wo_date: d(-3), plan_no: 'PP-2406-001', item_code: 'P-1001', item_name: '브라켓 ASSY', order_qty: 500, process: 'CNC 황삭', equipment: 'CNC-01', worker: '박생산', line: '가공1라인', start_date: d(-3), due_date: d(2), status: '작업중' },
    { wo_no: 'WO-2406-002', wo_date: d(-3), plan_no: 'PP-2406-001', item_code: 'P-1001', item_name: '브라켓 ASSY', order_qty: 500, process: 'CNC 정삭', equipment: 'CNC-02', worker: '박생산', line: '가공1라인', start_date: d(-1), due_date: d(4), status: '대기' },
  ],
  production_results: [
    { result_no: 'PR-2406-001', result_date: d(-2), wo_no: 'WO-2406-001', item_code: 'P-1001', item_name: '브라켓 ASSY', process: 'CNC 황삭', equipment: 'CNC-01', worker: '박생산', good_qty: 240, defect_qty: 10, work_time: 480, status: '완료' },
    { result_no: 'PR-2406-002', result_date: d(-1), wo_no: 'WO-2406-001', item_code: 'P-1001', item_name: '브라켓 ASSY', process: 'CNC 황삭', equipment: 'CNC-01', worker: '박생산', good_qty: 250, defect_qty: 5, work_time: 460, status: '완료' },
  ],
  material_inbounds: [
    { inbound_no: 'MI-2406-001', inbound_date: d(-6), partner: '대성머티리얼', item_code: 'M-3001', item_name: 'AL 6061 판재', spec: 't15 1000x500', unit: 'EA', inbound_qty: 100, unit_price: 32000, amount: 3200000, warehouse: '자재창고1', lot_no: 'LOT-A001', status: '입고완료' },
    { inbound_no: 'MI-2406-002', inbound_date: d(-4), partner: '대성머티리얼', item_code: 'M-4001', item_name: '볼트 M6x20', spec: 'M6x20', unit: 'EA', inbound_qty: 5000, unit_price: 80, amount: 400000, warehouse: '자재창고1', lot_no: 'LOT-B001', status: '입고완료' },
  ],
  material_outbounds: [
    { outbound_no: 'MO-2406-001', outbound_date: d(-3), item_code: 'M-3001', item_name: 'AL 6061 판재', unit: 'EA', outbound_qty: 40, wo_no: 'WO-2406-001', warehouse: '자재창고1', purpose: '생산투입', worker: '박생산' },
    { outbound_no: 'MO-2406-002', outbound_date: d(-2), item_code: 'M-4001', item_name: '볼트 M6x20', unit: 'EA', outbound_qty: 2000, wo_no: 'WO-2406-001', warehouse: '자재창고1', purpose: '생산투입', worker: '박생산' },
  ],
  tool_movements: [
    { move_no: 'TM-2406-001', move_date: d(-6), move_type: '입고', tool_code: 'T-001', tool_name: '엔드밀 Ø10', qty: 20, worker: '정자재', location: '공구실 A-1' },
    { move_no: 'TM-2406-002', move_date: d(-3), move_type: '출고', tool_code: 'T-001', tool_name: '엔드밀 Ø10', qty: 4, worker: '박생산', equipment: 'CNC-01' },
    { move_no: 'TM-2406-003', move_date: d(-5), move_type: '입고', tool_code: 'T-002', tool_name: '드릴 Ø6.8', qty: 30, worker: '정자재', location: '공구실 A-2' },
  ],
  tool_disposals: [
    { disposal_no: 'TD-2406-001', disposal_date: d(-1), tool_code: 'T-001', tool_name: '엔드밀 Ø10', qty: 2, reason: '수명초과', worker: '박생산' },
  ],
  inspection_standards: [
    { std_no: 'IS-001', item_code: 'P-1001', item_name: '브라켓 ASSY', inspect_type: '출하검사', eval_method: '정량적', inspect_item: '전장', spec_value: '120', tolerance: '0.1', method: '버니어캘리퍼스', equipment: '버니어캘리퍼스', use_yn: true },
    { std_no: 'IS-002', item_code: 'P-1001', item_name: '브라켓 ASSY', inspect_type: '출하검사', eval_method: '정성적', inspect_item: '외관/도장', spec_value: '스크래치·이물 없음', tolerance: '', method: '육안', equipment: '', use_yn: true },
    { std_no: 'IS-003', item_code: 'M-3001', item_name: 'AL 6061 판재', inspect_type: '수입검사', eval_method: '정량적', inspect_item: '두께', spec_value: '15', tolerance: '0.05', method: '마이크로미터', equipment: '마이크로미터', use_yn: true },
    { std_no: 'IS-004', item_code: 'M-3001', item_name: 'AL 6061 판재', inspect_type: '수입검사', eval_method: '정성적', inspect_item: '표면상태', spec_value: '흠집 없음', tolerance: '', method: '육안', equipment: '', use_yn: true },
  ],
  incoming_inspections: [
    { inspect_no: 'II-2406-001', inspect_date: d(-6), inbound_no: 'MI-2406-001', partner: '대성머티리얼', item_code: 'M-3001', item_name: 'AL 6061 판재', lot_no: 'LOT-A001', inspect_qty: 100, good_qty: 98, defect_qty: 2, inspector: '최품질', result: '합격' },
  ],
  nonconformances: [
    { ncr_no: 'NC-2406-001', occur_date: d(-2), process: 'CNC 황삭', item_code: 'P-1001', item_name: '브라켓 ASSY', defect_type: '치수불량', defect_qty: 10, cause: '공구마모', action: '공구교체 후 재작업', action_type: '재작업', worker: '박생산', status: '완료' },
  ],
  shipping_inspections: [
    { inspect_no: 'SI-2406-001', inspect_date: d(-2), order_no: 'SO-2406-001', partner: '(주)현대정밀', item_code: 'P-1001', item_name: '브라켓 ASSY', inspect_qty: 200, good_qty: 200, defect_qty: 0, inspector: '최품질', result: '합격' },
  ],
};
