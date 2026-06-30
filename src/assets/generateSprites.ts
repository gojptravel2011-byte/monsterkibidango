import Phaser from 'phaser';

// すべてのスプライトをPhaser Graphicsで生成してテクスチャ化する
// 本番素材に差し替える場合は BootScene の preload() で実際の画像をロードし
// generateAllSprites() の呼び出しを削除するだけでよい

export function generateAllSprites(scene: Phaser.Scene): void {
  generateAnotherWorldSprites(scene);
  genNpcEncho(scene);
  genPlayerFrames(scene);
  genNpcSensei(scene);
  genNpcGaku(scene);
  genNpcRitsu(scene);
  genNpcSoto(scene);
  genNpcKaya(scene);
  genKurosuke(scene);
  genPiyon(scene);
  genMizubon(scene);
  genHonon(scene);
  genKusagumi(scene);
  genIwagon(scene);
  genKazepon(scene);
  genDenkon(scene);
  genRasuboss(scene);
  genDragon(scene);
  genTree(scene);
  genHouse(scene);
  genLamp(scene);
  genTorii(scene);
  genShopFront(scene);
  genSchool(scene);
  genCloud(scene);
  genFlower(scene);
  genBench(scene);
}

// ---- ユーティリティ ----
type G = Phaser.GameObjects.Graphics;
function make(scene: Phaser.Scene): G { return scene.make.graphics({ x: 0, y: 0 }); }
function fin(g: G, key: string, w: number, h: number): void {
  g.generateTexture(key, w, h); g.destroy();
}

// ── 共通パーツ ──────────────────────────────────────────────────────
// 水彩アニメ風の大きな瞳（白目→瞳孔→虹彩→ハイライト2点）
function cuteEye(g: G, x: number, y: number, r: number, irisCol = 0x334477): void {
  g.fillStyle(0xffffff);        g.fillCircle(x, y, r);
  g.fillStyle(0x111122);        g.fillCircle(x, y, Math.round(r * 0.72));
  g.fillStyle(irisCol, 0.55);   g.fillCircle(x, y, Math.round(r * 0.52));
  g.fillStyle(0xffffff);        g.fillCircle(x - Math.round(r * 0.28), y - Math.round(r * 0.28), Math.max(1, Math.round(r * 0.28)));
  g.fillStyle(0xffffff, 0.65);  g.fillCircle(x + Math.round(r * 0.18), y + Math.round(r * 0.1), Math.max(1, Math.round(r * 0.14)));
}
// ほっぺ赤み
function blush(g: G, x: number, y: number, rx = 10, ry = 6): void {
  g.fillStyle(0xff8888, 0.38); g.fillEllipse(x, y, rx * 2, ry * 2);
  g.fillStyle(0xff9999, 0.18); g.fillEllipse(x, y, rx * 2.4, ry * 2.4);
}
// 水彩ハイライト（体の左上に白い光）
function bodyHighlight(g: G, cx: number, cy: number, r: number): void {
  g.fillStyle(0xffffff, 0.22); g.fillCircle(cx - Math.round(r * 0.35), cy - Math.round(r * 0.3), Math.round(r * 0.45));
  g.fillStyle(0xffffff, 0.12); g.fillCircle(cx - Math.round(r * 0.22), cy - Math.round(r * 0.15), Math.round(r * 0.32));
}

// ---- キャラクター共通描画（前向き 48×64） ----
interface CharOpts {
  hairColor: number;
  hairStyle: 'short' | 'bun' | 'pigtail' | 'spiky' | 'long';
  skinColor: number;
  shirtColor: number;
  pantsColor: number;
  shoeColor: number;
  glasses?: boolean;
  frame: 0 | 1 | 2;
}

function drawChar(g: G, o: CharOpts): void {
  const lLegY = o.frame === 1 ? 49 : o.frame === 2 ? 43 : 46;
  const rLegY = o.frame === 1 ? 43 : o.frame === 2 ? 49 : 46;
  const lLegX = o.frame === 1 ? 11 : o.frame === 2 ? 17 : 14;
  const rLegX = o.frame === 1 ? 27 : o.frame === 2 ? 22 : 25;
  const bodyY  = o.frame === 0 ? 26 : 24;
  const lArmY  = o.frame === 1 ? 32 : o.frame === 2 ? 24 : 28;
  const rArmY  = o.frame === 1 ? 24 : o.frame === 2 ? 32 : 28;

  g.fillStyle(o.pantsColor);
  g.fillRect(lLegX, lLegY, 9, 16); g.fillRect(rLegX, rLegY, 9, 16);
  g.fillStyle(o.shoeColor);
  g.fillRect(lLegX - 2, lLegY + 12, 13, 6); g.fillRect(rLegX - 2, rLegY + 12, 13, 6);
  g.fillStyle(o.shirtColor); g.fillRect(10, bodyY, 28, 22);
  g.fillStyle(o.skinColor);
  g.fillRect(2, lArmY, 9, 8); g.fillRect(37, rArmY, 9, 8);
  g.fillStyle(o.shirtColor);
  g.fillRect(2, lArmY, 9, 5); g.fillRect(37, rArmY, 9, 5);
  g.fillStyle(o.skinColor); g.fillRect(19, bodyY - 6, 10, 8);
  g.fillStyle(o.skinColor); g.fillCircle(24, 14, 13);
  g.fillStyle(o.hairColor);
  switch (o.hairStyle) {
    case 'short':
      g.fillCircle(24, 5, 11); g.fillRect(12, 5, 24, 10);
      g.fillRect(10, 10, 6, 6); g.fillRect(32, 10, 6, 6); break;
    case 'bun':
      g.fillCircle(24, 6, 9); g.fillRect(13, 6, 22, 9);
      g.fillCircle(16, 2, 6); g.fillCircle(32, 2, 6); break;
    case 'pigtail':
      g.fillCircle(24, 6, 9); g.fillRect(13, 6, 22, 9);
      g.fillEllipse(7, 15, 10, 22); g.fillEllipse(41, 15, 10, 22); break;
    case 'spiky':
      g.fillCircle(24, 6, 9); g.fillRect(13, 6, 22, 9);
      g.fillTriangle(14, 6, 10, -4, 20, 2);
      g.fillTriangle(22, 4, 19, -5, 28, 1);
      g.fillTriangle(32, 6, 27, -3, 36, 2); break;
    case 'long':
      g.fillCircle(24, 6, 9); g.fillRect(13, 6, 22, 9);
      g.fillRect(10, 9, 8, 28); g.fillRect(30, 9, 8, 28); break;
  }
  g.fillStyle(0x000000); g.fillCircle(19, 14, 3); g.fillCircle(29, 14, 3);
  g.fillStyle(0xffffff); g.fillCircle(20, 13, 1); g.fillCircle(30, 13, 1);
  g.fillStyle(0xffaaaa, 0.6); g.fillCircle(14, 17, 4); g.fillCircle(34, 17, 4);
  g.fillStyle(0xcc6655); g.fillRect(21, 20, 6, 2);
  if (o.glasses) {
    g.fillStyle(0x888866);
    g.fillRect(13, 12, 9, 1); g.fillRect(13, 17, 9, 1);
    g.fillRect(13, 12, 1, 6); g.fillRect(22, 12, 1, 6);
    g.fillRect(24, 12, 9, 1); g.fillRect(24, 17, 9, 1);
    g.fillRect(24, 12, 1, 6); g.fillRect(33, 12, 1, 6);
    g.fillRect(22, 14, 3, 1);
  }
}

// ---- プレイヤー ウォークフレーム（48×64） ----
function genPlayerFrames(scene: Phaser.Scene): void {
  const opts = {
    hairColor: 0x221100, hairStyle: 'short' as const,
    skinColor: 0xffcc99, shirtColor: 0xee4433,
    pantsColor: 0x2244aa, shoeColor: 0x111133,
  };
  for (const frame of [0, 1, 2] as const) {
    const g = make(scene);
    drawChar(g, { ...opts, frame });
    fin(g, `player_f${frame}`, 48, 64);
  }
  const g2 = make(scene);
  drawChar(g2, { ...opts, frame: 0 });
  fin(g2, 'player', 48, 64);
}

function genNpcEncho(scene: Phaser.Scene): void {
  const g = make(scene);
  drawChar(g, {
    hairColor: 0xcccccc, hairStyle: 'short',
    skinColor: 0xffcc99, shirtColor: 0x112244,
    pantsColor: 0x111133, shoeColor: 0x111111,
    glasses: true, frame: 0,
  });
  fin(g, 'npc_encho', 48, 64);
}
function genNpcSensei(scene: Phaser.Scene): void {
  const g = make(scene);
  drawChar(g, {
    hairColor: 0x331100, hairStyle: 'bun',
    skinColor: 0xffcc99, shirtColor: 0x4455cc,
    pantsColor: 0x334499, shoeColor: 0x222244,
    glasses: true, frame: 0,
  });
  fin(g, 'npc_sensei', 48, 64);
}
function genNpcGaku(scene: Phaser.Scene): void {
  const g = make(scene);
  drawChar(g, {
    hairColor: 0x110800, hairStyle: 'short',
    skinColor: 0xffcc99, shirtColor: 0xdd3322,
    pantsColor: 0x334488, shoeColor: 0x222222,
    frame: 0,
  });
  fin(g, 'npc_gaku', 48, 64);
}
function genNpcRitsu(scene: Phaser.Scene): void {
  const g = make(scene);
  drawChar(g, {
    hairColor: 0x442200, hairStyle: 'pigtail',
    skinColor: 0xffcc99, shirtColor: 0xee66aa,
    pantsColor: 0x2255aa, shoeColor: 0x222244,
    frame: 0,
  });
  fin(g, 'npc_ritsu', 48, 64);
}
function genNpcSoto(scene: Phaser.Scene): void {
  const g = make(scene);
  drawChar(g, {
    hairColor: 0x221100, hairStyle: 'spiky',
    skinColor: 0xffcc99, shirtColor: 0xeecc22,
    pantsColor: 0x224488, shoeColor: 0x222222,
    frame: 0,
  });
  fin(g, 'npc_soto', 48, 64);
}
function genNpcKaya(scene: Phaser.Scene): void {
  const g = make(scene);
  drawChar(g, {
    hairColor: 0x553311, hairStyle: 'long',
    skinColor: 0xffcc99, shirtColor: 0x44bb66,
    pantsColor: 0x225533, shoeColor: 0x222222,
    frame: 0,
  });
  fin(g, 'npc_kaya', 48, 64);
}

// ════════════════════════════════════════════════════════════
//  モンスタースプライト（水彩チビ絵柄リデザイン・80×80）
// ════════════════════════════════════════════════════════════

