import Phaser from 'phaser';
import { generateAllSprites } from '../assets/generateSprites';
import { createHeroAnims, HERO_SHEET_KEY } from '../systems/heroAnim';

// 起動時にスプライトテクスチャを生成してからタイトルへ進む
export class BootScene extends Phaser.Scene {
  constructor() { super('BootScene'); }

  preload(): void {
    // 主人公スプライトシート（64×64セル相当 / 2フレーム × 8方向）
    this.load.spritesheet(HERO_SHEET_KEY, 'hero_walk.png', { frameWidth: 256, frameHeight: 258 });

    // 実画像を先にロード（generateSprites側でexistsチェックしてスキップ）
    const realSprites: [string, string][] = [
      ['monster_kurosuke',   'monster_kurosuke.png'],
      ['monster_kusagumi',   'monster_kusagumi.png'],
      ['monster_mizubon',    'monster_mizupon.png'],   // ミズボン
      ['monster_honon',      'monster_honon.png'],
      ['monster_dragon',     'monster_dragon.png'],
      ['monster_iwagon',     'monster_iwagon.png'],
      ['aw_black_dragon',    'monster_black_dragon.png'],
      ['kodai_dragon',       'monster_kodai_dragon.png'],
      ['monster_rasuboss',   'monster_yami_nushi.png'],
      ['aw_yami_no_teiou',   'monster_yami_teiou.png'],
    ];
    for (const [key, file] of realSprites) {
      this.load.image(key, file);
    }
  }

  create(): void {
    generateAllSprites(this);

    // 主人公: 8方向 walk/idle アニメーション
    createHeroAnims(this);

    // 他画面(バトル/図鑑/おせわ)で使う代表アイコン用の静止テクスチャ「player」
    // （下向き・フレーム0を切り出して固定テクスチャ化）
    const downFrame0 = 6 * 2; // HERO_DIRS 内 'down' の行番号(6) × 2フレーム
    const frame = this.textures.getFrame(HERO_SHEET_KEY, downFrame0);
    const tmp = this.add.image(0, 0, HERO_SHEET_KEY, downFrame0).setOrigin(0, 0).setVisible(false);
    const rt = this.make.renderTexture({ width: frame.width, height: frame.height }, false);
    rt.draw(tmp, 0, 0);
    rt.saveTexture('player');
    rt.destroy();
    tmp.destroy();

    this.scene.start('TitleScene');
  }
}
