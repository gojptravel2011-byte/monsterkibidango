import Phaser from 'phaser';
import { getState, removeItem } from '../state/playerState';
import { MONSTER_SPECIES } from '../data/monsters';
import { ITEMS } from '../data/items';

export class CareScene extends Phaser.Scene {
  private selectedIndex: number = 0;
  private buttons: Phaser.GameObjects.GameObject[] = [];
  private statusTexts: Phaser.GameObjects.Text[] = [];

  constructor() { super({ key: 'CareScene', active: false }); }

  create(): void {
    const w = this.scale.width;
    const h = this.scale.height;

    this.add.rectangle(w / 2, h / 2, w, h, 0x112233, 0.95);
    this.add.text(w / 2, 28, 'そだてる', {
      fontSize: '30px', color: '#ffff88', fontFamily: 'sans-serif',
    }).setOrigin(0.5);

    const state = getState();
    if (state.party.length === 0) {
      this.add.text(w / 2, h / 2, 'なかまが　いないよ！', {
        fontSize: '36px', color: '#ffffff', fontFamily: 'sans-serif',
      }).setOrigin(0.5);
      this.addCloseButton();
      return;
    }

    // モンスター選択タブ
    state.party.forEach((m, i) => {
      const species = MONSTER_SPECIES[m.speciesId];
      const x = 60 + i * 110;
      const tab = this.add.rectangle(x, 65, 100, 36, i === this.selectedIndex ? 0x5566aa : 0x334455)
        .setStrokeStyle(1, 0x8888ff)
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => { this.selectedIndex = i; this.scene.restart(); });
      this.add.text(x, 65, species?.name ?? m.speciesId, {
        fontSize: '34px', color: '#ffffff', fontFamily: 'sans-serif',
      }).setOrigin(0.5);
    });

    const mon = state.party[this.selectedIndex];
    const species = MONSTER_SPECIES[mon.speciesId];

    // モンスター表示
    this.add.image(w / 2, 160, species?.spriteKey ?? 'player').setDisplaySize(90, 90);

    const hp = this.add.text(w / 2, 215, `HP: ${mon.hp}/${mon.maxHp}`, {
      fontSize: '36px', color: '#88ff88', fontFamily: 'sans-serif',
    }).setOrigin(0.5);
    const aff = this.add.text(w / 2, 238, `なつき度: ${mon.affection}`, {
      fontSize: '36px', color: '#ffaaff', fontFamily: 'sans-serif',
    }).setOrigin(0.5);
    this.statusTexts = [hp, aff];

    // 行動ボタン
    const actions = [
      {
        label: 'なでる',
        action: () => {
          mon.affection += 3;
          this.showEffect(w / 2, 160, '💕 なつき度+3');
          this.refreshStatus(mon);
        },
      },
      {
        label: 'あそぶ',
        action: () => {
          mon.affection += 2;
          this.showEffect(w / 2, 160, '⭐ なつき度+2');
          this.refreshStatus(mon);
        },
      },
      {
        label: 'エサをあげる',
        action: () => this.feedMonster(mon),
      },
    ];

    actions.forEach((a, i) => {
      const y = 300 + i * 72;
      const bg = this.add.rectangle(w / 2, y, 260, 56, 0x334488)
        .setStrokeStyle(2, 0x8888ff)
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', a.action)
        .on('pointerover', () => bg.setFillStyle(0x5566aa))
        .on('pointerout', () => bg.setFillStyle(0x334488));
      this.add.text(w / 2, y, a.label, {
        fontSize: '36px', color: '#ffffff', fontFamily: 'sans-serif',
      }).setOrigin(0.5);
    });

    this.addCloseButton();
  }

  private feedMonster(mon: { hp: number; maxHp: number; affection: number }): void {
    const state = getState();
    const foodItem = state.inventory.find(i => ITEMS[i.itemId]?.type === 'food' && i.count > 0);
    if (!foodItem) {
      this.showEffect(this.scale.width / 2, 160, 'エサが　ないよ！');
      return;
    }
    const item = ITEMS[foodItem.itemId];
    removeItem(foodItem.itemId);
    mon.affection += item.affectionBonus ?? 5;
    // 少し回復も
    mon.hp = Math.min(mon.hp + 10, mon.maxHp);
    this.showEffect(this.scale.width / 2, 160, `${item.name}を　あげた！\nなつき度+${item.affectionBonus}`);
    this.refreshStatus(mon as any);
  }

  private refreshStatus(mon: { hp: number; maxHp: number; affection: number }): void {
    if (this.statusTexts[0]) this.statusTexts[0].setText(`HP: ${mon.hp}/${mon.maxHp}`);
    if (this.statusTexts[1]) this.statusTexts[1].setText(`なつき度: ${mon.affection}`);
  }

  private showEffect(x: number, y: number, msg: string): void {
    const text = this.add.text(x, y - 30, msg, {
      fontSize: '34px', color: '#ffff44', fontFamily: 'sans-serif',
    }).setOrigin(0.5).setDepth(50);
    this.tweens.add({
      targets: text,
      y: y - 80,
      alpha: 0,
      duration: 1500,
      onComplete: () => text.destroy(),
    });
  }

  private addCloseButton(): void {
    const w = this.scale.width;
    const h = this.scale.height;
    const btn = this.add.rectangle(w / 2, h - 50, 200, 56, 0x554422)
      .setStrokeStyle(2, 0xaa8844)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.scene.stop('CareScene'));
    this.add.text(w / 2, h - 50, 'もどる', {
      fontSize: '36px', color: '#ffffff', fontFamily: 'sans-serif',
    }).setOrigin(0.5);
  }
}