// ---- クロスケ（黒シュナウザー 80×80） ----
function genKurosuke(scene: Phaser.Scene): void {
  const g = make(scene);
  const cx = 40, cy = 44;

  // 影
  g.fillStyle(0x000000, 0.15); g.fillEllipse(cx + 3, cy + 28, 46, 12);

  // 体（丸くフワフワ）
  g.fillStyle(0x1e1e2c); g.fillCircle(cx, cy + 6, 26);
  g.fillStyle(0x28283a); g.fillCircle(cx - 7, cy + 2, 20);
  g.fillStyle(0x28283a); g.fillCircle(cx + 7, cy + 2, 20);

  // 足（4本・まるい）
  g.fillStyle(0x161622);
  g.fillCircle(cx - 14, cy + 28, 9); g.fillCircle(cx + 14, cy + 28, 9);
  g.fillCircle(cx - 8,  cy + 30, 8); g.fillCircle(cx + 8,  cy + 30, 8);
  g.fillStyle(0x888898, 0.5);
  g.fillCircle(cx - 14, cy + 26, 4); g.fillCircle(cx + 14, cy + 26, 4);

  // しっぽ（短い・先が白）
  g.fillStyle(0x28283a); g.fillCircle(cx + 22, cy + 4, 8);
  g.fillStyle(0xd0d0c0); g.fillCircle(cx + 27, cy + 2, 5);

  // 頭（大きい・丸い）
  g.fillStyle(0x22222e); g.fillCircle(cx, cy - 18, 22);
  g.fillStyle(0x2e2e3e); g.fillCircle(cx - 4, cy - 21, 16);

  // 垂れ耳
  g.fillStyle(0x18181e);
  g.fillEllipse(cx - 18, cy - 14, 14, 24);
  g.fillEllipse(cx + 18, cy - 14, 14, 24);
  g.fillStyle(0x242430);
  g.fillEllipse(cx - 18, cy - 13, 8, 15);
  g.fillEllipse(cx + 18, cy - 13, 8, 15);

  // モシャモシャ眉毛（シュナウザー最大の特徴）
  g.fillStyle(0x8888a0);
  g.fillEllipse(cx - 10, cy - 30, 18, 9);
  g.fillEllipse(cx + 10, cy - 30, 18, 9);
  g.fillStyle(0xaaaabb, 0.7);
  g.fillEllipse(cx - 10, cy - 31, 13, 6);
  g.fillEllipse(cx + 10, cy - 31, 13, 6);

  // 目（大きく温かみのある茶色）
  cuteEye(g, cx - 9, cy - 20, 7, 0x7a4430);
  cuteEye(g, cx + 9, cy - 20, 7, 0x7a4430);

  // マズル
  g.fillStyle(0x2a2a36); g.fillEllipse(cx, cy - 9, 22, 15);

  // もじゃもじゃ白ひげ
  g.fillStyle(0xd0d0b8);
  g.fillCircle(cx - 7, cy - 7, 8); g.fillCircle(cx + 7, cy - 7, 8);
  g.fillCircle(cx, cy - 5, 8);
  g.fillStyle(0xe8e8d0, 0.65);
  g.fillCircle(cx - 5, cy - 8, 6); g.fillCircle(cx + 5, cy - 8, 6);
  g.fillCircle(cx, cy - 7, 7);
  g.fillStyle(0xf4f4e4, 0.4); g.fillEllipse(cx, cy - 7, 20, 9);

  // 鼻
  g.fillStyle(0x111118); g.fillEllipse(cx, cy - 14, 10, 7);
  g.fillStyle(0x888898, 0.5); g.fillCircle(cx + 2, cy - 16, 2);

  // ほっぺ
  blush(g, cx - 16, cy - 16, 8, 5);
  blush(g, cx + 16, cy - 16, 8, 5);

  // 体ハイライト
  bodyHighlight(g, cx, cy, 22);

  fin(g, 'monster_kurosuke', 80, 80);
}

// ---- ぴよん（黄色いひよこ 80×80） ----
// ふわふわ丸々・大きな黒目・オレンジくちばし
function genPiyon(scene: Phaser.Scene): void {
  const g = make(scene);
  const cx = 40, cy = 42;

  g.fillStyle(0x000000, 0.12); g.fillEllipse(cx + 2, cy + 30, 50, 11);

  // 体（ふかふかの丸）
  g.fillStyle(0xe8a800); g.fillCircle(cx, cy + 4, 25);
  g.fillStyle(0xffd000); g.fillCircle(cx, cy,    24);
  g.fillStyle(0xffe840); g.fillCircle(cx - 5, cy - 4, 18);

  // 小さな翼
  g.fillStyle(0xe8a800);
  g.fillEllipse(cx - 24, cy + 2, 15, 22);
  g.fillEllipse(cx + 24, cy + 2, 15, 22);
  g.fillStyle(0xffd000);
  g.fillEllipse(cx - 23, cy - 2, 10, 15);
  g.fillEllipse(cx + 23, cy - 2, 10, 15);

  // 足
  g.fillStyle(0xff8c00);
  g.fillRect(cx - 14, cy + 26, 9, 7); g.fillRect(cx + 5,  cy + 26, 9, 7);
  // 足指
  g.fillRect(cx - 18, cy + 30, 5, 3); g.fillRect(cx - 13, cy + 31, 5, 3); g.fillRect(cx - 8,  cy + 30, 5, 3);
  g.fillRect(cx + 1,  cy + 30, 5, 3); g.fillRect(cx + 6,  cy + 31, 5, 3); g.fillRect(cx + 11, cy + 30, 5, 3);

  // 頭（体に直結・丸くて大きい）
  g.fillStyle(0xffd000); g.fillCircle(cx, cy - 14, 20);
  g.fillStyle(0xffe840); g.fillCircle(cx - 4, cy - 17, 14);

  // 頭のほわほわ毛
  g.fillStyle(0xffe040);
  g.fillCircle(cx,     cy - 32, 7);
  g.fillCircle(cx - 6, cy - 30, 6);
  g.fillCircle(cx + 6, cy - 30, 6);

  // 目（大きくてまんまる）
  cuteEye(g, cx - 8,  cy - 15, 8, 0x2244aa);
  cuteEye(g, cx + 8,  cy - 15, 8, 0x2244aa);

  // くちばし（三角・オレンジ）
  g.fillStyle(0xff8c00);
  g.fillTriangle(cx - 5, cy - 9, cx + 5, cy - 9, cx, cy - 3);
  g.fillStyle(0xffa040, 0.6); g.fillTriangle(cx - 3, cy - 9, cx, cy - 9, cx - 2, cy - 5);

  // ほっぺ
  blush(g, cx - 18, cy - 13);
  blush(g, cx + 18, cy - 13);

  bodyHighlight(g, cx, cy - 6, 18);

  fin(g, 'monster_piyon', 80, 80);
}

// ---- みずぼん（水のしずく 80×80） ----
// 透明感のある水色・ぷよぷよした体・青い大きな目
function genMizubon(scene: Phaser.Scene): void {
  const g = make(scene);
  const cx = 40, cy = 44;

  g.fillStyle(0x000000, 0.12); g.fillEllipse(cx + 2, cy + 28, 46, 10);

  // 水滴の本体（下が丸く・上が細く）
  g.fillStyle(0x3388ee); g.fillEllipse(cx, cy + 6, 46, 50);
  g.fillStyle(0x55aaff); g.fillEllipse(cx, cy,    42, 44);
  g.fillStyle(0x44aaff); g.fillTriangle(cx - 14, cy - 14, cx + 14, cy - 14, cx, cy - 34);

  // 内側の明るい青（透明感）
  g.fillStyle(0x88ccff, 0.45); g.fillEllipse(cx - 5, cy - 6, 28, 32);
  g.fillStyle(0xaaddff, 0.25); g.fillEllipse(cx - 8, cy - 10, 18, 22);

  // 光沢（水滴らしい）
  g.fillStyle(0xffffff, 0.5); g.fillEllipse(cx - 8, cy - 20, 12, 20);
  g.fillStyle(0xffffff, 0.3); g.fillEllipse(cx - 10, cy - 24, 6, 10);

  // 目（透き通った水色）
  cuteEye(g, cx - 8,  cy + 2, 8, 0x1166cc);
  cuteEye(g, cx + 8,  cy + 2, 8, 0x1166cc);

  // 口（にこっ）
  g.fillStyle(0x2266cc); g.fillEllipse(cx, cy + 14, 14, 6);
  g.fillStyle(0x55aaff); g.fillRect(cx - 5, cy + 11, 10, 4);

  // ほっぺ（水色寄り）
  g.fillStyle(0x88ddff, 0.4); g.fillEllipse(cx - 18, cx + 2 - 40, 14, 8);
  g.fillStyle(0x88ddff, 0.4); g.fillEllipse(cx + 18, cy + 4, 14, 8);

  // 気泡
  g.fillStyle(0xaaddff, 0.55);
  g.fillCircle(cx - 26, cy - 8, 5); g.fillCircle(cx - 30, cy - 20, 4);
  g.fillCircle(cx + 28, cy - 4, 6); g.fillCircle(cx + 30, cy - 18, 3);
  g.fillStyle(0xffffff, 0.4);
  g.fillCircle(cx - 26, cy - 10, 2); g.fillCircle(cx + 28, cy - 6, 2);

  fin(g, 'monster_mizubon', 80, 80);
}

