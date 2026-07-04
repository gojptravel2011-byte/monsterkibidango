import Phaser from 'phaser';

// hero_sheet.png: 2列(フレーム) × 8行のスプライトシートだが、実際に描き分けられているのは
// 「うしろ向き(1行目=up)」「よこ向き(3行目=left)」「まえ向き(6行目=down)」の3ポーズのみ。
// upleft/upright はうしろ向きを、right/downleft/downright はよこ向きを流用し、
// 右方向はよこ向きポーズを左右反転(flipX)することで表現する。
export type HeroDir = 'upleft' | 'up' | 'upright' | 'left' | 'right' | 'downleft' | 'down' | 'downright';

export const HERO_DIRS: HeroDir[] = ['upleft', 'up', 'upright', 'left', 'right', 'downleft', 'down', 'downright'];

// 各方向 → 実際に使うシート行番号 と 左右反転の要否
const DIR_SOURCE: Record<HeroDir, { row: number; flip: boolean }> = {
  upleft:    { row: 1, flip: false },
  up:        { row: 1, flip: false },
  upright:   { row: 1, flip: false },
  left:      { row: 3, flip: false },
  right:     { row: 3, flip: true },
  downleft:  { row: 3, flip: false },
  down:      { row: 6, flip: false },
  downright: { row: 3, flip: true },
};

export const HERO_SHEET_KEY = 'hero_sheet';

// 同じ行を共有する方向は同じアニメーションキーを使い回す
export function heroWalkAnimKey(dir: HeroDir): string { return `hero_walk_row${DIR_SOURCE[dir].row}`; }
export function heroIdleAnimKey(dir: HeroDir): string { return `hero_idle_row${DIR_SOURCE[dir].row}`; }

// 移動中の方向キー(上下左右)から8方向を判定
export function resolveHeroDir(up: boolean, down: boolean, left: boolean, right: boolean): HeroDir | null {
  if (up && left) return 'upleft';
  if (up && right) return 'upright';
  if (down && left) return 'downleft';
  if (down && right) return 'downright';
  if (up) return 'up';
  if (down) return 'down';
  if (left) return 'left';
  if (right) return 'right';
  return null;
}

// BootSceneで一度だけ呼ぶ：実在する3ポーズ分のwalk/idleアニメーションを登録
export function createHeroAnims(scene: Phaser.Scene): void {
  const rows = new Set(Object.values(DIR_SOURCE).map(s => s.row));
  rows.forEach(row => {
    const f0 = row * 2;
    const f1 = row * 2 + 1;
    scene.anims.create({
      key: `hero_walk_row${row}`,
      frames: [
        { key: HERO_SHEET_KEY, frame: f0 },
        { key: HERO_SHEET_KEY, frame: f1 },
      ],
      frameRate: 6,
      repeat: -1,
    });
    scene.anims.create({
      key: `hero_idle_row${row}`,
      frames: [{ key: HERO_SHEET_KEY, frame: f0 }],
      frameRate: 1,
      repeat: -1,
    });
  });
}

// ←→↙↘ の4方向は歩行アニメを使わず、その方向を向いた1コマの静止フレームのみ表示する
const STATIC_DIRS: HeroDir[] = ['left', 'right', 'downleft', 'downright'];

// 移動時に呼ぶ：方向が変わった/待機→歩行に変わった時だけアニメを切り替える
export function playHeroWalk(sprite: Phaser.GameObjects.Sprite, dir: HeroDir): void {
  const { row, flip } = DIR_SOURCE[dir];
  sprite.setFlipX(flip);
  if (STATIC_DIRS.includes(dir)) {
    sprite.anims.stop();
    sprite.setFrame(row * 2);
    return;
  }
  const key = heroWalkAnimKey(dir);
  if (sprite.anims.currentAnim?.key !== key) sprite.play(key);
}

export function playHeroIdle(sprite: Phaser.GameObjects.Sprite, dir: HeroDir): void {
  const key = heroIdleAnimKey(dir);
  sprite.setFlipX(DIR_SOURCE[dir].flip);
  if (sprite.anims.currentAnim?.key !== key) sprite.play(key);
}
