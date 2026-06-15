// 검사 진행 화면 (수입검사 / 출하검사)
// 검사기준관리(inspection_standards)에 등록된 항목 기준으로 검사를 진행하고
// 항목별 측정/판정을 inspection_details에 저장한다.
import { db } from '../lib/db.js';
import { num, fmtDate, todayStr, escapeHtml, nextDocNo, downloadCSV } from '../lib/format.js';
import { badge, toast, openModal, confirmDialog } from '../ui/components.js';
import { icon } from '../ui/icons.js';

// 정량 판정: 측정값이 규격값 ± 공차 범위 내이면 OK
function judgeQuant(spec, tol, measured) {
  const s = parseFloat(spec);
  const m = parseFloat(measured);
  if (isNaN(s) || isNaN(m)) return null;
  const t = Math.abs(parseFloat(String(tol ?? '').replace(/[^0-9.\-]/g, '')) || 0);
  return (m >= s - t && m <= s + t) ? 'OK' : 'NG';
}

export function createInspectionPage(cfg) {
  // cfg: { table, kind, title, subtitle, docPrefix, sourceTable, sourceKey, sourceLabel, sourceFill, extraKey, extraLabel }
  return async function render(root) {
    const state = { search: '', result: '__all__' };

    root.innerHTML = `
      <div class="page-head">
        <div class="page-head__text"><h1>${escapeHtml(cfg.title)}</h1><p>${escapeHtml(cfg.subtitle)}</p></div>
        <div class="page-head__actions">
          <button class="btn" id="ins-csv">${icon('download', 16)} 엑셀(CSV)</button>
          <button class="btn" id="ins-refresh">${icon('refresh', 16)} 새로고침</button>
          <button class="btn btn--primary" id="ins-new">${icon('plus', 16)} 신규 검사</button>
        </div>
      </div>
      <div id="ins-stats"></div>
      <div class="card">
        <div class="toolbar">
          <div class="search-box grow">${icon('search', 16)}<input id="ins-search" placeholder="검사번호·품목·거래처 검색" autocomplete="off"/></div>
          <div class="chips" id="ins-chips"></div>
        </div>
        <div class="table-wrap"><div id="ins-table"><div class="spinner"></div></div></div>
      </div>`;

    root.querySelector('#ins-refresh').onclick = () => load();
    root.querySelector('#ins-new').onclick = () => openInspectionForm();
    root.querySelector('#ins-csv').onclick = () => exportCsv();
    root.querySelector('#ins-search').addEventListener('input', (e) => { state.search = e.target.value.trim(); renderTable(); });

    let rows = [];

    async function load() {
      root.querySelector('#ins-table').innerHTML = `<div class="spinner"></div>`;
      try { rows = await db.all(cfg.table, { sort: 'inspect_date', sortDir: 'desc' }); }
      catch (e) { root.querySelector('#ins-table').innerHTML = `<div class="empty">${icon('alert', 48)}<h4>불러오기 실패</h4><p>${escapeHtml(e.message || e)}</p></div>`; return; }
      renderStats(); renderChips(); renderTable();
    }

    function filtered() {
      const q = state.search.toLowerCase();
      return rows.filter(r =>
        (state.result === '__all__' || r.result === state.result) &&
        (!q || [r.inspect_no, r.item_code, r.item_name, r.partner].some(v => String(v ?? '').toLowerCase().includes(q)))
      );
    }

    function renderStats() {
      const pass = rows.filter(r => r.result === '합격').length;
      const rate = rows.length ? ((pass / rows.length) * 100).toFixed(1) : '0.0';
      root.querySelector('#ins-stats').innerHTML = `<div class="stat-grid">
        ${stat('총 검사건수', num(rows.length), '건', 'shield', 'brand')}
        ${stat('합격', num(pass), '건', 'checkCircle', 'green')}
        ${stat('불합격', num(rows.filter(r => r.result === '불합격').length), '건', 'alert', 'red')}
        ${stat('합격률', rate, '%', 'trendUp', 'violet')}</div>`;
    }

    function renderChips() {
      const opts = [{ v: '__all__', l: '전체' }, { v: '합격', l: '합격' }, { v: '불합격', l: '불합격' }, { v: '조건부합격', l: '조건부합격' }];
      const wrap = root.querySelector('#ins-chips');
      wrap.innerHTML = opts.map(o => `<button class="chip ${state.result === o.v ? 'active' : ''}" data-r="${o.v}">${o.l}</button>`).join('');
      wrap.querySelectorAll('[data-r]').forEach(b => b.onclick = () => { state.result = b.dataset.r; renderChips(); renderTable(); });
    }

    function renderTable() {
      const list = filtered();
      const slot = root.querySelector('#ins-table');
      if (!list.length) { slot.innerHTML = `<div class="empty">${icon('inbox', 52)}<h4>검사 내역이 없습니다</h4><p>신규 검사 버튼으로 검사를 진행하세요.</p></div>`; return; }
      slot.innerHTML = `<table class="grid"><thead><tr>
        <th>검사번호</th><th>검사일</th><th>${escapeHtml(cfg.extraLabel || '구분')}</th><th>거래처</th><th>품명</th>
        <th class="num">검사</th><th class="num">양품</th><th class="num">불량</th><th>검사자</th><th class="center">판정</th><th class="center" style="width:90px">관리</th>
      </tr></thead><tbody>${list.map(r => `<tr class="clickable" data-id="${r.id}">
        <td class="cell-code">${escapeHtml(r.inspect_no)}</td><td>${fmtDate(r.inspect_date)}</td>
        <td class="cell-code">${escapeHtml(r[cfg.extraKey] || r[cfg.sourceKey] || '')}</td>
        <td>${escapeHtml(r.partner || '')}</td><td class="cell-strong">${escapeHtml(r.item_name || '')}</td>
        <td class="num mono">${num(r.inspect_qty)}</td><td class="num mono">${num(r.good_qty)}</td><td class="num mono">${num(r.defect_qty)}</td>
        <td>${escapeHtml(r.inspector || '')}</td><td class="center">${badge(r.result || '')}</td>
        <td class="center"><div class="row-actions">
          <button class="icon-btn" data-view="${r.id}" title="상세">${icon('search', 15)}</button>
          <button class="icon-btn" data-del="${r.id}" title="삭제">${icon('trash', 15)}</button>
        </div></td></tr>`).join('')}</tbody></table>`;
      slot.querySelectorAll('[data-view]').forEach(b => b.onclick = (e) => { e.stopPropagation(); openDetail(list.find(r => r.id === b.dataset.view)); });
      slot.querySelectorAll('tr[data-id]').forEach(tr => tr.onclick = () => openDetail(list.find(r => r.id === tr.dataset.id)));
      slot.querySelectorAll('[data-del]').forEach(b => b.onclick = async (e) => {
        e.stopPropagation();
        const r = list.find(x => x.id === b.dataset.del);
        if (!(await confirmDialog({ message: '이 검사 내역을 삭제하시겠습니까?', confirmText: '삭제' }))) return;
        try {
          await db.remove(cfg.table, r.id);
          try { const dets = await db.all('inspection_details', { filters: { inspect_no: r.inspect_no } }); for (const d of dets) await db.remove('inspection_details', d.id); } catch { /* noop */ }
          toast('삭제되었습니다.'); load();
        } catch (err) { toast(err.message || '삭제 실패', 'error'); }
      });
    }

    // ---------- 신규 검사 폼 ----------
    async function openInspectionForm() {
      const [items, users, sources] = await Promise.all([
        db.all('items', { sort: 'code' }), db.all('users', { sort: 'name' }),
        db.all(cfg.sourceTable, {}).catch(() => []),
      ]);

      const body = document.createElement('div');
      body.innerHTML = `
        <form id="ins-form" class="form-grid">
          <div class="field"><label>검사일 <span class="req">*</span></label><input class="input" name="inspect_date" type="date" value="${todayStr()}"></div>
          <div class="field"><label>${escapeHtml(cfg.sourceLabel)}</label>
            <select class="select" name="__source"><option value="">선택 (선택사항)</option>
              ${sources.map(s => `<option value="${escapeHtml(s[cfg.sourceKey])}">${escapeHtml(cfg.sourceText(s))}</option>`).join('')}
            </select></div>
          <div class="field"><label>품목 <span class="req">*</span></label>
            <select class="select" name="item_code"><option value="">품목 선택</option>
              ${items.map(i => `<option value="${escapeHtml(i.code)}">${escapeHtml(i.code)} · ${escapeHtml(i.name)}</option>`).join('')}
            </select></div>
          <div class="field"><label>거래처</label><input class="input" name="partner"></div>
          ${cfg.extraKey ? `<div class="field"><label>${escapeHtml(cfg.extraLabel)}</label><input class="input" name="${cfg.extraKey}"></div>` : ''}
          <div class="field"><label>검사수량</label><input class="input" name="inspect_qty" type="number" value="0"></div>
          <div class="field"><label>양품수량</label><input class="input" name="good_qty" type="number" value="0"></div>
          <div class="field"><label>불량수량</label><input class="input" name="defect_qty" type="number" value="0"></div>
          <div class="field"><label>검사자</label><select class="select" name="inspector"><option value="">선택</option>
            ${users.map(u => `<option value="${escapeHtml(u.name)}">${escapeHtml(u.name)}${u.department ? ` (${escapeHtml(u.department)})` : ''}</option>`).join('')}</select></div>
          <input type="hidden" name="item_name">
        </form>
        <h4 style="margin:18px 0 10px;display:flex;align-items:center;gap:8px">${icon('shield', 18)} 검사기준 평가</h4>
        <div id="ins-criteria"><div class="muted" style="padding:10px">품목을 선택하면 등록된 검사기준이 표시됩니다.</div></div>
        <div id="ins-result" class="flex between" style="margin-top:14px;padding:12px 16px;background:var(--surface-2);border-radius:10px">
          <b>종합 판정</b><span id="ins-result-badge">${badge('대기', 'neutral')}</span></div>`;

      const form = body.querySelector('#ins-form');
      let criteria = []; // {std, el, getJudgment()}

      async function loadCriteria(itemCode) {
        const slot = body.querySelector('#ins-criteria');
        criteria = [];
        if (!itemCode) { slot.innerHTML = `<div class="muted" style="padding:10px">품목을 선택하세요.</div>`; updateResult(); return; }
        let stds = [];
        try { stds = await db.all('inspection_standards', { filters: { item_code: itemCode, inspect_type: cfg.kind }, sort: 'std_no' }); } catch { stds = []; }
        stds = stds.filter(s => s.use_yn !== false);
        if (!stds.length) {
          slot.innerHTML = `<div class="empty" style="padding:24px">${icon('alert', 40)}<h4>등록된 검사기준이 없습니다</h4><p>검사기준관리에서 이 품목의 <b>${escapeHtml(cfg.kind)}</b> 기준을 먼저 등록하세요. (종합판정은 수동 선택)</p>
            <select class="select" id="ins-manual" style="max-width:200px;margin:10px auto 0"><option value="합격">합격</option><option value="불합격">불합격</option><option value="조건부합격">조건부합격</option></select></div>`;
          slot.querySelector('#ins-manual').onchange = updateResult;
          updateResult(); return;
        }
        slot.innerHTML = `<div class="table-wrap"><table class="grid">
          <thead><tr><th>검사항목</th><th class="center">평가</th><th>기준</th><th>${'측정값/관측'}</th><th class="center">판정</th></tr></thead>
          <tbody>${stds.map((s, i) => {
            const quant = (s.eval_method || '정량적') === '정량적';
            const input = quant
              ? `<input class="input" data-cidx="${i}" type="number" step="any" placeholder="측정값(숫자)">`
              : `<select class="select" data-cidx="${i}"><option value="">판정</option><option value="OK">OK</option><option value="NG">NG</option></select>`;
            const spec = quant
              ? `${escapeHtml(s.spec_value ?? '')}${s.tolerance ? ` <span class="muted">/ 공차 ${escapeHtml(s.tolerance)}</span>` : ''}`
              : `<span class="muted">${escapeHtml(s.spec_value || 'OK/NG')}</span>`;
            return `<tr data-row="${i}">
              <td class="cell-strong">${escapeHtml(s.inspect_item || '')}</td>
              <td class="center">${badge(s.eval_method || '정량적', quant ? 'neutral' : 'info')}</td>
              <td>${spec}</td><td>${input}</td>
              <td class="center" data-judge="${i}">-</td></tr>`;
          }).join('')}</tbody></table></div>`;
        criteria = stds.map((s, i) => ({ std: s, idx: i }));
        slot.querySelectorAll('[data-cidx]').forEach(el => el.addEventListener('input', () => judgeRow(+el.dataset.cidx)));
        slot.querySelectorAll('select[data-cidx]').forEach(el => el.addEventListener('change', () => judgeRow(+el.dataset.cidx)));
        criteria.forEach(c => judgeRow(c.idx));
      }

      function judgeRow(i) {
        const c = criteria[i]; if (!c) return;
        const el = body.querySelector(`[data-cidx="${i}"]`);
        const cell = body.querySelector(`[data-judge="${i}"]`);
        const quant = (c.std.eval_method || '정량적') === '정량적';
        let j = null;
        if (quant) j = el.value === '' ? null : judgeQuant(c.std.spec_value, c.std.tolerance, el.value);
        else j = el.value || null;
        c.judgment = j; c.measured = el.value;
        cell.innerHTML = j ? badge(j) : '-';
        updateResult();
      }

      function updateResult() {
        const badgeEl = body.querySelector('#ins-result-badge');
        if (criteria.length) {
          const judged = criteria.filter(c => c.judgment);
          if (judged.length < criteria.length) { badgeEl.innerHTML = badge('검사중', 'warning'); body._result = null; return; }
          const allPass = criteria.every(c => c.judgment === 'OK');
          body._result = allPass ? '합격' : '불합격';
          badgeEl.innerHTML = badge(body._result);
        } else {
          const manual = body.querySelector('#ins-manual');
          body._result = manual ? manual.value : '합격';
          badgeEl.innerHTML = badge(body._result);
        }
      }

      form.querySelector('[name="item_code"]').addEventListener('change', (e) => {
        const it = items.find(x => x.code === e.target.value);
        form.querySelector('[name="item_name"]').value = it?.name || '';
        loadCriteria(e.target.value);
      });
      form.querySelector('[name="__source"]').addEventListener('change', (e) => {
        const s = sources.find(x => String(x[cfg.sourceKey]) === e.target.value);
        if (!s) return;
        for (const [f, col] of Object.entries(cfg.sourceFill)) { const el = form.querySelector(`[name="${f}"]`); if (el) el.value = s[col] ?? ''; }
        const ic = form.querySelector('[name="item_code"]'); if (ic.value) { ic.dispatchEvent(new Event('change')); }
      });

      openModal({
        title: `${cfg.title} 진행`, body, wide: true,
        footer: `<button class="btn" data-cancel>취소</button><button class="btn btn--primary" data-ok>${icon('check', 16)} 검사 저장</button>`,
        onMount: ({ footEl, close }) => {
          footEl.querySelector('[data-cancel]').onclick = close;
          footEl.querySelector('[data-ok]').onclick = async () => {
            const g = (n) => { const el = form.querySelector(`[name="${n}"]`); return el ? el.value : ''; };
            if (!g('item_code')) { toast('품목을 선택하세요.', 'error'); return; }
            if (criteria.length && body._result == null) { toast('모든 검사항목을 평가하세요.', 'error'); return; }
            const result = body._result || '합격';
            try {
              const all = await db.all(cfg.table, {});
              const inspect_no = nextDocNo(cfg.docPrefix, all.map(x => x.inspect_no));
              const header = {
                inspect_no, inspect_date: g('inspect_date') || todayStr(), partner: g('partner'),
                item_code: g('item_code'), item_name: g('item_name'),
                inspect_qty: Number(g('inspect_qty')) || 0, good_qty: Number(g('good_qty')) || 0, defect_qty: Number(g('defect_qty')) || 0,
                inspector: g('inspector'), result, remark: '',
              };
              if (cfg.extraKey) header[cfg.extraKey] = g(cfg.extraKey);
              if (cfg.sourceKey && form.querySelector('[name="__source"]').value) header[cfg.sourceKey] = form.querySelector('[name="__source"]').value;
              await db.insert(cfg.table, header);
              // 상세 저장 (테이블 없으면 무시)
              try {
                for (const c of criteria) {
                  await db.insert('inspection_details', {
                    inspect_no, inspect_kind: cfg.kind, item_code: header.item_code, inspect_item: c.std.inspect_item,
                    eval_method: c.std.eval_method || '정량적', spec_value: c.std.spec_value, tolerance: c.std.tolerance,
                    measured: c.measured ?? '', judgment: c.judgment || '',
                  });
                }
              } catch { /* inspection_details 미생성 시 무시 */ }
              close(); toast(`검사(${inspect_no}) 저장 — 판정: ${result}`); load();
            } catch (e) { toast(e.message || '저장 실패', 'error'); }
          };
        },
      });
    }

    // ---------- 상세 보기 ----------
    async function openDetail(r) {
      if (!r) return;
      let dets = [];
      try { dets = await db.all('inspection_details', { filters: { inspect_no: r.inspect_no } }); } catch { dets = []; }
      const body = document.createElement('div');
      body.innerHTML = `
        <div class="grid-2" style="margin-bottom:16px">
          ${info('검사번호', r.inspect_no)}${info('검사일', fmtDate(r.inspect_date))}
          ${info('품목', `${r.item_code || ''} ${r.item_name || ''}`)}${info('거래처', r.partner || '-')}
          ${info('검사수량', num(r.inspect_qty))}${info('검사자', r.inspector || '-')}
        </div>
        <div class="flex between" style="margin-bottom:14px"><b>종합 판정</b>${badge(r.result || '')}</div>
        <h4 style="margin:0 0 10px">검사항목 결과</h4>
        ${dets.length ? `<div class="table-wrap"><table class="grid">
          <thead><tr><th>검사항목</th><th class="center">평가</th><th>기준</th><th>측정/관측</th><th class="center">판정</th></tr></thead>
          <tbody>${dets.map(d => `<tr><td class="cell-strong">${escapeHtml(d.inspect_item || '')}</td>
            <td class="center">${badge(d.eval_method || '정량적', d.eval_method === '정성적' ? 'info' : 'neutral')}</td>
            <td>${escapeHtml(d.spec_value ?? '')}${d.tolerance ? ` <span class="muted">/ 공차 ${escapeHtml(d.tolerance)}</span>` : ''}</td>
            <td class="mono">${escapeHtml(d.measured ?? '')}</td><td class="center">${d.judgment ? badge(d.judgment) : '-'}</td></tr>`).join('')}</tbody></table></div>`
          : `<div class="muted" style="padding:14px">항목별 상세 기록이 없습니다.</div>`}`;
      openModal({ title: `${cfg.title} 상세`, body, wide: true, footer: `<button class="btn" data-cancel>닫기</button>`, onMount: ({ footEl, close }) => { footEl.querySelector('[data-cancel]').onclick = close; } });
    }

    function exportCsv() {
      const cols = [
        { label: '검사번호', key: 'inspect_no' }, { label: '검사일', key: 'inspect_date', csv: (r) => fmtDate(r.inspect_date) },
        { label: '거래처', key: 'partner' }, { label: '품목코드', key: 'item_code' }, { label: '품명', key: 'item_name' },
        { label: '검사수량', key: 'inspect_qty' }, { label: '양품', key: 'good_qty' }, { label: '불량', key: 'defect_qty' },
        { label: '검사자', key: 'inspector' }, { label: '판정', key: 'result' },
      ];
      downloadCSV(`${cfg.title}_${todayStr()}.csv`, cols, filtered());
      toast('CSV로 내보냈습니다.');
    }

    load();
  };
}