// ---- ほのん（炎のせいれい 80×80） ----
// 丸い体から炎が揺れる・怒り顔だが小さくてかわいい
function genHonon(scene: Phaser.Scene): void {
  const g = make(scene);
  const cx = 40, cy = 46;

  // 外炎（赤・揺らぎ感）
  g.fillStyle(0xcc1100);
  g.fillTriangle(cx, cy - 42, cx - 22, cy + 4, cx + 22, cy + 4);
  g.fillTriangle(cx - 12, cy - 36, cx - 34, cy + 8, cx + 4, cy + 4);
  g.fillTriangle(cx + 12, cy - 36, cx + 34, cy + 8, cx - 4, cy + 4);
  g.fillTriangle(cx - 4, cy - 44, cx - 30, cy + 2, cx + 2, cy - 10);
  g.fillTriangle(cx + 4, cy - 44, cx + 30, cy + 2, cx - 2, cy - 10);

  // 中炎（オレンジ）
  g.fillStyle(0xff5500);
  g.fillTriangle(cx, cx - 34, cx - 18, cy + 4, cx + 18, cy + 4);
  g.fillTriangle(cx, cy - 34, cx - 18, cy + 4, cx + 18, cy + 4);
  g.fillTriangle(cx - 6, cy - 38, cx - 26, cy + 4, cx + 6, cy - 6);
  g.fillTriangle(cx + 6, cy - 38, cx + 26, cy + 4, cx - 6, cy - 6);

  // 本体（丸くてかわいい）
  g.fillStyle(0xff6600); g.fillCircle(cx, cy, 24);
  g.fillStyle(0xff8800); g.fillCircle(cx, cy, 20);

  // 内炎（黄）
  g.fillStyle(0xffcc00);
  g.fillTriangle(cx, cy - 22, cx - 12, cy + 4, cx + 12, cy + 4);
  g.fillCircle(cx, cy, 14);

  // コア（明るい黄）
  g.fillStyle(0xffee88); g.fillCircle(cx, cy + 2, 8);
  g.fillStyle(0xffffff, 0.4); g.fillCircle(cx - 2, cy, 4);

  // 目（大きく・炎の中から見える）
  cuteEye(g, cx - 9, cy - 4, 8, 0xcc4400);
  cuteEye(g, cx + 9, cy - 4, 8, 0xcc4400);
  // 目に炎の色を重ねて赤みをつける
  g.fillStyle(0xff4400, 0.25); g.fillCircle(cx - 9, cy - 4, 8);
  g.fillStyle(0xff4400, 0.25); g.fillCircle(cx + 9, cy - 4, 8);
  // ハイライト再描画（上書きされたので）
  g.fillStyle(0xffffff); g.fillCircle(cx - 12, cy - 7, 2); g.fillCircle(cx + 6, cy - 7, 2);

  // 眉（ぐっと力強い）
  g.fillStyle(0xcc2200);
  g.fillRect(cx - 17, cy - 14, 12, 4);
  g.fillRect(cx + 5,  cy - 14, 12, 4);
  g.fillTriangle(cx - 17, cy - 10, cx - 17, cy - 14, cx - 5, cy - 14);
  g.fillTriangle(cx + 17, cy - 10, cx + 17, cy - 14, cx + 5, cy - 14);

  // 口（〜〜っ）
  g.fillStyle(0xaa2200); g.fillEllipse(cx, cy + 10, 18, 7);
  g.fillStyle(0xff5500); g.fillRect(cx - 6, cy + 8, 12, 4);

  bodyHighlight(g, cx, cy - 4, 18);

  fin(g, 'monster_honon', 80, 80);
}

// ---- くさぐみ（植物のせいれい 80×80） ----
// まるくてふくふくした緑の体・葉っぱのかんむり・おだやかな顔
function genKusagumi(scene: Phaser.Scene): void {
  const g = make(scene);
  const cx = 40, cy = 46;

  g.fillStyle(0x000000, 0.12); g.fillEllipse(cx + 2, cy + 26, 50, 11);

  // 体（丸い緑）
  g.fillStyle(0x228822); g.fillCircle(cx, cy + 2, 26);
  g.fillStyle(0x33aa33); g.fillCircle(cx, cy - 2, 24);
  g.fillStyle(0x44cc44, 0.6); g.fillCircle(cx - 6, cy - 6, 16);

  // 葉っぱ（頭の上）
  // 中央の葉
  g.fillStyle(0x118811);
  g.fillTriangle(cx - 2, cy - 26, cx + 2, cy - 26, cx, cy - 50);
  g.fillStyle(0x22aa22);
  g.fillEllipse(cx, cy - 38, 14, 26);
  // 左の葉
  g.fillStyle(0x119911);
  g.fillTriangle(cx - 14, cy - 20, cx - 8, cy - 24, cx - 26, cy - 38);
  g.fillStyle(0x33bb33);
  g.fillEllipse(cx - 20, cy - 30, 14, 22);
  // 右の葉
  g.fillStyle(0x119911);
  g.fillTriangle(cx + 14, cy - 20, cx + 8, cy - 24, cx + 26, cy - 38);
  g.fillStyle(0x33bb33);
  g.fillEllipse(cx + 20, cy - 30, 14, 22);
  // 葉脈
  g.fillStyle(0x116611);
  g.fillRect(cx - 1, cy - 48, 2, 20);
  g.fillRect(cx - 18, cy - 36, 2, 14);
  g.fillRect(cx + 17, cy - 36, 2, 14);

  // 足（丸いツル）
  g.fillStyle(0x338833);
  g.fillCircle(cx - 14, cy + 26, 9); g.fillCircle(cx + 14, cy + 26, 9);
  g.fillStyle(0x44aa44, 0.5);
  g.fillCircle(cx - 14, cy + 24, 5); g.fillCircle(cx + 14, cy + 24, 5);

  // 目（やさしい緑）
  cuteEye(g, cx - 8, cy - 2, 8, 0x115511);
  cuteEye(g, cx + 8, cy - 2, 8, 0x115511);

  // 口（にこにこ）
  g.fillStyle(0x115511); g.fillEllipse(cx, cy + 10, 16, 7);
  g.fillStyle(0x33aa33); g.fillRect(cx - 6, cy + 8, 12, 4);

  // ほっぺ（黄緑）
  g.fillStyle(0xaaffaa, 0.4); g.fillEllipse(cx - 18, cy + 0, 14, 8);
  g.fillStyle(0xaaffaa, 0.4); g.fillEllipse(cx + 18, cy + 0, 14, 8);

  bodyHighlight(g, cx, cy - 4, 20);

  fin(g, 'monster_kusagumi', 80, 80);
}

// ---- いわごん（岩のせいれい 80×80） ----
// ずんぐり丸くて重たそう・岩の表面テクスチャ・ぐりんとした目
function genIwagon(scene: Phaser.Scene): void {
  const g = make(scene);
  const cx = 40, cy = 46;

  g.fillStyle(0x000000, 0.18); g.fillEllipse(cx + 3, cy + 28, 56, 12);

  // 体（大きな岩のかたまり）
  g.fillStyle(0x666655); g.fillCircle(cx, cy, 30);
  g.fillStyle(0x7a7a68); g.fillCircle(cx, cy - 4, 28);
  g.fillStyle(0x888876, 0.6); g.fillCircle(cx - 6, cy - 8, 20);

  // 岩のでこぼこ（外周の小さい丸）
  g.fillStyle(0x5a5a48);
  g.fillCircle(cx - 22, cy, 10); g.fillCircle(cx + 22, cy, 10);
  g.fillCircle(cx - 18, cy - 20, 9); g.fillCircle(cx + 18, cy - 20, 9);
  g.fillCircle(cx, cy - 26, 10);
  g.fillStyle(0x7a7a66, 0.7);
  g.fillCircle(cx - 22, cy - 2, 7); g.fillCircle(cx + 22, cy - 2, 7);

  // ひび割れ
  g.fillStyle(0x444433);
  g.fillRect(cx + 6, cy - 20, 2, 18);
  g.fillRect(cx - 16, cy - 8, 14, 2);
  g.fillRect(cx + 4, cy + 8, 2, 14);
  g.fillRect(cx - 6, cy + 4, 10, 2);

  // 腕（ごつい）
  g.fillStyle(0x666655);
  g.fillEllipse(cx - 30, cy - 4, 18, 22);
  g.fillEllipse(cx + 30, cy - 4, 18, 22);
  g.fillStyle(0x555544);
  g.fillRect(cx - 38, cy + 0, 10, 4); g.fillRect(cx + 28, cy + 0, 10, 4); // 指

  // 足（ずんぐり）
  g.fillStyle(0x5a5a48);
  g.fillCircle(cx - 14, cy + 28, 12); g.fillCircle(cx + 14, cy + 28, 12);
  g.fillStyle(0x777766, 0.5);
  g.fillCircle(cx - 14, cy + 26, 6); g.fillCircle(cx + 14, cy + 26, 6);

  // 目（がっちりとした環境で生きる鋭い目）
  cuteEye(g, cx - 10, cy - 10, 8, 0xcc5500);
  cuteEye(g, cx + 10, cy - 10, 8, 0xcc5500);
  // 眉（ゴツい岩眉）
  g.fillStyle(0x444433);
  g.fillRect(cx - 20, cy - 20, 14, 5);
  g.fillRect(cx + 6,  cy - 20, 14, 5);
  g.fillTriangle(cx - 20, cy - 15, cx - 20, cy - 20, cx - 6,  cy - 20);
  g.fillTriangle(cx + 20, cy - 15, cx + 20, cy - 20, cx + 6,  cy - 20);

  // 口（への字・不機嫌）
  g.fillStyle(0x333322); g.fillRect(cx - 10, cy + 4, 20, 4);
  g.fillRect(cx - 10, cy + 4, 3, 8); g.fillRect(cx + 7, cy + 4, 3, 8);

  bodyHighlight(g, cx, cy - 6, 24);

  fin(g, 'monster_iwagon', 80, 80);
}

// ---- かぜぽん（風のせいれい 80×80） ----
// 半透明のひらひら・渦巻き模様・澄んだ目・ふわっと浮いてる感
function genKazepon(scene: Phaser.Scene): void {
  const g = make(scene);
  const cx = 40, cy = 42;

  // 外側の風の渦（半透明）
  g.fillStyle(0x88ddff, 0.25);
  g.fillEllipse(cx, cy, 66, 60);
  g.fillStyle(0xaaeeff, 0.18);
  g.fillEllipse(cx - 14, cy - 8, 36, 28);
  g.fillEllipse(cx + 14, cy + 8, 36, 28);

  // 風の尾（流線）
  g.fillStyle(0x88ccee, 0.35);
  g.fillEllipse(cx + 30, cy - 14, 22, 10);
  g.fillEllipse(cx + 34, cy - 4, 18, 8);
  g.fillEllipse(cx + 28, cy + 10, 20, 8);
  g.fillEllipse(cx - 30, cy - 10, 20, 8);
  g.fillEllipse(cx - 34, cy + 4, 16, 7);

  // 体（雲っぽい・丸い）
  g.fillStyle(0x55bbdd); g.fillCircle(cx, cy, 24);
  g.fillStyle(0x77ddff); g.fillCircle(cx - 5, cy - 5, 18);
  g.fillStyle(0x99eeff, 0.5); g.fillCircle(cx - 8, cy - 8, 12);

  // 渦巻き模様（体の上）
  g.fillStyle(0x44aacc, 0.55);
  g.fillEllipse(cx + 4, cy + 2, 22, 10);
  g.fillEllipse(cx - 4, cy - 4, 16, 8);
  g.fillStyle(0x66ccee, 0.4);
  g.fillEllipse(cx + 2, cy + 4, 14, 6);

  // 目（透き通った空色）
  cuteEye(g, cx - 8, cy - 2, 8, 0x0088bb);
  cuteEye(g, cx + 8, cy - 2, 8, 0x0088bb);

  // 口（〜 気持ち良さそう）
  g.fillStyle(0x3399bb); g.fillEllipse(cx, cy + 11, 14, 6);
  g.fillStyle(0x77ddff); g.fillRect(cx - 5, cy + 9, 10, 4);

  // ほっぺ（水色）
  g.fillStyle(0xaaeeff, 0.45); g.fillEllipse(cx - 18, cy + 0, 14, 8);
  g.fillStyle(0xaaeeff, 0.45); g.fillEllipse(cx + 18, cy + 0, 14, 8);

  bodyHighlight(g, cx, cy - 4, 18);

  fin(g, 'monster_kazepon', 80, 80);
}

