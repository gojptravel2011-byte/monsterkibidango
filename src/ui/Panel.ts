import Phaser from 'phaser';
import { T } from './theme';

/**
 * FF9 風「紺グラデ＋金二重縁」パネルを Graphics で描く。
 * @param x,y  左上座標
 * @param w,h  幅・高さ
 * @param opts scrollFactor / depth / alpha / cornerDeco
 */
export function drawPanel(
  scene: Phaser.Scene,
  x: number, y: number, w: number, h: number,
  opts: {
    scrollFactor?: number;
    depth?: number;
    alpha?: number;
    cornerDeco?: boolean;
  } = {},
): Phaser.GameObjects.Graphics {
  const { scrollFactor = 0, depth = -1, alpha = T.panelAlpha, cornerDeco = false } = opts;

  const g = scene.add.graphics().setDepth(depth).setScrollFactor(scrollFactor);

  // 背景グラデーション（上が明るい藍、下が深い紺）
  g.fillGradientStyle(T.panelMid, T.panelMid, T.panelDark, T.panelDark, alpha);
  g.fillRoundedRect(x, y, w, h, T.radius);

  // 外縁：真鍮ゴールド
  g.lineStyle(2.5, T.borderGold, 0.95);
  g.strokeRoundedRect(x, y, w, h, T.radius);

  // 内縁：淡い光ライン（内側3px）
  g.lineStyle(1, T.borderGlow, 0.30);
  g.strokeRoundedRect(x + 4, y + 4, w - 8, h - 8, Math.max(T.radius - 3, 4));

  // 四隅の菱形装飾
  if (cornerDeco) {
    g.lineStyle(0, 0, 0);
    g.fillStyle(T.borderGold, 0.85);
    const size = 5;
    [
      [x, y], [x + w, y],
      [x, y + h], [x + w, y + h],
    ].forEach(([cx, cy]) => {
      g.fillTriangle(
        cx!, cy! - size,
        cx! + size, cy!,
        cx! - size, cy!,
      );
      g.fillTriangle(
        cx!, cy! + size,
        cx! + size, cy!,
        cx! - size, cy!,
      );
    });
  }

  return g;
}

/**
 * ボタン用：小さい藍パネル＋金縁 Rectangle を返す（setInteractive はコール側で）。
 * Graphics ではなく Rectangle を使うことで setInteractive が可能。
 */
export function makeBtn(
  scene: Phaser.Scene,
  x: number, y: number, w: number, h: number,
  opts: { depth?: number; scrollFactor?: number } = {},
): Phaser.GameObjects.Rectangle {
  const { depth = 0, scrollFactor = 0 } = opts;
  return scene.add.rectangle(x, y, w, h, T.panelMid, 0.92)
    .setStrokeStyle(1.5, T.borderGold)
    .setDepth(depth)
    .setScrollFactor(scrollFactor);
}
