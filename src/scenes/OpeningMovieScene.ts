import Phaser from 'phaser';
import { getState } from '../state/playerState';

// {NAME} は再生時に主人公の名前に置き換わる
const SHOT_TEMPLATES: { file: string; caption: string }[] = [
  { file: 'shot01', caption: 'いつもとかわらないせかい。' },
  { file: 'shot02', caption: 'とあるよふけに、とつぜんいんせきがふってきました。' },
  { file: 'shot03', caption: 'つぎのひのあさ、なぜかおとなにはみえないモンスターたちがあらわれました。' },
  { file: 'shot04', caption: '{NAME}は、モンスターであるくろすけにであいます。' },
  { file: 'shot05', caption: 'くろすけ「このせかいが、わるいひとにかえられてしまっている。このままだとせかいがあぶない」' },
  { file: 'shot06', caption: 'そうして、{NAME}はせかいをまもるためはしりだした。' },
  { file: 'shot07', caption: 'さあ、モンスターとのぼうけんが　はじまるよ！' },
];

export class OpeningMovieScene extends Phaser.Scene {
  private videoEl: HTMLVideoElement | null = null;
  private captionEl: HTMLDivElement | null = null;
  private skipEl: HTMLDivElement | null = null;
  private skipped = false;

  constructor() { super('OpeningMovieScene'); }

  create(): void {
    this.skipped = false;

    // スペースキーでスキップ
    this.input.keyboard?.on('keydown-SPACE', () => this.doSkip());

    // Canvas 領域に HTML overlay を作成してから再生開始
    this.buildOverlay();
    this.playShot(0);
  }

  /** Canvas の BoundingRect にぴったり重なる video/caption/skip を DOM に作る */
  private buildOverlay(): void {
    const rect = this.game.canvas.getBoundingClientRect();

    // ── 動画要素 ──
    const vid = document.createElement('video');
    vid.playsInline = true;
    vid.setAttribute('playsinline', ''); // iOS 対応
    vid.style.cssText = `
      position: fixed;
      left: ${rect.left}px;
      top: ${rect.top}px;
      width: ${rect.width}px;
      height: ${rect.height}px;
      object-fit: contain;
      background: #000;
      z-index: 800;
      display: block;
    `;
    document.body.appendChild(vid);
    this.videoEl = vid;

    // ── テロップ要素（動画の下部に重ねる） ──
    const cap = document.createElement('div');
    const capFontSize = Math.max(14, Math.round(rect.height * 0.038));
    cap.style.cssText = `
      position: fixed;
      left: ${rect.left}px;
      bottom: ${window.innerHeight - rect.bottom + Math.round(rect.height * 0.06)}px;
      width: ${rect.width}px;
      text-align: center;
      font-size: ${capFontSize}px;
      font-family: 'Klee One', 'Hiragino Kaku Gothic ProN', 'Yu Gothic', sans-serif;
      color: #ffffff;
      text-shadow: 1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000,
                   0 2px 8px rgba(0,0,0,0.9);
      z-index: 801;
      padding: 6px 12px;
      background: linear-gradient(transparent, rgba(0,0,0,0.55));
      line-height: 1.5;
      letter-spacing: 0.04em;
      pointer-events: none;
    `;
    document.body.appendChild(cap);
    this.captionEl = cap;

    // ── スキップボタン ──
    const skip = document.createElement('div');
    const skipFontSize = Math.max(14, Math.round(rect.height * 0.034));
    skip.textContent = 'スキップ ▶';
    skip.style.cssText = `
      position: fixed;
      right: ${window.innerWidth - rect.right + Math.round(rect.width * 0.03)}px;
      bottom: ${window.innerHeight - rect.bottom + Math.round(rect.height * 0.025)}px;
      font-size: ${skipFontSize}px;
      font-family: 'Klee One', 'Hiragino Kaku Gothic ProN', 'Yu Gothic', sans-serif;
      color: #ffffff;
      background: rgba(0,0,0,0.55);
      border: 1px solid rgba(255,255,255,0.4);
      border-radius: 6px;
      padding: 6px 16px;
      cursor: pointer;
      z-index: 802;
      user-select: none;
    `;
    skip.addEventListener('pointerdown', () => this.doSkip());
    document.body.appendChild(skip);
    this.skipEl = skip;
  }

  private playShot(index: number): void {
    if (this.skipped) return;
    if (index >= SHOT_TEMPLATES.length) {
      this.goToOpening();
      return;
    }

    const shot = SHOT_TEMPLATES[index];
    const playerName = getState().name || 'あなた';
    const caption = shot.caption.replace(/\{NAME\}/g, playerName);
    const vid = this.videoEl!;

    // テロップ更新
    if (this.captionEl) this.captionEl.textContent = caption;

    // 前のリスナーをすべて外す
    const newVid = vid.cloneNode(false) as HTMLVideoElement;
    vid.parentNode?.replaceChild(newVid, vid);
    this.videoEl = newVid;
    newVid.playsInline = true;
    newVid.setAttribute('playsinline', '');

    const next = () => this.playShot(index + 1);

    // 12 秒ガード（ストール対策）
    const guardId = setTimeout(next, 12000);
    const clearGuard = () => clearTimeout(guardId);

    newVid.addEventListener('ended', () => { clearGuard(); next(); }, { once: true });
    newVid.addEventListener('error', () => {
      console.warn(`OpeningMovie: ${shot.file} をスキップ（エラー）`);
      clearGuard(); next();
    }, { once: true });

    newVid.src = `opening/${shot.file}.mp4`;
    newVid.load();
    newVid.play().catch(() => {
      // autoplay ブロック時はユーザー操作待ちにしてスキップで回避
      console.warn(`OpeningMovie: autoplay blocked for ${shot.file}`);
    });
  }

  private doSkip(): void {
    if (this.skipped) return;
    this.skipped = true;
    this.videoEl?.pause();
    this.goToOpening();
  }

  private goToOpening(): void {
    this.removeOverlay();
    this.scene.start('OpeningScene');
  }

  private removeOverlay(): void {
    this.videoEl?.pause();
    [this.videoEl, this.captionEl, this.skipEl].forEach(el => el?.parentNode?.removeChild(el));
    this.videoEl = null;
    this.captionEl = null;
    this.skipEl = null;
  }

  shutdown(): void {
    this.removeOverlay();
  }
}
