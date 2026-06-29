import Phaser from 'phaser';
import { getState } from '../state/playerState';
import { ITEMS } from '../data/items';
import { T } from '../ui/theme';
import { TS } from '../ui/StyledText';
import { drawPanel, makeBtn } from '../ui/Panel';

export class ItemListScene extends Phaser.Scene {
  constructor() { super({ key: 'ItemListScene', active: false }); }

  create(): void {
    const w = this.scale.width;
    const h = this.scale.height;

    drawPanel(this, 0, 0, w, h, { depth: 5 });
    this.add.text(w / 2, 30, 'もちもの', {
      ...TS.heading,
    }).setOrigin(0.5).setDepth(6);

    const state = getState();
    const held = state.inventory.filter(i => i.count > 0);

    if (held.length === 0) {
      this.add.text(w / 2, h / 2, 'なにも　もっていないよ！', {
        ...TS.body,
      }).setOrigin(0.5).setDepth(6);
    } else {
      held.forEach((entry, i) => {
        const item = ITEMS[entry.itemId];
        if (!item) return;
        const y = 72 + i * 86;
        drawPanel(this, 10, y, w - 20, 80, { depth: 6 });
        this.add.text(22, y + 10, item.name, {
          ...TS.body,
        }).setDepth(7);
        this.add.text(22, y + 44, this.describe(item), {
          ...TS.sub,
        }).setDepth(7);
        this.add.text(w - 20, y + 32, `× ${entry.count}`, {
          ...TS.coin,
        }).setOrigin(1, 0.5).setDepth(7);
      });
    }

    const closeBtn = makeBtn(this, w / 2, h - 50, 240, 56, { depth: 6 })
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.scene.stop('ItemListScene'))
      .on('pointerover', () => closeBtn.setFillStyle(0x2a4090))
      .on('pointerout', () => closeBtn.setFillStyle(T.panelMid));
    this.add.text(w / 2, h - 50, 'もどる', {
      ...TS.btn,
    }).setOrigin(0.5).setDepth(7);
  }

  private describe(item: { type: string; affectionBonus?: number; healAmount?: number; expBonus?: number }): string {
    if (item.type === 'food') return `なつき度 +${item.affectionBonus ?? 0}　けいけんちアップ`;
    if (item.type === 'heal') return `HP ${item.healAmount ?? 0}　かいふく`;
    if (item.type === 'ball') return 'モンスターを　つかまえる';
    if (item.type === 'accessory') return `けいけんちが　${item.expBonus ?? 1}ばい！`;
    return '';
  }
}
