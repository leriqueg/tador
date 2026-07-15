/**
 * Interactive Plantillas Admin tool (dev HTML).
 * Left list · right try-form · bottom asiento mockup · source toggle.
 */

export function renderPlantillasAdminTool(mode: string): string {
  const safeMode = JSON.stringify(mode);
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>TADOR — Plantillas Admin</title>
  <style>
    :root {
      --bg: #f4f6f5;
      --panel: #ffffff;
      --ink: #1a2422;
      --muted: #5c6b68;
      --teal: #006a6a;
      --teal-soft: #e0f2f1;
      --border: #d5ddd9;
      --danger: #a12622;
      --ok: #1b6b3a;
      --warn: #8a5a00;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: "Segoe UI", system-ui, sans-serif;
      background: var(--bg);
      color: var(--ink);
      min-height: 100vh;
    }
    header {
      display: flex;
      align-items: baseline;
      gap: 1rem;
      padding: 0.85rem 1.25rem;
      background: var(--panel);
      border-bottom: 1px solid var(--border);
    }
    header h1 {
      margin: 0;
      font-size: 1.15rem;
      color: var(--teal);
      font-weight: 650;
    }
    header .meta { color: var(--muted); font-size: 0.85rem; }
    .layout {
      display: grid;
      grid-template-columns: 280px 1fr;
      grid-template-rows: 1fr auto;
      gap: 0;
      min-height: calc(100vh - 52px);
    }
    .sidebar {
      background: var(--panel);
      border-right: 1px solid var(--border);
      display: flex;
      flex-direction: column;
      min-height: 0;
    }
    .sidebar h2 {
      margin: 0;
      padding: 0.75rem 1rem;
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: var(--muted);
      border-bottom: 1px solid var(--border);
    }
    .list {
      list-style: none;
      margin: 0;
      padding: 0.35rem 0;
      overflow: auto;
      flex: 1;
    }
    .list button {
      width: 100%;
      text-align: left;
      border: 0;
      background: transparent;
      padding: 0.65rem 1rem;
      cursor: pointer;
      font: inherit;
      color: inherit;
      display: flex;
      flex-direction: column;
      gap: 0.15rem;
      border-left: 3px solid transparent;
    }
    .list button:hover { background: var(--teal-soft); }
    .list button.active {
      background: var(--teal-soft);
      border-left-color: var(--teal);
    }
    .list .name { font-weight: 600; font-size: 0.92rem; }
    .list .code { font-size: 0.72rem; color: var(--muted); font-family: ui-monospace, monospace; }
    .badge {
      display: inline-block;
      font-size: 0.65rem;
      padding: 0.1rem 0.35rem;
      border-radius: 3px;
      background: #eee;
      color: var(--muted);
      margin-left: 0.35rem;
    }
    .badge.ready { background: #d9f0e1; color: var(--ok); }
    .badge.not-ready { background: #f8e0de; color: var(--danger); }
    .main {
      display: flex;
      flex-direction: column;
      min-width: 0;
      min-height: 0;
    }
    .tabs {
      display: flex;
      gap: 0;
      border-bottom: 1px solid var(--border);
      background: var(--panel);
      padding: 0 1rem;
    }
    .tabs button {
      border: 0;
      background: transparent;
      padding: 0.75rem 1rem;
      font: inherit;
      cursor: pointer;
      color: var(--muted);
      border-bottom: 2px solid transparent;
      margin-bottom: -1px;
    }
    .tabs button.active {
      color: var(--teal);
      border-bottom-color: var(--teal);
      font-weight: 600;
    }
    .panel {
      display: none;
      padding: 1.25rem;
      overflow: auto;
      flex: 1;
    }
    .panel.active { display: block; }
    .empty {
      color: var(--muted);
      padding: 2rem 1rem;
    }
    form.try {
      display: grid;
      gap: 0.9rem;
      max-width: 36rem;
    }
    label {
      display: flex;
      flex-direction: column;
      gap: 0.3rem;
      font-size: 0.85rem;
      font-weight: 600;
    }
    label span.hint {
      font-weight: 400;
      color: var(--muted);
      font-size: 0.75rem;
    }
    input, select {
      font: inherit;
      padding: 0.5rem 0.65rem;
      border: 1px solid var(--border);
      border-radius: 6px;
      background: #fff;
    }
    .line-box {
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 0.75rem;
      background: #fafbfa;
    }
    .line-box .side {
      font-size: 0.7rem;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: var(--muted);
      margin-bottom: 0.35rem;
    }
    .actions {
      display: flex;
      gap: 0.75rem;
      align-items: center;
      flex-wrap: wrap;
      margin-top: 0.5rem;
    }
    .btn {
      border: 0;
      border-radius: 6px;
      padding: 0.55rem 1rem;
      font: inherit;
      font-weight: 600;
      cursor: pointer;
    }
    .btn-primary { background: var(--teal); color: #fff; }
    .btn-primary:hover { filter: brightness(1.05); }
    .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
    .status { font-size: 0.85rem; color: var(--muted); }
    .status.error { color: var(--danger); }
    .status.ok { color: var(--ok); }
    pre.source {
      margin: 0;
      padding: 1rem;
      background: #1e2423;
      color: #e8eeec;
      border-radius: 8px;
      overflow: auto;
      font-size: 0.8rem;
      line-height: 1.45;
      max-height: calc(100vh - 180px);
    }
    .preview-dock {
      grid-column: 1 / -1;
      border-top: 1px solid var(--border);
      background: var(--panel);
      padding: 1rem 1.25rem 1.25rem;
      max-height: 42vh;
      overflow: auto;
    }
    .preview-dock h3 {
      margin: 0 0 0.75rem;
      font-size: 0.95rem;
      color: var(--teal);
    }
    table.asiento {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.85rem;
    }
    table.asiento th,
    table.asiento td {
      border: 1px solid var(--border);
      padding: 0.45rem 0.6rem;
      text-align: left;
    }
    table.asiento th { background: var(--teal-soft); }
    table.asiento td.num { text-align: right; font-variant-numeric: tabular-nums; font-family: ui-monospace, monospace; }
    table.asiento tfoot td { font-weight: 700; }
    .pill {
      display: inline-block;
      padding: 0.15rem 0.45rem;
      border-radius: 999px;
      font-size: 0.72rem;
      font-weight: 600;
    }
    .pill.ok { background: #d9f0e1; color: var(--ok); }
    .pill.bad { background: #f8e0de; color: var(--danger); }
    @media (max-width: 800px) {
      .layout { grid-template-columns: 1fr; }
      .sidebar { max-height: 220px; border-right: 0; border-bottom: 1px solid var(--border); }
    }
  </style>
</head>
<body>
  <header>
    <h1>Plantillas Admin</h1>
    <span class="meta">dev tool · mode=<span id="modeLabel"></span> · no persiste asientos</span>
  </header>
  <div class="layout">
    <aside class="sidebar">
      <h2>Plantillas</h2>
      <ul class="list" id="plantillaList"></ul>
    </aside>
    <section class="main">
      <div class="tabs" role="tablist">
        <button type="button" class="active" data-tab="form" id="tabForm">Probar</button>
        <button type="button" data-tab="source" id="tabSource">Código fuente</button>
      </div>
      <div class="panel active" id="panelForm">
        <p class="empty" id="formEmpty">Seleccioná una plantilla a la izquierda.</p>
        <form class="try" id="tryForm" hidden>
          <div id="formMeta"></div>
          <label>
            Concepto
            <input name="concept" id="fieldConcept" required maxlength="200" />
          </label>
          <label>
            Monto
            <input name="amount" id="fieldAmount" type="number" step="0.01" min="0.01" required />
          </label>
          <div id="lineFields"></div>
          <div class="actions">
            <button type="submit" class="btn btn-primary" id="btnPreview">Generar mockup del asiento</button>
            <span class="status" id="formStatus"></span>
          </div>
        </form>
      </div>
      <div class="panel" id="panelSource">
        <p class="empty" id="sourceEmpty">Seleccioná una plantilla para ver su JSON.</p>
        <pre class="source" id="sourcePre" hidden></pre>
      </div>
    </section>
    <section class="preview-dock" id="previewDock" hidden>
      <h3>Mockup del asiento <span id="previewBadge"></span></h3>
      <div id="previewBody"></div>
    </section>
  </div>
  <script>
(function () {
  const MODE = ${safeMode};
  const listEl = document.getElementById('plantillaList');
  const formEmpty = document.getElementById('formEmpty');
  const tryForm = document.getElementById('tryForm');
  const formMeta = document.getElementById('formMeta');
  const lineFields = document.getElementById('lineFields');
  const fieldConcept = document.getElementById('fieldConcept');
  const fieldAmount = document.getElementById('fieldAmount');
  const formStatus = document.getElementById('formStatus');
  const sourceEmpty = document.getElementById('sourceEmpty');
  const sourcePre = document.getElementById('sourcePre');
  const previewDock = document.getElementById('previewDock');
  const previewBody = document.getElementById('previewBody');
  const previewBadge = document.getElementById('previewBadge');
  const btnPreview = document.getElementById('btnPreview');

  document.getElementById('modeLabel').textContent = MODE;

  let catalog = [];
  let selected = null; // enriched detail payload

  function esc(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  async function api(path, opts) {
    const res = await fetch(path, {
      credentials: 'same-origin',
      headers: { Accept: 'application/json', ...(opts && opts.headers) },
      ...opts,
    });
    const text = await res.text();
    let data = null;
    try { data = text ? JSON.parse(text) : null; } catch (_) { data = { error: text }; }
    if (!res.ok) {
      const msg = (data && data.error) || res.statusText || 'Error';
      throw new Error(msg);
    }
    return data;
  }

  function renderList() {
    listEl.innerHTML = catalog.map((p) => {
      const ready = p.ready ? 'ready' : 'not-ready';
      const readyLabel = p.ready ? 'ready' : 'faltan cuentas';
      const active = selected && selected.plantilla.code === p.code ? ' active' : '';
      return '<li><button type="button" data-code="' + esc(p.code) + '" class="' + active.trim() + '">' +
        '<span class="name">' + esc(p.name) +
        '<span class="badge ' + ready + '">' + readyLabel + '</span></span>' +
        '<span class="code">' + esc(p.code) + ' · ' + esc(p.kind) + ' / ' + esc(p.category) + '</span>' +
        '</button></li>';
    }).join('');
  }

  function setTab(name) {
    document.querySelectorAll('.tabs button').forEach((b) => {
      b.classList.toggle('active', b.dataset.tab === name);
    });
    document.getElementById('panelForm').classList.toggle('active', name === 'form');
    document.getElementById('panelSource').classList.toggle('active', name === 'source');
  }

  document.getElementById('tabForm').addEventListener('click', () => setTab('form'));
  document.getElementById('tabSource').addEventListener('click', () => setTab('source'));

  listEl.addEventListener('click', async (ev) => {
    const btn = ev.target.closest('button[data-code]');
    if (!btn) return;
    const code = btn.getAttribute('data-code');
    formStatus.textContent = 'Cargando…';
    formStatus.className = 'status';
    try {
      const detail = await api('/api/dev/plantillas-admin/' + encodeURIComponent(code));
      selected = detail;
      renderList();
      fillForm(detail);
      fillSource(detail);
      previewDock.hidden = true;
      formStatus.textContent = '';
      setTab('form');
    } catch (err) {
      formStatus.textContent = err.message;
      formStatus.className = 'status error';
    }
  });

  function fillSource(detail) {
    sourceEmpty.hidden = true;
    sourcePre.hidden = false;
    sourcePre.textContent = JSON.stringify(detail.source || detail.plantilla, null, 2);
  }

  function fillForm(detail) {
    const p = detail.plantilla;
    formEmpty.hidden = true;
    tryForm.hidden = false;
    formMeta.innerHTML =
      '<p style="margin:0 0 0.5rem"><strong>' + esc(p.name) + '</strong> ' +
      '<span class="badge ' + (detail.ready ? 'ready' : 'not-ready') + '">' +
      (detail.ready ? 'ready' : 'faltan cuentas') + '</span></p>' +
      '<p class="empty" style="padding:0;margin:0;font-size:0.8rem">' + esc(p.code) +
      ' · amountMode=' + esc(p.amountMode || 'single') + '</p>';

    fieldConcept.value = p.name || '';
    fieldAmount.value = '';

    lineFields.innerHTML = p.lines.map((line) => {
      const opts = (line.availableAccounts || []).map((a) => {
        const label = a.nombre + (a.codigo ? ' [' + a.codigo + ']' : '') + ' (' + a.tipo + ')';
        return '<option value="' + esc(a.id) + '">' + esc(label) + '</option>';
      }).join('');
      const emptyWarn = (line.availableAccounts || []).length === 0
        ? '<span class="hint" style="color:var(--danger)">Sin cuentas disponibles para esta línea</span>'
        : '<span class="hint">strategy=' + esc(line.strategy) +
          (line.groupCode ? ' · group ' + esc(line.groupCode) : '') +
          (line.groupCodes ? ' · groups ' + esc(line.groupCodes.join(',')) : '') + '</span>';
      return '<div class="line-box">' +
        '<div class="side">' + esc(line.side) + ' · línea ' + line.id + '</div>' +
        '<label>' + esc(line.label) +
        emptyWarn +
        '<select name="line_' + line.id + '" data-line-id="' + line.id + '" ' +
        ((line.availableAccounts || []).length === 0 ? 'disabled' : 'required') + '>' +
        '<option value="">— elegir cuenta —</option>' + opts +
        '</select></label></div>';
    }).join('');
  }

  tryForm.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    if (!selected) return;
    const code = selected.plantilla.code;
    const lines = [];
    lineFields.querySelectorAll('select[data-line-id]').forEach((sel) => {
      if (!sel.value) return;
      lines.push({ id: Number(sel.getAttribute('data-line-id')), accountId: sel.value });
    });

    formStatus.textContent = 'Generando…';
    formStatus.className = 'status';
    btnPreview.disabled = true;
    try {
      const preview = await api(
        '/api/dev/plantillas-admin/' + encodeURIComponent(code) + '/preview',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({
            amount: Number(fieldAmount.value),
            concept: fieldConcept.value,
            lines,
          }),
        },
      );
      renderPreview(preview);
      formStatus.textContent = 'Mockup generado (no persistido)';
      formStatus.className = 'status ok';
    } catch (err) {
      formStatus.textContent = err.message;
      formStatus.className = 'status error';
      previewDock.hidden = true;
    } finally {
      btnPreview.disabled = false;
    }
  });

  function renderPreview(preview) {
    previewDock.hidden = false;
    previewBadge.innerHTML = preview.balanced
      ? '<span class="pill ok">balanceado</span>'
      : '<span class="pill bad">descuadrado</span>';
    const rows = (preview.lines || []).map((l) =>
      '<tr>' +
      '<td>' + esc(String(l.lineId)) + '</td>' +
      '<td>' + esc(l.label) + '</td>' +
      '<td>' + esc(l.side) + '</td>' +
      '<td>' + esc(l.accountName) + '<br><span class="code">' + esc(l.accountId) + '</span></td>' +
      '<td class="num">' + esc(l.debito) + '</td>' +
      '<td class="num">' + esc(l.credito) + '</td>' +
      '</tr>'
    ).join('');
    const totD = (preview.lines || []).reduce((s, l) => s + Number(l.debito), 0).toFixed(2);
    const totC = (preview.lines || []).reduce((s, l) => s + Number(l.credito), 0).toFixed(2);
    previewBody.innerHTML =
      '<p style="margin:0 0 0.75rem;font-size:0.85rem;color:var(--muted)">' +
      esc(preview.templateCode) + ' · ' + esc(preview.concept) + ' · ' +
      esc(String(preview.amount)) + ' ' + esc(preview.currency) +
      ' · persisted=' + String(preview.persisted) + '</p>' +
      '<table class="asiento"><thead><tr>' +
      '<th>#</th><th>Etiqueta</th><th>Side</th><th>Cuenta</th><th>Débito</th><th>Crédito</th>' +
      '</tr></thead><tbody>' + rows + '</tbody>' +
      '<tfoot><tr><td colspan="4">Totales</td><td class="num">' + totD +
      '</td><td class="num">' + totC + '</td></tr></tfoot></table>';
  }

  api('/api/dev/plantillas-admin?mode=' + encodeURIComponent(MODE) + '&format=json')
    .then((data) => {
      catalog = data.plantillas || [];
      renderList();
    })
    .catch((err) => {
      listEl.innerHTML = '<li class="empty" style="padding:1rem">' + esc(err.message) + '</li>';
    });
})();
  </script>
</body>
</html>`;
}
