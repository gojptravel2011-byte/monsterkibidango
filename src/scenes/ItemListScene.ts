import Phaser from 'phaser';
import { getState } from '../state/playerState';
import { ITEMS } from '../data/items';

export class ItemListScene extends Phaser.Scene {
  constructor() { super({ key: 'ItemListScene', active: false }); }

  create(): void {
    const w = this.scale.width;
    const h = this.scale.height;

    this.add.rectangle(w / 2, h / 2, w, h, 0x112233, 0.96);
    this.add.text(w / 2, 30, 'もちもの', {
      fontSize: '34px', color: '#ffff88', fontFamily: 'sans-serif',
    }).setOrigin(0.5);

    const state = getState();
    const held = state.inventory.filter(i => i.count > 0);

    if (held.length === 0) {
      this.add.text(w / 2, h / 2, 'なにも　もっていないよ！', {
        fontSize: '30px', color: '#aaaaaa', fontFamily: 'sans-serif',
      }).setOrigin(0.5);
    } else {
      held.forEach((entry, i) => {
        const item = ITEMS[entry.itemId];
        if (!item) return;
        const y = 72 + i * 86;
        this.add.rectangle(w / 2, y + 32, w - 20, 76, 0x223366).setStrokeStyle(2, 0x5577bb);
        this.add.text(22, y + 10, item.name, {
          fontSize: '30px', color: '#ffffff', fontFamily: 'sans-serif',
        });
        this.add.text(22, y + 44, this.describe(item), {
          fontSize: '24px', color: '#aaaaaa', fontFamily: 'sans-serif',
        });
        this.add.text(w - 20, y + 26, `× ${entry.count}`, {
          fontSize: '30px', color: '#ffdd44', fontFamily: 'sans-serif',
        }).setOrigin(1, 0.5);
      });
    }

    this.add.rectangle(w / 2, h - 50, 240, 56, 0x554422)
      .setStrokeStyle(2, 0xaa8844)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.scene.stop('ItemListScene'));
    this.add.text(w / 2, h - 50, 'もどる', {
      fontSize: '30px', color: '#ffffff', fontFamily: 'sans-serif',
    }).setOrigin(0.5);
  }

  private describe(item: { type: string; affectionBonus?: number; healAmount?: number; expBonus?: number }): string {
    if (item.type === 'food') return `なつき度 +${item.affectionBonus ?? 0}　けいけんちアップ`;
    if (item.type === 'heal') return `HP ${item.healAmount ?? 0}　かいふく`;
    if (item.type === 'ball') return 'モンスターを　つかまえる';
    if (item.type === 'accessory') return `けいけんちが　${item.expBonus ?? 1}ばい！`;
    return '';
  }
}
