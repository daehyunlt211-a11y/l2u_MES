// 자재관리: 자재입고 / 자재반출 / 자재현황(재고)
import { createCrudPage } from '../lib/crud.js';
import { db } from '../lib/db.js';
import { num, won, todayStr } from '../lib/format.js';
import { badge, toast } from '../ui/components.js';

function bindAmount(form) {
  const q = form.querySelector('[name="inbound_qty"]');
  const p = form.querySelector('[name="unit_price"]');
  const a = form.querySelector('[name="amount"]');
  if (!q || !p || !a) return;
  const calc = () => { a.value = (Number(q.value) || 0) * (Number(p.value) || 0); };
  q.addEventListener('input', calc); p.addEventListener('input', calc);
}

// 4-1 자재입고관리
export const materialInbounds = createCrudPage({
  table: 'material_inbounds', title: '자재입고관리', subtitle: '구매·외주 자재의 입고를 등록하고 관리합니다.',
  searchFields: ['inbound_no', 'partner', 'item_code', 'item_name', 'lot_no'], searchPlaceholder: '입고번호·거래처·품목·LOT 검색',
  defaultSort: { key: 'inbound_date', dir: 'desc' },
  filters: [
    { key: 'status', label: '상태', options: ['입고예정', '입고완료'] },
    { key: 'warehouse', label: '창고', options: ['자재창고1', '자재창고2', '외주창고'] },
  ],
  statusChips: { key: 'status', options: ['입고예정', '입고완료'] },
  docNoField: { key: 'inbound_no', prefix: 'MI' },
  computed: bindAmount,
  // 신규 등록은 '입고예정'으로. 실제 입고완료는 목록의 버튼으로 처리
  beforeSave: (data, row) => { if (!row && !data.status) data.status = '입고예정'; },
  rowActions: [
    {
      label: '입고완료', icon: 'checkCircle', cls: 'btn--primary', title: '입고완료 처리',
      show: (r) => r.status !== '입고완료',
      onClick: async (r, reload) => {
        try { await db.update('material_inbounds', r.id, { status: '입고완료' }); toast(`${r.inbound_no} 입고완료 처리되었습니다.`); reload(); }
        catch (e) { toast(e.message || '처리 실패', 'error'); }
      },
    },
  ],
  stats: async (rows) => [
    { label: '총 입고건수', value: num(rows.length), unit: '건', icon: 'inbox', tint: 'brand' },
    { label: '입고완료', value: num(rows.filter(r => r.status === '입고완료').length), unit: '건', icon: 'checkCircle', tint: 'green' },
    { label: '입고수량 합계', value: num(rows.reduce((s, r) => s + (+r.inbound_qty || 0), 0)), unit: 'EA', icon: 'box', tint: 'violet' },
    { label: '입고금액 합계', value: won(rows.reduce((s, r) => s + (+r.amount || 0), 0)), icon: 'dollar', tint: 'amber' },
  ],
  columns: [
    { key: 'inbound_no', label: '입고번호', cls: 'cell-code', sortable: true },
    { key: 'inbound_date', label: '입고일', type: 'date', sortable: true },
    { key: 'partner', label: '거래처' },
    { key: 'item_name', label: '품명', cls: 'cell-strong' },
    { key: 'spec', label: '규격' },
    { key: 'inbound_qty', label: '입고수량', type: 'num', sortable: true },
    { key: 'unit_price', label: '단가', type: 'money' },
    { key: 'amount', label: '금액', type: 'money', sortable: true },
    { key: 'warehouse', label: '창고' },
    { key: 'lot_no', label: 'LOT', cls: 'cell-code' },
    { key: 'status', label: '상태', type: 'badge', align: 'center' },
  ],
  fields: [
    { key: 'inbound_no', label: '입고번호 (자동생성)', placeholder: '비워두면 자동 채번' },
    { key: 'inbound_date', label: '입고일', type: 'date', required: true, default: todayStr() },
    { key: 'partner', label: '거래처', required: true, ref: { table: 'partners', value: 'name', label: (r) => `${r.code} · ${r.name}` }, placeholder: '거래처 선택' },
    { key: 'item_code', label: '품목', required: true, ref: { table: 'items', value: 'code', label: (r) => `${r.code} · ${r.name}`, fill: { item_name: 'name', spec: 'spec', unit: 'unit', unit_price: 'unit_price' } }, placeholder: '품목 선택' },
    { key: 'item_name', label: '품명(자동)', required: true, readonly: true },
    { key: 'spec', label: '규격(자동)', readonly: true },
    { key: 'unit', label: '단위', type: 'select', options: ['EA', 'KG', 'M', 'BOX'], default: 'EA' },
    { key: 'inbound_qty', label: '입고수량', type: 'number', required: true, default: 0 },
    { key: 'unit_price', label: '단가', type: 'number', default: 0 },
    { key: 'amount', label: '금액(자동)', type: 'number', readonly: true, default: 0 },
    { key: 'warehouse', label: '창고', type: 'select', options: ['자재창고1', '자재창고2', '외주창고'], default: '자재창고1' },
    { key: 'lot_no', label: 'LOT 번호' },
    { key: 'remark', label: '비고', type: 'textarea' },
  ],
});

