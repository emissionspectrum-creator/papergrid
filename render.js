// 共用的版面計算與繪製（index.html 與 test.html 都會用到）
'use strict';

const PG = (() => {
  const C = window.PAPERGRID_CONFIG;
  const SVGNS = 'http://www.w3.org/2000/svg';

  // 載入字型。ascent/descent-override 讓行高剛好等於國字的 1em 正方形
  // （字型 ascender 900 + descender 124 = 1024 = unitsPerEm），
  // 避免瀏覽器改用 win 度量（descent 240）而讓字上下偏移。
  const css = Object.values(C.FONTS).map(f => `
@font-face {
  font-family: "${f.family}";
  src: url("${f.file}") format("truetype");
  font-display: block;
  ascent-override: 87.890625%;
  descent-override: 12.109375%;
  line-gap-override: 0%;
}`).join('\n');
  const styleEl = document.createElement('style');
  styleEl.textContent = css;
  document.head.appendChild(styleEl);

  function fontsReady() {
    return Promise.all(Object.values(C.FONTS).map(f => document.fonts.load(`20px "${f.family}"`, '永')));
  }

  // 直書時要換成直式字形的符號
  const VERTICAL = {
    '「': '﹁', '」': '﹂', '『': '﹃', '』': '﹄',
    '（': '︵', '）': '︶', '(': '︵', ')': '︶',
    '《': '︽', '》': '︾', '〈': '︿', '〉': '﹀',
    '【': '︻', '】': '︼', '〔': '︹', '〕': '︺', '｛': '︷', '｝': '︸',
    '—': '︱', '―': '︱', '─': '︱', '－': '︱',
  };
  // 字型沒有直式字形，改用旋轉 90°
  const ROTATE = new Set(['…', '‥', '～', '〜']);
  const BLANK = new Set([' ', '　', '\t']);

  const isHan = ch => /\p{Script=Han}/u.test(ch);
  const isVS = cp => (cp >= 0xFE00 && cp <= 0xFE0F) || (cp >= 0xE0100 && cp <= 0xE01EF);

  // 文字 → [[{ch, boxed}]]（每個元素是一行）。[ ] 包住的國字為加框字。
  function parse(text) {
    return text.replace(/\r/g, '').split('\n').map(line => {
      const out = [];
      let boxed = false;
      for (const ch of line) {
        const cp = ch.codePointAt(0);
        if (ch === '[') { boxed = true; continue; }
        if (ch === ']') { boxed = false; continue; }
        if (isVS(cp) && out.length) { out[out.length - 1].ch += ch; continue; } // 異體字選擇器併到前一字
        out.push({ ch, boxed });
      }
      return out;
    });
  }

  // [[{ch, boxed}]] → 文字。連續的加框字合併成一組 [ ]。
  function serialize(lines) {
    return lines.map(line => {
      let s = '', open = false;
      for (const it of line) {
        const b = it.boxed && isHan(it.ch);
        if (b && !open) { s += '['; open = true; }
        if (!b && open) { s += ']'; open = false; }
        s += it.ch;
      }
      if (open) s += ']';
      return s;
    }).join('\n');
  }

  // 版面計算（單位 mm）
  // portrait：true = A4 直放（寬高對調）
  function layout({ sizeMm, marginMm, rtl, portrait }) {
    const pageW = portrait ? C.PAGE_H_MM : C.PAGE_W_MM;
    const pageH = portrait ? C.PAGE_W_MM : C.PAGE_H_MM;
    const cellH = sizeMm;
    const cellW = sizeMm * (1 + C.BPMF_RATIO);
    const gap = C.COLUMN_GAP_MM;
    const availW = pageW - 2 * marginMm;
    const availH = pageH - 2 * marginMm;
    const cols = Math.max(0, Math.floor((availW + gap) / (cellW + gap) + 1e-6));
    const rows = Math.max(0, Math.floor(availH / cellH + 1e-6));
    const gridW = cols * cellW + Math.max(0, cols - 1) * gap;
    const gridH = rows * cellH;
    const ox = (pageW - gridW) / 2;
    const oy = (pageH - gridH) / 2;
    const colX = c => ox + (rtl ? cols - 1 - c : c) * (cellW + gap);
    const rowY = r => oy + r * cellH;
    return { sizeMm, cellW, cellH, cols, rows, colX, rowY, pageW, pageH };
  }

  // 一頁空白稿紙（含格線）
  function makePage(L, gridOn) {
    const page = document.createElement('div');
    page.className = 'page';
    if (L && L.pageW) {
      page.style.width = L.pageW + 'mm';
      page.style.height = L.pageH + 'mm';
    }
    if (gridOn) drawGrid(page, L);
    return page;
  }

  // 在頁面上畫 L.cols 個直行 × L.rows 格的格線
  function drawGrid(page, L) {
    const svg = document.createElementNS(SVGNS, 'svg');
    svg.setAttribute('class', 'grid');
    svg.setAttribute('viewBox', `0 0 ${L.pageW ?? C.PAGE_W_MM} ${L.pageH ?? C.PAGE_H_MM}`);
    const line = (x1, y1, x2, y2, color, w) => {
      const l = document.createElementNS(SVGNS, 'line');
      Object.entries({ x1, y1, x2, y2, stroke: color, 'stroke-width': w, 'stroke-linecap': 'square' })
        .forEach(([k, v]) => l.setAttribute(k, v));
      svg.appendChild(l);
    };
    const top = L.rowY(0), bot = L.rowY(L.rows);
    for (let c = 0; c < L.cols; c++) {
      const x = L.colX(c), xr = x + L.cellW, xs = x + L.sizeMm;
      line(xs, top, xs, bot, C.BPMF_LINE_COLOR, C.BPMF_LINE_WIDTH_MM);
      for (let r = 0; r <= L.rows; r++) line(x, L.rowY(r), xr, L.rowY(r), C.GRID_COLOR, C.GRID_WIDTH_MM);
      line(x, top, x, bot, C.GRID_COLOR, C.GRID_WIDTH_MM);
      line(xr, top, xr, bot, C.GRID_COLOR, C.GRID_WIDTH_MM);
    }
    page.appendChild(svg);
  }

  // 一個字的字形（國字的 1em 正方形對齊 span 左上角，注音在右側 0.5em）
  function glyph(ch, fontKey) {
    const a = C.FONT_ADJUST[fontKey];
    const span = document.createElement('span');
    span.className = 'g g-' + fontKey;
    span.textContent = VERTICAL[ch] ?? ch;
    span.style.transform = `translate(${a.dx}em, ${a.dy}em) scale(${a.scale})` + (ROTATE.has(ch) ? ' rotate(90deg)' : '');
    return span;
  }

  // 在頁面上的 (c, r) 格放一個字
  function placeCell(page, L, c, r, ch, fontKey) {
    const cell = document.createElement('div');
    cell.className = 'cell';
    cell.style.left = L.colX(c) + 'mm';
    cell.style.top = L.rowY(r) + 'mm';
    cell.style.width = L.cellW + 'mm';
    cell.style.height = L.cellH + 'mm';
    cell.style.fontSize = L.sizeMm + 'mm';
    if (!BLANK.has(ch)) cell.appendChild(glyph(ch, fontKey));
    page.appendChild(cell);
    return cell;
  }

  return { C, fontsReady, parse, serialize, layout, makePage, drawGrid, placeCell, glyph, isHan };
})();
