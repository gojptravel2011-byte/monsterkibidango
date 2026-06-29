import Phaser from 'phaser';
import { getState } from '../state/playerState';

export class NameInputScene extends Phaser.Scene {
  private nameInput!: HTMLInputElement;

  constructor() { super('NameInputScene'); }

  create(): void {
    const w = this.scale.width;
    const h = this.scale.height;

    this.add.rectangle(w / 2, h / 2, w, h, 0x112244);

    this.add.text(w / 2, h * 0.2, 'なまえを　いれてね！', {
      fontSize: '34px',
      color: '#ffffff',
      fontFamily: 'sans-serif',
    }).setOrigin(0.5);

    // HTML input を重ねる（キャンバスのスケール・位置に合わせる）
    const canvas = this.game.canvas;
    const rect = canvas.getBoundingClientRect();
    const scaleX = rect.width / w;
    const scaleY = rect.height / h;

    const input = document.createElement('input');
    input.type = 'text';
    input.maxLength = 8;
    input.placeholder = 'なまえ';
    input.style.cssText = `
      position: fixed;
      left: ${rect.left + w * 0.5 * scaleX}px;
      top: ${rect.top + h * 0.4 * scaleY}px;
      transform: translateX(-50%);
      font-size: ${Math.round(24 * scaleY)}px;
      padding: ${Math.round(10 * scaleY)}px ${Math.round(20 * scaleX)}px;
      border-radius: 10px;
      border: 3px solid #8888ff;
      text-align: center;
      width: ${Math.round(220 * scaleX)}px;
      background: #223366;
      color: white;
      font-family: sans-serif;
      z-index: 1000;
      outline: none;
      box-sizing: border-box;
    `;
    document.body.appendChild(input);
    input.focus();
    this.nameInput = input;

    const decide = () => {
      const name = input.value.trim() || 'あなた';
      getState().name = name;
      document.body.removeChild(input);
      this.scene.start('OpeningMovieScene');
    };

    this.add.rectangle(w / 2, h * 0.65, 200, 60, 0x3355aa)
      .setStrokeStyle(3, 0xaaaaff)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', decide);
    this.add.text(w / 2, h * 0.65, 'けってい！', {
      fontSize: '32px',
      color: '#ffffff',
      fontFamily: 'sans-serif',
    }).setOrigin(0.5);

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') decide();
    });

    this.events.on('shutdown', () => {
      if (document.body.contains(input)) document.body.removeChild(input);
    });
  }
}