// 4-2 자재반출관리(출고)
export const materialOutbounds = createCrudPage({
  table: 'material_outbounds', title: '자재반출관리', subtitle: '생산투입·외주 등 자재 출고(반출)를 관리합니다.',
  searchFields: ['outbound_no', 'item_code', 'item_name', 'wo_no', 'worker'], searchPlaceholder: '반출번호·품목·작업지시 검색',
  defaultSort: { key: 'outbound_date', dir: 'desc' },
  filters: [{ key: 'purpose', label: '용도', options: ['생산투입', '외주', '반품'] }],
  statusChips: { key: 'purpose', options: ['생산투입', '외주', '반품'] },
  docNoField: { key: 'outbound_no', prefix: 'MO' },
  stats: async (rows) => [
    { label: '총 반출건수', value: num(rows.length), unit: '건', icon: 'upload', tint: 'brand' },
    { label: '생산투입', value: num(rows.filter(r => r.purpose === '생산투입').length), unit: '건', icon: 'factory', tint: 'green' },
    { label: '외주', value: num(rows.filter(r => r.purpose === '외주').length), unit: '건', icon: 'truck', tint: 'amber' },
    { label: '반출수량 합계', value: num(rows.reduce((s, r) => s + (+r.outbound_qty || 0), 0)), unit: 'EA', icon: 'box', tint: 'violet' },
  ],
  columns: [
    { key: 'outbound_no', label: '반출번호', cls: 'cell-code', sortable: true },
    { key: 'outbound_date', label: '반출일', type: 'date', sortable: true },
    { key: 'item_name', label: '품명', cls: 'cell-strong' },
    { key: 'outbound_qty', label: '반출수량', type: 'num', sortable: true },
    { key: 'unit', label: '단위', align: 'center' },
    { key: 'wo_no', label: '작업지시', cls: 'cell-code' },
    { key: 'warehouse', label: '창고' },
    { key: 'purpose', label: '용도', type: 'badge', tone: 'brand' },
    { key: 'worker', label: '담당자' },
  ],
  fields: [
    { key: 'outbound_no', label: '반출번호 (자동생성)', placeholder: '비워두면 자동 채번' },
    { key: 'outbound_date', label: '반출일', type: 'date', required: true, default: todayStr() },
    { key: 'item_code', label: '품목', required: true, ref: { table: 'items', value: 'code', label: (r) => `${r.code} · ${r.name}`, fill: { item_name: 'name', unit: 'unit' } }, placeholder: '품목 선택' },
    { key: 'item_name', label: '품명(자동)', required: true, readonly: true },
    { key: 'unit', label: '단위', type: 'select', options: ['EA', 'KG', 'M', 'BOX'], default: 'EA' },
    { key: 'outbound_qty', label: '반출수량', type: 'number', required: true, default: 0 },
    { key: 'wo_no', label: '작업지시', ref: { table: 'work_orders', value: 'wo_no', label: (r) => `${r.wo_no} · ${r.item_name}` }, placeholder: '작업지시 선택' },
    { key: 'warehouse', label: '창고', type: 'select', options: ['자재창고1', '자재창고2', '외주창고'], default: '자재창고1' },
    { key: 'purpose', label: '용도', type: 'select', options: ['생산투입', '외주', '반품'], default: '생산투입' },
    { key: 'worker', label: '담당자', ref: { table: 'users', value: 'name', label: (r) => `${r.name} (${r.department || ''})` }, placeholder: '담당자 선택' },
    { key: 'remark', label: '비고', type: 'textarea' },
  ],
});

// 4-3 자재현황 (재고 뷰 — 읽기전용, 부족재고 강조)
export const materialStocks = createCrudPage({
  table: 'material_stocks', title: '자재현황', subtitle: '입고·반출 기준 실시간 자재 재고 현황입니다.',
  readOnly: true,
  searchFields: ['item_code', 'item_name'], searchPlaceholder: '품목코드·품명 검색',
  defaultSort: { key: 'item_code', dir: 'asc' },
  stats: async (rows) => {
    const stock = rows.reduce((s, r) => s + (+r.stock_qty || 0), 0);
    const low = rows.filter(r => (+r.stock_qty || 0) <= 0).length;
    return [
      { label: '관리 품목수', value: num(rows.length), unit: '종', icon: 'layers', tint: 'brand' },
      { label: '총 입고', value: num(rows.reduce((s, r) => s + (+r.in_qty || 0), 0)), unit: 'EA', icon: 'inbox', tint: 'green' },
      { label: '총 반출', value: num(rows.reduce((s, r) => s + (+r.out_qty || 0), 0)), unit: 'EA', icon: 'upload', tint: 'amber' },
      { label: '현재 재고 / 재고부족', value: `${num(stock)}`, unit: `EA (부족 ${low})`, icon: 'box', tint: low ? 'red' : 'violet' },
    ];
  },
  columns: [
    { key: 'item_code', label: '품목코드', cls: 'cell-code', sortable: true },
    { key: 'item_name', label: '품명', cls: 'cell-strong', sortable: true },
    { key: 'in_qty', label: '입고수량', type: 'num', sortable: true },
    { key: 'out_qty', label: '반출수량', type: 'num', sortable: true },
    { key: 'stock_qty', label: '현재고', align: 'right', sortable: true, render: (r) => {
      const v = +r.stock_qty || 0;
      const tone = v <= 0 ? 'danger' : v < 30 ? 'warning' : 'success';
      return badge(num(v), tone);
    } },
  ],
});
