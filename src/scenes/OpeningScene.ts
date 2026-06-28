import Phaser from 'phaser';
import { MessageWindow } from '../ui/MessageWindow';
import { STORY_EVENTS } from '../data/story';
import { getState, setFlag, addToParty, createMonsterInstance, addItem } from '../state/playerState';

export class OpeningScene extends Phaser.Scene {
  constructor() { super('OpeningScene'); }

  create(): void {
    const w = this.scale.width;
    const h = this.scale.height;

    this.add.rectangle(w / 2, h / 2, w, h, 0x000011);

    // 星のエフェクト（アニメーション付き）
    const starObjs: Phaser.GameObjects.Arc[] = [];
    for (let i = 0; i < 60; i++) {
      const star = this.add.circle(
        Math.random() * w, Math.random() * h * 0.7,
        Math.random() * 2 + 1, 0xffffff, Math.random() * 0.8 + 0.2,
      );
      starObjs.push(star);
    }
    starObjs.filter((_, i) => i % 3 === 0).forEach(star => {
      this.tweens.add({
        targets: star, alpha: 0.1, duration: 800 + Math.random() * 1200,
        yoyo: true, repeat: -1, delay: Math.random() * 2000,
      });
    });

    const msgWin = new MessageWindow(this);

    // タップで進む
    this.input.on('pointerdown', () => {
      if (msgWin.isVisible()) msgWin.advance();
    });

    const dialogs = STORY_EVENTS.opening.dialogs.map(d => ({
      speaker: d.speaker === 'あなた' ? getState().name : d.speaker,
      text: d.text,
    }));

    // クロスケをイベントで仲間にする（Lv5スタート）
    msgWin.showSequence(dialogs, () => {
      const kurosuke = createMonsterInstance('kurosuke', 5);
      addToParty(kurosuke);
      setFlag('metKurosuke');
      // 初期アイテム
      addItem('honyakuki', 2);   // かいふくすい ×2
      addItem('okyuball', 3);    // かるいきびだんご ×3
      getState().position = { field: 'kouen', x: 400, y: 300 };
      this.scene.start('MapScene');
    });
  }
}
