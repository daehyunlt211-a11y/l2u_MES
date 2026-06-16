// 부적합현황 — 부적합관리(nonconformances) 데이터를 발생일 기준으로 집계해 차트 표시
import { db } from '../lib/db.js';
import { num, escapeHtml } from '../lib/format.js';
import { icon } from '../ui/icons.js';
import { badge } from '../ui/components.js';

const fmt = (d) => d.toISOString().slice(0, 10);
const today = () => fmt(new Date());
const daysAgo = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return fmt(d); };

export async function ncrStatus(root) {
  const state = { from: daysAgo(30), to: today() };

  root.innerHTML = `
    <div class="page-head">
      <div class="page-head__text"><h1>부적합현황</h1><p>부적합관리 데이터를 발생일 기준으로 집계해 차트로 보여줍니다.</p></div>
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
    <div class="grid-2" id="ncr-charts"></div>`;

  root.querySelector('#ncr-search').onclick = () => {
    state.from = root.querySelector('#ncr-from').value || daysAgo(30);
    state.to = root.querySelector('#ncr-to').value || today();
    load();
  };

  async function load() {
    const stats = root.querySelector('#ncr-stats');
    const charts = root.querySelector('#ncr-charts');
    charts.innerHTML = `<div class="spinner"></div>`;
    let rows = [];
    try { rows = await db.all('nonconformances', {}); }
    catch (e) { charts.innerHTML = `<div class="empty">${icon('alert', 48)}<h4>불러오기 실패</h4><p>${escapeHtml(e.message || e)}</p></div>`; return; }

    rows = rows.filter(r => { const d = String(r.occur_date || '').slice(0, 10); return d >= state.from && d <= state.to; });

    const totalQty = rows.reduce((s, r) => s + (+r.defect_qty || 0), 0);
    const open = rows.filter(r => r.status === '처리중').length;
    const done = rows.filter(r => r.status === '완료').length;
    stats.innerHTML = `<div class="stat-grid">
      ${stat('조회기간 부적합', num(rows.length), '건', 'alert', 'brand')}
      ${stat('부적합수량 합계', num(totalQty), 'EA', 'box', 'red')}
      ${stat('처리중', num(open), '건', 'clock', 'amber')}
      ${stat('완료', num(done), '건', 'checkCircle', 'green')}
    </div>`;

    if (!rows.length) {
      charts.innerHTML = `<div class="card" style="grid-column:1/-1"><div class="card__body"><div class="empty" style="padding:60px">${icon('inbox', 52)}<h4>해당 기간에 부적합 데이터가 없습니다</h4><p>조회 기간을 조정해 보세요. (기본: 최근 30일)</p></div></div></div>`;
      return;
    }

    charts.innerHTML =
      chartCard('발생공정별', 'factory', agg(rows, 'process'), 'var(--brand-500)') +
      chartCard('작업자별', 'users', agg(rows, 'worker'), 'var(--accent)') +
      chartCard('조치별', 'sliders', agg(rows, 'action_type'), 'var(--accent-2)') +
      chartCard('불량유형별', 'alert', agg(rows, 'defect_type'), 'var(--warning)');
  }

  // 발생일 변경 시 자동 조회
  root.querySelector('#ncr-from').onchange = () => root.querySelector('#ncr-search').click();
  root.querySelector('#ncr-to').onchange = () => root.querySelector('#ncr-search').click();

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

function chartCard(title, ic, data, color) {
  const max = Math.max(1, ...data.map(d => d.qty));
  const bars = data.length ? data.map(d => `
    <div style="margin-bottom:12px">
      <div class="flex between" style="margin-bottom:5px">
        <span style="font-weight:600">${escapeHtml(d.label)}</span>
        <span class="mono muted">${num(d.qty)} EA · ${num(d.count)}건</span>
      </div>
      <div class="progress" style="height:14px"><span style="width:${Math.round(d.qty / max * 100)}%;background:${color}"></span></div>
    </div>`).join('') : `<div class="empty" style="padding:28px">${icon('inbox', 36)}<h4>데이터 없음</h4></div>`;
  return `<div class="card"><div class="card__head">${icon(ic, 18)}<h3>${escapeHtml(title)}</h3><div class="spacer"></div>${badge(num(data.length) + '종', 'neutral')}</div><div class="card__body">${bars}</div></div>`;
}

function stat(label, value, unit, ic, tint) {
  return `<div class="stat"><div class="stat__top"><span class="stat__label">${label}</span><span class="stat__ico ico-tint-${tint}">${icon(ic, 21)}</span></div><div class="stat__value">${value}<small>${unit}</small></div></div>`;
}
