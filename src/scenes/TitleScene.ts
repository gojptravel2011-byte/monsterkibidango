import Phaser from 'phaser';
import { hasSaveData, loadGame } from '../systems/save';
import { BGM } from '../systems/bgm';
import { T } from '../ui/theme';
import { TS } from '../ui/StyledText';
import { makeBtn } from '../ui/Panel';

export class TitleScene extends Phaser.Scene {
  private bgVideoEl: HTMLVideoElement | null = null;

  constructor() { super('TitleScene'); }

  create(): void {
    const w = this.scale.width;
    const h = this.scale.height;

    // shot07 をループ動画背景として配置（HTML要素、ミュート自動再生）
    this.startBgVideo();

    // タイトルテキスト（動画の上に重ねる）
    this.add.text(w / 2, h * 0.22, 'モンスター', {
      ...TS.heading,
      fontSize: '52px',
      color: T.textGold,
      stroke: '#050b1a',
      strokeThickness: 6,
    }).setOrigin(0.5).setDepth(2);

    this.add.text(w / 2, h * 0.33, 'きびだんご', {
      ...TS.heading,
      fontSize: '60px',
      color: '#ff9933',
      stroke: '#050b1a',
      strokeThickness: 6,
    }).setOrigin(0.5).setDepth(2);

    this.add.text(w / 2, h * 0.40, 'いっしょに　ぼうけんしよう', {
      ...TS.sub,
    }).setOrigin(0.5).setDepth(2);

    this.makeButton(w / 2, h * 0.60, 'はじめから', () => {
      this.scene.start('NameInputScene');
    });

    if (hasSaveData()) {
      this.makeButton(w / 2, h * 0.75, 'つづきから', () => {
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

    this.add.text(w - 10, h - 10, '© 2025', {
      ...TS.sub,
    }).setOrigin(1, 1).setDepth(2);
  }

  private startBgVideo(): void {
    const canvas = this.game.canvas;
    const rect = canvas.getBoundingClientRect();

    const vid = document.createElement('video');
    vid.src = 'opening/shot07.mp4';
    vid.loop = true;
    vid.muted = true;          // ミュートで自動再生（ブラウザ制限回避）
    vid.playsInline = true;
    vid.setAttribute('playsinline', '');
    vid.style.cssText = `
      position: fixed;
      left: ${rect.left}px;
      top: ${rect.top}px;
      width: ${rect.width}px;
      height: ${rect.height}px;
      object-fit: contain;
      background: #000011;
      z-index: -1;
      display: block;
    `;
    // canvas より背面（canvas は z-index デフォルト 0 なので -1 で背後に）
    canvas.style.background = 'transparent';
    canvas.style.position = 'relative';
    canvas.style.zIndex = '0';

    document.body.appendChild(vid);
    vid.play().catch(() => {/* autoplay blocked: 背景なしで続行 */});
    this.bgVideoEl = vid;
  }

  private removeBgVideo(): void {
    if (this.bgVideoEl) {
      this.bgVideoEl.pause();
      this.bgVideoEl.parentNode?.removeChild(this.bgVideoEl);
      this.bgVideoEl = null;
    }
  }

  private makeButton(x: number, y: number, label: string, cb: () => void): void {
    const bg = makeBtn(this, x, y, 300, 64, { depth: 2 })
      .setInteractive({ useHandCursor: true });
    this.add.text(x, y, label, {
      ...TS.btn,
      fontSize: '30px',
    }).setOrigin(0.5).setDepth(3);

    bg.on('pointerover', () => bg.setFillStyle(0x2a4090));
    bg.on('pointerout', () => bg.setFillStyle(T.panelMid));
    bg.on('pointerdown', cb);
  }

  shutdown(): void {
    this.removeBgVideo();
  }
}
