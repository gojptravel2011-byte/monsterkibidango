import Phaser from 'phaser';
import { getState, calcExpToNextLevel } from '../state/playerState';
import { MONSTER_SPECIES } from '../data/monsters';
import { SKILLS } from '../data/skills';
import { T } from '../ui/theme';
import { TS } from '../ui/StyledText';
import { drawPanel, makeBtn } from '../ui/Panel';

export class MonsterListScene extends Phaser.Scene {
  constructor() { super({ key: 'MonsterListScene', active: false }); }

  create(): void {
    const w = this.scale.width;
    const h = this.scale.height;

    drawPanel(this, 0, 0, w, h, { depth: 5 });
    this.add.text(w / 2, 30, 'てもちモンスター', {
      ...TS.heading,
    }).setOrigin(0.5).setDepth(6);

    const state = getState();
    if (state.party.length === 0) {
      this.add.text(w / 2, h / 2, 'まだ　なかまが　いないよ！', {
        ...TS.body,
      }).setOrigin(0.5).setDepth(6);
    }

    state.party.forEach((m, i) => {
      const species = MONSTER_SPECIES[m.speciesId];
      const cardH = 130;
      const y = 70 + i * (cardH + 8);
      drawPanel(this, 10, y, w - 20, cardH, { depth: 6 });
      this.add.image(54, y + cardH / 2, species?.spriteKey ?? 'player').setDisplaySize(64, 64).setDepth(7);

      // 名前・レベル
      this.add.text(100, y + 8, `${species?.name ?? m.speciesId}　Lv.${m.level}`, {
        ...TS.subheading,
      }).setDepth(7);
      // HP
      this.add.text(100, y + 38, `HP: ${m.hp} / ${m.maxHp}`, {
        ...TS.hp,
      }).setDepth(7);

      // EXPバー
      const expNeeded = calcExpToNextLevel(m.level);
      const expRatio = Math.min(1, m.exp / expNeeded);
      const barW = w - 120;
      this.add.rectangle(100 + barW / 2, y + 72, barW, 14, 0x223355).setStrokeStyle(1, T.borderGold).setDepth(7);
      this.add.rectangle(100, y + 72, Math.round(barW * expRatio), 10, 0x44aaff).setOrigin(0, 0.5).setDepth(8);
      this.add.text(100, y + 86, `EXP: ${m.exp} / ${expNeeded}`, {
        ...TS.sub,
      }).setDepth(7);

      // わざ
      const skillNames = m.skills.map(s => SKILLS[s]?.name ?? s).join('　');
      this.add.text(100, y + 108, `わざ: ${skillNames}`, {
        ...TS.sub,
        color: T.textSub,
      }).setDepth(7);
    });

    // 閉じるボタン
    const closeBtn = makeBtn(this, w / 2, h - 50, 200, 56, { depth: 7 })
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.scene.stop('MonsterListScene'))
      .on('pointerover', () => closeBtn.setFillStyle(0x2a4090))
      .on('pointerout', () => closeBtn.setFillStyle(T.panelMid));
    this.add.text(w / 2, h - 50, 'もどる', {
      ...TS.btn,
    }).setOrigin(0.5).setDepth(8);
  }
}
