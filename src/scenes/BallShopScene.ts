import Phaser from 'phaser';
import { getState, addItem, spendCoins } from '../state/playerState';
import { ITEMS } from '../data/items';
import type { Item } from '../data/items';
import { T } from '../ui/theme';
import { TS } from '../ui/StyledText';
import { drawPanel, makeBtn } from '../ui/Panel';

const DEFAULT_ITEMS = ['okyuball', 'daikyuball'];
const AW_ITEMS = ['douball', 'ginball'];

export class BallShopScene extends Phaser.Scene {
  private coinsText!: Phaser.GameObjects.Text;
  private feedbackText!: Phaser.GameObjects.Text;
  private shopItems: string[] = DEFAULT_ITEMS;
  private shopTitle: string = 'えんちょうせんせいの\nきびだんごやさん';

  constructor() { super({ key: 'BallShopScene', active: false }); }

  init(data?: { items?: string[]; title?: string }): void {
    this.shopItems = data?.items ?? DEFAULT_ITEMS;
    this.shopTitle = data?.title ?? 'えんちょうせんせいの\nきびだんごやさん';
  }

  create(): void {
    const w = this.scale.width;
    const h = this.scale.height;

    drawPanel(this, 0, 0, w, h, { depth: 5 });

    // えんちょうせんせいの絵
    this.add.image(w * 0.18, h * 0.2, 'npc_encho').setDisplaySize(64, 80).setDepth(6);

    this.add.text(w * 0.28, h * 0.12, this.shopTitle, {
      ...TS.subheading,
    }).setDepth(6);

    // セリフ
    this.add.text(w / 2, h * 0.28, 'きびだんごで　なかまに　なろう！', {
      ...TS.sub,
      color: T.textSub,
    }).setOrigin(0.5).setDepth(6);

    this.coinsText = this.add.text(w - 10, 16, `コイン: ${getState().coins}まい`, {
      ...TS.coin,
    }).setOrigin(1, 0).setDepth(6);

    // きびだんご説明
    const desc: Record<string, string> = {
      okyuball: 'つかまえやすさ　ふつう',
      daikyuball: 'つかまえやすさ　たかい！',
      douball: 'つかまえやすさ　まあまあ',
      ginball: 'つかまえやすさ　とてもたかい！',
    };

    this.shopItems.forEach((itemId, i) => {
      const item = ITEMS[itemId];
      if (!item) return;
      const y = h * 0.38 + i * 110;

      drawPanel(this, 12, y, w - 24, 96, { depth: 6 });
      this.add.text(w / 2, y + 12, item.name, {
        ...TS.body,
      }).setOrigin(0.5).setDepth(7);
      this.add.text(w / 2, y + 40, desc[itemId] ?? '', {
        ...TS.sub,
        color: T.textSub,
      }).setOrigin(0.5).setDepth(7);
      this.add.text(w / 2, y + 66, `${item.price}まい`, {
        ...TS.coin,
      }).setOrigin(0.5).setDepth(7);

      const buyBtn = makeBtn(this, w - 60, y + 48, 90, 52, { depth: 7 })
        .setInteractive({ useHandCursor: true })
        .on('pointerover', () => buyBtn.setFillStyle(0x2a4090))
        .on('pointerout', () => buyBtn.setFillStyle(T.panelMid))
        .on('pointerdown', () => this.buyItem(item));
      this.add.text(w - 60, y + 48, 'かう', {
        ...TS.btn,
      }).setOrigin(0.5).setDepth(8);
    });

    this.feedbackText = this.add.text(w / 2, h * 0.82, '', {
      ...TS.body,
      align: 'center',
    }).setOrigin(0.5).setDepth(6);

    const closeBtn = makeBtn(this, w / 2, h - 50, 260, 56, { depth: 6 })
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        this.scene.stop('BallShopScene');
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
      this.coinsText.setText(`コイン: ${state.coins}まい`);
      this.feedbackText.setText(`${item.name}を　かった！`).setColor(T.textGreen);
    }
    this.time.delayedCall(1800, () => this.feedbackText.setText(''));
  }
}
