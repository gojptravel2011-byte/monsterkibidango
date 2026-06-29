import Phaser from 'phaser';
import { hasSaveData, loadGame } from '../systems/save';
import { BGM } from '../systems/bgm';
import { T } from '../ui/theme';
import { TS } from '../ui/StyledText';
import { makeBtn } from '../ui/Panel';

export class TitleScene extends Phaser.Scene {
  constructor() { super('TitleScene'); }

  create(): void {
    const w = this.scale.width;
    const h = this.scale.height;

    // 夜空背景
    this.add.rectangle(w / 2, h / 2, w, h, T.panelDark);

    // 星 ×60
    for (let i = 0; i < 60; i++) {
      this.add.circle(
        Math.random() * w,
        Math.random() * h * 0.75,
        Math.random() * 1.5 + 0.5,
        T.borderGold,
        Math.random() * 0.5 + 0.1,
      );
    }

    // 地面（下1/4 緑）
    this.add.rectangle(w / 2, h * 0.875, w, h * 0.25, 0x336622);

    // タイトル
    this.add.text(w / 2, h * 0.22, 'モンスター', {
      ...TS.heading,
      fontSize: '48px',
      color: T.textGold,
      stroke: '#050b1a',
      strokeThickness: 5,
    }).setOrigin(0.5);

    this.add.text(w / 2, h * 0.33, 'きびだんご', {
      ...TS.heading,
      fontSize: '56px',
      color: '#ff9933',
      stroke: '#050b1a',
      strokeThickness: 5,
    }).setOrigin(0.5);

    // サブタイトル
    this.add.text(w / 2, h * 0.38, 'いっしょに　ぼうけんしよう', {
      ...TS.sub,
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
      ...TS.sub,
    }).setOrigin(1, 1);
  }

  private makeButton(x: number, y: number, label: string, cb: () => void): void {
    const bg = makeBtn(this, x, y, 280, 60)
      .setInteractive({ useHandCursor: true });
    this.add.text(x, y, label, {
      ...TS.btn,
    }).setOrigin(0.5);

    bg.on('pointerover', () => bg.setFillStyle(0x2a4090));
    bg.on('pointerout', () => bg.setFillStyle(T.panelMid));
    bg.on('pointerdown', cb);
  }
}
