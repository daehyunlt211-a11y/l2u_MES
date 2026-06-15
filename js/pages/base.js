// 기준정보관리: 사용자/부서/거래처/품목/표준공정/제품별표준공정/공구/설비
import { createCrudPage } from '../lib/crud.js';
import { num } from '../lib/format.js';

// 1-1 사용자관리
export const users = createCrudPage({
  table: 'users', title: '사용자관리', subtitle: '시스템 사용자 계정과 권한을 관리합니다.',
  searchFields: ['login_id', 'name', 'department', 'email'], searchPlaceholder: '아이디·이름·부서 검색',
  defaultSort: { key: 'login_id', dir: 'asc' },
  filters: [
    { key: 'role', label: '권한', options: [{ value: 'admin', label: '관리자' }, { value: 'manager', label: '매니저' }, { value: 'user', label: '일반' }] },
    { key: 'department', label: '부서', options: ['경영지원팀', '영업팀', '생산팀', '품질팀', '자재팀'] },
  ],
  columns: [
    { key: 'login_id', label: '아이디', cls: 'cell-code', sortable: true },
    { key: 'name', label: '이름', cls: 'cell-strong', sortable: true },
    { key: 'department', label: '부서' },
    { key: 'position', label: '직급' },
    { key: 'role', label: '권한', type: 'badge', render: (r) => ({ admin: '관리자', manager: '매니저', user: '일반' }[r.role] || r.role) },
    { key: 'email', label: '이메일' },
    { key: 'phone', label: '연락처' },
    { key: 'use_yn', label: '사용', type: 'yesno', align: 'center' },
  ],
  fields: [
    { key: 'login_id', label: '로그인 아이디', required: true },
    { key: 'name', label: '이름', required: true },
    { key: 'department', label: '부서', ref: { table: 'departments', value: 'name', label: (r) => `${r.code} · ${r.name}` }, placeholder: '부서 선택' },
    { key: 'position', label: '직급' },
    { key: 'role', label: '권한', type: 'select', options: [{ value: 'admin', label: '관리자' }, { value: 'manager', label: '매니저' }, { value: 'user', label: '일반' }], default: 'user' },
    { key: 'email', label: '이메일' },
    { key: 'phone', label: '연락처' },
    { key: 'use_yn', label: '사용여부', type: 'switch', default: true },
    { key: 'remark', label: '비고', type: 'textarea' },
  ],
});

// 1-2 부서관리
export const departments = createCrudPage({
  table: 'departments', title: '부서관리', subtitle: '조직 부서 정보를 관리합니다.',
  searchFields: ['code', 'name', 'manager'], searchPlaceholder: '부서코드·부서명 검색',
  defaultSort: { key: 'code', dir: 'asc' },
  columns: [
    { key: 'code', label: '부서코드', cls: 'cell-code', sortable: true },
    { key: 'name', label: '부서명', cls: 'cell-strong', sortable: true },
    { key: 'manager', label: '부서장' },
    { key: 'phone', label: '연락처' },
    { key: 'use_yn', label: '사용', type: 'yesno', align: 'center' },
    { key: 'remark', label: '비고' },
  ],
  fields: [
    { key: 'code', label: '부서코드', required: true, placeholder: '예: D300' },
    { key: 'name', label: '부서명', required: true },
    { key: 'manager', label: '부서장' },
    { key: 'phone', label: '연락처' },
    { key: 'use_yn', label: '사용여부', type: 'switch', default: true },
    { key: 'remark', label: '비고', type: 'textarea' },
  ],
});

