// 공구관리(운영): 재고관리 / 입·출고관리 / 폐기관리
import { createCrudPage } from '../lib/crud.js';
import { num, todayStr } from '../lib/format.js';
import { badge } from '../ui/components.js';

// 5-1 공구재고관리 (뷰 — 읽기전용)
export const toolStocks = createCrudPage({
  table: 'tool_stocks', title: '공구 재고관리', subtitle: '입고·출고·폐기 기준 실시간 공구 재고 현황입니다.',
  readOnly: true,
  searchFields: ['tool_code', 'tool_name'], searchPlaceholder: '공구코드·공구명 검색',
  defaultSort: { key: 'tool_code', dir: 'asc' },
  filters: [{ key: 'tool_type', label: '유형', options: ['절삭', '측정', '지그', '기타'] }],
  stats: async (rows) => {
    const low = rows.filter(r => (+r.stock_qty || 0) <= (+r.safety_stock || 0)).length;
    return [
      { label: '관리 공구수', value: num(rows.length), unit: '종', icon: 'tool', tint: 'brand' },
      { label: '총 입고', value: num(rows.reduce((s, r) => s + (+r.in_qty || 0), 0)), unit: 'EA', icon: 'inbox', tint: 'green' },
      { label: '총 폐기', value: num(rows.reduce((s, r) => s + (+r.disposal_qty || 0), 0)), unit: 'EA', icon: 'trash', tint: 'red' },
      { label: '안전재고 미달', value: num(low), unit: '종', icon: 'alert', tint: low ? 'amber' : 'violet' },
    ];
  },
  columns: [
    { key: 'tool_code', label: '공구코드', cls: 'cell-code', sortable: true },
    { key: 'tool_name', label: '공구명', cls: 'cell-strong', sortable: true },
    { key: 'tool_type', label: '유형', type: 'badge' },
    { key: 'in_qty', label: '입고', type: 'num', sortable: true },
    { key: 'out_qty', label: '출고', type: 'num', sortable: true },
    { key: 'disposal_qty', label: '폐기', type: 'num', sortable: true },
    { key: 'safety_stock', label: '안전재고', type: 'num' },
    { key: 'stock_qty', label: '현재고', align: 'right', sortable: true, render: (r) => {
      const v = +r.stock_qty || 0, safe = +r.safety_stock || 0;
      const tone = v <= 0 ? 'danger' : v <= safe ? 'warning' : 'success';
      return badge(num(v), tone);
    } },
  ],
});

// 5-2 공구 입·출고관리
export const toolMovements = createCrudPage({
  table: 'tool_movements', title: '공구 입·출고관리', subtitle: '공구 입고·출고 이력을 등록하고 추적합니다.',
  searchFields: ['move_no', 'tool_code', 'tool_name', 'worker', 'equipment'], searchPlaceholder: '관리번호·공구·작업자 검색',
  defaultSort: { key: 'move_date', dir: 'desc' },
  filters: [{ key: 'move_type', label: '구분', options: ['입고', '출고'] }],
  statusChips: { key: 'move_type', options: ['입고', '출고'] },
  docNoField: { key: 'move_no', prefix: 'TM' },
  stats: async (rows) => [
    { label: '총 이력', value: num(rows.length), unit: '건', icon: 'refresh', tint: 'brand' },
    { label: '입고 건수', value: num(rows.filter(r => r.move_type === '입고').length), unit: '건', icon: 'inbox', tint: 'green' },
    { label: '출고 건수', value: num(rows.filter(r => r.move_type === '출고').length), unit: '건', icon: 'upload', tint: 'amber' },
    { label: '입고수량 합계', value: num(rows.filter(r => r.move_type === '입고').reduce((s, r) => s + (+r.qty || 0), 0)), unit: 'EA', icon: 'box', tint: 'violet' },
  ],
  columns: [
    { key: 'move_no', label: '관리번호', cls: 'cell-code', sortable: true },
    { key: 'move_date', label: '일자', type: 'date', sortable: true },
    { key: 'move_type', label: '구분', type: 'badge', align: 'center' },
    { key: 'tool_code', label: '공구코드', cls: 'cell-code' },
    { key: 'tool_name', label: '공구명', cls: 'cell-strong' },
    { key: 'qty', label: '수량', type: 'num', sortable: true },
    { key: 'worker', label: '담당자' },
    { key: 'equipment', label: '사용설비' },
    { key: 'location', label: '위치' },
  ],
  fields: [
    { key: 'move_no', label: '관리번호 (자동생성)', placeholder: '비워두면 자동 채번' },
    { key: 'move_date', label: '일자', type: 'date', required: true, default: todayStr() },
    { key: 'move_type', label: '구분', type: 'select', options: ['입고', '출고'], default: '입고' },
    { key: 'tool_code', label: '공구', required: true, ref: { table: 'tools', value: 'code', label: (r) => `${r.code} · ${r.name}`, fill: { tool_name: 'name', location: 'location' } }, placeholder: '공구 선택' },
    { key: 'tool_name', label: '공구명(자동)', required: true, readonly: true },
    { key: 'qty', label: '수량', type: 'number', required: true, default: 0 },
    { key: 'worker', label: '담당자', ref: { table: 'users', value: 'name', label: (r) => `${r.name} (${r.department || ''})` }, placeholder: '담당자 선택' },
    { key: 'equipment', label: '사용설비', ref: { table: 'equipments', value: 'name', label: (r) => `${r.code} · ${r.name}` }, placeholder: '설비 선택' },
    { key: 'location', label: '보관위치' },
    { key: 'remark', label: '비고', type: 'textarea' },
  ],
});

