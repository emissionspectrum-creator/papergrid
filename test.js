'use strict';

(() => {
  const C = PG.C;
  const $ = id => document.getElementById(id);
  const sampleEl = $('sample'), sizeEl = $('size'), gridEl = $('grid');
  const pagesEl = $('pages'), previewEl = $('preview');

  sampleEl.value = '永國字中一我學愛，。「」';
  sizeEl.value = C.DEFAULT_SIZE_CM;

  const NAMES = { kai: '注音標楷', box: '注音加框' };
  const PARAMS = [
    { key: 'scale', label: '縮放', min: 0.7, max: 1.3, step: 0.005 },
    { key: 'dx', label: '水平', min: -0.2, max: 0.2, step: 0.002 },
    { key: 'dy', label: '垂直', min: -0.2, max: 0.2, step: 0.002 },
  ];

  // 建立調整滑桿（直接修改記憶體中的 FONT_ADJUST）
  for (const font of ['kai', 'box']) {
    const box = document.createElement('div');
    box.className = 'adj';
    box.innerHTML = `<h2>${NAMES[font]}</h2>`;
    for (const p of PARAMS) {
      const row = document.createElement('div');
      row.className = 'row';
      row.innerHTML = `<span>${p.label}</span>
        <input type="range" min="${p.min}" max="${p.max}" step="${p.step}">
        <input type="number" min="${p.min}" max="${p.max}" step="${p.step}">`;
      const [range, number] = row.querySelectorAll('input');
      range.value = number.value = C.FONT_ADJUST[font][p.key];
      const set = v => {
        v = parseFloat(v);
        if (!Number.isFinite(v)) return;
        C.FONT_ADJUST[font][p.key] = v;
        range.value = number.value = v;
        render();
      };
      range.addEventListener('input', () => set(range.value));
      number.addEventListener('input', () => set(number.value));
      box.appendChild(row);
    }
    $('adjusters').appendChild(box);
  }

  function render() {
    const sizeMm = Math.max(5, (parseFloat(sizeEl.value) || C.DEFAULT_SIZE_CM) * 10);
    const cellW = sizeMm * (1 + C.BPMF_RATIO), cellH = sizeMm;
    const left = 25, top = 12, groupGap = 8;
    const perRow = Math.max(1, Math.floor((C.PAGE_W_MM - left - 10) / cellW));
    const chars = Array.from(sampleEl.value).filter(ch => ch.trim());

    pagesEl.textContent = '';
    const page = PG.makePage(null, false);
    for (let g = 0, y0 = top; g * perRow < chars.length || g === 0; g++, y0 += 3 * cellH + groupGap) {
      if (y0 + 3 * cellH > C.PAGE_H_MM) break;
      const group = chars.slice(g * perRow, (g + 1) * perRow);
      const L = {
        sizeMm, cellW, cellH, cols: Math.max(1, group.length), rows: 3,
        colX: c => left + c * cellW, rowY: r => y0 + r * cellH,
      };
      if (gridEl.checked) PG.drawGrid(page, L);
      ['標楷', '加框', '重疊'].forEach((name, r) => {
        const lab = document.createElement('div');
        lab.className = 'label';
        lab.textContent = name;
        lab.style.left = (left - 9) + 'mm';
        lab.style.top = (L.rowY(r) + 2) + 'mm';
        page.appendChild(lab);
      });
      group.forEach((ch, c) => {
        PG.placeCell(page, L, c, 0, ch, 'kai');
        PG.placeCell(page, L, c, 1, ch, 'box');
        const cell = PG.placeCell(page, L, c, 2, ch, 'box');
        const over = PG.glyph(ch, 'kai');
        over.classList.add('overlay');
        cell.appendChild(over);
      });
    }
    pagesEl.appendChild(page);

    const fmt = a => `{ scale: ${a.scale}, dx: ${a.dx}, dy: ${a.dy} }`;
    $('snippet').value = `  FONT_ADJUST: {\n    kai: ${fmt(C.FONT_ADJUST.kai)},\n    box: ${fmt(C.FONT_ADJUST.box)},\n  },`;
    pagesEl.style.zoom = Math.min(1, (previewEl.clientWidth - 40) / (C.PAGE_W_MM * 96 / 25.4));
  }

  sampleEl.addEventListener('input', render);
  sizeEl.addEventListener('input', render);
  gridEl.addEventListener('change', render);
  window.addEventListener('resize', render);
  render();
  PG.fontsReady().then(() => { $('status').textContent = ''; render(); },
    () => { $('status').textContent = '字型載入失敗'; });
})();