function stat(label, value, unit, ic, tint) {
  return `<div class="stat"><div class="stat__top"><span class="stat__label">${label}</span><span class="stat__ico ico-tint-${tint}">${icon(ic, 21)}</span></div><div class="stat__value">${value}<small>${unit}</small></div></div>`;
}
function info(label, val) {
  return `<div style="background:var(--surface-2);border:1px solid var(--border);border-radius:10px;padding:12px 14px"><div class="muted" style="font-size:12px">${escapeHtml(label)}</div><div style="font-weight:700;margin-top:2px">${escapeHtml(val)}</div></div>`;
}

// 수입검사
export const incomingInspection = createInspectionPage({
  table: 'incoming_inspections', kind: '수입검사', title: '수입검사', subtitle: '입고 자재를 검사기준에 따라 검사합니다.',
  docPrefix: 'II', sourceTable: 'material_inbounds', sourceKey: 'inbound_no', sourceLabel: '입고 선택',
  sourceText: (s) => `${s.inbound_no} · ${s.item_name || ''} · ${s.lot_no || ''}`,
  sourceFill: { partner: 'partner', item_code: 'item_code', item_name: 'item_name', lot_no: 'lot_no', inspect_qty: 'inbound_qty' },
  extraKey: 'lot_no', extraLabel: 'LOT',
});

// 출하검사
export const shippingInspection = createInspectionPage({
  table: 'shipping_inspections', kind: '출하검사', title: '출하검사', subtitle: '납품 전 완제품을 검사기준에 따라 검사합니다.',
  docPrefix: 'SI', sourceTable: 'sales_orders', sourceKey: 'order_no', sourceLabel: '수주 선택',
  sourceText: (s) => `${s.order_no} · ${s.partner || ''} · ${s.item_name || ''}`,
  sourceFill: { partner: 'partner', item_code: 'item_code', item_name: 'item_name', inspect_qty: 'order_qty' },
  extraKey: 'order_no', extraLabel: '수주번호',
});
