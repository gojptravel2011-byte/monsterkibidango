import Phaser from 'phaser';
import { getState, calcExpToNextLevel } from '../state/playerState';
import { MONSTER_SPECIES } from '../data/monsters';
import { SKILLS } from '../data/skills';

export class MonsterListScene extends Phaser.Scene {
  constructor() { super({ key: 'MonsterListScene', active: false }); }

  create(): void {
    const w = this.scale.width;
    const h = this.scale.height;

    this.add.rectangle(w / 2, h / 2, w, h, 0x112233, 0.95);
    this.add.text(w / 2, 30, 'てもちモンスター', {
      fontSize: '30px', color: '#ffff88', fontFamily: 'sans-serif',
    }).setOrigin(0.5);

    const state = getState();
    if (state.party.length === 0) {
      this.add.text(w / 2, h / 2, 'まだ　なかまが　いないよ！', {
        fontSize: '36px', color: '#ffffff', fontFamily: 'sans-serif',
      }).setOrigin(0.5);
    }

    state.party.forEach((m, i) => {
      const species = MONSTER_SPECIES[m.speciesId];
      const cardH = 130;
      const y = 70 + i * (cardH + 8);
      this.add.rectangle(w / 2, y + cardH / 2, w - 20, cardH, 0x223366)
        .setStrokeStyle(2, 0x8888ff);
      this.add.image(54, y + cardH / 2, species?.spriteKey ?? 'player').setDisplaySize(64, 64);

      // 名前・レベル
      this.add.text(100, y + 8, `${species?.name ?? m.speciesId}　Lv.${m.level}`, {
        fontSize: '28px', color: '#ffffff', fontFamily: 'sans-serif',
      });
      // HP
      this.add.text(100, y + 38, `HP: ${m.hp} / ${m.maxHp}`, {
        fontSize: '24px', color: '#88ff88', fontFamily: 'sans-serif',
      });

      // EXPバー
      const expNeeded = calcExpToNextLevel(m.level);
      const expRatio = Math.min(1, m.exp / expNeeded);
      const barW = w - 120;
      this.add.rectangle(100 + barW / 2, y + 72, barW, 14, 0x333355).setStrokeStyle(1, 0x6666aa);
      this.add.rectangle(100, y + 72, Math.round(barW * expRatio), 10, 0x44aaff).setOrigin(0, 0.5);
      this.add.text(100, y + 86, `EXP: ${m.exp} / ${expNeeded}`, {
        fontSize: '20px', color: '#aaccff', fontFamily: 'sans-serif',
      });

      // わざ
      const skillNames = m.skills.map(s => SKILLS[s]?.name ?? s).join('　');
      this.add.text(100, y + 108, `わざ: ${skillNames}`, {
        fontSize: '22px', color: '#88ddff', fontFamily: 'sans-serif',
      });
    });

    // 閉じるボタン
    const closeBtn = this.add.rectangle(w / 2, h - 50, 200, 56, 0x554422)
      .setStrokeStyle(2, 0xaa8844)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.scene.stop('MonsterListScene'));
    this.add.text(w / 2, h - 50, 'もどる', {
      fontSize: '36px', color: '#ffffff', fontFamily: 'sans-serif',
    }).setOrigin(0.5);
  }
}
