// BOM관리 — 좌: 모품목 선택 / 우: 구성품(자재·반제품) + 소요량 편집(추가·삭제·저장)
import { db } from '../lib/db.js';
import { num, escapeHtml } from '../lib/format.js';
import { toast } from '../ui/components.js';
import { icon } from '../ui/icons.js';

export async function bomManager(root) {
  root.innerHTML = `
    <div class="page-head">
      <div class="page-head__text"><h1>BOM관리</h1><p>모품목(완제품·반제품)을 선택하고 구성품(자재·반제품)과 소요량을 등록합니다.</p></div>
    </div>
    <div style="display:grid;grid-template-columns:340px 1fr;gap:18px;align-items:start">
      <div class="card">
        <div class="toolbar"><div class="search-box grow">${icon('search', 16)}<input id="bom-search" placeholder="품목코드·품명 검색" autocomplete="off"/></div></div>
        <div id="bom-items" style="max-height:62vh;overflow-y:auto"></div>
      </div>
      <div class="card" id="bom-editor"><div class="card__body"><div class="empty" style="padding:80px 20px">${icon('layers', 52)}<h4>모품목을 선택하세요</h4><p>왼쪽에서 품목을 선택하면 BOM(구성품)을 편집할 수 있습니다.</p></div></div></div>
    </div>`;

  const [items, allBoms] = await Promise.all([
    db.all('items', { sort: 'code' }),
    db.all('boms', {}).catch(() => []),
  ]);
  // 모품목 후보: 완제품/반제품 (그 외 품목도 선택 가능하게 전체 노출하되 정렬은 유형 우선)
  const itemByCode = Object.fromEntries(items.map(i => [i.code, i]));

  const state = { code: null, rows: [], removedIds: [], counts: {} };
  for (const b of allBoms) state.counts[b.item_code] = (state.counts[b.item_code] || 0) + 1;

  const itemsSlot = root.querySelector('#bom-items');
  function renderItems(filter = '') {
    const q = filter.toLowerCase();
    const list = items.filter(i => ['완제품', '반제품'].includes(i.item_type) || state.counts[i.code])
      .filter(i => !q || [i.code, i.name, i.spec].some(v => String(v ?? '').toLowerCase().includes(q)));
    if (!list.length) { itemsSlot.innerHTML = `<div class="empty" style="padding:40px 12px">${icon('inbox', 40)}<h4>품목이 없습니다</h4><p>완제품·반제품을 먼저 등록하세요.</p></div>`; return; }
    itemsSlot.innerHTML = list.map(i => `
      <div class="rt-item ${state.code === i.code ? 'active' : ''}" data-code="${escapeHtml(i.code)}"
        style="display:flex;align-items:center;gap:10px;padding:12px 16px;border-bottom:1px solid var(--border);cursor:pointer">
        <div style="flex:1;min-width:0">
          <div class="flex" style="gap:8px"><span class="cell-code">${escapeHtml(i.code)}</span><span class="badge badge--neutral" style="height:20px">${escapeHtml(i.item_type || '')}</span></div>
          <div style="font-weight:700;margin-top:3px">${escapeHtml(i.name)}</div>
        </div>
        ${state.counts[i.code] ? `<span class="badge badge--brand">${state.counts[i.code]}개</span>` : `<span class="muted">미등록</span>`}
      </div>`).join('');
    itemsSlot.querySelectorAll('[data-code]').forEach(el => el.onclick = () => selectItem(el.dataset.code));
  }

  async function selectItem(code) {
    state.code = code; state.removedIds = [];
    renderItems(root.querySelector('#bom-search').value.trim());
    const editor = root.querySelector('#bom-editor');
    editor.innerHTML = `<div class="card__body"><div class="spinner"></div></div>`;
    let rows = [];
    try { rows = await db.all('boms', { filters: { item_code: code }, sort: 'component_code' }); }
    catch (e) { editor.innerHTML = `<div class="card__body">${/boms|relation|does not exist|schema cache/i.test(e.message || '') ? migrationBox() : `<div class="empty">${icon('alert', 48)}<h4>불러오기 실패</h4><p>${escapeHtml(e.message || e)}</p></div>`}</div>`; return; }
    state.rows = rows.map(r => ({ ...r }));
    renderEditor();
  }

  function renderEditor() {
    const item = itemByCode[state.code];
    const editor = root.querySelector('#bom-editor');
    state.rows.sort((a, b) => String(a.component_code).localeCompare(String(b.component_code)));
    // 구성품 후보: 자기 자신 제외
    const compOptions = items.filter(i => i.code !== state.code)
      .map(i => `<option value="${escapeHtml(i.code)}">${escapeHtml(i.code)} · ${escapeHtml(i.name)} (${escapeHtml(i.item_type || '')})</option>`).join('');

    editor.innerHTML = `
      <div class="card__head">
        <div><div class="flex" style="gap:8px"><span class="cell-code" style="font-size:14px">${escapeHtml(item.code)}</span><span class="badge badge--neutral">${escapeHtml(item.item_type || '')}</span></div>
          <h3 style="margin-top:4px">${escapeHtml(item.name)} BOM</h3></div>
        <div class="spacer"></div>
        <button class="btn btn--primary" id="bom-save">${icon('check', 16)} 저장</button>
      </div>
      <div class="card__body">
        <div class="flex" style="gap:10px;margin-bottom:14px">
          <select class="select" id="bom-add-comp" style="max-width:360px"><option value="">구성품(자재/반제품) 선택…</option>${compOptions}</select>
          <button class="btn" id="bom-add">${icon('plus', 16)} 구성품 추가</button>
          <div class="spacer"></div><span class="muted">총 ${state.rows.length}개 구성품</span>
        </div>
        <div class="table-wrap"><table class="grid" id="bom-table">
          <thead><tr><th>구성품코드</th><th>구성품명</th><th>유형</th><th class="num" style="width:130px">소요량</th><th class="center" style="width:80px">단위</th><th style="width:180px">비고</th><th class="center" style="width:60px"></th></tr></thead>
          <tbody></tbody>
        </table></div>
        ${!state.rows.length ? `<div class="empty" style="padding:40px">${icon('layers', 44)}<h4>등록된 구성품이 없습니다</h4><p>위에서 구성품을 선택해 추가하세요.</p></div>` : ''}
      </div>`;

    renderRows();
    editor.querySelector('#bom-add').onclick = addComp;
    editor.querySelector('#bom-save').onclick = save;
  }

  function renderRows() {
    const tbody = root.querySelector('#bom-table tbody');
    if (!tbody) return;
    tbody.innerHTML = state.rows.map((r, idx) => {
      const it = itemByCode[r.component_code] || {};
      return `<tr>
        <td class="cell-code">${escapeHtml(r.component_code)}</td>
        <td class="cell-strong">${escapeHtml(r.component_name || it.name || '')}</td>
        <td>${escapeHtml(it.item_type || '')}</td>
        <td class="num"><input class="input mono" style="text-align:right" type="number" step="any" value="${escapeHtml(r.qty ?? 0)}" data-idx="${idx}" data-f="qty"></td>
        <td class="center">${escapeHtml(r.unit || it.unit || 'EA')}</td>
        <td><input class="input" value="${escapeHtml(r.remark ?? '')}" data-idx="${idx}" data-f="remark" placeholder="-"></td>
        <td class="center"><button class="icon-btn" data-del="${idx}" title="삭제">${icon('trash', 15)}</button></td>
      </tr>`;
    }).join('');
    tbody.querySelectorAll('[data-idx]').forEach(el => el.addEventListener('input', () => {
      const r = state.rows[+el.dataset.idx];
      r[el.dataset.f] = el.dataset.f === 'qty' ? (el.value === '' ? null : Number(el.value)) : el.value;
    }));
    tbody.querySelectorAll('[data-del]').forEach(b => b.onclick = () => {
      const r = state.rows[+b.dataset.del];
      if (r.id) state.removedIds.push(r.id);
      state.rows.splice(+b.dataset.del, 1);
      renderEditor();
    });
  }

  function addComp() {
    const sel = root.querySelector('#bom-add-comp');
    const code = sel.value;
    if (!code) { toast('추가할 구성품을 선택하세요.', 'error'); return; }
    if (state.rows.some(r => r.component_code === code)) { toast('이미 추가된 구성품입니다.', 'error'); return; }
    const it = itemByCode[code] || {};
    state.rows.push({ item_code: state.code, component_code: code, component_name: it.name || code, qty: 1, unit: it.unit || 'EA', remark: '' });
    sel.value = '';
    renderEditor();
  }

  async function save() {
    if (!state.code) return;
    const btn = root.querySelector('#bom-save');
    btn.disabled = true; btn.innerHTML = '저장 중…';
    try {
      for (const id of state.removedIds) await db.remove('boms', id);
      state.removedIds = [];
      for (const r of state.rows) {
        const it = itemByCode[r.component_code] || {};
        const payload = { item_code: state.code, component_code: r.component_code, component_name: r.component_name || it.name || '', qty: +r.qty || 0, unit: r.unit || it.unit || 'EA', remark: r.remark || '' };
        if (r.id) await db.update('boms', r.id, payload);
        else await db.insert('boms', payload);
      }
      state.counts[state.code] = state.rows.length;
      toast('BOM이 저장되었습니다.');
      await selectItem(state.code);
    } catch (e) {
      toast(e.message || '저장 실패', 'error');
      btn.disabled = false; btn.innerHTML = '저장';
    }
  }

  renderItems();
  root.querySelector('#bom-search').addEventListener('input', (e) => renderItems(e.target.value.trim()));
}

function migrationBox() {
  return `<div class="empty" style="padding:40px 20px">${icon('database', 52)}<h4>BOM 테이블이 아직 생성되지 않았습니다</h4><p>Supabase SQL Editor에서 <b>supabase/migration_bom.sql</b> 을 실행한 뒤 다시 시도하세요.<br/>(데모 모드에서는 자동으로 동작합니다.)</p></div>`;
}
