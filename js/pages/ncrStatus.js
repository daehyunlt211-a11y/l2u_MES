// 부적합현황 — 부적합관리(nonconformances) 데이터를 발생일 기준으로 집계해 그래프로 표시
//  - 발생일별 추이(막대) + 발생공정별/작업자별/조치별/불량유형별(도넛)
//  - 그래프 호버 시 툴팁, 클릭 시 해당 건 리스트 팝업
import { db } from '../lib/db.js';
import { num, escapeHtml, fmtDate } from '../lib/format.js';
import { icon } from '../ui/icons.js';
import { badge, openModal } from '../ui/components.js';

const PALETTE = ['#3b63f0', '#00c2a8', '#7c4dff', '#d97706', '#dc2626', '#16a34a', '#0284c7', '#db2777', '#65a30d', '#9333ea'];
const fmt = (d) => d.toISOString().slice(0, 10);
const today = () => fmt(new Date());
const daysAgo = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return fmt(d); };
const catVal = (r, key) => (r[key] && String(r[key]).trim()) || '(미지정)';

export async function ncrStatus(root) {
  const state = { from: daysAgo(30), to: today() };
  let rows = []; // 현재 조회기간 데이터

  root.innerHTML = `
    <div class="page-head">
      <div class="page-head__text"><h1>부적합현황</h1><p>그래프에 마우스를 올리면 요약, 클릭하면 해당 건 목록이 표시됩니다.</p></div>
      <div class="page-head__actions">
        <div class="flex" style="gap:8px;flex-wrap:wrap">
          <input class="input" type="date" id="ncr-from" value="${state.from}" style="width:auto">
          <span class="muted">~</span>
          <input class="input" type="date" id="ncr-to" value="${state.to}" style="width:auto">
          <button class="btn btn--primary" id="ncr-search">${icon('search', 16)} 조회</button>
        </div>
      </div>
    </div>
    <div id="ncr-stats"></div>
    <div class="card" style="margin-bottom:18px"><div class="card__head">${icon('activity', 18)}<h3>발생일별 추이</h3><div class="spacer"></div><span class="muted" id="ncr-range"></span></div><div class="card__body" id="ncr-trend"></div></div>
    <div class="grid-2" id="ncr-charts"></div>`;

  const doSearch = () => {
    state.from = root.querySelector('#ncr-from').value || daysAgo(30);
    state.to = root.querySelector('#ncr-to').value || today();
    load();
  };
  root.querySelector('#ncr-search').onclick = doSearch;
  root.querySelector('#ncr-from').onchange = doSearch;
  root.querySelector('#ncr-to').onchange = doSearch;

  async function load() {
    const charts = root.querySelector('#ncr-charts');
    const trend = root.querySelector('#ncr-trend');
    trend.innerHTML = `<div class="spinner"></div>`; charts.innerHTML = '';
    let all = [];
    try { all = await db.all('nonconformances', {}); }
    catch (e) { trend.innerHTML = `<div class="empty">${icon('alert', 48)}<h4>불러오기 실패</h4><p>${escapeHtml(e.message || e)}</p></div>`; return; }

    rows = all.filter(r => { const d = String(r.occur_date || '').slice(0, 10); return d >= state.from && d <= state.to; });
    root.querySelector('#ncr-range').textContent = `${state.from} ~ ${state.to}`;

    const totalQty = rows.reduce((s, r) => s + (+r.defect_qty || 0), 0);
    root.querySelector('#ncr-stats').innerHTML = `<div class="stat-grid">
      ${stat('조회기간 부적합', num(rows.length), '건', 'alert', 'brand')}
      ${stat('부적합수량 합계', num(totalQty), 'EA', 'box', 'red')}
      ${stat('처리중', num(rows.filter(r => r.status === '처리중').length), '건', 'clock', 'amber')}
      ${stat('완료', num(rows.filter(r => r.status === '완료').length), '건', 'checkCircle', 'green')}
    </div>`;

    if (!rows.length) {
      trend.innerHTML = `<div class="empty" style="padding:40px">${icon('inbox', 48)}<h4>해당 기간에 부적합 데이터가 없습니다</h4><p>조회 기간을 조정해 보세요. (기본: 최근 30일)</p></div>`;
      return;
    }

    trend.innerHTML = trendChart(rows, state.from, state.to);
    charts.innerHTML =
      donutCard('발생공정별', 'factory', 'process', rows) +
      donutCard('작업자별', 'users', 'worker', rows) +
      donutCard('조치별', 'sliders', 'action_type', rows) +
      donutCard('불량유형별', 'alert', 'defect_type', rows);

    bindInteractions();
  }

  // ---------- 호버/클릭 바인딩 ----------
  function bindInteractions() {
    // 도넛 세그먼트 + 범례
    root.querySelectorAll('#ncr-charts [data-cat]').forEach(el => {
      const card = el.closest('[data-key]');
      const key = card.dataset.key, title = card.dataset.title, cat = el.dataset.cat;
      const sub = rows.filter(r => catVal(r, key) === cat);
      const qty = sub.reduce((s, r) => s + (+r.defect_qty || 0), 0);
      const html = `<b>${escapeHtml(cat)}</b><br>${num(sub.length)}건 · ${num(qty)} EA<br><span style="color:var(--text-3)">클릭하면 목록 보기</span>`;
      el.addEventListener('mousemove', (e) => showTip(html, e.clientX, e.clientY));
      el.addEventListener('mouseleave', hideTip);
      el.addEventListener('click', () => { hideTip(); openListModal(`${title} · ${cat}`, sub); });
    });
    // 추이 막대
    root.querySelectorAll('#ncr-trend [data-date]').forEach(el => {
      const date = el.dataset.date;
      const sub = rows.filter(r => String(r.occur_date || '').slice(0, 10) === date);
      const qty = sub.reduce((s, r) => s + (+r.defect_qty || 0), 0);
      el.addEventListener('mousemove', (e) => showTip(`<b>${date}</b><br>${num(sub.length)}건 · ${num(qty)} EA${sub.length ? '<br><span style="color:var(--text-3)">클릭하면 목록 보기</span>' : ''}`, e.clientX, e.clientY));
      el.addEventListener('mouseleave', hideTip);
      el.addEventListener('click', () => { if (sub.length) { hideTip(); openListModal(`발생일 ${date}`, sub); } });
    });
  }

  load();
}

