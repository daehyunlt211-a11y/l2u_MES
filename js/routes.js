// 메뉴 구조 + 라우트 → 페이지 매핑
import { dashboard } from './pages/dashboard.js';
import * as base from './pages/base.js';
import * as sales from './pages/sales.js';
import * as prod from './pages/production.js';
import * as mat from './pages/material.js';
import * as tool from './pages/tool.js';
import * as qa from './pages/quality.js';
import { popList, popDetail } from './pages/pop.js';
import { itemRouting } from './pages/routing.js';
import { processMaster } from './pages/processMaster.js';
import { incomingInspection, shippingInspection } from './pages/inspection.js';
import { departmentManager } from './pages/department.js';
import { inspectionStandards } from './pages/inspectionStandard.js';

// 사이드바 메뉴 트리 (group icon + 하위 항목)
export const MENU = [
  { id: 'dashboard', label: '대시보드', icon: 'dashboard', path: '/dashboard' },
  { id: 'pop', label: '작업 POP', icon: 'monitor', path: '/pop' },
  {
    id: 'base', label: '기준정보관리', icon: 'database', children: [
      { label: '사용자관리', path: '/base/users' },
      { label: '부서관리', path: '/base/departments' },
      { label: '거래처관리', path: '/base/partners' },
      { label: '품목관리', path: '/base/items' },
      { label: '표준공정관리', path: '/base/processes' },
      { label: '제품별표준공정관리', path: '/base/item-processes' },
      { label: '공구관리', path: '/base/tools' },
      { label: '설비관리', path: '/base/equipments' },
    ],
  },
  {
    id: 'sales', label: '영업관리', icon: 'cart', children: [
      { label: '수주관리', path: '/sales/orders' },
      { label: '납품관리', path: '/sales/deliveries' },
    ],
  },
  {
    id: 'production', label: '생산관리', icon: 'factory', children: [
      { label: '생산계획관리', path: '/production/plans' },
      { label: '작업지시관리', path: '/production/work-orders' },
      { label: '생산실적', path: '/production/results' },
      { label: '생산현황판', path: '/production/board' },
    ],
  },
  {
    id: 'material', label: '자재관리', icon: 'box', children: [
      { label: '자재입고관리', path: '/material/inbounds' },
      { label: '자재반출관리', path: '/material/outbounds' },
      { label: '자재현황', path: '/material/stocks' },
    ],
  },
  {
    id: 'tool', label: '공구관리', icon: 'tool', children: [
      { label: '재고관리', path: '/tool/stocks' },
      { label: '입·출고관리', path: '/tool/movements' },
      { label: '폐기관리', path: '/tool/disposals' },
    ],
  },
  {
    id: 'quality', label: '품질관리', icon: 'shield', children: [
      { label: '검사기준관리', path: '/quality/standards' },
      { label: '수입검사', path: '/quality/incoming' },
      { label: '부적합관리', path: '/quality/nonconformance' },
      { label: '출하검사', path: '/quality/shipping' },
    ],
  },
];

// 라우트 → { render, title, group }
export const ROUTES = {
  '/dashboard': { render: dashboard, title: '대시보드', group: '대시보드' },

  '/pop': { render: popList, title: '작업 POP', group: 'POP' },
  '/pop/detail': { render: popDetail, title: '작업 진행', group: 'POP' },

  '/base/users': { render: base.users, title: '사용자관리', group: '기준정보관리' },
  '/base/departments': { render: departmentManager, title: '부서관리', group: '기준정보관리' },
  '/base/partners': { render: base.partners, title: '거래처관리', group: '기준정보관리' },
  '/base/items': { render: base.items, title: '품목관리', group: '기준정보관리' },
  '/base/processes': { render: processMaster, title: '표준공정관리', group: '기준정보관리' },
  '/base/item-processes': { render: itemRouting, title: '제품별표준공정관리', group: '기준정보관리' },
  '/base/tools': { render: base.tools, title: '공구관리', group: '기준정보관리' },
  '/base/equipments': { render: base.equipments, title: '설비관리', group: '기준정보관리' },

  '/sales/orders': { render: sales.salesOrders, title: '수주관리', group: '영업관리' },
  '/sales/deliveries': { render: sales.deliveries, title: '납품관리', group: '영업관리' },

  '/production/plans': { render: prod.productionPlans, title: '생산계획관리', group: '생산관리' },
  '/production/work-orders': { render: prod.workOrders, title: '작업지시관리', group: '생산관리' },
  '/production/results': { render: prod.productionResults, title: '생산실적', group: '생산관리' },
  '/production/board': { render: prod.productionBoard, title: '생산현황판', group: '생산관리' },

  '/material/inbounds': { render: mat.materialInbounds, title: '자재입고관리', group: '자재관리' },
  '/material/outbounds': { render: mat.materialOutbounds, title: '자재반출관리', group: '자재관리' },
  '/material/stocks': { render: mat.materialStocks, title: '자재현황', group: '자재관리' },

  '/tool/stocks': { render: tool.toolStocks, title: '재고관리', group: '공구관리' },
  '/tool/movements': { render: tool.toolMovements, title: '입·출고관리', group: '공구관리' },
  '/tool/disposals': { render: tool.toolDisposals, title: '폐기관리', group: '공구관리' },

  '/quality/standards': { render: inspectionStandards, title: '검사기준관리', group: '품질관리' },
  '/quality/incoming': { render: incomingInspection, title: '수입검사', group: '품질관리' },
  '/quality/nonconformance': { render: qa.nonconformances, title: '부적합관리', group: '품질관리' },
  '/quality/shipping': { render: shippingInspection, title: '출하검사', group: '품질관리' },
};

export const DEFAULT_ROUTE = '/dashboard';
