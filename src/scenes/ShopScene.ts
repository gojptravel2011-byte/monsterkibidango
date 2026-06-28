import Phaser from 'phaser';
import { getState, addItem, spendCoins } from '../state/playerState';
import { ITEMS } from '../data/items';
import type { Item } from '../data/items';
import { STORY_EVENTS } from '../data/story';
import { getFlag, setFlag } from '../state/playerState';

const SHOP_ITEMS = ['tabenoko', 'honyakuki', 'okyuball', 'daikyuball', 'kiracolla'];

export class ShopScene extends Phaser.Scene {
  private coinsText!: Phaser.GameObjects.Text;
  private feedbackText!: Phaser.GameObjects.Text;

  constructor() { super({ key: 'ShopScene', active: false }); }

  create(): void {
    const w = this.scale.width;
    const h = this.scale.height;

    this.add.rectangle(w / 2, h / 2, w, h, 0x221133, 0.96);

    this.add.text(w / 2, 28, 'おみせ', {
      fontSize: '24px', color: '#ffdd44', fontFamily: 'sans-serif',
    }).setOrigin(0.5);

    this.coinsText = this.add.text(w - 10, 28, `コイン: ${getState().coins}`, {
      fontSize: '18px', color: '#ffdd44', fontFamily: 'sans-serif',
    }).setOrigin(1, 0.5);

    // 初回メッセージ（フラグで1回だけ）
    if (!getFlag('shownShopIntro')) {
      setFlag('shownShopIntro');
      const dialogs = STORY_EVENTS.shopIntro.dialogs;
      // 簡易表示
      this.add.text(w / 2, 60, dialogs[0].text, {
        fontSize: '16px', color: '#aaffaa', fontFamily: 'sans-serif',
      }).setOrigin(0.5);
    }

    SHOP_ITEMS.forEach((itemId, i) => {
      const item = ITEMS[itemId];
      if (!item) return;
      const y = 90 + i * 80;
      this.add.rectangle(w / 2, y + 25, w - 20, 68, 0x334455)
        .setStrokeStyle(1, 0x8888ff);
      this.add.text(20, y + 8, item.name, {
        fontSize: '18px', color: '#ffffff', fontFamily: 'sans-serif',
      });
      this.add.text(20, y + 30, this.describeItem(item), {
        fontSize: '13px', color: '#aaaaaa', fontFamily: 'sans-serif',
      });
      this.add.text(w - 130, y + 18, `${item.price}まい`, {
        fontSize: '16px', color: '#ffdd44', fontFamily: 'sans-serif',
      });

      const buyBtn = this.add.rectangle(w - 50, y + 18, 70, 40, 0x3355aa)
        .setStrokeStyle(2, 0x8888ff)
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => this.buyItem(item))
        .on('pointerover', () => buyBtn.setFillStyle(0x5577cc))
        .on('pointerout', () => buyBtn.setFillStyle(0x3355aa));
      this.add.text(w - 50, y + 18, 'かう', {
        fontSize: '16px', color: '#ffffff', fontFamily: 'sans-serif',
      }).setOrigin(0.5);
    });

    this.feedbackText = this.add.text(w / 2, h - 100, '', {
      fontSize: '18px', color: '#88ff88', fontFamily: 'sans-serif',
    }).setOrigin(0.5);

    const closeBtn = this.add.rectangle(w / 2, h - 50, 200, 52, 0x554422)
      .setStrokeStyle(2, 0xaa8844)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        this.scene.stop('ShopScene');
        this.scene.resume('MapScene');
      });
    this.add.text(w / 2, h - 50, 'おみせを　でる', {
      fontSize: '18px', color: '#ffffff', fontFamily: 'sans-serif',
    }).setOrigin(0.5);
  }

  private buyItem(item: Item): void {
    const state = getState();
    if (!spendCoins(item.price)) {
      this.feedbackText.setText('コインが　たりないよ！').setColor('#ff8888');
    } else {
      addItem(item.id);
      this.coinsText.setText(`コイン: ${state.coins}`);
      this.feedbackText.setText(`${item.name}を　かった！`).setColor('#88ff88');
    }
    this.time.delayedCall(1500, () => this.feedbackText.setText(''));
  }

  private describeItem(item: Item): string {
    if (item.type === 'food') return `なつき度 +${item.affectionBonus}　けいけんちアップ`;
    if (item.type === 'heal') return `HP ${item.healAmount}　かいふく`;
    if (item.type === 'ball') return `モンスターに　きびだんごをあげる`;
    if (item.type === 'accessory') return `けいけんちが　${item.expBonus}ばい！`;
    return '';
  }
}
