// 영업관리: 수주관리 / 납품관리
import { createCrudPage } from '../lib/crud.js';
import { num, won, todayStr } from '../lib/format.js';
import { badge } from '../ui/components.js';

// 금액 자동계산 (수량 * 단가) 바인딩 헬퍼
function bindAmount(form, qtyKey, priceKey, amountKey) {
  const q = form.querySelector(`[name="${qtyKey}"]`);
  const p = form.querySelector(`[name="${priceKey}"]`);
  const a = form.querySelector(`[name="${amountKey}"]`);
  if (!q || !p || !a) return;
  const calc = () => { a.value = (Number(q.value) || 0) * (Number(p.value) || 0); };
  q.addEventListener('input', calc); p.addEventListener('input', calc);
}

// 2-1 수주관리
export const salesOrders = createCrudPage({
  table: 'sales_orders', title: '수주관리', subtitle: '고객 수주를 등록하고 진행상태를 관리합니다.',
  searchFields: ['order_no', 'partner', 'item_code', 'item_name'], searchPlaceholder: '수주번호·거래처·품목 검색',
  defaultSort: { key: 'order_date', dir: 'desc' },
  filters: [{ key: 'status', label: '상태', options: ['접수', '생산중', '완료', '취소'] }],
  statusChips: { key: 'status', options: ['접수', '생산중', '완료', '취소'] },
  docNoField: { key: 'order_no', prefix: 'SO' },
  computed: (form) => bindAmount(form, 'order_qty', 'unit_price', 'amount'),
  stats: async (rows) => {
    const total = rows.reduce((s, r) => s + (+r.amount || 0), 0);
    const active = rows.filter(r => ['접수', '생산중'].includes(r.status));
    const qty = rows.reduce((s, r) => s + (+r.order_qty || 0), 0);
    return [
      { label: '총 수주건수', value: num(rows.length), unit: '건', icon: 'cart', tint: 'brand' },
      { label: '진행중 수주', value: num(active.length), unit: '건', icon: 'clock', tint: 'amber' },
      { label: '총 수주수량', value: num(qty), unit: 'EA', icon: 'box', tint: 'violet' },
      { label: '총 수주금액', value: won(total), icon: 'dollar', tint: 'green' },
    ];
  },
  columns: [
    { key: 'order_no', label: '수주번호', cls: 'cell-code', sortable: true },
    { key: 'order_date', label: '수주일', type: 'date', sortable: true },
    { key: 'partner', label: '거래처' },
    { key: 'item_code', label: '품목코드', cls: 'cell-code' },
    { key: 'item_name', label: '품명', cls: 'cell-strong' },
    { key: 'order_qty', label: '수주수량', type: 'num', sortable: true },
    { key: 'unit_price', label: '단가', type: 'money' },
    { key: 'amount', label: '금액', type: 'money', sortable: true },
    { key: 'due_date', label: '납기일', type: 'date', sortable: true },
    { key: 'status', label: '상태', type: 'badge', align: 'center' },
  ],
  fields: [
    { key: 'order_no', label: '수주번호 (자동생성)', placeholder: '비워두면 자동 채번', readonly: false },
    { key: 'order_date', label: '수주일', type: 'date', required: true, default: todayStr() },
    { key: 'partner', label: '거래처', required: true, ref: { table: 'partners', value: 'name', label: (r) => `${r.code} · ${r.name}` }, placeholder: '거래처 선택' },
    { key: 'item_code', label: '품목', required: true, ref: { table: 'items', value: 'code', label: (r) => `${r.code} · ${r.name}`, fill: { item_name: 'name', spec: 'spec', unit: 'unit', unit_price: 'unit_price' } }, placeholder: '품목 선택' },
    { key: 'item_name', label: '품명(자동)', required: true, readonly: true },
    { key: 'spec', label: '규격(자동)', readonly: true },
    { key: 'unit', label: '단위', type: 'select', options: ['EA', 'SET', 'BOX'], default: 'EA' },
    { key: 'order_qty', label: '수주수량', type: 'number', required: true, default: 0 },
    { key: 'unit_price', label: '단가', type: 'number', default: 0 },
    { key: 'amount', label: '금액(자동)', type: 'number', readonly: true, default: 0 },
    { key: 'due_date', label: '납기일', type: 'date' },
    { key: 'status', label: '상태', type: 'select', options: ['접수', '생산중', '완료', '취소'], default: '접수' },
    { key: 'remark', label: '비고', type: 'textarea' },
  ],
});