// 5-3 공구 폐기관리
export const toolDisposals = createCrudPage({
  table: 'tool_disposals', title: '공구 폐기관리', subtitle: '수명초과·파손 공구의 폐기 이력을 관리합니다.',
  searchFields: ['disposal_no', 'tool_code', 'tool_name', 'worker'], searchPlaceholder: '폐기번호·공구 검색',
  defaultSort: { key: 'disposal_date', dir: 'desc' },
  filters: [{ key: 'reason', label: '사유', options: ['수명초과', '파손', '마모', '기타'] }],
  statusChips: { key: 'reason', options: ['수명초과', '파손', '마모', '기타'] },
  docNoField: { key: 'disposal_no', prefix: 'TD' },
  stats: async (rows) => [
    { label: '총 폐기건수', value: num(rows.length), unit: '건', icon: 'trash', tint: 'brand' },
    { label: '폐기수량 합계', value: num(rows.reduce((s, r) => s + (+r.qty || 0), 0)), unit: 'EA', icon: 'box', tint: 'red' },
    { label: '수명초과', value: num(rows.filter(r => r.reason === '수명초과').length), unit: '건', icon: 'clock', tint: 'amber' },
    { label: '파손/마모', value: num(rows.filter(r => ['파손', '마모'].includes(r.reason)).length), unit: '건', icon: 'alert', tint: 'violet' },
  ],
  columns: [
    { key: 'disposal_no', label: '폐기번호', cls: 'cell-code', sortable: true },
    { key: 'disposal_date', label: '폐기일', type: 'date', sortable: true },
    { key: 'tool_code', label: '공구코드', cls: 'cell-code' },
    { key: 'tool_name', label: '공구명', cls: 'cell-strong' },
    { key: 'qty', label: '폐기수량', type: 'num', sortable: true },
    { key: 'reason', label: '사유', type: 'badge', tone: 'brand' },
    { key: 'worker', label: '담당자' },
    { key: 'remark', label: '비고' },
  ],
  fields: [
    { key: 'disposal_no', label: '폐기번호 (자동생성)', placeholder: '비워두면 자동 채번' },
    { key: 'disposal_date', label: '폐기일', type: 'date', required: true, default: todayStr() },
    { key: 'tool_code', label: '공구', required: true, ref: { table: 'tools', value: 'code', label: (r) => `${r.code} · ${r.name}`, fill: { tool_name: 'name' } }, placeholder: '공구 선택' },
    { key: 'tool_name', label: '공구명(자동)', required: true, readonly: true },
    { key: 'qty', label: '폐기수량', type: 'number', required: true, default: 0 },
    { key: 'reason', label: '폐기사유', type: 'select', options: ['수명초과', '파손', '마모', '기타'], default: '수명초과' },
    { key: 'worker', label: '담당자', ref: { table: 'users', value: 'name', label: (r) => `${r.name} (${r.department || ''})` }, placeholder: '담당자 선택' },
    { key: 'remark', label: '비고', type: 'textarea' },
  ],
});
