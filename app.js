'use strict';

(() => {
  const C = PG.C;
  const $ = id => document.getElementById(id);
  const textEl = $('text'), sizeEl = $('size'), marginEl = $('margin'), gridEl = $('grid');
  const pagesEl = $('pages'), infoEl = $('info'), previewEl = $('preview');

  textEl.value = C.DEFAULT_TEXT;
  sizeEl.value = C.DEFAULT_SIZE_CM;
  marginEl.value = C.DEFAULT_MARGIN_CM;
  (document.querySelector(`input[name=orient][value="${C.DEFAULT_ORIENTATION}"]`)
    || document.querySelector('input[name=orient]')).checked = true;

  // 列印的紙張方向跟著選項走（覆蓋 style.css 的 @page）
  const pageStyleEl = document.createElement('style');
  document.head.appendChild(pageStyleEl);
  let pageWMm = C.PAGE_W_MM;

  let lines = [];

  function num(el, fallback) {
    const v = parseFloat(el.value);
    return Number.isFinite(v) && v >= 0 ? v : fallback;
  }

  function render() {
    lines = PG.parse(textEl.value);
    const rtl = document.querySelector('input[name=dir]:checked').value === 'rtl';
    const portrait = document.querySelector('input[name=orient]:checked').value === 'portrait';
    const L = PG.layout({
      sizeMm: Math.max(5, num(sizeEl, C.DEFAULT_SIZE_CM) * 10),
      marginMm: num(marginEl, C.DEFAULT_MARGIN_CM) * 10,
      rtl,
      portrait,
    });
    pageWMm = L.pageW;
    pageStyleEl.textContent = `@page { size: A4 ${portrait ? 'portrait' : 'landscape'}; margin: 0; }`;

    pagesEl.textContent = '';
    if (L.cols < 1 || L.rows < 1) {
      infoEl.textContent = '格子太大或邊界太寬，一頁放不下任何一格。';
      return;
    }

    // 把每一行切成直行（超過一行的字數就接到下一直行）
    let last = lines.length;
    while (last > 0 && lines[last - 1].length === 0) last--; // 去掉結尾的空行
    const columns = [];
    for (let l = 0; l < last; l++) {
      const line = lines[l];
      if (line.length === 0) { columns.push([]); continue; }
      for (let i = 0; i < line.length; i += L.rows) {
        columns.push(line.slice(i, i + L.rows).map((it, k) => ({ ...it, l, i: i + k })));
      }
    }

    const nPages = Math.max(1, Math.ceil(columns.length / L.cols));
    for (let p = 0; p < nPages; p++) {
      const page = PG.makePage(L, gridEl.checked);
      for (let c = 0; c < L.cols; c++) {
        const col = columns[p * L.cols + c];
        if (!col) break;
        col.forEach((it, r) => {
          const han = PG.isHan(it.ch);
          const cell = PG.placeCell(page, L, c, r, it.ch, han && it.boxed ? 'box' : 'kai');
          if (han) {
            cell.classList.add('han');
            cell.dataset.l = it.l;
            cell.dataset.i = it.i;
          }
        });
      }
      pagesEl.appendChild(page);
    }

    const cellW = (L.cellW / 10).toFixed(2), cellH = (L.cellH / 10).toFixed(2);
    infoEl.textContent = `每格 ${cellW} × ${cellH} cm，每頁 ${L.cols} 行 × ${L.rows} 字，共 ${nPages} 頁`;
    fitZoom();
  }

  // 預覽縮放到符合視窗寬度（列印時不縮放）
  function fitZoom() {
    const pagePx = pageWMm * 96 / 25.4;
    const avail = previewEl.clientWidth - 40;
    pagesEl.style.zoom = Math.min(1, avail / pagePx);
  }

  // 點預覽上的國字 → 切換加框，並同步回文字框
  pagesEl.addEventListener('click', e => {
    const cell = e.target.closest('.cell.han');
    if (!cell) return;
    const it = lines[+cell.dataset.l][+cell.dataset.i];
    it.boxed = !it.boxed;
    const scroll = textEl.scrollTop;
    textEl.value = PG.serialize(lines);
    textEl.scrollTop = scroll;
    render();
  });

  textEl.addEventListener('input', render);
  sizeEl.addEventListener('input', render);
  marginEl.addEventListener('input', render);
  gridEl.addEventListener('change', render);
  document.querySelectorAll('input[name=dir], input[name=orient]').forEach(el => el.addEventListener('change', render));
  document.querySelectorAll('button[data-size]').forEach(b => b.addEventListener('click', () => {
    sizeEl.value = b.dataset.size;
    render();
  }));
  $('print').addEventListener('click', () => window.print());
  window.addEventListener('resize', fitZoom);

  render();
  PG.fontsReady().then(() => { $('status').textContent = ''; render(); },
    () => { $('status').textContent = '字型載入失敗，請確認 fonts/ 資料夾與 config.js 的檔名。'; });
})();
