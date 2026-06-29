// デザイントークン：全シーンはここを参照する
// 色は Phaser Graphics 用（hex）と Phaser Text 用（CSS文字列）の2種類

export const T = {
  // ── パネル背景グラデーション ──
  panelDark:  0x0d1225,   // 深い紺（下）
  panelMid:   0x1e2d5a,   // 藍（上）
  panelAlpha: 0.93,

  // ── 縁取り ──
  borderGold: 0xc9a44c,   // 真鍮・金
  borderGlow: 0xe8c87a,   // 内側の光ライン

  // ── アクセント ──
  accent1:    0x6e2733,   // 葡萄酒色（danger/boss）
  accent2:    0x2f6d5e,   // 深緑（safe/nature）
  parchment:  0xf1e4c3,   // 羊皮紙クリーム

  // ── テキスト（Phaser Text 用 CSS 文字列）──
  textLight:  '#ddeeff',  // パネル上の主テキスト（青みがかった白）
  textGold:   '#e8c87a',  // 見出し・強調
  textSub:    '#9ab0d8',  // サブ・説明
  textGreen:  '#7de8b0',  // HP/正解など良い値
  textRed:    '#f08080',  // ダメージ・失敗
  textYellow: '#fff580',  // 報酬・コイン
  textInk:    '#3a2c1e',  // 羊皮紙上の焦茶インク（未使用余地）

  // ── フォント ──
  font: '"Klee One", "Hiragino Kaku Gothic ProN", "Yu Gothic", sans-serif',

  // ── 角丸 ──
  radius:    14,
  radiusBtn:  8,
} as const;
