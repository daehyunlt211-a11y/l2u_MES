// 부적합현황 — 부적합관리(nonconformances) 데이터를 발생일 기준으로 집계해 그래프로 표시
//  - 발생일별 추이(막대) + 발생공정별/작업자별/조치별/불량유형별(도넛)
import { db } from '../lib/db.js';
import { num, escapeHtml } from '../lib/format.js';
import { icon } from '../ui/icons.js';

const PALETTE = ['#3b63f0', '#00c2a8', '#7c4dff', '#d97706', '#dc2626', '#16a34a', '#0284c7', '#db2777', '#65a30d', '#9333ea'];
const fmt = (d) => d.toISOString().slice(0, 10);
const today = () => fmt(new Date());
const daysAgo = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return fmt(d); };

export async function ncrStatus(root) {
  const state = { from: daysAgo(30), to: today() };

  root.innerHTML = `
    <div class="page-head">
      <div class="page-head__text"><h1>부적합현황</h1><p>부적합관리 데이터를 발생일 기준으로 집계해 그래프로 보여줍니다.</p></div>
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
    let rows = [];
    try { rows = await db.all('nonconformances', {}); }
    catch (e) { trend.innerHTML = `<div class="empty">${icon('alert', 48)}<h4>불러오기 실패</h4><p>${escapeHtml(e.message || e)}</p></div>`; return; }

    rows = rows.filter(r => { const d = String(r.occur_date || '').slice(0, 10); return d >= state.from && d <= state.to; });
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
      donutCard('발생공정별', 'factory', agg(rows, 'process')) +
      donutCard('작업자별', 'users', agg(rows, 'worker')) +
      donutCard('조치별', 'sliders', agg(rows, 'action_type')) +
      donutCard('불량유형별', 'alert', agg(rows, 'defect_type'));
  }

  load();
}

function agg(rows, key) {
  const m = {};
  for (const r of rows) {
    const k = (r[key] && String(r[key]).trim()) || '(미지정)';
    (m[k] ??= { count: 0, qty: 0 });
    m[k].count++; m[k].qty += (+r.defect_qty || 0);
  }
  return Object.entries(m).map(([label, v]) => ({ label, ...v })).sort((a, b) => b.qty - a.qty || b.count - a.count);
}

// ---------- 발생일별 추이 (세로 막대) ----------
function trendChart(rows, from, to) {
  const days = [];
  let d = new Date(from); const end = new Date(to);
  // 너무 길면 일자 수 제한 없이 그리되 라벨만 솎음
  while (d <= end && days.length < 120) { days.push(fmt(d)); d = new Date(d.getTime() + 86400000); }
  const map = {};
  for (const r of rows) { const k = String(r.occur_date || '').slice(0, 10); map[k] = (map[k] || 0) + (+r.defect_qty || 0); }
  const max = Math.max(1, ...days.map(x => map[x] || 0));
  const labelEvery = Math.ceil(days.length / 10);
  const bars = days.map((x, i) => {
    const v = map[x] || 0;
    const h = Math.round(v / max * 100);
    const lab = (i % labelEvery === 0) ? `<div style="font-size:10px;color:var(--text-3);transform:rotate(-45deg);transform-origin:top left;white-space:nowrap;height:14px">${x.slice(5)}</div>` : `<div style="height:14px"></div>`;
    return `<div style="flex:1;min-width:6px;display:flex;flex-direction:column;align-items:center;gap:4px">
      <div style="width:100%;height:150px;display:flex;align-items:flex-end" title="${x} · ${v}EA">
        <div style="width:72%;margin:0 auto;height:${h}%;min-height:${v ? 4 : 0}px;background:linear-gradient(180deg,var(--brand-400),var(--brand-600));border-radius:4px 4px 0 0"></div>
      </div>${lab}</div>`;
  }).join('');
  return `<div style="display:flex;align-items:flex-end;gap:3px;overflow-x:auto;padding-bottom:4px">${bars}</div>`;
}

// ---------- 도넛 차트 (conic-gradient) + 범례 ----------
function donutCard(title, ic, data) {
  const total = data.reduce((s, d) => s + d.qty, 0) || 1;
  let acc = 0;
  const stops = data.map((d, i) => {
    const start = acc; acc += d.qty / total * 100;
    return `${PALETTE[i % PALETTE.length]} ${start.toFixed(2)}% ${acc.toFixed(2)}%`;
  }).join(', ');
  const legend = data.map((d, i) => `
    <div class="flex between" style="padding:5px 0">
      <div class="flex" style="gap:8px;min-width:0">
        <span style="width:11px;height:11px;border-radius:3px;background:${PALETTE[i % PALETTE.length]};flex-shrink:0"></span>
        <span style="font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${escapeHtml(d.label)}</span>
      </div>
      <span class="mono muted" style="flex-shrink:0">${num(d.qty)} EA · ${num(d.count)}건</span>
    </div>`).join('');
  return `<div class="card"><div class="card__head">${icon(ic, 18)}<h3>${escapeHtml(title)}</h3></div>
    <div class="card__body" style="display:flex;gap:20px;align-items:center;flex-wrap:wrap">
      <div style="position:relative;width:150px;height:150px;border-radius:50%;background:conic-gradient(${stops});flex-shrink:0">
        <div style="position:absolute;inset:26px;border-radius:50%;background:var(--surface);display:grid;place-items:center;text-align:center">
          <div><div class="muted" style="font-size:11px">합계</div><div style="font-size:22px;font-weight:800" class="mono">${num(total)}</div><div class="muted" style="font-size:11px">EA</div></div>
        </div>
      </div>
      <div style="flex:1;min-width:180px">${legend}</div>
    </div></div>`;
}

function stat(label, value, unit, ic, tint) {
  return `<div class="stat"><div class="stat__top"><span class="stat__label">${label}</span><span class="stat__ico ico-tint-${tint}">${icon(ic, 21)}</span></div><div class="stat__value">${value}<small>${unit}</small></div></div>`;
}
