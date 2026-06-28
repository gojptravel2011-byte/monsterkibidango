import Phaser from 'phaser';
import { MessageWindow } from '../ui/MessageWindow';
import { STORY_EVENTS } from '../data/story';
import { getState } from '../state/playerState';
import { saveGame } from '../systems/save';

export class EndingScene extends Phaser.Scene {
  constructor() { super('EndingScene'); }

  create(): void {
    const w = this.scale.width;
    const h = this.scale.height;

    this.add.rectangle(w / 2, h / 2, w, h, 0x000011);

    // 星
    for (let i = 0; i < 80; i++) {
      this.add.circle(Math.random() * w, Math.random() * h, Math.random() * 2 + 1, 0xffffff, Math.random());
    }

    const msgWin = new MessageWindow(this);
    this.input.on('pointerdown', () => { if (msgWin.isVisible()) msgWin.advance(); });

    const state = getState();
    const dialogs = STORY_EVENTS.ending.dialogs.map(d => ({
      speaker: d.speaker === 'あなた' ? state.name : d.speaker,
      text: d.text,
    }));

    msgWin.showSequence(dialogs, () => {
      saveGame();
      this.add.text(w / 2, h * 0.55, 'おわり', {
        fontSize: '48px', color: '#ffff88', fontFamily: 'sans-serif',
      }).setOrigin(0.5);

      this.add.text(w / 2, h * 0.7, `なかまモンスター: ${state.party.length}ひき`, {
        fontSize: '20px', color: '#aaffaa', fontFamily: 'sans-serif',
      }).setOrigin(0.5);

      this.add.text(w / 2, h * 0.78, `コイン: ${state.coins}まい`, {
        fontSize: '20px', color: '#ffdd44', fontFamily: 'sans-serif',
      }).setOrigin(0.5);

      const titleBtn = this.add.rectangle(w / 2, h * 0.9, 240, 56, 0x3355aa)
        .setStrokeStyle(3, 0xaaaaff)
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => this.scene.start('TitleScene'));
      this.add.text(w / 2, h * 0.9, 'タイトルへ', {
        fontSize: '22px', color: '#ffffff', fontFamily: 'sans-serif',
      }).setOrigin(0.5);
    });
  }
}