// 1-3 거래처관리
export const partners = createCrudPage({
  table: 'partners', title: '거래처관리', subtitle: '매출처·매입처·외주처 정보를 관리합니다.',
  searchFields: ['code', 'name', 'biz_no', 'ceo', 'manager'], searchPlaceholder: '거래처코드·명·사업자번호 검색',
  defaultSort: { key: 'code', dir: 'asc' },
  filters: [{ key: 'biz_type', label: '구분', options: ['매출처', '매입처', '외주처'] }],
  statusChips: { key: 'biz_type', options: ['매출처', '매입처', '외주처'] },
  columns: [
    { key: 'code', label: '거래처코드', cls: 'cell-code', sortable: true },
    { key: 'name', label: '거래처명', cls: 'cell-strong', sortable: true },
    { key: 'biz_type', label: '구분', type: 'badge' },
    { key: 'biz_no', label: '사업자번호' },
    { key: 'ceo', label: '대표자' },
    { key: 'manager', label: '담당자' },
    { key: 'phone', label: '연락처' },
    { key: 'use_yn', label: '사용', type: 'yesno', align: 'center' },
  ],
  fields: [
    { key: 'code', label: '거래처코드', required: true, placeholder: '예: C001' },
    { key: 'name', label: '거래처명', required: true },
    { key: 'biz_type', label: '거래구분', type: 'select', options: ['매출처', '매입처', '외주처'], default: '매출처' },
    { key: 'biz_no', label: '사업자등록번호', placeholder: '000-00-00000' },
    { key: 'ceo', label: '대표자' },
    { key: 'manager', label: '담당자' },
    { key: 'phone', label: '연락처' },
    { key: 'email', label: '이메일' },
    { key: 'address', label: '주소', col2: true },
    { key: 'use_yn', label: '사용여부', type: 'switch', default: true },
    { key: 'remark', label: '비고', type: 'textarea' },
  ],
});

// 1-4 품목관리
export const items = createCrudPage({
  table: 'items', title: '품목관리', subtitle: '완제품·반제품·원자재·부자재 품목 정보를 관리합니다.',
  searchFields: ['code', 'name', 'spec', 'category'], searchPlaceholder: '품목코드·품명·규격 검색',
  defaultSort: { key: 'code', dir: 'asc' },
  filters: [{ key: 'item_type', label: '품목유형', options: ['완제품', '반제품', '원자재', '부자재'] }],
  statusChips: { key: 'item_type', options: ['완제품', '반제품', '원자재', '부자재'] },
  columns: [
    { key: 'code', label: '품목코드', cls: 'cell-code', sortable: true },
    { key: 'name', label: '품명', cls: 'cell-strong', sortable: true },
    { key: 'item_type', label: '유형', type: 'badge' },
    { key: 'spec', label: '규격' },
    { key: 'unit', label: '단위', align: 'center' },
    { key: 'safety_stock', label: '안전재고', type: 'num', sortable: true },
    { key: 'unit_price', label: '단가', type: 'money', sortable: true },
    { key: 'use_yn', label: '사용', type: 'yesno', align: 'center' },
  ],
  fields: [
    { key: 'code', label: '품목코드', required: true, placeholder: '예: P-1001' },
    { key: 'name', label: '품명', required: true },
    { key: 'item_type', label: '품목유형', type: 'select', options: ['완제품', '반제품', '원자재', '부자재'], default: '완제품' },
    { key: 'spec', label: '규격' },
    { key: 'unit', label: '단위', type: 'select', options: ['EA', 'SET', 'BOX', 'KG', 'M', 'L'], default: 'EA' },
    { key: 'category', label: '분류' },
    { key: 'safety_stock', label: '안전재고', type: 'number', default: 0 },
    { key: 'unit_price', label: '단가', type: 'number', default: 0 },
    { key: 'partner', label: '주거래처', ref: { table: 'partners', value: 'name', label: (r) => `${r.code} · ${r.name}` }, placeholder: '거래처 선택' },
    { key: 'use_yn', label: '사용여부', type: 'switch', default: true },
    { key: 'remark', label: '비고', type: 'textarea' },
  ],
});

// 1-5 표준공정관리는 전용 화면(js/pages/processMaster.js)에서 처리합니다.
// 1-6 제품별표준공정관리(라우팅)는 전용 화면(js/pages/routing.js)에서 처리합니다.