// 2-2 납품관리
export const deliveries = createCrudPage({
  table: 'deliveries', title: '납품관리', subtitle: '수주 건의 출하·납품 실적을 관리합니다.',
  searchFields: ['delivery_no', 'order_no', 'partner', 'item_name'], searchPlaceholder: '납품번호·수주번호·거래처 검색',
  defaultSort: { key: 'delivery_date', dir: 'desc' },
  filters: [{ key: 'status', label: '상태', options: ['출고예정', '납품완료'] }],
  statusChips: { key: 'status', options: ['출고예정', '납품완료'] },
  docNoField: { key: 'delivery_no', prefix: 'DL' },
  computed: (form) => bindAmount(form, 'delivery_qty', 'unit_price', 'amount'),
  stats: async (rows) => {
    const total = rows.reduce((s, r) => s + (+r.amount || 0), 0);
    const done = rows.filter(r => r.status === '납품완료');
    return [
      { label: '총 납품건수', value: num(rows.length), unit: '건', icon: 'truck', tint: 'brand' },
      { label: '납품완료', value: num(done.length), unit: '건', icon: 'checkCircle', tint: 'green' },
      { label: '출고예정', value: num(rows.length - done.length), unit: '건', icon: 'clock', tint: 'amber' },
      { label: '총 납품금액', value: won(total), icon: 'dollar', tint: 'violet' },
    ];
  },
  columns: [
    { key: 'delivery_no', label: '납품번호', cls: 'cell-code', sortable: true },
    { key: 'delivery_date', label: '납품일', type: 'date', sortable: true },
    { key: 'order_no', label: '수주번호', cls: 'cell-code' },
    { key: 'partner', label: '거래처' },
    { key: 'item_name', label: '품명', cls: 'cell-strong' },
    { key: 'delivery_qty', label: '납품수량', type: 'num', sortable: true },
    { key: 'unit_price', label: '단가', type: 'money' },
    { key: 'amount', label: '금액', type: 'money', sortable: true },
    { key: 'status', label: '상태', type: 'badge', align: 'center' },
  ],
  fields: [
    { key: 'delivery_no', label: '납품번호 (자동생성)', placeholder: '비워두면 자동 채번' },
    { key: 'delivery_date', label: '납품일', type: 'date', required: true, default: todayStr() },
    { key: 'order_no', label: '수주 선택', ref: { table: 'sales_orders', value: 'order_no', label: (r) => `${r.order_no} · ${r.partner} · ${r.item_name}`, fill: { partner: 'partner', item_code: 'item_code', item_name: 'item_name', unit_price: 'unit_price' } }, placeholder: '수주 선택' },
    { key: 'partner', label: '거래처(자동)', required: true, readonly: true },
    { key: 'item_code', label: '품목코드(자동)', readonly: true },
    { key: 'item_name', label: '품명(자동)', required: true, readonly: true },
    { key: 'delivery_qty', label: '납품수량', type: 'number', required: true, default: 0 },
    { key: 'unit_price', label: '단가', type: 'number', default: 0 },
    { key: 'amount', label: '금액(자동)', type: 'number', readonly: true, default: 0 },
    { key: 'status', label: '상태', type: 'select', options: ['출고예정', '납품완료'], default: '납품완료' },
    { key: 'remark', label: '비고', type: 'textarea' },
  ],
});
