import Phaser from 'phaser';
import { getState } from '../state/playerState';
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
      const y = 80 + i * 100;
      this.add.rectangle(w / 2, y + 35, w - 20, 90, 0x223366)
        .setStrokeStyle(2, 0x8888ff);
      this.add.image(60, y + 35, species?.spriteKey ?? 'player').setDisplaySize(60, 60);
      this.add.text(100, y + 12, `${species?.name ?? m.speciesId}　Lv.${m.level}`, {
        fontSize: '34px', color: '#ffffff', fontFamily: 'sans-serif',
      });
      this.add.text(100, y + 34, `HP: ${m.hp} / ${m.maxHp}　なつき度: ${m.affection}`, {
        fontSize: '34px', color: '#aaaaaa', fontFamily: 'sans-serif',
      });
      const skillNames = m.skills.map(s => SKILLS[s]?.name ?? s).join('　');
      this.add.text(100, y + 54, `わざ: ${skillNames}`, {
        fontSize: '32px', color: '#88ddff', fontFamily: 'sans-serif',
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
