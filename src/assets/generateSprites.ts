import Phaser from 'phaser';

// すべてのスプライトをPhaser Graphicsで生成してテクスチャ化する
// 本番素材に差し替える場合は BootScene の preload() で実際の画像をロードし
// generateAllSprites() の呼び出しを削除するだけでよい

export function generateAllSprites(scene: Phaser.Scene): void {
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
function make(scene: Phaser.Scene): Phaser.GameObjects.Graphics {
  return scene.make.graphics({ x: 0, y: 0 });
}
function fin(g: Phaser.GameObjects.Graphics, key: string, w: number, h: number): void {
  g.generateTexture(key, w, h);
  g.destroy();
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
  frame: 0 | 1 | 2; // 0=idle, 1=左足前, 2=右足前
}

function drawChar(g: Phaser.GameObjects.Graphics, o: CharOpts): void {
  // フレームによる脚・腕オフセット
  const lLegY = o.frame === 1 ? 49 : o.frame === 2 ? 43 : 46;
  const rLegY = o.frame === 1 ? 43 : o.frame === 2 ? 49 : 46;
  const lLegX = o.frame === 1 ? 11 : o.frame === 2 ? 17 : 14;
  const rLegX = o.frame === 1 ? 27 : o.frame === 2 ? 22 : 25;
  const bodyY  = o.frame === 0 ? 26 : 24; // 歩き中は体が少し上がる
  const lArmY  = o.frame === 1 ? 32 : o.frame === 2 ? 24 : 28;
  const rArmY  = o.frame === 1 ? 24 : o.frame === 2 ? 32 : 28;

  // 脚
  g.fillStyle(o.pantsColor);
  g.fillRect(lLegX, lLegY, 9, 16);
  g.fillRect(rLegX, rLegY, 9, 16);
  // 靴
  g.fillStyle(o.shoeColor);
  g.fillRect(lLegX - 2, lLegY + 12, 13, 6);
  g.fillRect(rLegX - 2, rLegY + 12, 13, 6);
  // 体
  g.fillStyle(o.shirtColor); g.fillRect(10, bodyY, 28, 22);
  // 腕（肌）
  g.fillStyle(o.skinColor);
  g.fillRect(2, lArmY, 9, 8);
  g.fillRect(37, rArmY, 9, 8);
  // 袖
  g.fillStyle(o.shirtColor);
  g.fillRect(2, lArmY, 9, 5);
  g.fillRect(37, rArmY, 9, 5);
  // 首
  g.fillStyle(o.skinColor); g.fillRect(19, bodyY - 6, 10, 8);
  // 頭
  g.fillStyle(o.skinColor); g.fillCircle(24, 14, 13);
  // 髪
  g.fillStyle(o.hairColor);
  switch (o.hairStyle) {
    case 'short':
      g.fillCircle(24, 5, 11); g.fillRect(12, 5, 24, 10);
      g.fillRect(10, 10, 6, 6); g.fillRect(32, 10, 6, 6);
      break;
    case 'bun':
      g.fillCircle(24, 6, 9); g.fillRect(13, 6, 22, 9);
      g.fillCircle(16, 2, 6); g.fillCircle(32, 2, 6); // お団子
      break;
    case 'pigtail':
      g.fillCircle(24, 6, 9); g.fillRect(13, 6, 22, 9);
      g.fillEllipse(7, 15, 10, 22);  // 左ツインテ
      g.fillEllipse(41, 15, 10, 22); // 右ツインテ
      break;
    case 'spiky':
      g.fillCircle(24, 6, 9); g.fillRect(13, 6, 22, 9);
      g.fillTriangle(14, 6, 10, -4, 20, 2);
      g.fillTriangle(22, 4, 19, -5, 28, 1);
      g.fillTriangle(32, 6, 27, -3, 36, 2);
      break;
    case 'long':
      g.fillCircle(24, 6, 9); g.fillRect(13, 6, 22, 9);
      g.fillRect(10, 9, 8, 28); // 左の長い髪
      g.fillRect(30, 9, 8, 28); // 右の長い髪
      break;
  }
  // 目
  g.fillStyle(0x000000); g.fillCircle(19, 14, 3); g.fillCircle(29, 14, 3);
  g.fillStyle(0xffffff); g.fillCircle(20, 13, 1); g.fillCircle(30, 13, 1);
  // ほっぺ
  g.fillStyle(0xffaaaa, 0.6); g.fillCircle(14, 17, 4); g.fillCircle(34, 17, 4);
  // 口
  g.fillStyle(0xcc6655); g.fillRect(21, 20, 6, 2);
  // 眼鏡（先生）
  if (o.glasses) {
    g.fillStyle(0x888866);
    g.fillRect(13, 12, 9, 1); g.fillRect(13, 17, 9, 1);
    g.fillRect(13, 12, 1, 6); g.fillRect(22, 12, 1, 6);
    g.fillRect(24, 12, 9, 1); g.fillRect(24, 17, 9, 1);
    g.fillRect(24, 12, 1, 6); g.fillRect(33, 12, 1, 6);
    g.fillRect(22, 14, 3, 1); // ブリッジ
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
  // 後方互換（バトル画面などで使用）
  const g2 = make(scene);
  drawChar(g2, { ...opts, frame: 0 });
  fin(g2, 'player', 48, 64);
}

// ---- 先生（NPC 48×64） ----
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

// ---- 生徒：がく（NPC 48×64） ----
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

// ---- 生徒：りつ（NPC 48×64） ----
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

// ---- 生徒：そうと（NPC 48×64） ----
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

// ---- 生徒：かや（NPC 48×64） ----
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

// ---- クロスケ（黒シュナウザー犬 64×72） ----
function genKurosuke(scene: Phaser.Scene): void {
  const g = make(scene);

  // ---- 体（黒・どっしり） ----
  g.fillStyle(0x1a1a22);
  g.fillEllipse(32, 50, 38, 30);
  g.fillRect(13, 38, 38, 18);

  // ---- 足（4本） ----
  g.fillStyle(0x111118);
  g.fillRect(14, 56, 10, 14); // 左前
  g.fillRect(40, 56, 10, 14); // 右前
  g.fillRect(17, 58, 9, 12);  // 左後（少し内側）
  g.fillRect(38, 58, 9, 12);  // 右後
  // 足先（白っぽい）
  g.fillStyle(0xcccccc);
  g.fillRect(14, 66, 10, 4); g.fillRect(40, 66, 10, 4);
  g.fillRect(17, 66, 9, 4);  g.fillRect(38, 66, 9, 4);

  // ---- 頭（四角っぽい・シュナウザー特有） ----
  g.fillStyle(0x1a1a22);
  g.fillRect(14, 10, 36, 32);        // 頭の四角ベース
  g.fillCircle(20, 16, 10);          // 左丸み
  g.fillCircle(44, 16, 10);          // 右丸み
  g.fillRect(14, 16, 36, 26);        // 補完

  // ---- 垂れ耳（シュナウザーらしい折れた耳） ----
  g.fillStyle(0x111118);
  g.fillEllipse(14, 20, 14, 22);     // 左耳（垂れ下がる）
  g.fillEllipse(50, 20, 14, 22);     // 右耳
  // 耳の内側（暗め）
  g.fillStyle(0x2a1a2a);
  g.fillEllipse(14, 22, 8, 14);
  g.fillEllipse(50, 22, 8, 14);

  // ---- 鼻先（マズル：シュナウザーは四角く突き出る） ----
  g.fillStyle(0x333344);
  g.fillRect(20, 30, 24, 18);        // マズル本体
  g.fillCircle(20, 39, 5); g.fillCircle(44, 39, 5); // 角の丸み

  // ---- ひげ（シュナウザー最大の特徴：もじゃもじゃひげ） ----
  g.fillStyle(0xd0d0d0);
  // ひげの塊（ふさふさ感）
  g.fillEllipse(32, 44, 28, 12);
  g.fillCircle(22, 44, 7); g.fillCircle(32, 46, 7); g.fillCircle(42, 44, 7);
  g.fillCircle(26, 47, 6); g.fillCircle(38, 47, 6);
  // ひげの毛束感
  g.fillStyle(0xbbbbbb);
  g.fillEllipse(32, 43, 22, 8);
  g.fillCircle(24, 43, 5); g.fillCircle(40, 43, 5);

  // ---- 眉毛（シュナウザー最大の特徴その2：ぼうぼう眉） ----
  g.fillStyle(0xaaaaaa);
  // 左眉
  g.fillEllipse(22, 21, 16, 7);
  g.fillCircle(16, 22, 5); g.fillCircle(28, 21, 5);
  // 右眉
  g.fillEllipse(42, 21, 16, 7);
  g.fillCircle(36, 21, 5); g.fillCircle(48, 22, 5);
  // 眉のハイライト（白っぽい毛）
  g.fillStyle(0xdddddd);
  g.fillEllipse(22, 20, 10, 4);
  g.fillEllipse(42, 20, 10, 4);

  // ---- 目（眉の下に隠れ気味・シュナウザーらしい） ----
  g.fillStyle(0x111100); g.fillCircle(22, 27, 5); g.fillCircle(42, 27, 5);
  g.fillStyle(0x553300); g.fillCircle(22, 27, 4); g.fillCircle(42, 27, 4);
  g.fillStyle(0xffffff); g.fillCircle(24, 25, 2); g.fillCircle(44, 25, 2);

  // ---- 鼻（黒・四角っぽい） ----
  g.fillStyle(0x111111);
  g.fillEllipse(32, 32, 12, 8);
  g.fillStyle(0x333333); g.fillCircle(28, 31, 3); g.fillCircle(36, 31, 3);
  // 鼻のハイライト
  g.fillStyle(0x666666); g.fillCircle(30, 30, 2);

  // しっぽ（断尾されたシュナウザーらしい短いしっぽ）
  g.fillStyle(0x1a1a22);
  g.fillRect(50, 40, 8, 6);
  g.fillStyle(0xdddddd); g.fillRect(56, 40, 4, 4);

  fin(g, 'monster_kurosuke', 64, 72);
}

// ---- ぴよん（黄色ひよこ 64×64） ----
function genPiyon(scene: Phaser.Scene): void {
  const g = make(scene);
  // 体（黄色の丸）
  g.fillStyle(0xffdd22); g.fillCircle(32, 36, 22);
  // 頭
  g.fillStyle(0xffee44); g.fillCircle(32, 18, 16);
  // 羽（両サイド）
  g.fillStyle(0xffcc00);
  g.fillEllipse(10, 36, 14, 24);
  g.fillEllipse(54, 36, 14, 24);
  // 目
  g.fillStyle(0x111100); g.fillCircle(27, 16, 3); g.fillCircle(37, 16, 3);
  g.fillStyle(0xffffff); g.fillCircle(26, 15, 1); g.fillCircle(36, 15, 1);
  // くちばし（オレンジ三角）
  g.fillStyle(0xff8800); g.fillTriangle(27, 22, 37, 22, 32, 30);
  // 足
  g.fillStyle(0xff8800);
  g.fillRect(22, 56, 6, 8); g.fillRect(36, 56, 6, 8);
  // 足指
  g.fillRect(18, 61, 12, 3); g.fillRect(32, 61, 12, 3);
  // ほっぺ
  g.fillStyle(0xffaaaa, 0.5); g.fillCircle(22, 20, 4); g.fillCircle(42, 20, 4);
  fin(g, 'monster_piyon', 64, 64);
}

// ---- みずぼん（水のしずく 64×64） ----
function genMizubon(scene: Phaser.Scene): void {
  const g = make(scene);
  // 水滴の本体（青楕円）
  g.fillStyle(0x2288ff); g.fillEllipse(32, 40, 44, 48);
  // 上部の先端
  g.fillStyle(0x2288ff); g.fillTriangle(22, 28, 42, 28, 32, 4);
  // 光沢（白の楕円）
  g.fillStyle(0xffffff, 0.5); g.fillEllipse(24, 26, 12, 18);
  g.fillStyle(0xffffff, 0.3); g.fillEllipse(20, 20, 6, 10);
  // 目
  g.fillStyle(0x003388); g.fillCircle(25, 38, 5); g.fillCircle(39, 38, 5);
  g.fillStyle(0xffffff); g.fillCircle(27, 36, 2); g.fillCircle(41, 36, 2);
  // 口（にこにこ）
  g.fillStyle(0x003388); g.fillEllipse(32, 48, 16, 6);
  g.fillStyle(0x2288ff); g.fillRect(26, 44, 12, 4);
  // 気泡
  g.fillStyle(0xaaddff, 0.6);
  g.fillCircle(8, 30, 4); g.fillCircle(4, 20, 3); g.fillCircle(56, 35, 5); g.fillCircle(60, 22, 3);
  fin(g, 'monster_mizubon', 64, 64);
}

// ---- ほのん（炎のせいれい 64×64） ----
function genHonon(scene: Phaser.Scene): void {
  const g = make(scene);
  // 外炎（赤）
  g.fillStyle(0xff2200);
  g.fillTriangle(32, 2, 8, 44, 56, 44);
  g.fillTriangle(20, 10, 2, 52, 42, 38);
  g.fillTriangle(44, 10, 62, 52, 22, 38);
  g.fillCircle(32, 44, 20);
  // 中炎（オレンジ）
  g.fillStyle(0xff7700);
  g.fillTriangle(32, 10, 14, 46, 50, 46);
  g.fillCircle(32, 44, 16);
  // 内炎（黄）
  g.fillStyle(0xffdd00);
  g.fillTriangle(32, 20, 20, 46, 44, 46);
  g.fillCircle(32, 46, 10);
  // コア（白）
  g.fillStyle(0xffffcc); g.fillCircle(32, 48, 5);
  // 目
  g.fillStyle(0xffffff); g.fillCircle(25, 38, 5); g.fillCircle(39, 38, 5);
  g.fillStyle(0xff4400); g.fillCircle(25, 38, 3); g.fillCircle(39, 38, 3);
  g.fillStyle(0xffffff); g.fillCircle(24, 37, 1); g.fillCircle(38, 37, 1);
  // 眉（強そう）
  g.fillStyle(0xff2200); g.fillRect(20, 32, 10, 3); g.fillRect(34, 32, 10, 3);
  fin(g, 'monster_honon', 64, 64);
}

// ---- くさぐみ（草むら生物 64×64） ----
function genKusagumi(scene: Phaser.Scene): void {
  const g = make(scene);
  // 体（緑の丸）
  g.fillStyle(0x33aa33); g.fillCircle(32, 40, 22);
  // 葉っぱ（頭の上）
  g.fillStyle(0x22cc22);
  g.fillTriangle(32, 4, 20, 22, 44, 22);
  g.fillTriangle(20, 8, 8, 24, 32, 20);
  g.fillTriangle(44, 8, 56, 24, 32, 20);
  g.fillTriangle(10, 18, 2, 36, 26, 28);
  g.fillTriangle(54, 18, 62, 36, 38, 28);
  // 葉脈
  g.fillStyle(0x118811);
  g.fillRect(31, 6, 2, 16); g.fillRect(19, 10, 2, 12); g.fillRect(43, 10, 2, 12);
  // 目
  g.fillStyle(0x115511); g.fillCircle(25, 40, 5); g.fillCircle(39, 40, 5);
  g.fillStyle(0xffffff); g.fillCircle(27, 38, 2); g.fillCircle(41, 38, 2);
  // 口（にっこり）
  g.fillStyle(0x115511); g.fillEllipse(32, 50, 14, 6);
  g.fillStyle(0x33aa33); g.fillRect(26, 47, 12, 4);
  // 足（小さい）
  g.fillStyle(0x228822); g.fillRect(20, 59, 10, 5); g.fillRect(34, 59, 10, 5);
  fin(g, 'monster_kusagumi', 64, 64);
}

// ---- いわごん（岩の精 64×64） ----
function genIwagon(scene: Phaser.Scene): void {
  const g = make(scene);
  // 体（灰色の塊）
  g.fillStyle(0x888877);
  // メインボディ（六角形っぽく）
  g.fillRect(14, 20, 36, 38);
  g.fillRect(8, 28, 48, 22);
  // 頭
  g.fillStyle(0x999988); g.fillRect(16, 8, 32, 20);
  g.fillRect(10, 12, 44, 12);
  // 岩のひび
  g.fillStyle(0x666655);
  g.fillRect(20, 16, 3, 20); g.fillRect(34, 22, 3, 16); g.fillRect(28, 38, 2, 14);
  g.fillRect(12, 30, 14, 2); g.fillRect(40, 34, 12, 2);
  // 目（赤くて厳しい）
  g.fillStyle(0xcc2200); g.fillRect(18, 14, 10, 8); g.fillRect(36, 14, 10, 8);
  g.fillStyle(0xff4400); g.fillRect(20, 15, 6, 5); g.fillRect(38, 15, 6, 5);
  g.fillStyle(0xffffff); g.fillRect(21, 15, 2, 2); g.fillRect(39, 15, 2, 2);
  // 眉（ゴツい）
  g.fillStyle(0x555544); g.fillRect(16, 11, 14, 4); g.fillRect(34, 11, 14, 4);
  // 口（への字）
  g.fillStyle(0x555544); g.fillRect(20, 30, 24, 3);
  g.fillRect(20, 30, 3, 8); g.fillRect(41, 30, 3, 8);
  // 腕（ゴツい）
  g.fillStyle(0x888877);
  g.fillRect(0, 24, 12, 20); g.fillRect(52, 24, 12, 20);
  g.fillStyle(0x666655);
  g.fillRect(0, 24, 12, 3); g.fillRect(52, 24, 12, 3);
  // 足
  g.fillStyle(0x777766); g.fillRect(14, 56, 14, 8); g.fillRect(36, 56, 14, 8);
  fin(g, 'monster_iwagon', 64, 64);
}

// ---- かぜぽん（風の精 64×64） ----
function genKazepon(scene: Phaser.Scene): void {
  const g = make(scene);
  // 半透明の風の渦（水色）
  g.fillStyle(0xaaeeff, 0.6);
  g.fillCircle(32, 32, 26);
  // 渦巻き（濃い青）
  g.fillStyle(0x44aadd);
  g.fillEllipse(32, 32, 40, 20);
  g.fillEllipse(32, 26, 24, 14);
  g.fillStyle(0x88ddff);
  g.fillEllipse(32, 30, 16, 10);
  // 尻尾（風の流れ）
  g.fillStyle(0xaaeeff, 0.5);
  g.fillEllipse(58, 20, 20, 8);
  g.fillEllipse(62, 30, 16, 6);
  g.fillEllipse(56, 40, 18, 6);
  g.fillEllipse(6, 20, 16, 6);
  g.fillEllipse(2, 32, 14, 5);
  // 体の中心
  g.fillStyle(0x66ccee); g.fillCircle(32, 30, 14);
  // 目（澄んだ青）
  g.fillStyle(0xffffff); g.fillCircle(26, 28, 5); g.fillCircle(38, 28, 5);
  g.fillStyle(0x0066aa); g.fillCircle(26, 28, 3); g.fillCircle(38, 28, 3);
  g.fillStyle(0xffffff); g.fillCircle(25, 27, 1); g.fillCircle(37, 27, 1);
  // 口（〜）
  g.fillStyle(0x0088bb);
  g.fillEllipse(32, 36, 12, 4);
  g.fillStyle(0x66ccee); g.fillRect(26, 34, 12, 3);
  fin(g, 'monster_kazepon', 64, 64);
}

// ---- でんこん（電気ネズミ 64×64） ----
function genDenkon(scene: Phaser.Scene): void {
  const g = make(scene);
  // 尻尾（稲妻型）
  g.fillStyle(0xffcc00);
  g.fillTriangle(46, 52, 56, 36, 62, 46);
  g.fillTriangle(56, 36, 60, 22, 64, 34);
  // 体
  g.fillStyle(0xffee00); g.fillCircle(28, 38, 22);
  // 頭
  g.fillStyle(0xffdd00); g.fillCircle(30, 20, 18);
  // 耳（黒縁の三角）
  g.fillStyle(0xffdd00);
  g.fillTriangle(16, 10, 10, -2, 28, 8);
  g.fillTriangle(44, 10, 50, -2, 32, 8);
  g.fillStyle(0xff4466);
  g.fillTriangle(18, 9, 13, 1, 26, 8);
  g.fillTriangle(42, 9, 47, 1, 34, 8);
  // ほっぺ（赤い電気マーク）
  g.fillStyle(0xff2244, 0.8);
  g.fillCircle(18, 22, 5); g.fillCircle(42, 22, 5);
  // 目
  g.fillStyle(0x110000); g.fillCircle(26, 18, 4); g.fillCircle(36, 18, 4);
  g.fillStyle(0xffffff); g.fillCircle(25, 17, 1); g.fillCircle(35, 17, 1);
  // 口（W型）
  g.fillStyle(0x110000);
  g.fillTriangle(24, 24, 28, 30, 32, 24);
  g.fillTriangle(32, 24, 36, 30, 40, 24);
  // 腕・足
  g.fillStyle(0xffcc00);
  g.fillRect(4, 36, 10, 8); g.fillRect(44, 36, 10, 8);
  g.fillRect(16, 56, 10, 8); g.fillRect(32, 56, 10, 8);
  fin(g, 'monster_denkon', 64, 64);
}

// ---- 装飾スプライト ----

// genTree: 木 56×80
function genTree(scene: Phaser.Scene): void {
  const g = make(scene);
  // 幹（茶色）
  g.fillStyle(0x885522); g.fillRect(22, 50, 12, 30);
  // 葉（緑の円3つ）
  g.fillStyle(0x338822); g.fillCircle(28, 40, 18);
  g.fillStyle(0x449933); g.fillCircle(16, 50, 14);
  g.fillStyle(0x449933); g.fillCircle(40, 50, 14);
  fin(g, 'deco_tree', 56, 80);
}

// genHouse: 家 96×112
function genHouse(scene: Phaser.Scene): void {
  const g = make(scene);
  // 壁（クリーム）
  g.fillStyle(0xfff0cc); g.fillRect(8, 48, 80, 64);
  // 屋根（赤い三角）
  g.fillStyle(0xcc3322); g.fillTriangle(48, 4, 0, 52, 96, 52);
  // 窓 ×2
  g.fillStyle(0xaaddff); g.fillRect(14, 60, 24, 20); g.fillRect(58, 60, 24, 20);
  g.fillStyle(0x888888); g.fillRect(14, 60, 24, 2); g.fillRect(14, 60, 2, 20);
  g.fillStyle(0x888888); g.fillRect(58, 60, 24, 2); g.fillRect(58, 60, 2, 20);
  // ドア（茶）
  g.fillStyle(0x885533); g.fillRect(36, 80, 24, 32);
  g.fillStyle(0xffcc44); g.fillCircle(57, 96, 3);
  fin(g, 'deco_house', 96, 112);
}

// genLamp: 街灯 20×56
function genLamp(scene: Phaser.Scene): void {
  const g = make(scene);
  // ポール（黒）
  g.fillStyle(0x222222); g.fillRect(8, 16, 4, 40);
  // ランプ（黄の楕円）
  g.fillStyle(0xffee44); g.fillEllipse(10, 12, 16, 14);
  // ベース（灰）
  g.fillStyle(0x888888); g.fillRect(4, 50, 12, 6);
  fin(g, 'deco_lamp', 20, 56);
}

// genTorii: 鳥居 80×96
function genTorii(scene: Phaser.Scene): void {
  const g = make(scene);
  // 柱2本（赤）
  g.fillStyle(0xcc2200); g.fillRect(6, 24, 14, 72); g.fillRect(60, 24, 14, 72);
  // 笠木（上の横棒）
  g.fillStyle(0xcc2200); g.fillRect(0, 8, 80, 12);
  // 貫（下の横棒）
  g.fillStyle(0xcc2200); g.fillRect(4, 28, 72, 10);
  fin(g, 'deco_torii', 80, 96);
}

// genShopFront: 商店 96×80
function genShopFront(scene: Phaser.Scene): void {
  const g = make(scene);
  // 壁（クリーム）
  g.fillStyle(0xfff0cc); g.fillRect(0, 20, 96, 60);
  // 看板（ダーク）
  g.fillStyle(0x443322); g.fillRect(0, 0, 96, 24);
  // ストライプ模様
  g.fillStyle(0xff4444, 0.5);
  for (let i = 0; i < 6; i++) {
    g.fillRect(i * 16, 0, 8, 24);
  }
  // ドア
  g.fillStyle(0x885533); g.fillRect(36, 44, 24, 36);
  fin(g, 'deco_shopfront', 96, 80);
}

// genSchool: 学校 200×160
function genSchool(scene: Phaser.Scene): void {
  const g = make(scene);
  // 壁（白）
  g.fillStyle(0xffffff); g.fillRect(10, 40, 180, 120);
  // 屋上フロア（灰）
  g.fillStyle(0xcccccc); g.fillRect(10, 30, 180, 14);
  // 旗ポール
  g.fillStyle(0x888888); g.fillRect(95, 4, 4, 30);
  g.fillStyle(0xff4444); g.fillRect(99, 4, 20, 14);
  // グリッド窓
  g.fillStyle(0xaaddff);
  for (let row = 0; row < 2; row++) {
    for (let col = 0; col < 4; col++) {
      g.fillRect(20 + col * 44, 54 + row * 44, 30, 28);
    }
  }
  // 入口アーチ
  g.fillStyle(0xdddddd); g.fillRect(80, 120, 40, 40);
  g.fillStyle(0xaaaaaa); g.fillEllipse(100, 120, 40, 20);
  fin(g, 'deco_school', 200, 160);
}

// genCloud: 雲 80×40
function genCloud(scene: Phaser.Scene): void {
  const g = make(scene);
  g.fillStyle(0xffffff);
  g.fillEllipse(40, 26, 50, 28);
  g.fillEllipse(22, 28, 36, 24);
  g.fillEllipse(58, 28, 36, 24);
  g.fillEllipse(32, 18, 34, 26);
  g.fillEllipse(50, 16, 30, 24);
  fin(g, 'deco_cloud', 80, 40);
}

// genFlower: 花 24×28
function genFlower(scene: Phaser.Scene): void {
  const g = make(scene);
  // 茎（緑）
  g.fillStyle(0x44aa22); g.fillRect(11, 14, 3, 14);
  // 花びら5枚（ピンク）
  g.fillStyle(0xff99cc);
  g.fillCircle(12, 8, 5);
  g.fillCircle(18, 12, 5);
  g.fillCircle(16, 19, 5);
  g.fillCircle(8, 19, 5);
  g.fillCircle(6, 12, 5);
  // 中心（黄）
  g.fillStyle(0xffee00); g.fillCircle(12, 14, 5);
  fin(g, 'deco_flower', 24, 28);
}

// genBench: ベンチ 48×24
function genBench(scene: Phaser.Scene): void {
  const g = make(scene);
  // 座面（茶）
  g.fillStyle(0x885533); g.fillRect(0, 6, 48, 8);
  // 脚2本
  g.fillStyle(0x664422); g.fillRect(4, 14, 6, 10); g.fillRect(38, 14, 6, 10);
  fin(g, 'deco_bench', 48, 24);
}

// ---- やみのぬし（ラスボス 80×96） ----
function genRasuboss(scene: Phaser.Scene): void {
  const g = make(scene);
  // 暗いオーラ（外側）
  g.fillStyle(0x220033, 0.4);
  g.fillCircle(40, 50, 38);
  // マント（紫黒）
  g.fillStyle(0x330044);
  g.fillTriangle(40, 8, 2, 80, 78, 80);
  g.fillTriangle(40, 8, 0, 60, 30, 30);
  g.fillTriangle(40, 8, 80, 60, 50, 30);
  // マントのハイライト
  g.fillStyle(0x660088);
  g.fillTriangle(40, 12, 6, 74, 40, 74);
  g.fillTriangle(40, 12, 74, 74, 40, 74);
  // 体（暗い楕円）
  g.fillStyle(0x1a0022); g.fillEllipse(40, 50, 44, 56);
  // 頭
  g.fillStyle(0x220033); g.fillCircle(40, 24, 22);
  // 角（2本）
  g.fillStyle(0x440055);
  g.fillTriangle(28, 12, 20, -4, 36, 6);
  g.fillTriangle(52, 12, 60, -4, 44, 6);
  // 目（赤く光る）
  g.fillStyle(0xff0000); g.fillEllipse(32, 22, 12, 10); g.fillEllipse(48, 22, 12, 10);
  g.fillStyle(0xff6600); g.fillEllipse(32, 22, 8, 6); g.fillEllipse(48, 22, 8, 6);
  g.fillStyle(0xffff00); g.fillCircle(32, 22, 2); g.fillCircle(48, 22, 2);
  // 目のオーラ
  g.fillStyle(0xff0000, 0.3);
  g.fillCircle(32, 22, 10); g.fillCircle(48, 22, 10);
  // 口（歯をむいた）
  g.fillStyle(0x110000); g.fillRect(28, 30, 24, 8);
  g.fillStyle(0xffffff);
  for (let i = 0; i < 5; i++) g.fillTriangle(28 + i * 5, 30, 31 + i * 5, 30, 29 + i * 5, 38);
  // 手（爪）
  g.fillStyle(0x330044);
  g.fillRect(0, 46, 16, 10); g.fillRect(64, 46, 16, 10);
  // 爪
  g.fillStyle(0xaa00cc);
  g.fillTriangle(0, 46, 4, 38, 8, 46);
  g.fillTriangle(6, 46, 10, 38, 14, 46);
  g.fillTriangle(64, 46, 68, 38, 72, 46);
  g.fillTriangle(70, 46, 74, 38, 78, 46);
  fin(g, 'monster_rasuboss', 80, 96);
}
