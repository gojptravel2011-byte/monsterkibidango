import Phaser from 'phaser';
import { TS } from '../ui/StyledText';

const SHOTS = ['shot01', 'shot02', 'shot03', 'shot04', 'shot05', 'shot06', 'shot07'];

export class OpeningMovieScene extends Phaser.Scene {
  private vid: Phaser.GameObjects.Video | null = null;
  private skipped = false;

  constructor() { super('OpeningMovieScene'); }

  create(): void {
    const { width: w, height: h } = this.scale;

    this.add.rectangle(w / 2, h / 2, w, h, 0x000000).setDepth(0);

    // スキップボタン（右下）
    const skipTxt = this.add.text(w - 20, h - 28, 'スキップ ▶', {
      ...TS.body,
      color: '#ffffff',
      backgroundColor: '#00000099',
      padding: { x: 18, y: 10 },
    }).setOrigin(1, 1).setDepth(100).setInteractive({ useHandCursor: true });

    skipTxt.on('pointerdown', () => this.doSkip());

    // スペースキーでもスキップ
    this.input.keyboard?.on('keydown-SPACE', () => this.doSkip());

    // ボタン以外の画面タップでスキップ
    this.input.on('pointerdown', (_ptr: Phaser.Input.Pointer, objs: Phaser.GameObjects.GameObject[]) => {
      if (objs.length === 0) this.doSkip();
    });

    this.skipped = false;
    this.playShot(0);
  }

  private playShot(index: number): void {
    if (this.skipped) return;
    if (index >= SHOTS.length) {
      this.goToOpening();
      return;
    }

    const { width: w, height: h } = this.scale;

    // 前のビデオを破棄
    if (this.vid) {
      this.vid.stop();
      this.vid.destroy();
      this.vid = null;
    }

    const url = `opening/${SHOTS[index]}.mp4`;
    const vid = this.add.video(w / 2, h / 2).setDepth(1);
    vid.setDisplaySize(w, h);
    this.vid = vid;

    const next = () => { this.playShot(index + 1); };

    vid.once('complete', next);
    vid.once('error', () => {
      console.warn(`OpeningMovie: ${SHOTS[index]} をスキップ（読み込みエラー）`);
      next();
    });

    // タイムアウト保険（動画が止まったまま進まなくなるのを防ぐ）
    const guard = this.time.delayedCall(12000, next);
    vid.once('complete', () => guard.remove());
    vid.once('error',    () => guard.remove());

    try {
      vid.loadURL(url, false);
      vid.play(false);
    } catch {
      next();
    }
  }

  private doSkip(): void {
    if (this.skipped) return;
    this.skipped = true;
    this.vid?.stop();
    this.goToOpening();
  }

  private goToOpening(): void {
    this.scene.start('OpeningScene');
  }

  // シーン破棄時にビデオを確実に停止
  shutdown(): void {
    this.vid?.stop();
    this.vid = null;
  }
}
