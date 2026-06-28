import Phaser from 'phaser';
import { generateAllSprites } from '../assets/generateSprites';

// 起動時にスプライトテクスチャを生成してからタイトルへ進む
export class BootScene extends Phaser.Scene {
  constructor() { super('BootScene'); }

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
