import Phaser from 'phaser';
import { getState, addItem, spendCoins } from '../state/playerState';
import { ITEMS } from '../data/items';
import type { Item } from '../data/items';

const BALL_ITEMS = ['okyuball', 'daikyuball'];

export class BallShopScene extends Phaser.Scene {
  private coinsText!: Phaser.GameObjects.Text;
  private feedbackText!: Phaser.GameObjects.Text;

  constructor() { super({ key: 'BallShopScene', active: false }); }

  create(): void {
    const w = this.scale.width;
    const h = this.scale.height;

    this.add.rectangle(w / 2, h / 2, w, h, 0x1a1a2e, 0.97);

    // えんちょうせんせいの絵
    this.add.image(w * 0.18, h * 0.2, 'npc_encho').setDisplaySize(64, 80);

    this.add.text(w * 0.28, h * 0.12, 'えんちょうせんせいの\nきびだんごやさん', {
      fontSize: '26px', color: '#ffdd44', fontFamily: 'sans-serif',
    });

    // セリフ
    this.add.text(w / 2, h * 0.28, 'きびだんごで　なかまに　なろう！', {
      fontSize: '24px', color: '#aaffaa', fontFamily: 'sans-serif',
    }).setOrigin(0.5);

    this.coinsText = this.add.text(w - 10, 16, `コイン: ${getState().coins}まい`, {
      fontSize: '26px', color: '#ffdd44', fontFamily: 'sans-serif',
    }).setOrigin(1, 0);

    // きびだんご説明
    const desc: Record<string, string> = {
      okyuball: 'つかまえやすさ　ふつう',
      daikyuball: 'つかまえやすさ　たかい！',
    };

    BALL_ITEMS.forEach((itemId, i) => {
      const item = ITEMS[itemId];
      if (!item) return;
      const y = h * 0.38 + i * 110;

      this.add.rectangle(w / 2, y + 40, w - 24, 96, 0x223355).setStrokeStyle(2, 0x5577bb);
      this.add.text(w / 2, y + 12, item.name, {
        fontSize: '30px', color: '#ffffff', fontFamily: 'sans-serif',
      }).setOrigin(0.5);
      this.add.text(w / 2, y + 46, desc[itemId] ?? '', {
        fontSize: '24px', color: '#aaccff', fontFamily: 'sans-serif',
      }).setOrigin(0.5);
      this.add.text(w / 2, y + 70, `${item.price}まい`, {
        fontSize: '26px', color: '#ffdd44', fontFamily: 'sans-serif',
      }).setOrigin(0.5);

      const buyBtn = this.add.rectangle(w - 60, y + 40, 90, 52, 0x335533)
        .setStrokeStyle(2, 0x55aa55)
        .setInteractive({ useHandCursor: true })
        .on('pointerover', () => buyBtn.setFillStyle(0x447744))
        .on('pointerout', () => buyBtn.setFillStyle(0x335533))
        .on('pointerdown', () => this.buyItem(item));
      this.add.text(w - 60, y + 40, 'かう', {
        fontSize: '28px', color: '#aaffaa', fontFamily: 'sans-serif',
      }).setOrigin(0.5);
    });

    this.feedbackText = this.add.text(w / 2, h * 0.82, '', {
      fontSize: '28px', color: '#88ff88', fontFamily: 'sans-serif', align: 'center',
    }).setOrigin(0.5);

    this.add.rectangle(w / 2, h - 50, 260, 56, 0x554422)
      .setStrokeStyle(2, 0xaa8844)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        this.scene.stop('BallShopScene');
        this.scene.resume('MapScene');
      });
    this.add.text(w / 2, h - 50, 'おみせを　でる', {
      fontSize: '28px', color: '#ffffff', fontFamily: 'sans-serif',
    }).setOrigin(0.5);
  }

  private buyItem(item: Item): void {
    const state = getState();
    if (!spendCoins(item.price)) {
      this.feedbackText.setText('コインが　たりないよ！').setColor('#ff8888');
    } else {
      addItem(item.id);
      this.coinsText.setText(`コイン: ${state.coins}まい`);
      this.feedbackText.setText(`${item.name}を　かった！`).setColor('#88ff88');
    }
    this.time.delayedCall(1800, () => this.feedbackText.setText(''));
  }
}