// ---- でんこん（電気ネズミ 80×80） ----
// ぷくぷく黄色・ピカチュウ風・赤いほっぺ・電撃耳
function genDenkon(scene: Phaser.Scene): void {
  const g = make(scene);
  const cx = 40, cy = 46;

  g.fillStyle(0x000000, 0.12); g.fillEllipse(cx + 2, cy + 26, 52, 11);

  // 稲妻しっぽ
  g.fillStyle(0xffcc00);
  g.fillTriangle(cx + 22, cy + 8, cx + 34, cy - 10, cx + 38, cy + 2);
  g.fillTriangle(cx + 34, cy - 10, cx + 40, cy - 26, cx + 44, cy - 14);
  g.fillStyle(0xffee44, 0.7);
  g.fillTriangle(cx + 24, cy + 6, cx + 34, cy - 8, cx + 37, cy + 0);

  // 体（ぷよぷよ黄色）
  g.fillStyle(0xeea800); g.fillCircle(cx - 2, cy + 4, 26);
  g.fillStyle(0xffd000); g.fillCircle(cx - 2, cy,    24);
  g.fillStyle(0xffe840, 0.6); g.fillCircle(cx - 7, cy - 5, 17);

  // 耳（稲妻型・三角）
  // 左耳
  g.fillStyle(0xeeaa00);
  g.fillTriangle(cx - 18, cy - 22, cx - 28, cy - 46, cx - 8, cy - 22);
  g.fillStyle(0xff2244);
  g.fillTriangle(cx - 18, cy - 24, cx - 26, cy - 44, cx - 10, cy - 24);
  // 右耳
  g.fillStyle(0xeeaa00);
  g.fillTriangle(cx + 12, cy - 22, cx + 24, cy - 46, cx + 4, cy - 22);
  g.fillStyle(0xff2244);
  g.fillTriangle(cx + 12, cy - 24, cx + 22, cy - 44, cx + 6, cy - 24);

  // 頭
  g.fillStyle(0xffd000); g.fillCircle(cx, cy - 16, 20);
  g.fillStyle(0xffe840, 0.5); g.fillCircle(cx - 5, cy - 20, 14);

  // 足
  g.fillStyle(0xeea800);
  g.fillCircle(cx - 14, cy + 28, 9); g.fillCircle(cx + 12, cy + 28, 9);
  g.fillStyle(0x88660050, 0.3);
  g.fillCircle(cx - 14, cy + 26, 5); g.fillCircle(cx + 12, cy + 26, 5);
  // 足先（茶色）
  g.fillStyle(0xcc8833);
  g.fillEllipse(cx - 14, cy + 34, 14, 7); g.fillEllipse(cx + 12, cy + 34, 14, 7);

  // 腕（ちっちゃい）
  g.fillStyle(0xeea800);
  g.fillEllipse(cx - 26, cy + 2, 12, 16);
  g.fillEllipse(cx + 24, cy + 2, 12, 16);

  // 目（大きなくりっとした目）
  cuteEye(g, cx - 8, cy - 16, 8, 0x2244aa);
  cuteEye(g, cx + 8, cy - 16, 8, 0x2244aa);

  // 口（W型・元気）
  g.fillStyle(0xcc6600);
  g.fillTriangle(cx - 8, cy - 8, cx - 4, cy - 3, cx, cy - 8);
  g.fillTriangle(cx, cy - 8, cx + 4, cy - 3, cx + 8, cy - 8);

  // ほっぺ（赤い電気マーク・丸形）
  g.fillStyle(0xff2244, 0.75); g.fillCircle(cx - 18, cy - 10, 7);
  g.fillStyle(0xff2244, 0.75); g.fillCircle(cx + 18, cy - 10, 7);
  // ほっぺの電撃マーク
  g.fillStyle(0xffee44, 0.5);
  g.fillTriangle(cx - 20, cy - 13, cx - 17, cy - 7, cx - 15, cy - 12);
  g.fillTriangle(cx + 16, cy - 13, cx + 19, cy - 7, cx + 21, cy - 12);

  bodyHighlight(g, cx - 2, cy - 4, 20);

  fin(g, 'monster_denkon', 80, 80);
}

// ════════════════════════════════════════════════════════════
//  装飾スプライト（変更なし）
// ════════════════════════════════════════════════════════════

function genTree(scene: Phaser.Scene): void {
  const g = make(scene);
  g.fillStyle(0x885522); g.fillRect(22, 50, 12, 30);
  g.fillStyle(0x338822); g.fillCircle(28, 40, 18);
  g.fillStyle(0x449933); g.fillCircle(16, 50, 14);
  g.fillStyle(0x449933); g.fillCircle(40, 50, 14);
  fin(g, 'deco_tree', 56, 80);
}
function genHouse(scene: Phaser.Scene): void {
  const g = make(scene);
  g.fillStyle(0xfff0cc); g.fillRect(8, 48, 80, 64);
  g.fillStyle(0xcc3322); g.fillTriangle(48, 4, 0, 52, 96, 52);
  g.fillStyle(0xaaddff); g.fillRect(14, 60, 24, 20); g.fillRect(58, 60, 24, 20);
  g.fillStyle(0x888888); g.fillRect(14, 60, 24, 2); g.fillRect(14, 60, 2, 20);
  g.fillStyle(0x888888); g.fillRect(58, 60, 24, 2); g.fillRect(58, 60, 2, 20);
  g.fillStyle(0x885533); g.fillRect(36, 80, 24, 32);
  g.fillStyle(0xffcc44); g.fillCircle(57, 96, 3);
  fin(g, 'deco_house', 96, 112);
}
function genLamp(scene: Phaser.Scene): void {
  const g = make(scene);
  g.fillStyle(0x222222); g.fillRect(8, 16, 4, 40);
  g.fillStyle(0xffee44); g.fillEllipse(10, 12, 16, 14);
  g.fillStyle(0x888888); g.fillRect(4, 50, 12, 6);
  fin(g, 'deco_lamp', 20, 56);
}
function genTorii(scene: Phaser.Scene): void {
  const g = make(scene);
  g.fillStyle(0xcc2200); g.fillRect(6, 24, 14, 72); g.fillRect(60, 24, 14, 72);
  g.fillStyle(0xcc2200); g.fillRect(0, 8, 80, 12);
  g.fillStyle(0xcc2200); g.fillRect(4, 28, 72, 10);
  fin(g, 'deco_torii', 80, 96);
}
function genShopFront(scene: Phaser.Scene): void {
  const g = make(scene);
  g.fillStyle(0xfff0cc); g.fillRect(0, 20, 96, 60);
  g.fillStyle(0x443322); g.fillRect(0, 0, 96, 24);
  g.fillStyle(0xff4444, 0.5);
  for (let i = 0; i < 6; i++) g.fillRect(i * 16, 0, 8, 24);
  g.fillStyle(0x885533); g.fillRect(36, 44, 24, 36);
  fin(g, 'deco_shopfront', 96, 80);
}
function genSchool(scene: Phaser.Scene): void {
  const g = make(scene);
  g.fillStyle(0xffffff); g.fillRect(10, 40, 180, 120);
  g.fillStyle(0xcccccc); g.fillRect(10, 30, 180, 14);
  g.fillStyle(0x888888); g.fillRect(95, 4, 4, 30);
  g.fillStyle(0xff4444); g.fillRect(99, 4, 20, 14);
  g.fillStyle(0xaaddff);
  for (let row = 0; row < 2; row++) {
    for (let col = 0; col < 4; col++) g.fillRect(20 + col * 44, 54 + row * 44, 30, 28);
  }
  g.fillStyle(0xdddddd); g.fillRect(80, 120, 40, 40);
  g.fillStyle(0xaaaaaa); g.fillEllipse(100, 120, 40, 20);
  fin(g, 'deco_school', 200, 160);
}
function genCloud(scene: Phaser.Scene): void {
  const g = make(scene);
  g.fillStyle(0xffffff);
  g.fillEllipse(40, 26, 50, 28); g.fillEllipse(22, 28, 36, 24);
  g.fillEllipse(58, 28, 36, 24); g.fillEllipse(32, 18, 34, 26);
  g.fillEllipse(50, 16, 30, 24);
  fin(g, 'deco_cloud', 80, 40);
}
function genFlower(scene: Phaser.Scene): void {
  const g = make(scene);
  g.fillStyle(0x44aa22); g.fillRect(11, 14, 3, 14);
  g.fillStyle(0xff99cc);
  g.fillCircle(12, 8, 5); g.fillCircle(18, 12, 5); g.fillCircle(16, 19, 5);
  g.fillCircle(8, 19, 5); g.fillCircle(6, 12, 5);
  g.fillStyle(0xffee00); g.fillCircle(12, 14, 5);
  fin(g, 'deco_flower', 24, 28);
}
function genBench(scene: Phaser.Scene): void {
  const g = make(scene);
  g.fillStyle(0x885533); g.fillRect(0, 6, 48, 8);
  g.fillStyle(0x664422); g.fillRect(4, 14, 6, 10); g.fillRect(38, 14, 6, 10);
  fin(g, 'deco_bench', 48, 24);
}

