// 앱 부트스트랩: 레이아웃 렌더 + 해시 라우팅
import { MENU, ROUTES, DEFAULT_ROUTE } from './routes.js';
import { icon } from './ui/icons.js';
import { IS_DEMO, db } from './lib/db.js';
import { APP_CONFIG } from './config.js';
import { toast, confirmDialog } from './ui/components.js';
import { escapeHtml } from './lib/format.js';

const app = document.getElementById('app');

// ---------- 테마 ----------
function initTheme() {
  const saved = localStorage.getItem('mes_theme') || 'light';
  document.documentElement.setAttribute('data-theme', saved);
}
function toggleTheme() {
  const cur = document.documentElement.getAttribute('data-theme');
  const next = cur === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('mes_theme', next);
  renderThemeBtn();
}
function renderThemeBtn() {
  const btn = document.getElementById('theme-btn');
  if (btn) btn.innerHTML = icon(document.documentElement.getAttribute('data-theme') === 'dark' ? 'sun' : 'moon', 19);
}

// ---------- 레이아웃 ----------
function renderShell() {
  const collapsed = localStorage.getItem('mes_collapsed') === '1';
  app.className = 'app' + (collapsed ? ' collapsed' : '');
  app.innerHTML = `
    <aside class="sidebar">
      <div class="sidebar__brand">
        <div class="sidebar__logo">M</div>
        <div class="sidebar__title"><b>${escapeHtml(APP_CONFIG.appName)}</b><span>${escapeHtml(APP_CONFIG.company)}</span></div>
      </div>
      <nav class="sidebar__nav" id="nav"></nav>
      <div class="sidebar__footer">
        ${IS_DEMO ? `<button class="btn btn--sm" id="reset-demo" style="width:100%">${icon('refresh', 14)} 데모 데이터 초기화</button>` : ''}
      </div>
    </aside>
    <div class="main">
      <header class="topbar">
        <button class="icon-btn" id="toggle-sidebar" title="메뉴 접기">${icon('menu', 19)}</button>
        <div class="breadcrumb" id="breadcrumb"></div>
        <div class="topbar__spacer"></div>
        ${IS_DEMO ? `<span class="badge badge--warning" title="Supabase 미연결 — 브라우저에 임시 저장됩니다">데모 모드</span>` : `<span class="badge badge--success">Supabase 연결됨</span>`}
        <button class="icon-btn" id="theme-btn" title="테마 전환"></button>
        <button class="icon-btn" title="알림">${icon('bell', 19)}</button>
        <div class="avatar" title="관리자">A</div>
      </header>
      <main class="content" id="content"></main>
    </div>
    <div class="scrim" id="scrim"></div>`;

  renderNav();
  renderThemeBtn();

  document.getElementById('toggle-sidebar').onclick = () => {
    if (window.innerWidth <= 900) {
      app.classList.toggle('mobile-open');
      document.getElementById('scrim').classList.toggle('show', app.classList.contains('mobile-open'));
    } else {
      app.classList.toggle('collapsed');
      localStorage.setItem('mes_collapsed', app.classList.contains('collapsed') ? '1' : '0');
    }
  };
  document.getElementById('scrim').onclick = () => { app.classList.remove('mobile-open'); document.getElementById('scrim').classList.remove('show'); };
  document.getElementById('theme-btn').onclick = toggleTheme;
  const reset = document.getElementById('reset-demo');
  if (reset) reset.onclick = async () => {
    const ok = await confirmDialog({ title: '데모 데이터 초기화', message: '모든 입력 데이터를 삭제하고 기본 샘플로 되돌립니다. 계속하시겠습니까?', confirmText: '초기화' });
    if (!ok) return;
    await db.resetDemo(); toast('초기화되었습니다.'); location.reload();
  };
}

// ---------- 네비게이션 ----------
function renderNav() {
  const nav = document.getElementById('nav');
  const curPath = currentPath();
  nav.innerHTML = MENU.map(m => {
    if (!m.children) {
      const active = curPath === m.path ? 'active' : '';
      return `<div class="nav-group"><a class="nav-group__header ${active === 'active' ? '' : ''}" href="#${m.path}">
        <span class="nav-ico">${icon(m.icon, 20)}</span><span class="nav-group__label">${escapeHtml(m.label)}</span></a></div>`;
    }
    const childActive = m.children.some(c => c.path === curPath);
    const open = childActive || openGroups.has(m.id);
    return `<div class="nav-group ${open ? 'open' : ''}" data-group="${m.id}">
      <div class="nav-group__header" data-toggle="${m.id}">
        <span class="nav-ico">${icon(m.icon, 20)}</span>
        <span class="nav-group__label">${escapeHtml(m.label)}</span>
        <span class="nav-group__chev">${icon('chevronRight', 16)}</span>
      </div>
      <div class="nav-group__items"><div>
        ${m.children.map(c => `<a class="nav-item ${c.path === curPath ? 'active' : ''}" href="#${c.path}">${escapeHtml(c.label)}</a>`).join('')}
      </div></div></div>`;
  }).join('');

  nav.querySelectorAll('[data-toggle]').forEach(h => h.onclick = () => {
    const id = h.dataset.toggle;
    const group = nav.querySelector(`[data-group="${id}"]`);
    const isOpen = group.classList.toggle('open');
    if (isOpen) openGroups.add(id); else openGroups.delete(id);
  });
  nav.querySelectorAll('a[href^="#"]').forEach(a => a.addEventListener('click', () => {
    if (window.innerWidth <= 900) { app.classList.remove('mobile-open'); document.getElementById('scrim').classList.remove('show'); }
  }));
}
const openGroups = new Set();

// ---------- 라우터 ----------
function currentPath() {
  const h = location.hash.replace(/^#/, '').split('?')[0];
  return h || DEFAULT_ROUTE;
}
function currentParams() {
  const qs = location.hash.replace(/^#/, '').split('?')[1] || '';
  const params = {};
  new URLSearchParams(qs).forEach((v, k) => { params[k] = v; });
  return params;
}

async function route() {
  const path = currentPath();
  const r = ROUTES[path];
  const content = document.getElementById('content');
  if (!content) return;

  // breadcrumb
  const bc = document.getElementById('breadcrumb');
  if (r) bc.innerHTML = `<span>${escapeHtml(r.group)}</span><span class="sep">${icon('chevronRight', 14)}</span><b>${escapeHtml(r.title)}</b>`;

  // active nav 갱신
  renderNav();

  if (!r) {
    content.innerHTML = `<div class="empty" style="padding:100px 20px">${icon('alert', 56)}<h4>페이지를 찾을 수 없습니다</h4><p>요청하신 메뉴(${escapeHtml(path)})가 존재하지 않습니다.</p><a class="btn btn--primary" href="#${DEFAULT_ROUTE}" style="margin-top:14px">대시보드로 이동</a></div>`;
    return;
  }

  const view = document.createElement('div');
  view.className = 'page-enter';
  content.innerHTML = '';
  content.appendChild(view);
  try {
    await r.render(view, currentParams());
  } catch (e) {
    console.error(e);
    view.innerHTML = `<div class="empty" style="padding:80px 20px">${icon('alert', 56)}<h4>화면을 불러오지 못했습니다</h4><p>${escapeHtml(e.message || e)}</p></div>`;
  }
  document.title = `${r.title} · ${APP_CONFIG.appName}`;
  content.scrollTo?.(0, 0);
  window.scrollTo(0, 0);
}

// ---------- 시작 ----------
initTheme();
renderShell();
window.addEventListener('hashchange', route);
if (!location.hash) location.replace('#' + DEFAULT_ROUTE);
route();
