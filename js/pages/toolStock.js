// 공구 재고관리 — 좌: 공구 목록 / 우: 공구별 입고 LOT 상세(수명·사용·남은수명)
import { db } from '../lib/db.js';
import { num, fmtDate, escapeHtml } from '../lib/format.js';
import { badge } from '../ui/components.js';
import { icon } from '../ui/icons.js';

export async function toolStock(root) {
  root.innerHTML = `
    <div class="page-head">
      <div class="page-head__text"><h1>공구 재고관리</h1><p>공구별 입고 LOT의 수명(횟수)과 남은 수명을 관리합니다. (POP 투입 시 LOT별로 차감)</p></div>
      <div class="page-head__actions"><button class="btn" id="ts-refresh">${icon('refresh', 16)} 새로고침</button></div>
    </div>
    <div style="display:grid;grid-template-columns:340px 1fr;gap:18px;align-items:start">
      <div class="card">
        <div class="toolbar"><div class="search-box grow">${icon('search', 16)}<input id="ts-search" placeholder="공구코드·공구명 검색" autocomplete="off"/></div></div>
        <div id="ts-list" style="max-height:62vh;overflow-y:auto"></div>
      </div>
      <div class="card" id="ts-detail"><div class="card__body"><div class="empty" style="padding:80px 20px">${icon('tool', 52)}<h4>공구를 선택하세요</h4><p>왼쪽에서 공구를 선택하면 입고 LOT별 수명 현황이 표시됩니다.</p></div></div></div>
    </div>`;

  root.querySelector('#ts-refresh').onclick = () => toolStock(root);

  const state = { code: null, tools: [], moves: [], usages: [] };
  try {
    [state.tools, state.moves, state.usages] = await Promise.all([
      db.all('tools', { sort: 'code' }),
      db.all('tool_movements', {}).catch(() => []),
      db.all('tool_usages', {}).catch(() => []),
    ]);
  } catch (e) { root.querySelector('#ts-list').innerHTML = `<div class="empty">${icon('alert', 40)}<h4>불러오기 실패</h4><p>${escapeHtml(e.message || e)}</p></div>`; return; }

  // 공구별 입고 LOT (move_type 입고) + 사용/남은수명 계산
  function lotsOf(code) {
    const tool = state.tools.find(t => t.code === code) || {};
    const life1 = +tool.life_count || 0; // 1개당 수명(횟수)
    const lots = state.moves.filter(m => m.move_type === '입고' && m.tool_code === code)
      .sort((a, b) => String(a.move_date || '').localeCompare(String(b.move_date || '')));
    return lots.map(m => {
      const lifeTotal = life1 > 0 ? life1 * (+m.qty || 0) : 0; // 0이면 수명 무제한
      const used = state.usages.filter(u => u.lot_no === m.move_no).reduce((s, u) => s + (+u.use_qty || 0), 0);
      return { move_no: m.move_no, move_date: m.move_date, qty: +m.qty || 0, life1, lifeTotal, used, remain: life1 > 0 ? Math.max(0, lifeTotal - used) : null };
    });
  }
  function remainTotal(code) {
    const lots = lotsOf(code);
    if (lots.every(l => l.remain === null)) return null; // 수명 무제한
    return lots.reduce((s, l) => s + (l.remain || 0), 0);
  }

  const listSlot = root.querySelector('#ts-list');
  function renderList(filter = '') {
    const q = filter.toLowerCase();
    const list = state.tools.filter(t => !q || [t.code, t.name, t.process].some(v => String(v ?? '').toLowerCase().includes(q)));
    if (!list.length) { listSlot.innerHTML = `<div class="empty" style="padding:40px 12px">${icon('inbox', 40)}<h4>공구가 없습니다</h4></div>`; return; }
    listSlot.innerHTML = list.map(t => {
      const rt = remainTotal(t.code);
      return `<div class="rt-item ${state.code === t.code ? 'active' : ''}" data-code="${escapeHtml(t.code)}"
        style="display:flex;align-items:center;gap:10px;padding:12px 16px;border-bottom:1px solid var(--border);cursor:pointer">
        <div style="flex:1;min-width:0">
          <div class="flex" style="gap:8px"><span class="cell-code">${escapeHtml(t.code)}</span><span class="badge badge--neutral" style="height:20px">${escapeHtml(t.tool_type || '')}</span></div>
          <div style="font-weight:700;margin-top:3px">${escapeHtml(t.name)}</div>
        </div>
        ${rt === null ? `<span class="muted">수명관리X</span>` : `<span class="badge ${rt <= (+t.safety_stock || 0) ? 'badge--danger' : 'badge--success'}">남은 ${num(rt)}</span>`}
      </div>`;
    }).join('');
    listSlot.querySelectorAll('[data-code]').forEach(el => el.onclick = () => selectTool(el.dataset.code));
  }

  function selectTool(code) {
    state.code = code;
    renderList(root.querySelector('#ts-search').value.trim());
    const t = state.tools.find(x => x.code === code) || {};
    const lots = lotsOf(code);
    const editor = root.querySelector('#ts-detail');
    const lifeUnlimited = (+t.life_count || 0) === 0;
    editor.innerHTML = `
      <div class="card__head">
        <div><div class="flex" style="gap:8px"><span class="cell-code" style="font-size:14px">${escapeHtml(t.code)}</span><span class="badge badge--neutral">${escapeHtml(t.tool_type || '')}</span></div>
          <h3 style="margin-top:4px">${escapeHtml(t.name)}</h3></div>
      </div>
      <div class="card__body">
        <div class="grid-3" style="margin-bottom:18px">
          ${infoBox('1개당 수명(횟수)', lifeUnlimited ? '관리 안함' : num(t.life_count))}
          ${infoBox('사용공정', t.process || '-')}
          ${infoBox('남은수명 합계', lifeUnlimited ? '-' : num(remainTotal(code)))}
        </div>
        <h4 style="margin:0 0 10px;display:flex;align-items:center;gap:8px">${icon('inbox', 18)} 입고 LOT 상세</h4>
        <div class="table-wrap"><table class="grid">
          <thead><tr><th>입고일</th><th>LOT</th><th class="num">입고수량</th><th class="num">수명(횟수)</th><th class="num">사용(횟수)</th><th class="num">남은수명</th><th class="center">상태</th></tr></thead>
          <tbody>${lots.length ? lots.map(l => `<tr>
            <td>${fmtDate(l.move_date)}</td><td class="cell-code">${escapeHtml(l.move_no || '')}</td>
            <td class="num mono">${num(l.qty)}</td>
            <td class="num mono">${l.remain === null ? '∞' : num(l.lifeTotal)}</td>
            <td class="num mono">${num(l.used)}</td>
            <td class="num mono" style="font-weight:700">${l.remain === null ? '∞' : num(l.remain)}</td>
            <td class="center">${l.remain === null ? badge('수명관리X', 'neutral') : (l.remain <= 0 ? badge('소진', 'danger') : badge('사용가능', 'success'))}</td>
          </tr>`).join('') : `<tr><td colspan="7"><div class="empty" style="padding:30px">${icon('inbox', 40)}<h4>입고 LOT이 없습니다</h4><p>공구 입·출고관리에서 입고를 등록하세요.</p></div></td></tr>`}</tbody>
        </table></div>
      </div>`;
  }

  renderList();
  root.querySelector('#ts-search').addEventListener('input', (e) => renderList(e.target.value.trim()));
}

function infoBox(label, val) {
  return `<div style="background:var(--surface-2);border:1px solid var(--border);border-radius:10px;padding:12px 14px"><div class="muted" style="font-size:12px">${escapeHtml(label)}</div><div style="font-weight:700;font-size:15px;margin-top:2px">${escapeHtml(val)}</div></div>`;
}
