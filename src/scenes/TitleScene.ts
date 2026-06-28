import Phaser from 'phaser';
import { hasSaveData, loadGame } from '../systems/save';
import { BGM } from '../systems/bgm';

export class TitleScene extends Phaser.Scene {
  constructor() { super('TitleScene'); }

  create(): void {
    const w = this.scale.width;
    const h = this.scale.height;

    // 夜空背景
    this.add.rectangle(w / 2, h / 2, w, h, 0x000022);

    // 星 ×60
    for (let i = 0; i < 60; i++) {
      this.add.circle(
        Math.random() * w,
        Math.random() * h * 0.75,
        Math.random() * 1.5 + 0.5,
        0xffffff,
        Math.random() * 0.8 + 0.2,
      );
    }

    // 地面（下1/4 緑）
    this.add.rectangle(w / 2, h * 0.875, w, h * 0.25, 0x336622);

    // タイトル
    this.add.text(w / 2, h * 0.22, 'モンスター', {
      fontSize: '40px',
      color: '#ffff44',
      fontFamily: 'sans-serif',
      stroke: '#000044',
      strokeThickness: 5,
    }).setOrigin(0.5);

    this.add.text(w / 2, h * 0.33, 'きびだんご', {
      fontSize: '48px',
      color: '#ff8800',
      fontFamily: 'sans-serif',
      stroke: '#440000',
      strokeThickness: 5,
    }).setOrigin(0.5);

    // サブタイトル
    this.add.text(w / 2, h * 0.38, 'いっしょに　ぼうけんしよう', {
      fontSize: '18px',
      color: '#44ffff',
      fontFamily: 'sans-serif',
    }).setOrigin(0.5);

    this.makeButton(w / 2, h * 0.58, 'はじめから', () => {
      this.scene.start('NameInputScene');
    });

    if (hasSaveData()) {
      this.makeButton(w / 2, h * 0.73, 'つづきから', () => {
        if (loadGame()) {
          this.scene.start('MapScene');
        }
      });
    }

    // タップ時にBGM初期化（ブラウザのAutoplay制限対応）
    this.input.once('pointerdown', () => {
      BGM.init();
      BGM.play('title');
    });

    // コピーライト
    this.add.text(w - 10, h - 10, '© 2025', {
      fontSize: '12px',
      color: '#888888',
      fontFamily: 'sans-serif',
    }).setOrigin(1, 1);
  }

  private makeButton(x: number, y: number, label: string, cb: () => void): void {
    const bg = this.add.rectangle(x, y, 280, 60, 0x3355aa)
      .setStrokeStyle(4, 0xaaaaff)
      .setInteractive({ useHandCursor: true });
    const text = this.add.text(x, y, label, {
      fontSize: '24px',
      color: '#ffffff',
      fontFamily: 'sans-serif',
    }).setOrigin(0.5);

    bg.on('pointerover', () => bg.setFillStyle(0x6688ee));
    bg.on('pointerout', () => bg.setFillStyle(0x3355aa));
    bg.on('pointerdown', cb);
  }
}
