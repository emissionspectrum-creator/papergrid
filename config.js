// papergrid 設定檔：常改的參數都放這裡。
// 修改後重新整理頁面即可生效。

window.PAPERGRID_CONFIG = {
  // ── 字型檔（相對路徑）──
  FONTS: {
    kai: { family: 'PG-Kai', file: 'fonts/BpmfZihiKaiStd/BpmfZihiKaiStd-Regular.ttf' }, // 字嗨注音標楷
    box: { family: 'PG-Box', file: 'fonts/BpmfZihiBox-R/BpmfZihiBox-R.ttf' },           // 字嗨注音加框
  },

  // ── 字型微調（用 test.html 比較後，把數值貼回這裡）──
  // scale：縮放比例（1 = 原尺寸）
  // dx, dy：水平／垂直位移，單位是「國字大小」的倍數（0.01 = 國字大小的 1%），正值往右／往下
  // 量測結果：兩種字型的國字部分都是 1em × 1em 的正方形（加框字的框線在 1%～99% 的位置），
  // 注音在右側另佔 0.5em，所以預設不需要調整。
  FONT_ADJUST: {
    kai: { scale: 1, dx: 0, dy: 0 },
    box: { scale: 1, dx: 0, dy: 0 },
  },

  // 注音欄寬度 ÷ 國字大小（字型實測：字寬 1536 / 國字 1024 → 多出 0.5）
  BPMF_RATIO: 0.5,

  // ── 版面預設值 ──
  PAGE_W_MM: 297,          // A4 橫放時的寬、高（直放時自動對調）
  PAGE_H_MM: 210,
  DEFAULT_ORIENTATION: 'portrait',  // 紙張方向：'landscape' 橫式、'portrait' 直式
  DEFAULT_SIZE_CM: 2.5,    // 國字大小
  DEFAULT_MARGIN_CM: 0.5,  // 紙張四周最小邊界（格子會在頁面置中）
  COLUMN_GAP_MM: 0,        // 直行之間的間隔（0 = 格子緊鄰，像稿紙）

  // ── 格線樣式 ──
  GRID_COLOR: '#777',
  GRID_WIDTH_MM: 0.3,
  BPMF_LINE_COLOR: '#aaa', // 國字與注音之間的分隔線
  BPMF_LINE_WIDTH_MM: 0.2,

  DEFAULT_TEXT: '我愛[爸]爸，也愛[媽]媽。\n\n「你好嗎？」\n小[狗]跑來跑去，好開心！',
};
