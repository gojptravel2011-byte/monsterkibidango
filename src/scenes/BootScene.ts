import Phaser from 'phaser';
import { generateAllSprites } from '../assets/generateSprites';

// 起動時にスプライトテクスチャを生成してからタイトルへ進む
export class BootScene extends Phaser.Scene {
  constructor() { super('BootScene'); }

  preload(): void {
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

    // プレイヤーウォークアニメーション
    this.anims.create({
      key: 'player_walk',
      frames: [
        { key: 'player_f0' },
        { key: 'player_f1' },
        { key: 'player_f0' },
        { key: 'player_f2' },
      ],
      frameRate: 7,
      repeat: -1,
    });
    this.anims.create({
      key: 'player_idle',
      frames: [{ key: 'player_f0' }],
      frameRate: 1,
      repeat: -1,
    });

    this.scene.start('TitleScene');
  }
}
