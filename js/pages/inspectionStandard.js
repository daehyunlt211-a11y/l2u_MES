// 검사기준관리 — 검사유형(수입/부적합/출하) 탭별 + 평가방법(정량 숫자 / 정성 OK·NG) 폼
import { db } from '../lib/db.js';
import { escapeHtml, nextDocNo } from '../lib/format.js';
import { toast, confirmDialog, openModal, badge, yesNo } from '../ui/components.js';
import { icon } from '../ui/icons.js';

const TYPES = ['수입검사', '부적합검사', '출하검사'];

export async function inspectionStandards(root) {
  const state = { type: '수입검사', search: '', rows: [], counts: {}, items: [], tools: [] };

  root.innerHTML = `
    <div class="page-head">
      <div class="page-head__text"><h1>검사기준관리</h1><p>검사유형별 검사기준을 등록합니다. 정량적은 숫자 측정, 정성적은 OK/NG로 판정합니다.</p></div>
      <div class="page-head__actions"><button class="btn btn--primary" id="is-add">${icon('plus', 16)} 검사기준 등록</button></div>
    </div>
    <div class="card">
      <div class="toolbar" style="gap:8px">
        <div class="chips" id="is-tabs"></div>
        <div class="grow"></div>
        <div class="search-box" style="min-width:240px">${icon('search', 16)}<input id="is-search" placeholder="품목·검사항목 검색" autocomplete="off"/></div>
      </div>
      <div class="table-wrap"><div id="is-table"><div class="spinner"></div></div></div>
    </div>`;

  root.querySelector('#is-add').onclick = () => openForm(null);
  root.querySelector('#is-search').addEventListener('input', (e) => { state.search = e.target.value.trim(); renderTable(); });

  async function loadRefs() {
    [state.items, state.tools] = await Promise.all([
      db.all('items', { sort: 'code' }).catch(() => []),
      db.all('tools', { sort: 'code' }).catch(() => []),
    ]);
  }

  async function load() {
    root.querySelector('#is-table').innerHTML = `<div class="spinner"></div>`;
    try { state.rows = await db.all('inspection_standards', { sort: 'std_no' }); }
    catch (e) {
      const need = /eval_method|column|does not exist|schema cache/i.test(e.message || '');
      root.querySelector('#is-table').innerHTML = need ? migrationBox() : `<div class="empty">${icon('alert', 48)}<h4>불러오기 실패</h4><p>${escapeHtml(e.message || e)}</p></div>`;
      return;
    }
    state.counts = {};
    for (const r of state.rows) state.counts[r.inspect_type] = (state.counts[r.inspect_type] || 0) + 1;
    renderTabs(); renderTable();
  }

  function renderTabs() {
    const wrap = root.querySelector('#is-tabs');
    wrap.innerHTML = TYPES.map(t => `<button class="chip ${state.type === t ? 'active' : ''}" data-t="${t}">${t}<span class="chip__count">${state.counts[t] || 0}</span></button>`).join('');
    wrap.querySelectorAll('[data-t]').forEach(b => b.onclick = () => { state.type = b.dataset.t; renderTabs(); renderTable(); });
  }

  function renderTable() {
    const q = state.search.toLowerCase();
    const list = state.rows.filter(r => r.inspect_type === state.type &&
      (!q || [r.std_no, r.item_code, r.item_name, r.inspect_item].some(v => String(v ?? '').toLowerCase().includes(q))));
    const slot = root.querySelector('#is-table');
    if (!list.length) { slot.innerHTML = `<div class="empty">${icon('inbox', 52)}<h4>${escapeHtml(state.type)} 기준이 없습니다</h4><p>[검사기준 등록]으로 추가하세요.</p></div>`; return; }
    slot.innerHTML = `<table class="grid"><thead><tr>
      <th>기준번호</th><th>품목코드</th><th>품명</th><th>검사항목</th><th class="center">평가방법</th><th>기준/판정</th><th class="center">사용</th><th class="center" style="width:90px">관리</th>
    </tr></thead><tbody>${list.map(r => {
      const quant = (r.eval_method || '정량적') === '정량적';
      const std = quant
        ? `${escapeHtml(r.spec_value ?? '')}${r.tolerance ? ` <span class="muted">/ 공차 ${escapeHtml(r.tolerance)}</span>` : ''}`
        : `<span class="muted">${escapeHtml(r.spec_value || 'OK/NG 판정')}</span>`;
      return `<tr data-id="${r.id}">
        <td class="cell-code">${escapeHtml(r.std_no)}</td><td class="cell-code">${escapeHtml(r.item_code || '')}</td>
        <td class="cell-strong">${escapeHtml(r.item_name || '')}</td><td>${escapeHtml(r.inspect_item || '')}</td>
        <td class="center">${badge(r.eval_method || '정량적')}</td><td>${std}</td>
        <td class="center">${yesNo(r.use_yn)}</td>
        <td class="center"><div class="row-actions">
          <button class="icon-btn" data-edit="${r.id}" title="수정">${icon('edit', 15)}</button>
          <button class="icon-btn" data-del="${r.id}" title="삭제">${icon('trash', 15)}</button>
        </div></td></tr>`;
    }).join('')}</tbody></table>`;
    slot.querySelectorAll('[data-edit]').forEach(b => b.onclick = () => openForm(list.find(r => r.id === b.dataset.edit)));
    slot.querySelectorAll('[data-del]').forEach(b => b.onclick = async () => {
      const r = list.find(x => x.id === b.dataset.del);
      if (!(await confirmDialog({ message: `검사기준 [${r.std_no}]을(를) 삭제하시겠습니까?`, confirmText: '삭제' }))) return;
      try { await db.remove('inspection_standards', r.id); toast('삭제되었습니다.'); load(); } catch (e) { toast(e.message || '삭제 실패', 'error'); }
    });
  }

  function openForm(r) {
    const isEdit = !!r;
    const v = (k, d = '') => (r ? (r[k] ?? d) : d);
    const evalMethod = v('eval_method', '정량적');
    const body = document.createElement('form');
    body.className = 'form-grid';
    body.innerHTML = `
      <div class="field"><label>검사유형 <span class="req">*</span></label>
        <select class="select" name="inspect_type">${TYPES.map(t => `<option ${(r ? v('inspect_type') : state.type) === t ? 'selected' : ''}>${t}</option>`).join('')}</select></div>
      <div class="field"><label>품목 <span class="req">*</span></label>
        <select class="select" name="item_code"><option value="">품목 선택</option>
          ${state.items.map(i => `<option value="${escapeHtml(i.code)}" ${v('item_code') === i.code ? 'selected' : ''}>${escapeHtml(i.code)} · ${escapeHtml(i.name)}</option>`).join('')}
        </select></div>
      <div class="field"><label>검사항목 <span class="req">*</span></label><input class="input" name="inspect_item" value="${escapeHtml(v('inspect_item'))}" placeholder="예: 전장, 두께, 외관"></div>
      <div class="field"><label>평가방법 <span class="req">*</span></label>
        <select class="select" name="eval_method">
          <option value="정량적" ${evalMethod === '정량적' ? 'selected' : ''}>정량적 (숫자 측정)</option>
          <option value="정성적" ${evalMethod === '정성적' ? 'selected' : ''}>정성적 (OK/NG 판정)</option>
        </select></div>

      <!-- 정량적 전용 -->
      <div class="field" data-quant><label>규격값(기준 숫자) <span class="req">*</span></label><input class="input" name="spec_value_q" type="number" step="any" value="${escapeHtml(evalMethod === '정량적' ? v('spec_value') : '')}" placeholder="예: 120"></div>
      <div class="field" data-quant><label>허용공차(±, 숫자)</label><input class="input" name="tolerance" type="number" step="any" value="${escapeHtml(v('tolerance'))}" placeholder="예: 0.1"></div>

      <!-- 정성적 전용 -->
      <div class="field col-2" data-qual><label>판정기준 (OK 조건 설명)</label><input class="input" name="spec_value_t" value="${escapeHtml(evalMethod === '정성적' ? v('spec_value') : '')}" placeholder="예: 스크래치·이물 없음 → OK"></div>

      <div class="field"><label>검사방법</label><input class="input" name="method" value="${escapeHtml(v('method'))}" placeholder="예: 버니어캘리퍼스 / 육안"></div>
      <div class="field"><label>측정장비</label>
        <select class="select" name="equipment"><option value="">선택</option>
          ${state.tools.map(t => `<option value="${escapeHtml(t.name)}" ${v('equipment') === t.name ? 'selected' : ''}>${escapeHtml(t.code)} · ${escapeHtml(t.name)}</option>`).join('')}
        </select></div>
      <div class="field col-2"><label class="switch"><input type="checkbox" name="use_yn" ${v('use_yn', true) === false ? '' : 'checked'}><span class="switch__track"></span><span class="muted" data-switch-label>${v('use_yn', true) === false ? '미사용' : '사용'}</span></label></div>
      <div class="field col-2"><label>비고</label><input class="input" name="remark" value="${escapeHtml(v('remark'))}"></div>`;

    const toggleEval = () => {
      const m = body.querySelector('[name="eval_method"]').value;
      body.querySelectorAll('[data-quant]').forEach(el => el.classList.toggle('hidden', m !== '정량적'));
      body.querySelectorAll('[data-qual]').forEach(el => el.classList.toggle('hidden', m !== '정성적'));
    };
    body.querySelector('[name="eval_method"]').addEventListener('change', toggleEval);

    // 품목 선택 시 품명 자동
    const itemName = () => state.items.find(i => i.code === body.querySelector('[name="item_code"]').value)?.name || '';

    openModal({
      title: `검사기준 ${isEdit ? '수정' : '등록'}`, body, wide: true,
      footer: `<button class="btn" data-cancel>취소</button><button class="btn btn--primary" data-ok>${icon('check', 16)} ${isEdit ? '수정' : '등록'}</button>`,
      onMount: ({ footEl, close }) => {
        toggleEval();
        footEl.querySelector('[data-cancel]').onclick = close;
        footEl.querySelector('[data-ok]').onclick = async () => {
          const g = (n) => { const el = body.querySelector(`[name="${n}"]`); return el ? el.value.trim() : ''; };
          const evalM = g('eval_method');
          if (!g('item_code')) { toast('품목을 선택하세요.', 'error'); return; }
          if (!g('inspect_item')) { toast('검사항목을 입력하세요.', 'error'); return; }
          if (evalM === '정량적' && g('spec_value_q') === '') { toast('규격값(숫자)을 입력하세요.', 'error'); return; }
          const payload = {
            inspect_type: g('inspect_type'), item_code: g('item_code'), item_name: itemName(),
            inspect_item: g('inspect_item'), eval_method: evalM,
            spec_value: evalM === '정량적' ? g('spec_value_q') : g('spec_value_t'),
            tolerance: evalM === '정량적' ? g('tolerance') : '',
            method: g('method'), equipment: g('equipment'),
            use_yn: body.querySelector('[name="use_yn"]').checked, remark: g('remark'),
          };
          try {
            if (isEdit) await db.update('inspection_standards', r.id, payload);
            else {
              const all = await db.all('inspection_standards', {});
              payload.std_no = nextDocNo('IS', all.map(x => x.std_no));
              await db.insert('inspection_standards', payload);
            }
            close(); toast(isEdit ? '수정되었습니다.' : '등록되었습니다.');
            state.type = payload.inspect_type; load();
          } catch (e) { toast(e.message || '저장 실패', 'error'); }
        };
      },
    });
  }

  await loadRefs();
  await load();
}

function migrationBox() {
  return `<div class="empty" style="padding:40px 20px">${icon('database', 52)}<h4>검사기준 컬럼이 아직 추가되지 않았습니다</h4><p>Supabase SQL Editor에서 <b>supabase/migration_inspection.sql</b> 을 실행한 뒤 다시 시도하세요.<br/>(데모 모드에서는 자동으로 동작합니다.)</p></div>`;
}
