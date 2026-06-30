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

    // タイトルBGM：ボタン押下時にユーザー操作として init → play
    // （ブラウザの Autoplay 制限は「ユーザー操作のイベントハンドラ内」でのみ解除できる）
    const startBgm = () => {
      BGM.init();   // AudioContext 生成 or resume（ユーザー操作内なので running になる）
      BGM.play('title');
    };

    this.makeButton(w / 2, h * 0.60, 'はじめから', () => {
      startBgm();
      this.scene.start('NameInputScene');
    });

    if (hasSaveData()) {
      this.makeButton(w / 2, h * 0.75, 'つづきから', () => {
        startBgm();
        if (loadGame()) {
          this.scene.start('MapScene');
        }
      });
    }

    this.add.text(w - 10, h - 10, '© 2025', {
      ...TS.sub,
    }).setOrigin(1, 1).setDepth(2);
  }

  private bgVideoResizeHandler: (() => void) | null = null;

  private startBgVideo(): void {
    const canvas = this.game.canvas;

    const vid = document.createElement('video');
    vid.src = 'opening/shot07.mp4';
    vid.loop = true;
    vid.muted = true;          // ミュートで自動再生（ブラウザ制限回避）
    vid.playsInline = true;
    vid.setAttribute('playsinline', '');
    vid.style.cssText = `
      position: fixed;
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

    // canvas は Scale.FIT のレイアウト確定が create() 直後にまだ済んでいないことがあるため、
    // 都度 canvas の実際の表示矩形に追従させる（リサイズ・URLバー開閉・初回レイアウト確定）
    const sync = () => {
      if (!this.bgVideoEl) return;
      const rect = canvas.getBoundingClientRect();
      this.bgVideoEl.style.left = `${rect.left}px`;
      this.bgVideoEl.style.top = `${rect.top}px`;
      this.bgVideoEl.style.width = `${rect.width}px`;
      this.bgVideoEl.style.height = `${rect.height}px`;
    };
    sync();
    requestAnimationFrame(sync);
    this.scale.on('resize', sync);
    window.addEventListener('resize', sync);
    window.addEventListener('orientationchange', sync);
    this.bgVideoResizeHandler = sync;
  }

  private removeBgVideo(): void {
    if (this.bgVideoResizeHandler) {
      this.scale.off('resize', this.bgVideoResizeHandler);
      window.removeEventListener('resize', this.bgVideoResizeHandler);
      window.removeEventListener('orientationchange', this.bgVideoResizeHandler);
      this.bgVideoResizeHandler = null;
    }
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