// ════════════════════════════════════════════════════════════
//  やみのぬし（ラスボス 80×96）
//  水彩風：暗い神秘的なシルエット・禍々しい光る目
// ════════════════════════════════════════════════════════════
function genRasuboss(scene: Phaser.Scene): void {
  const g = make(scene);
  const cx = 40, cy = 52;

  // 外側のオーラ（暗い紫の霧）
  g.fillStyle(0x330044, 0.3); g.fillCircle(cx, cy, 42);
  g.fillStyle(0x220033, 0.2); g.fillCircle(cx, cy, 50);

  // マント（大きく広がる）
  g.fillStyle(0x220033);
  g.fillTriangle(cx, cy - 44, cx - 36, cy + 44, cx + 36, cy + 44);
  g.fillTriangle(cx, cy - 36, cx - 44, cy + 24, cx - 14, cy - 12);
  g.fillTriangle(cx, cy - 36, cx + 44, cy + 24, cx + 14, cy - 12);
  // マントのグラデ（少し明るい紫）
  g.fillStyle(0x440066, 0.7);
  g.fillTriangle(cx, cy - 40, cx - 30, cy + 40, cx + 30, cy + 40);
  g.fillStyle(0x330055, 0.5);
  g.fillTriangle(cx, cy - 34, cx - 22, cy + 36, cx + 22, cy + 36);

  // 体（暗い楕円）
  g.fillStyle(0x1a0028); g.fillEllipse(cx, cy, 44, 56);
  g.fillStyle(0x240036); g.fillEllipse(cx, cy - 4, 38, 46);

  // 頭（丸くてなめらか）
  g.fillStyle(0x220030); g.fillCircle(cx, cy - 32, 22);
  g.fillStyle(0x2c003c, 0.7); g.fillCircle(cx - 4, cy - 35, 16);

  // 角（2本・曲がった禍々しい角）
  g.fillStyle(0x550077);
  g.fillTriangle(cx - 12, cy - 46, cx - 22, cy - 76, cx - 4, cy - 46);
  g.fillTriangle(cx + 12, cy - 46, cx + 22, cy - 76, cx + 4, cy - 46);
  // 角のグラデ
  g.fillStyle(0x7700aa, 0.6);
  g.fillTriangle(cx - 12, cy - 48, cx - 20, cy - 70, cx - 6, cy - 48);
  g.fillTriangle(cx + 12, cy - 48, cx + 20, cy - 70, cx + 6, cy - 48);

  // 目（大きく・赤く禍々しく光る）
  // 外側の赤い光
  g.fillStyle(0xff0000, 0.35); g.fillCircle(cx - 10, cy - 32, 14);
  g.fillStyle(0xff0000, 0.35); g.fillCircle(cx + 10, cy - 32, 14);
  // 白目（オレンジ寄り）
  g.fillStyle(0xff8800); g.fillEllipse(cx - 10, cy - 32, 18, 12);
  g.fillStyle(0xff8800); g.fillEllipse(cx + 10, cy - 32, 18, 12);
  // 瞳（赤・縦長）
  g.fillStyle(0xff2200); g.fillEllipse(cx - 10, cy - 32, 12, 10);
  g.fillStyle(0xff2200); g.fillEllipse(cx + 10, cy - 32, 12, 10);
  // 瞳孔（縦スリット）
  g.fillStyle(0x220000); g.fillRect(cx - 11, cy - 37, 2, 10);
  g.fillStyle(0x220000); g.fillRect(cx + 9,  cy - 37, 2, 10);
  // 目のハイライト
  g.fillStyle(0xffee88, 0.8); g.fillCircle(cx - 14, cy - 35, 3);
  g.fillStyle(0xffee88, 0.8); g.fillCircle(cx + 6,  cy - 35, 3);

  // 口（裂けた・歯が見える）
  g.fillStyle(0x110000); g.fillRect(cx - 14, cy - 20, 28, 8);
  g.fillStyle(0xffffff);
  for (let i = 0; i < 6; i++) {
    g.fillTriangle(cx - 14 + i * 5, cy - 20, cx - 11 + i * 5, cy - 20, cx - 12 + i * 5, cy - 14);
  }
  // 口の血の色
  g.fillStyle(0xcc0000, 0.4); g.fillRect(cx - 14, cy - 18, 28, 4);

  // 手（爪が鋭い）
  g.fillStyle(0x330044);
  g.fillEllipse(cx - 32, cy + 4, 18, 12);
  g.fillEllipse(cx + 32, cy + 4, 18, 12);
  // 爪
  g.fillStyle(0xaa00cc);
  for (let i = 0; i < 3; i++) {
    g.fillTriangle(cx - 38 + i * 5, cy + 4, cx - 35 + i * 5, cy - 6, cx - 32 + i * 5, cy + 4);
    g.fillTriangle(cx + 28 + i * 5, cy + 4, cx + 31 + i * 5, cy - 6, cx + 34 + i * 5, cy + 4);
  }

  // マントの光沢
  g.fillStyle(0x660088, 0.2);
  g.fillTriangle(cx, cy - 38, cx - 16, cy + 30, cx, cy + 30);
  g.fillStyle(0xffffff, 0.04); g.fillCircle(cx - 8, cy - 24, 14);

  fin(g, 'monster_rasuboss', 80, 96);
}

// ════════════════════════════════════════════════════════════
//  ドラゴン（レアモンスター 80×80）
//  赤鱗・大きな翼・炎の息・金色の目
// ════════════════════════════════════════════════════════════
function genDragon(scene: Phaser.Scene): void {
  const g = make(scene);
  const cx = 40, cy = 44;

  // 影
  g.fillStyle(0x000000, 0.18); g.fillEllipse(cx + 3, cy + 30, 58, 13);

  // 翼（後ろ側・大きく広げる）
  g.fillStyle(0x880022);
  g.fillTriangle(cx - 10, cy - 10, cx - 44, cy - 52, cx - 2, cy - 28);
  g.fillTriangle(cx + 10, cy - 10, cx + 44, cy - 52, cx + 2, cy - 28);
  // 翼膜（半透明の赤）
  g.fillStyle(0xcc1100, 0.5);
  g.fillTriangle(cx - 10, cy - 10, cx - 46, cy - 46, cx - 20, cy + 4);
  g.fillTriangle(cx + 10, cy - 10, cx + 46, cy - 46, cx + 20, cy + 4);
  // 翼の骨
  g.fillStyle(0xaa2200);
  g.fillRect(cx - 26, cy - 30, 3, 24); g.fillRect(cx + 23, cy - 30, 3, 24);
  g.fillRect(cx - 36, cy - 40, 3, 20); g.fillRect(cx + 33, cy - 40, 3, 20);

  // 尻尾（長くとがった）
  g.fillStyle(0xcc2200);
  g.fillTriangle(cx + 14, cy + 18, cx + 30, cy + 44, cx + 20, cy + 18);
  g.fillTriangle(cx + 24, cy + 38, cx + 38, cy + 52, cx + 28, cy + 38);
  // 尻尾の棘
  g.fillStyle(0xff4400);
  g.fillTriangle(cx + 32, cy + 46, cx + 38, cy + 42, cx + 36, cy + 54);

  // 体（太くてがっしり）
  g.fillStyle(0xaa2200); g.fillEllipse(cx, cy + 6, 46, 42);
  g.fillStyle(0xcc2200); g.fillEllipse(cx, cy, 42, 36);
  // お腹（淡いオレンジ）
  g.fillStyle(0xff8844, 0.7); g.fillEllipse(cx, cy + 6, 26, 26);
  g.fillStyle(0xffaa66, 0.4); g.fillEllipse(cx, cy + 2, 18, 18);

  // 足（後ろ足）
  g.fillStyle(0xaa2200);
  g.fillEllipse(cx - 18, cy + 26, 16, 20); g.fillEllipse(cx + 18, cy + 26, 16, 20);
  // 爪
  g.fillStyle(0xddddaa);
  g.fillTriangle(cx - 24, cy + 34, cx - 20, cy + 40, cx - 16, cy + 34);
  g.fillTriangle(cx - 18, cy + 36, cx - 14, cy + 42, cx - 10, cy + 36);
  g.fillTriangle(cx + 16, cy + 34, cx + 20, cy + 40, cx + 24, cy + 34);
  g.fillTriangle(cx + 10, cy + 36, cx + 14, cy + 42, cx + 18, cy + 36);

  // 前足（腕）
  g.fillStyle(0xcc2200);
  g.fillEllipse(cx - 28, cy + 4, 14, 18);
  g.fillEllipse(cx + 28, cy + 4, 14, 18);
  // 前足の爪
  g.fillStyle(0xddddaa);
  g.fillTriangle(cx - 34, cy + 12, cx - 30, cy + 18, cx - 24, cy + 12);
  g.fillTriangle(cx + 24, cy + 12, cx + 30, cy + 18, cx + 34, cy + 12);

  // 首
  g.fillStyle(0xbb2200); g.fillEllipse(cx, cy - 16, 24, 22);
  // 首の鱗模様
  g.fillStyle(0x991100, 0.5);
  for (let i = 0; i < 3; i++) {
    g.fillEllipse(cx - 6 + i * 6, cy - 10 - i * 4, 8, 5);
  }

  // 頭（大きくて迫力）
  g.fillStyle(0xcc2200); g.fillEllipse(cx, cy - 30, 30, 24);
  g.fillStyle(0xdd2200); g.fillEllipse(cx - 2, cy - 32, 26, 20);

  // 頭の角（2本・鋭い）
  g.fillStyle(0xddbb44);
  g.fillTriangle(cx - 10, cy - 38, cx - 16, cy - 60, cx - 4, cy - 38);
  g.fillTriangle(cx + 10, cy - 38, cx + 16, cy - 60, cx + 4, cy - 38);
  // 角の縞
  g.fillStyle(0xbbaa22, 0.6);
  g.fillRect(cx - 14, cy - 54, 5, 6); g.fillRect(cx + 9, cy - 54, 5, 6);
  g.fillRect(cx - 13, cy - 46, 5, 4); g.fillRect(cx + 8, cy - 46, 5, 4);

  // 目（金色・縦スリット・迫力）
  g.fillStyle(0xffcc00); g.fillEllipse(cx - 10, cy - 30, 12, 10);
  g.fillStyle(0xffcc00); g.fillEllipse(cx + 10, cy - 30, 12, 10);
  g.fillStyle(0x1a0800); g.fillRect(cx - 11, cy - 35, 3, 10);
  g.fillStyle(0x1a0800); g.fillRect(cx + 9,  cy - 35, 3, 10);
  g.fillStyle(0xffffff, 0.7); g.fillCircle(cx - 13, cy - 32, 2);
  g.fillStyle(0xffffff, 0.7); g.fillCircle(cx + 7,  cy - 32, 2);

  // 眉（太くて険しい）
  g.fillStyle(0x880000);
  g.fillRect(cx - 18, cy - 38, 12, 4);
  g.fillRect(cx + 6,  cy - 38, 12, 4);
  g.fillTriangle(cx - 18, cy - 34, cx - 18, cy - 38, cx - 6,  cy - 38);
  g.fillTriangle(cx + 18, cy - 34, cx + 18, cy - 38, cx + 6,  cy - 38);

  // 口・鼻先（とがっていてワイルド）
  g.fillStyle(0xaa1800); g.fillEllipse(cx, cy - 20, 22, 14);
  // 歯
  g.fillStyle(0xffffff);
  g.fillTriangle(cx - 8, cy - 15, cx - 6, cy - 22, cx - 2, cy - 15);
  g.fillTriangle(cx + 2, cy - 15, cx + 6, cy - 22, cx + 8, cy - 15);
  // 炎のブレス（口から）
  g.fillStyle(0xff6600, 0.55);
  g.fillTriangle(cx - 4, cy - 15, cx + 4, cy - 15, cx + 22, cy - 6);
  g.fillStyle(0xffaa00, 0.4);
  g.fillTriangle(cx - 2, cy - 15, cx + 2, cy - 15, cx + 26, cy - 4);
  g.fillStyle(0xffee44, 0.25);
  g.fillTriangle(cx, cy - 14, cx + 2, cy - 14, cx + 30, cy - 2);

  // 鱗のキラキラ（体の各所に）
  g.fillStyle(0xff5544, 0.6);
  g.fillEllipse(cx - 10, cy + 2, 8, 5);
  g.fillEllipse(cx + 8,  cy - 2, 8, 5);
  g.fillEllipse(cx - 4,  cy + 10, 8, 5);
  g.fillStyle(0xff7755, 0.4);
  g.fillEllipse(cx + 12, cy + 8, 7, 4);
  g.fillEllipse(cx - 14, cy + 12, 7, 4);

  // 体ハイライト
  g.fillStyle(0xffffff, 0.12); g.fillCircle(cx - 10, cy - 6, 14);
  g.fillStyle(0xffffff, 0.07); g.fillCircle(cx - 6, cy - 2, 8);

  fin(g, 'monster_dragon', 80, 80);
}