function agg(rows, key) {
  const m = {};
  for (const r of rows) {
    const k = catVal(r, key);
    (m[k] ??= { count: 0, qty: 0 });
    m[k].count++; m[k].qty += (+r.defect_qty || 0);
  }
  return Object.entries(m).map(([label, v]) => ({ label, ...v })).sort((a, b) => b.qty - a.qty || b.count - a.count);
}

// ---------- 발생일별 추이 (세로 막대) ----------
function trendChart(rows, from, to) {
  const days = [];
  let d = new Date(from); const end = new Date(to);
  while (d <= end && days.length < 120) { days.push(fmt(d)); d = new Date(d.getTime() + 86400000); }
  const map = {};
  for (const r of rows) { const k = String(r.occur_date || '').slice(0, 10); map[k] = (map[k] || 0) + (+r.defect_qty || 0); }
  const max = Math.max(1, ...days.map(x => map[x] || 0));
  const labelEvery = Math.ceil(days.length / 10);
  const bars = days.map((x, i) => {
    const v = map[x] || 0;
    const h = Math.round(v / max * 100);
    const lab = (i % labelEvery === 0) ? `<div style="font-size:10px;color:var(--text-3);transform:rotate(-45deg);transform-origin:top left;white-space:nowrap;height:14px">${x.slice(5)}</div>` : `<div style="height:14px"></div>`;
    return `<div class="trend-bar" data-date="${x}" style="flex:1;min-width:6px;display:flex;flex-direction:column;align-items:center;gap:4px">
      <div style="width:100%;height:150px;display:flex;align-items:flex-end">
        <div style="width:72%;margin:0 auto;height:${h}%;min-height:${v ? 4 : 0}px;background:linear-gradient(180deg,var(--brand-400),var(--brand-600));border-radius:4px 4px 0 0"></div>
      </div>${lab}</div>`;
  }).join('');
  return `<div style="display:flex;align-items:flex-end;gap:3px;overflow-x:auto;padding-bottom:4px">${bars}</div>`;
}