// 1-7 공구관리 (마스터)
export const tools = createCrudPage({
  table: 'tools', title: '공구관리', subtitle: '공구 마스터(절삭·측정·지그) 기준정보를 관리합니다.',
  searchFields: ['code', 'name', 'spec', 'maker'], searchPlaceholder: '공구코드·공구명 검색',
  defaultSort: { key: 'code', dir: 'asc' },
  filters: [{ key: 'tool_type', label: '공구유형', options: ['절삭', '측정', '지그', '기타'] }],
  statusChips: { key: 'tool_type', options: ['절삭', '측정', '지그', '기타'] },
  columns: [
    { key: 'code', label: '공구코드', cls: 'cell-code', sortable: true },
    { key: 'name', label: '공구명', cls: 'cell-strong', sortable: true },
    { key: 'tool_type', label: '유형', type: 'badge' },
    { key: 'spec', label: '규격' },
    { key: 'maker', label: '제조사' },
    { key: 'life_count', label: '수명(횟수)', type: 'num' },
    { key: 'safety_stock', label: '안전재고', type: 'num' },
    { key: 'location', label: '보관위치' },
    { key: 'use_yn', label: '사용', type: 'yesno', align: 'center' },
  ],
  fields: [
    { key: 'code', label: '공구코드', required: true, placeholder: '예: T-001' },
    { key: 'name', label: '공구명', required: true },
    { key: 'tool_type', label: '공구유형', type: 'select', options: ['절삭', '측정', '지그', '기타'], default: '절삭' },
    { key: 'spec', label: '규격' },
    { key: 'maker', label: '제조사' },
    { key: 'life_count', label: '수명(횟수)', type: 'number', default: 0 },
    { key: 'unit', label: '단위', type: 'select', options: ['EA', 'SET'], default: 'EA' },
    { key: 'safety_stock', label: '안전재고', type: 'number', default: 0 },
    { key: 'location', label: '보관위치' },
    { key: 'use_yn', label: '사용여부', type: 'switch', default: true },
    { key: 'remark', label: '비고', type: 'textarea' },
  ],
});

// 1-8 설비관리
export const equipments = createCrudPage({
  table: 'equipments', title: '설비관리', subtitle: '생산 설비 정보와 가동상태를 관리합니다.',
  searchFields: ['code', 'name', 'model', 'maker', 'work_center'], searchPlaceholder: '설비코드·설비명 검색',
  defaultSort: { key: 'code', dir: 'asc' },
  filters: [
    { key: 'equip_type', label: '설비유형', options: ['가공기', '조립기', '검사기', '기타'] },
    { key: 'status', label: '상태', options: ['정상', '점검', '고장', '비가동'] },
  ],
  statusChips: { key: 'status', options: ['정상', '점검', '고장', '비가동'] },
  stats: async (rows) => {
    const c = (s) => rows.filter(r => r.status === s).length;
    return [
      { label: '전체 설비', value: num(rows.length), unit: '대', icon: 'cpu', tint: 'brand' },
      { label: '정상 가동', value: num(c('정상')), unit: '대', icon: 'checkCircle', tint: 'green' },
      { label: '점검 중', value: num(c('점검')), unit: '대', icon: 'settings', tint: 'amber' },
      { label: '고장/비가동', value: num(c('고장') + c('비가동')), unit: '대', icon: 'alert', tint: 'red' },
    ];
  },
  columns: [
    { key: 'code', label: '설비코드', cls: 'cell-code', sortable: true },
    { key: 'name', label: '설비명', cls: 'cell-strong', sortable: true },
    { key: 'equip_type', label: '유형', type: 'badge', tone: 'brand' },
    { key: 'model', label: '모델' },
    { key: 'maker', label: '제조사' },
    { key: 'work_center', label: '작업장' },
    { key: 'install_date', label: '설치일', type: 'date', sortable: true },
    { key: 'status', label: '상태', type: 'badge', align: 'center' },
  ],
  fields: [
    { key: 'code', label: '설비코드', required: true, placeholder: '예: CNC-01' },
    { key: 'name', label: '설비명', required: true },
    { key: 'equip_type', label: '설비유형', type: 'select', options: ['가공기', '조립기', '검사기', '기타'], default: '가공기' },
    { key: 'model', label: '모델명' },
    { key: 'maker', label: '제조사' },
    { key: 'work_center', label: '작업장' },
    { key: 'install_date', label: '설치일', type: 'date' },
    { key: 'status', label: '가동상태', type: 'select', options: ['정상', '점검', '고장', '비가동'], default: '정상' },
    { key: 'use_yn', label: '사용여부', type: 'switch', default: true },
    { key: 'remark', label: '비고', type: 'textarea' },
  ],
});