// ────────────────────────────────────────────────────────────────────
// 別世界モンスタースプライト（80×80 プレースホルダー）
// ────────────────────────────────────────────────────────────────────

function generateAnotherWorldSprites(scene: Phaser.Scene): void {
  // ── ほのおのせかい ─────────────────────────────────────────
  // インフェルノゴーレム: 溶岩色の四角い巨体
  (() => {
    const g = make(scene);
    const cx = 40, cy = 44;
    g.fillStyle(0x221100); g.fillRect(12, 16, 56, 58); // 影
    g.fillStyle(0x994400); g.fillRect(14, 14, 52, 56); // 体
    g.fillStyle(0xff4400); g.fillRect(18, 18, 44, 48); // 前面
    g.fillStyle(0xff8800, 0.7);
    [[-10,10],[8,4],[-4,20],[12,16],[-8,30]].forEach(([dx,dy]) =>
      g.fillEllipse(cx+dx, cy+dy, 10, 6));
    cuteEye(g, cx-10, cy-8, 8, 0xff2200);
    cuteEye(g, cx+10, cy-8, 8, 0xff2200);
    g.fillStyle(0xff6600, 0.8); g.fillTriangle(cx-12, 14, cx, 2, cx+12, 14);
    fin(g, 'aw_inferno_golem', 80, 80);
  })();

  // フレイムドラゴン: 赤い翼竜
  (() => {
    const g = make(scene);
    const cx = 40, cy = 44;
    g.fillStyle(0x660000); g.fillEllipse(cx, cy+2, 38, 52);  // 体影
    g.fillStyle(0xcc2200); g.fillEllipse(cx, cy,   36, 50);  // 体
    g.fillStyle(0xff3300); g.fillEllipse(cx, cy-4, 28, 38);  // 前面
    g.fillStyle(0x880000);
    g.fillTriangle(cx-40, cy-10, cx-16, cy+10, cx-16, cy-30); // 左翼
    g.fillTriangle(cx+40, cy-10, cx+16, cy+10, cx+16, cy-30); // 右翼
    g.fillStyle(0xdd2200);
    g.fillTriangle(cx-38, cy-10, cx-18, cy+8, cx-18, cy-28);
    g.fillTriangle(cx+38, cy-10, cx+18, cy+8, cx+18, cy-28);
    cuteEye(g, cx-9, cy-12, 8, 0xff8800);
    cuteEye(g, cx+9, cy-12, 8, 0xff8800);
    g.fillStyle(0xff6600); g.fillEllipse(cx, cy+22, 10, 18); // 尻尾
    fin(g, 'aw_flame_dragon', 80, 80);
  })();

  // バルカンフェニックス: オレンジの炎の鳥
  (() => {
    const g = make(scene);
    const cx = 40, cy = 40;
    g.fillStyle(0xff6600); g.fillCircle(cx, cy, 24);
    g.fillStyle(0xffaa00); g.fillCircle(cx, cy-2, 20);
    g.fillStyle(0xff4400, 0.8);
    [[-30,-15,35,-30,-10,10],[30,-15,-35,-30,10,10]].forEach(([x1,y1,x2,y2,x3,y3]) =>
      g.fillTriangle(cx+x1,cy+y1,cx+x2,cy+y2,cx+x3,cy+y3));
    g.fillStyle(0xffee00, 0.6); g.fillCircle(cx, cy, 14);
    cuteEye(g, cx-7, cy-4, 7, 0xffcc00);
    cuteEye(g, cx+7, cy-4, 7, 0xffcc00);
    g.fillStyle(0xff6600); g.fillTriangle(cx-4,cy+6,cx+4,cy+6,cx,cy+14);
    for (let i=-2;i<=2;i++) {
      g.fillStyle(0xff8800, 0.7); g.fillEllipse(cx+i*14, cy+32, 8, 20);
    }
    fin(g, 'aw_vulcan_phoenix', 80, 80);
  })();

  // ── こおりのせかい ─────────────────────────────────────────
  // ブリザードウルフ: 氷色の狼
  (() => {
    const g = make(scene);
    const cx = 40, cy = 46;
    g.fillStyle(0x4488bb); g.fillEllipse(cx+2, cy+2, 46, 38);
    g.fillStyle(0x88ccee); g.fillEllipse(cx, cy, 44, 36);
    g.fillStyle(0xaaddff); g.fillEllipse(cx-4, cy-6, 30, 24);
    g.fillStyle(0x6699cc); g.fillEllipse(cx-20, cy-14, 16, 20); // 頭
    g.fillStyle(0x88bbdd); g.fillEllipse(cx-20, cy-14, 14, 18);
    cuteEye(g, cx-24, cy-16, 6, 0x0044aa);
    cuteEye(g, cx-16, cy-16, 6, 0x0044aa);
    g.fillStyle(0x44aadd); g.fillTriangle(cx-28,cy-22,cx-24,cy-28,cx-20,cy-22); // 耳
    g.fillStyle(0xaaddff); g.fillTriangle(cx-27,cy-23,cx-24,cy-27,cx-21,cy-23);
    g.fillStyle(0xcceeFF, 0.4);
    [[-8,0],[8,-4],[0,10],[-12,8]].forEach(([dx,dy]) => g.fillEllipse(cx+dx,cy+dy,8,5));
    fin(g, 'aw_blizzard_wolf', 80, 80);
  })();

  // フロストジャイアント: 氷の巨人
  (() => {
    const g = make(scene);
    const cx = 40, cy = 42;
    g.fillStyle(0x224466); g.fillRect(10, 8, 60, 68);
    g.fillStyle(0x336688); g.fillRect(12, 6, 56, 66);
    g.fillStyle(0x4488aa); g.fillRect(14, 8, 52, 62);
    g.fillStyle(0x66aacc, 0.5);
    [[0,0],[20,-10],[-20,10],[10,20]].forEach(([dx,dy]) =>
      g.fillEllipse(cx+dx,cy+dy,16,10));
    cuteEye(g, cx-10, cy-12, 9, 0x0088ff);
    cuteEye(g, cx+10, cy-12, 9, 0x0088ff);
    g.fillStyle(0x88ccee); g.fillTriangle(cx-4,cy-2,cx+4,cy-2,cx,cy+6);
    g.fillStyle(0x2255aa); g.fillRect(4, 6, 10, 30); g.fillRect(66, 6, 10, 30);
    fin(g, 'aw_frost_giant', 80, 80);
  })();

  // アイススペクター: 半透明の氷の霊
  (() => {
    const g = make(scene);
    const cx = 40, cy = 38;
    g.fillStyle(0x88ccee, 0.3); g.fillCircle(cx, cy, 30);
    g.fillStyle(0xaaddff, 0.5); g.fillCircle(cx, cy-2, 26);
    g.fillStyle(0xcceeFF, 0.6); g.fillCircle(cx, cy-4, 20);
    g.fillStyle(0xeef8ff, 0.7); g.fillCircle(cx, cy-6, 14);
    cuteEye(g, cx-8, cy-8, 8, 0x0066cc);
    cuteEye(g, cx+8, cy-8, 8, 0x0066cc);
    g.fillStyle(0xaaddff, 0.4);
    g.fillEllipse(cx-4, cy+62, 28, 22); g.fillEllipse(cx+4, cy+60, 20, 18);
    g.fillStyle(0x88ccee, 0.3);
    [-12,0,12].forEach(x => g.fillEllipse(cx+x, cy+74, 10, 14));
    fin(g, 'aw_ice_specter', 80, 80);
  })();

  // ── かみなりのせかい ───────────────────────────────────────
  // サンダービースト: 電撃を放つ獣
  (() => {
    const g = make(scene);
    const cx = 40, cy = 44;
    g.fillStyle(0x443300); g.fillEllipse(cx, cy+2, 50, 42);
    g.fillStyle(0xcc9900); g.fillEllipse(cx, cy, 48, 40);
    g.fillStyle(0xffdd00); g.fillEllipse(cx-4, cy-6, 32, 26);
    for (let i=0;i<6;i++) {
      g.fillStyle(0x221100, 0.7);
      g.fillRect(cx-24+i*8, cy-4, 3, 30);
    }
    cuteEye(g, cx-10, cy-10, 8, 0x6600aa);
    cuteEye(g, cx+10, cy-10, 8, 0x6600aa);
    g.fillStyle(0xffff00, 0.8);
    [[-18,-18],[-8,-24],[18,-18],[8,-24]].forEach(([dx,dy]) =>
      g.fillTriangle(cx+dx,cy+dy,cx+dx-4,cy+dy+12,cx+dx+4,cy+dy+12));
    fin(g, 'aw_thunder_beast', 80, 80);
  })();

  // ストームロード: 嵐の鎧武者
  (() => {
    const g = make(scene);
    const cx = 40, cy = 42;
    g.fillStyle(0x220044); g.fillRect(16, 10, 48, 66);
    g.fillStyle(0x440088); g.fillRect(18, 8, 44, 64);
    g.fillStyle(0x6600aa); g.fillRect(20, 6, 40, 34);   // 上半身
    g.fillStyle(0x330066); g.fillRect(20, 40, 40, 34);  // 下半身
    g.fillStyle(0x9933ff); g.fillRect(22, 8, 36, 30);   // 前面
    g.fillStyle(0xcc66ff, 0.6);
    [[0,-4],[12,0],[-12,0],[0,10]].forEach(([dx,dy]) =>
      g.fillEllipse(cx+dx,cy+dy,8,6));
    cuteEye(g, cx-8, cy-12, 8, 0xffff00);
    cuteEye(g, cx+8, cy-12, 8, 0xffff00);
    g.fillStyle(0xffff00, 0.9);
    g.fillRect(2, 30, 16, 4); g.fillRect(62, 30, 16, 4); // 稲妻の剣
    [-3,0,3].forEach(y => { g.fillStyle(0xddcc00,0.7); g.fillRect(2,30+y,14,2); });
    fin(g, 'aw_storm_lord', 80, 80);
  })();

  // ボルトヒドラ: 3つ頭の蛇
  (() => {
    const g = make(scene);
    const cx = 40, cy = 50;
    g.fillStyle(0x336600); g.fillEllipse(cx, cy, 44, 36);
    g.fillStyle(0x44aa00); g.fillEllipse(cx, cy-2, 40, 32);
    [[-16,-30],[0,-34],[16,-30]].forEach(([dx,dy]) => {
      g.fillStyle(0x336600); g.fillEllipse(cx+dx, cy+dy+2, 18, 22);
      g.fillStyle(0x44aa00); g.fillEllipse(cx+dx, cy+dy, 16, 20);
      cuteEye(g, cx+dx-4, cy+dy-4, 5, 0xffff00);
      cuteEye(g, cx+dx+4, cy+dy-4, 5, 0xffff00);
      g.fillStyle(0xffff00, 0.7); g.fillEllipse(cx+dx, cy+dy+6, 8, 4);
    });
    g.fillStyle(0xffff00, 0.5);
    [[0,-34],[-16,-30],[16,-30]].forEach(([dx,dy]) =>
      g.fillCircle(cx+dx, cy+dy-14, 5));
    fin(g, 'aw_volt_hydra', 80, 80);
  })();

  // ── みずのせかい ───────────────────────────────────────────
  // アビスクラーケン: 巨大タコ型
  (() => {
    const g = make(scene);
    const cx = 40, cy = 34;
    g.fillStyle(0x221155); g.fillCircle(cx, cy, 28);
    g.fillStyle(0x3333aa); g.fillCircle(cx, cy, 26);
    g.fillStyle(0x4444cc); g.fillCircle(cx, cy-2, 20);
    cuteEye(g, cx-10, cy-4, 9, 0xff4400);
    cuteEye(g, cx+10, cy-4, 9, 0xff4400);
    g.fillStyle(0x3333aa);
    [-30,-18,-6,6,18,30,24,-24].forEach((dx,i) => {
      const base = cy + 20;
      g.fillEllipse(cx+dx, base + (i%2)*10, 10, 22);
    });
    g.fillStyle(0x6666cc, 0.4);
    [-30,-18,-6,6,18,30].forEach(dx => g.fillEllipse(cx+dx,cy+26,8,16));
    fin(g, 'aw_abyss_kraken', 80, 80);
  })();

  // タイドレヴィアタン: 海の巨竜
  (() => {
    const g = make(scene);
    const cx = 40, cy = 40;
    g.fillStyle(0x002266); g.fillEllipse(cx, cy, 60, 40);
    g.fillStyle(0x003388); g.fillEllipse(cx, cy-2, 56, 36);
    g.fillStyle(0x0055aa); g.fillEllipse(cx-8, cy-8, 36, 26);
    g.fillStyle(0x002266); g.fillEllipse(cx-28, cy-2, 24, 18); // 頭
    g.fillStyle(0x003388); g.fillEllipse(cx-28, cy-4, 22, 16);
    cuteEye(g, cx-34, cy-6, 7, 0x00ffcc);
    cuteEye(g, cx-22, cy-6, 7, 0x00ffcc);
    g.fillStyle(0x0088cc); // フィン
    g.fillTriangle(cx+20, cy-20, cx+36, cy-36, cx+28, cy-6);
    g.fillTriangle(cx, cy+14, cx-10, cy+30, cx+10, cy+22);
    g.fillStyle(0x4499cc, 0.6);
    [0,12,24].forEach(i => g.fillEllipse(cx-10+i*6, cy, 8, 5));
    fin(g, 'aw_tide_leviathan', 80, 80);
  })();

  // コーラルゴーレム: 珊瑚の骨格
  (() => {
    const g = make(scene);
    const cx = 40, cy = 42;
    g.fillStyle(0x883300); g.fillRect(14, 12, 52, 62);
    g.fillStyle(0xcc5522); g.fillRect(16, 10, 48, 60);
    g.fillStyle(0xff7744); g.fillRect(18, 12, 44, 48);
    g.fillStyle(0xff9966, 0.6);
    [[cx-16,cy-14],[cx+16,cy-14],[cx,cy-28],[cx-22,cy+4],[cx+22,cy+4]].forEach(([x,y]) =>
      g.fillEllipse(x,y,14,10));
    cuteEye(g, cx-10, cy-10, 8, 0x00aaff);
    cuteEye(g, cx+10, cy-10, 8, 0x00aaff);
    g.fillStyle(0x0088ff, 0.4);
    [-18,0,18].forEach(dx => g.fillEllipse(cx+dx, cy+36, 10, 14));
    fin(g, 'aw_coral_golem', 80, 80);
  })();

  // ── そらのせかい ───────────────────────────────────────────
  // ヘブンナイト: 白銀の天空騎士
  (() => {
    const g = make(scene);
    const cx = 40, cy = 40;
    g.fillStyle(0x888899); g.fillRect(16, 10, 48, 66);
    g.fillStyle(0xaaaacc); g.fillRect(18, 8, 44, 64);
    g.fillStyle(0xddddff); g.fillRect(20, 6, 40, 38); // 上半身甲冑
    g.fillStyle(0xbbbbdd); g.fillRect(20, 44, 40, 30); // 下半身
    g.fillStyle(0xffffff); g.fillRect(28, 8, 24, 10);  // 顔
    cuteEye(g, cx-6, cy-22, 6, 0x4444ff);
    cuteEye(g, cx+6, cy-22, 6, 0x4444ff);
    g.fillStyle(0xffdd44); g.fillRect(cx-2, 8, 4, 56); // 光の剣
    g.fillStyle(0xffffff, 0.5); g.fillRect(cx-1, 10, 2, 52);
    g.fillStyle(0xeeeeff); // 翼
    g.fillTriangle(cx-20, cy-10, cx-50, cy-30, cx-16, cy+10);
    g.fillTriangle(cx+20, cy-10, cx+50, cy-30, cx+16, cy+10);
    g.fillStyle(0xffffff, 0.6);
    g.fillTriangle(cx-20, cy-10, cx-44, cy-26, cx-18, cy+8);
    g.fillTriangle(cx+20, cy-10, cx+44, cy-26, cx+18, cy+8);
    fin(g, 'aw_heaven_knight', 80, 80);
  })();

  // スカイタイタン: 空の巨人
  (() => {
    const g = make(scene);
    const cx = 40, cy = 40;
    g.fillStyle(0x336699); g.fillRect(8, 4, 64, 72);
    g.fillStyle(0x5588bb); g.fillRect(10, 2, 60, 70);
    g.fillStyle(0x88aadd); g.fillRect(12, 4, 56, 42); // 上半身
    g.fillStyle(0x4466aa); g.fillRect(12, 46, 56, 28); // 下半身
    g.fillStyle(0x99ccee, 0.5);
    [[0,-6],[16,2],[-16,2],[0,12],[12,-14],[-12,-14]].forEach(([dx,dy]) =>
      g.fillCircle(cx+dx,cy+dy,7));
    cuteEye(g, cx-10, cy-16, 9, 0xffffff);
    cuteEye(g, cx+10, cy-16, 9, 0xffffff);
    g.fillStyle(0xaaccff); g.fillEllipse(cx,cy-28,30,12); // 雲冠
    fin(g, 'aw_sky_titan', 80, 80);
  })();

  // ウィンドサーペント: 風の翼竜
  (() => {
    const g = make(scene);
    const cx = 40, cy = 42;
    g.fillStyle(0x228844); g.fillEllipse(cx, cy, 34, 54);
    g.fillStyle(0x44bb66); g.fillEllipse(cx-2, cy-2, 30, 50);
    g.fillStyle(0x66dd88); g.fillEllipse(cx-4, cy-4, 22, 38);
    g.fillStyle(0x228844); // 翼
    g.fillTriangle(cx-16, cy-10, cx-50, cy-30, cx-14, cy+10);
    g.fillTriangle(cx+16, cy-10, cx+50, cy-30, cx+14, cy+10);
    g.fillStyle(0x44bb66);
    g.fillTriangle(cx-16, cy-10, cx-44, cy-26, cx-14, cy+8);
    g.fillTriangle(cx+16, cy-10, cx+44, cy-26, cx+14, cy+8);
    cuteEye(g, cx-8, cy-18, 7, 0x88ff44);
    cuteEye(g, cx+8, cy-18, 7, 0x88ff44);
    g.fillStyle(0xaaffcc, 0.5);
    [0,10,20].forEach(i => g.fillCircle(cx+10+i, cy-30+i*2, 5));
    fin(g, 'aw_wind_serpent', 80, 80);
  })();

  // ── えんじぇるしょうがっこう ──────────────────────────────
  // ダークエンジェル: 半黒の堕天使
  (() => {
    const g = make(scene);
    const cx = 40, cy = 40;
    g.fillStyle(0x220033); g.fillEllipse(cx, cy, 32, 44);
    g.fillStyle(0x553366); g.fillEllipse(cx, cy-2, 28, 40);
    g.fillStyle(0xddbbff); g.fillEllipse(cx, cy-8, 20, 26); // 顔
    cuteEye(g, cx-6, cy-12, 7, 0xff0088);
    cuteEye(g, cx+6, cy-12, 7, 0xff0088);
    g.fillStyle(0x110022); // 黒翼
    g.fillTriangle(cx-14, cy-4, cx-56, cy-20, cx-12, cy+14);
    g.fillStyle(0xffffff, 0.8); // 白翼
    g.fillTriangle(cx+14, cy-4, cx+56, cy-20, cx+12, cy+14);
    g.fillStyle(0xffffff, 0.4); // ハロー
    g.fillEllipse(cx, cy-30, 30, 8);
    g.lineStyle(2, 0xffdd00); g.strokeEllipse(cx, cy-30, 30, 8);
    fin(g, 'aw_dark_angel', 80, 80);
  })();

  // ゴーレムせんせい: 石の先生
  (() => {
    const g = make(scene);
    const cx = 40, cy = 42;
    g.fillStyle(0x666666); g.fillRect(12, 6, 56, 70);
    g.fillStyle(0x888888); g.fillRect(14, 4, 52, 68);
    g.fillStyle(0xaaaaaa); g.fillRect(16, 6, 48, 30); // 上半身
    g.fillStyle(0x999999); g.fillRect(16, 36, 48, 38); // 下半身
    g.fillStyle(0xbbbbbb); g.fillRect(18, 6, 44, 20); // 顔
    cuteEye(g, cx-10, cy-28, 8, 0x4444ff);
    cuteEye(g, cx+10, cy-28, 8, 0x4444ff);
    g.fillStyle(0x333333); g.fillRect(22, 4, 36, 4);    // メガネ上
    g.fillStyle(0x4444ff, 0.7); g.fillRect(24, 4, 12, 6); g.fillRect(42, 4, 12, 6);
    g.fillStyle(0xffffff); // チョーク
    g.fillRect(cx + 22, cy - 18, 14, 4);
    fin(g, 'aw_golem_teacher', 80, 80);
  })();

  // シャドウせいと: 影の生徒
  (() => {
    const g = make(scene);
    const cx = 40, cy = 42;
    g.fillStyle(0x111122, 0.8); g.fillRect(18, 8, 44, 68);
    g.fillStyle(0x223355, 0.9); g.fillRect(20, 6, 40, 66);
    g.fillStyle(0x334466); g.fillRect(22, 8, 36, 30); // 上半身
    g.fillStyle(0x222244); g.fillRect(22, 38, 36, 36); // 下半身
    g.fillStyle(0x445577); g.fillRect(22, 8, 36, 16); // 顔
    cuteEye(g, cx-8, cy-30, 6, 0xff4444);
    cuteEye(g, cx+8, cy-30, 6, 0xff4444);
    g.fillStyle(0x0000aa, 0.5);
    g.fillRect(cx-20, cy-4, 6, 20); g.fillRect(cx+14, cy-4, 6, 20); // 腕
    g.fillStyle(0x334466, 0.4); g.fillEllipse(cx, cy+46, 30, 8); // 影
    fin(g, 'aw_shadow_student', 80, 80);
  })();

  // ── やみのせかい ───────────────────────────────────────────
  // ヴォイドリーパー: 虚無の死神
  (() => {
    const g = make(scene);
    const cx = 40, cy = 44;
    g.fillStyle(0x0a000f); g.fillEllipse(cx, cy, 34, 60);
    g.fillStyle(0x220033); g.fillEllipse(cx, cy-2, 30, 56);
    g.fillStyle(0x440055); g.fillEllipse(cx-4, cy-10, 22, 38);
    g.fillStyle(0x110022); // 大きいマント
    g.fillTriangle(cx-16, cy, cx-50, cy+30, cx+50, cy+30);
    g.fillTriangle(cx+16, cy, cx-44, cy+32, cx+44, cy+32);
    cuteEye(g, cx-7, cy-18, 7, 0xff00ff);
    cuteEye(g, cx+7, cy-18, 7, 0xff00ff);
    g.fillStyle(0x880099, 0.8); // 鎌
    g.fillRect(cx+14, cy-40, 4, 60);
    g.fillStyle(0x660077); g.fillEllipse(cx+26, cy-38, 30, 12);
    g.fillStyle(0xaa00cc, 0.6); g.fillEllipse(cx+26, cy-38, 24, 8);
    fin(g, 'aw_void_reaper', 80, 80);
  })();

  // ナイトメアウルフ: 悪夢の狼
  (() => {
    const g = make(scene);
    const cx = 40, cy = 44;
    g.fillStyle(0x220000); g.fillEllipse(cx+2, cy+2, 50, 42);
    g.fillStyle(0x440011); g.fillEllipse(cx, cy, 48, 40);
    g.fillStyle(0x660022); g.fillEllipse(cx-4, cy-6, 34, 28);
    g.fillStyle(0x440022); g.fillEllipse(cx-20, cy-14, 20, 24); // 頭
    g.fillStyle(0x550033); g.fillEllipse(cx-20, cy-14, 18, 22);
    cuteEye(g, cx-25, cy-18, 7, 0xff0000);
    cuteEye(g, cx-15, cy-18, 7, 0xff0000);
    g.fillStyle(0x330011); g.fillTriangle(cx-28,cy-24,cx-24,cy-30,cx-20,cy-24); // 耳
    g.fillStyle(0xff0000, 0.3);
    [[-8,0],[8,-4],[0,10],[-12,8]].forEach(([dx,dy]) => g.fillEllipse(cx+dx,cy+dy,10,6));
    fin(g, 'aw_nightmare_wolf', 80, 80);
  })();

  // シャドウコロッサス: 影の大魔人
  (() => {
    const g = make(scene);
    const cx = 40, cy = 40;
    g.fillStyle(0x050005); g.fillRect(6, 2, 68, 76);
    g.fillStyle(0x110011); g.fillRect(8, 0, 64, 74);
    g.fillStyle(0x220022); g.fillRect(10, 2, 60, 44); // 上半身
    g.fillStyle(0x110011); g.fillRect(10, 46, 60, 32); // 下半身
    g.fillStyle(0x440044); g.fillRect(18, 4, 44, 28);  // 前面上半身
    cuteEye(g, cx-10, cy-18, 10, 0x9900ff);
    cuteEye(g, cx+10, cy-18, 10, 0x9900ff);
    g.fillStyle(0x660066, 0.5);
    [[0,-4],[14,2],[-14,2],[0,10]].forEach(([dx,dy]) =>
      g.fillEllipse(cx+dx,cy+dy,12,8));
    g.fillStyle(0x330033); // 巨腕
    g.fillRect(0, 20, 10, 36); g.fillRect(70, 20, 10, 36);
    g.fillStyle(0x220022);
    g.fillRect(-4, 20, 10, 36); g.fillRect(74, 20, 10, 36);
    fin(g, 'aw_shadow_colossus', 80, 80);
  })();

  // ── レアモンスター ──────────────────────────────────────────
  // くろいドラゴン: 伝説の黒龍
  (() => {
    const g = make(scene);
    const cx = 40, cy = 44;
    g.fillStyle(0x080010); g.fillEllipse(cx, cy+2, 52, 62);
    g.fillStyle(0x110022); g.fillEllipse(cx, cy,   50, 60);
    g.fillStyle(0x220033); g.fillEllipse(cx, cy-4, 40, 48);
    g.fillStyle(0x080010); // 翼
    g.fillTriangle(cx-20, cy-10, cx-70, cy-30, cx-18, cy+16);
    g.fillTriangle(cx+20, cy-10, cx+70, cy-30, cx+18, cy+16);
    g.fillStyle(0x1a0028);
    g.fillTriangle(cx-20, cy-10, cx-62, cy-28, cx-18, cy+14);
    g.fillTriangle(cx+20, cy-10, cx+62, cy-28, cx+18, cy+14);
    cuteEye(g, cx-10, cy-14, 9, 0xff0000);
    cuteEye(g, cx+10, cy-14, 9, 0xff0000);
    g.fillStyle(0x440000, 0.8); // 鱗
    [[-12,4],[4,0],[-4,14],[10,10]].forEach(([dx,dy]) =>
      g.fillEllipse(cx+dx,cy+dy,12,7));
    g.fillStyle(0x330000); g.fillTriangle(cx-2, cy-30, cx-6, cy-22, cx+2, cy-22);
    fin(g, 'aw_black_dragon', 80, 80);
  })();

  // ゴールドスライム: コイン色のスライム
  (() => {
    const g = make(scene);
    const cx = 40, cy = 44;
    g.fillStyle(0xaa8800); g.fillEllipse(cx, cy+2, 52, 48);
    g.fillStyle(0xddaa00); g.fillEllipse(cx, cy, 50, 46);
    g.fillStyle(0xffdd00); g.fillEllipse(cx-2, cy-4, 42, 38);
    g.fillStyle(0xffee44); g.fillEllipse(cx-6, cy-10, 28, 22);
    cuteEye(g, cx-10, cy-8, 8, 0xff8800);
    cuteEye(g, cx+10, cy-8, 8, 0xff8800);
    g.fillStyle(0xffcc00, 0.6);
    [[-14,2],[6,-6],[-2,10],[12,4],[-8,-4]].forEach(([dx,dy]) =>
      g.fillCircle(cx+dx,cy+dy,5));
    bodyHighlight(g, cx-10, cy-12, 18);
    fin(g, 'aw_coin_slime', 80, 80);
  })();

  // けいけんちのゆうれい: 経験値の霊
  (() => {
    const g = make(scene);
    const cx = 40, cy = 36;
    g.fillStyle(0x8888cc, 0.3); g.fillEllipse(cx, cy, 34, 40);
    g.fillStyle(0xaaaaee, 0.5); g.fillEllipse(cx, cy-2, 30, 36);
    g.fillStyle(0xccccff, 0.65); g.fillEllipse(cx, cy-4, 24, 28);
    g.fillStyle(0xeeeeff, 0.7); g.fillEllipse(cx, cy-6, 18, 20);
    cuteEye(g, cx-7, cy-8, 7, 0x6666ff);
    cuteEye(g, cx+7, cy-8, 7, 0x6666ff);
    g.fillStyle(0xaaaaff, 0.4);
    g.fillEllipse(cx-6, cy+60, 26, 18); g.fillEllipse(cx+6, cy+58, 20, 16);
    [-10,0,10].forEach(x => g.fillEllipse(cx+x, cy+68, 8, 12));
    // 本を持つ
    g.fillStyle(0x4444aa); g.fillRect(cx+10, cy+8, 18, 14);
    g.fillStyle(0x6666cc); g.fillRect(cx+10, cy+8, 18, 14);
    g.fillStyle(0xffffff, 0.8); g.fillRect(cx+12, cy+10, 7, 10); g.fillRect(cx+21, cy+10, 5, 10);
    fin(g, 'aw_exp_ghost', 80, 80);
  })();

  // ── やみのていおう（ラスボス第2形態）─────────────────────
  (() => {
    const g = make(scene);
    const cx = 40, cy = 40;
    g.fillStyle(0x0a0010); g.fillRect(2, 0, 76, 78);
    g.fillStyle(0x150020); g.fillRect(4, 0, 72, 76);
    g.fillStyle(0x250035); g.fillRect(8, 4, 64, 52);   // 上半身
    g.fillStyle(0x150020); g.fillRect(8, 56, 64, 24);  // 下半身
    g.fillStyle(0x400060); g.fillRect(16, 6, 48, 36);  // 前面
    g.fillStyle(0x660099); g.fillRect(24, 8, 32, 22);  // 顔
    cuteEye(g, cx-10, cy-20, 10, 0xff0000);
    cuteEye(g, cx+10, cy-20, 10, 0xff0000);
    g.fillStyle(0x0a0010); // 翼（巨大）
    g.fillTriangle(cx-22, cy-4, cx-80, cy-50, cx-18, cy+24);
    g.fillTriangle(cx+22, cy-4, cx+80, cy-50, cx+18, cy+24);
    g.fillStyle(0x200030);
    g.fillTriangle(cx-22, cy-4, cx-70, cy-45, cx-18, cy+22);
    g.fillTriangle(cx+22, cy-4, cx+70, cy-45, cx+18, cy+22);
    g.fillStyle(0x9900ff, 0.6); // オーラ
    [-24,0,24].forEach(dx => g.fillEllipse(cx+dx, cy+40, 12, 16));
    g.fillStyle(0x6600cc, 0.4);
    g.fillRect(6, 0, 68, 78);   // 薄い影レイヤー
    g.fillStyle(0xff0066, 0.15);
    [[-14,10],[14,10],[0,20]].forEach(([dx,dy]) => g.fillCircle(cx+dx,cy+dy,8));
    // 王冠
    g.fillStyle(0x220033);
    [-20,-10,0,10,20].forEach((dx,i) => {
      const h = i%2===0 ? 14 : 8;
      g.fillRect(cx+dx-3, cy-38, 6, h);
    });
    g.fillStyle(0x9900ff, 0.8);
    g.fillRect(cx-24, cy-24, 48, 4);
    fin(g, 'aw_yami_no_teiou', 80, 80);
  })();
}
