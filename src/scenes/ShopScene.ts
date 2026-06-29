import Phaser from 'phaser';
import { getState, addItem, spendCoins } from '../state/playerState';
import { ITEMS } from '../data/items';
import type { Item } from '../data/items';
import { STORY_EVENTS } from '../data/story';
import { getFlag, setFlag } from '../state/playerState';
import { T } from '../ui/theme';
import { TS } from '../ui/StyledText';
import { drawPanel, makeBtn } from '../ui/Panel';

const SHOP_ITEMS = ['tabenoko', 'honyakuki', 'kiracolla'];

export class ShopScene extends Phaser.Scene {
  private coinsText!: Phaser.GameObjects.Text;
  private feedbackText!: Phaser.GameObjects.Text;

  constructor() { super({ key: 'ShopScene', active: false }); }

  create(): void {
    const w = this.scale.width;
    const h = this.scale.height;

    drawPanel(this, 0, 0, w, h, { depth: 5 });

    this.add.text(w / 2, 28, 'おみせ', {
      ...TS.heading,
    }).setOrigin(0.5).setDepth(6);

    this.coinsText = this.add.text(w - 10, 28, `コイン: ${getState().coins}`, {
      ...TS.coin,
    }).setOrigin(1, 0.5).setDepth(6);

    // 初回メッセージ（フラグで1回だけ）
    if (!getFlag('shownShopIntro')) {
      setFlag('shownShopIntro');
      const dialogs = STORY_EVENTS.shopIntro.dialogs;
      // 簡易表示
      this.add.text(w / 2, 60, dialogs[0].text, {
        ...TS.sub,
        color: T.textGreen,
      }).setOrigin(0.5).setDepth(6);
    }

    SHOP_ITEMS.forEach((itemId, i) => {
      const item = ITEMS[itemId];
      if (!item) return;
      const y = 90 + i * 80;
      drawPanel(this, 10, y, w - 20, 70, { depth: 6 });
      this.add.text(20, y + 8, item.name, {
        ...TS.body,
      }).setDepth(7);
      this.add.text(20, y + 36, this.describeItem(item), {
        ...TS.sub,
      }).setDepth(7);
      this.add.text(w - 130, y + 22, `${item.price}まい`, {
        ...TS.coin,
      }).setDepth(7);

      const buyBtn = makeBtn(this, w - 50, y + 22, 80, 44, { depth: 7 })
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => this.buyItem(item))
        .on('pointerover', () => buyBtn.setFillStyle(0x2a4090))
        .on('pointerout', () => buyBtn.setFillStyle(T.panelMid));
      this.add.text(w - 50, y + 22, 'かう', {
        ...TS.btn,
      }).setOrigin(0.5).setDepth(8);
    });

    this.feedbackText = this.add.text(w / 2, h - 100, '', {
      ...TS.body,
    }).setOrigin(0.5).setDepth(6);

    const closeBtn = makeBtn(this, w / 2, h - 50, 200, 52, { depth: 6 })
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        this.scene.stop('ShopScene');
        this.scene.resume('MapScene');
      })
      .on('pointerover', () => closeBtn.setFillStyle(0x2a4090))
      .on('pointerout', () => closeBtn.setFillStyle(T.panelMid));
    this.add.text(w / 2, h - 50, 'おみせを　でる', {
      ...TS.btn,
    }).setOrigin(0.5).setDepth(7);
  }

  private buyItem(item: Item): void {
    const state = getState();
    if (!spendCoins(item.price)) {
      this.feedbackText.setText('コインが　たりないよ！').setColor(T.textRed);
    } else {
      addItem(item.id);
      this.coinsText.setText(`コイン: ${state.coins}`);
      this.feedbackText.setText(`${item.name}を　かった！`).setColor(T.textGreen);
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