// ---------- 도넛 차트 (SVG 세그먼트) + 범례 ----------
function donutCard(title, ic, key, rows) {
  const data = agg(rows, key);
  const total = data.reduce((s, d) => s + d.qty, 0) || 1;
  let cum = 0;
  const segs = data.map((d, i) => {
    const pct = d.qty / total * 100;
    const off = 25 - cum; cum += pct;
    return `<circle class="donut-seg" data-cat="${escapeHtml(d.label)}" cx="21" cy="21" r="15.915" fill="none" stroke="${PALETTE[i % PALETTE.length]}" stroke-width="6" stroke-dasharray="${pct.toFixed(3)} ${(100 - pct).toFixed(3)}" stroke-dashoffset="${off.toFixed(3)}"></circle>`;
  }).join('');
  const legend = data.map((d, i) => `
    <div class="ncr-legend-item flex between" data-cat="${escapeHtml(d.label)}" style="padding:6px 8px">
      <div class="flex" style="gap:8px;min-width:0">
        <span style="width:11px;height:11px;border-radius:3px;background:${PALETTE[i % PALETTE.length]};flex-shrink:0"></span>
        <span style="font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${escapeHtml(d.label)}</span>
      </div>
      <span class="mono muted" style="flex-shrink:0">${num(d.qty)} EA · ${num(d.count)}건</span>
    </div>`).join('');
  return `<div class="card" data-key="${key}" data-title="${escapeHtml(title)}"><div class="card__head">${icon(ic, 18)}<h3>${escapeHtml(title)}</h3></div>
    <div class="card__body" style="display:flex;gap:20px;align-items:center;flex-wrap:wrap">
      <div style="position:relative;width:150px;height:150px;flex-shrink:0">
        <svg viewBox="0 0 42 42" width="150" height="150"><circle cx="21" cy="21" r="15.915" fill="none" stroke="var(--border)" stroke-width="6"></circle>${segs}</svg>
        <div style="position:absolute;inset:0;display:grid;place-items:center;pointer-events:none;text-align:center">
          <div><div class="muted" style="font-size:11px">합계</div><div style="font-size:20px;font-weight:800" class="mono">${num(total)}</div><div class="muted" style="font-size:11px">EA</div></div>
        </div>
      </div>
      <div style="flex:1;min-width:180px">${legend}</div>
    </div></div>`;
}

function stat(label, value, unit, ic, tint) {
  return `<div class="stat"><div class="stat__top"><span class="stat__label">${label}</span><span class="stat__ico ico-tint-${tint}">${icon(ic, 21)}</span></div><div class="stat__value">${value}<small>${unit}</small></div></div>`;
}

// ---------- 공용 툴팁 ----------
let tipEl;
function showTip(html, x, y) {
  if (!tipEl) { tipEl = document.createElement('div'); tipEl.className = 'chart-tip'; document.body.appendChild(tipEl); }
  tipEl.innerHTML = html; tipEl.style.display = 'block';
  const w = tipEl.offsetWidth, h = tipEl.offsetHeight;
  let left = x + 14, top = y + 14;
  if (left + w > window.innerWidth) left = x - w - 14;
  if (top + h > window.innerHeight) top = y - h - 14;
  tipEl.style.left = left + 'px'; tipEl.style.top = top + 'px';
}
function hideTip() { if (tipEl) tipEl.style.display = 'none'; }

// ---------- 클릭 시 목록 팝업 ----------
function openListModal(title, list) {
  const body = document.createElement('div');
  body.innerHTML = list.length
    ? `<div class="table-wrap"><table class="grid">
        <thead><tr><th>부적합번호</th><th>발생일</th><th>공정</th><th>품명</th><th>불량유형</th><th class="num">수량</th><th class="center">조치</th><th>작업자</th><th class="center">상태</th></tr></thead>
        <tbody>${list.map(r => `<tr>
          <td class="cell-code">${escapeHtml(r.ncr_no || '')}</td><td>${fmtDate(r.occur_date)}</td>
          <td>${escapeHtml(r.process || '')}</td><td class="cell-strong">${escapeHtml(r.item_name || '')}</td>
          <td>${escapeHtml(r.defect_type || '')}</td><td class="num mono">${num(r.defect_qty)}</td>
          <td class="center">${r.action_type ? badge(r.action_type, 'brand') : '-'}</td><td>${escapeHtml(r.worker || '')}</td>
          <td class="center">${badge(r.status || '')}</td></tr>`).join('')}</tbody></table></div>`
    : `<div class="empty" style="padding:30px">${icon('inbox', 40)}<h4>데이터가 없습니다</h4></div>`;
  openModal({ title: `${title} — ${list.length}건`, body, wide: true, footer: `<button class="btn" data-cancel>닫기</button>`, onMount: ({ footEl, close }) => { footEl.querySelector('[data-cancel]').onclick = close; } });
}
