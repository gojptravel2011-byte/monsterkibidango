import Phaser from 'phaser';
import { getState, calcExpToNextLevel } from '../state/playerState';
import { MONSTER_SPECIES } from '../data/monsters';
import { SKILLS } from '../data/skills';
import { T } from '../ui/theme';
import { TS } from '../ui/StyledText';
import { drawPanel, makeBtn } from '../ui/Panel';

const ITEM_H = 130;
const ITEM_GAP = 8;
const HEADER_H = 64;
const FOOTER_H = 80;

export class MonsterListScene extends Phaser.Scene {
  constructor() { super({ key: 'MonsterListScene', active: false }); }

  create(): void {
    const w = this.scale.width;
    const h = this.scale.height;

    drawPanel(this, 0, 0, w, h, { depth: 5 });
    this.add.text(w / 2, 28, 'てもちモンスター', { ...TS.heading }).setOrigin(0.5).setDepth(6);

    const state = getState();
    const party = state.party;

    if (party.length === 0) {
      this.add.text(w / 2, h / 2, 'まだ　なかまが　いないよ！', { ...TS.body }).setOrigin(0.5).setDepth(6);
    } else {
      const viewH = h - HEADER_H - FOOTER_H;
      const contentH = party.length * (ITEM_H + ITEM_GAP);
      const maxScroll = Math.max(0, contentH - viewH);

      // スクロールコンテナ
      const container = this.add.container(0, HEADER_H).setDepth(6);

      party.forEach((m, i) => {
        const species = MONSTER_SPECIES[m.speciesId];
        const y = i * (ITEM_H + ITEM_GAP);

        const bg = this.add.rectangle(w / 2, y + ITEM_H / 2, w - 20, ITEM_H, T.panelMid)
          .setStrokeStyle(1, T.borderGold);
        const icon = this.add.image(54, y + ITEM_H / 2, species?.spriteKey ?? 'player').setDisplaySize(64, 64);

        const nameT = this.add.text(100, y + 8, `${species?.name ?? m.speciesId}　Lv.${m.level}`, { ...TS.subheading });
        const hpT   = this.add.text(100, y + 38, `HP: ${m.hp} / ${m.maxHp}`, { ...TS.hp });

        const expNeeded = calcExpToNextLevel(m.level);
        const expRatio = Math.min(1, m.exp / expNeeded);
        const barW = w - 120;
        const expBar = this.add.rectangle(100, y + 72, Math.round(barW * expRatio), 10, 0x44aaff).setOrigin(0, 0.5);
        const expBg  = this.add.rectangle(100 + barW / 2, y + 72, barW, 14, 0x223355).setStrokeStyle(1, T.borderGold);
        const expT   = this.add.text(100, y + 86, `EXP: ${m.exp} / ${expNeeded}`, { ...TS.sub });

        const skillNames = m.skills.map(s => SKILLS[s]?.name ?? s).join('　');
        const skillT = this.add.text(100, y + 108, `わざ: ${skillNames}`, { ...TS.sub, color: T.textSub });

        container.add([bg, icon, nameT, hpT, expBg, expBar, expT, skillT]);
      });

      // ドラッグスクロール
      if (maxScroll > 0) {
        let scrollY = 0;
        let startY = 0;
        let dragging = false;
        let moved = false;

        this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
          startY = p.y;
          dragging = true;
          moved = false;
        });
        this.input.on('pointermove', (p: Phaser.Input.Pointer) => {
          if (!dragging) return;
          const dy = p.y - startY;
          if (Math.abs(dy) > 8) moved = true;
          if (!moved) return;
          scrollY = Math.max(0, Math.min(maxScroll, scrollY - (p.y - startY)));
          startY = p.y;
          container.y = HEADER_H - scrollY;
        });
        this.input.on('pointerup', () => { dragging = false; });

        // スクロールバー
        this.add.rectangle(w - 8, HEADER_H + viewH / 2, 6, viewH, 0x223355).setOrigin(0.5).setDepth(7);
        const barH = Math.max(40, (viewH / contentH) * viewH);
        const scrollBar = this.add.rectangle(w - 8, HEADER_H + barH / 2, 6, barH, 0x4466aa).setOrigin(0.5).setDepth(7);
        this.events.on('update', () => {
          const ratio = scrollY / maxScroll;
          scrollBar.y = HEADER_H + ratio * (viewH - barH) + barH / 2;
        });
      }

      // マスク（上下にはみ出ないよう）
      const maskShape = this.add.graphics().fillRect(0, HEADER_H, w, viewH);
      container.setMask(maskShape.createGeometryMask());
    }

    // とじるボタン
    const closeBtn = makeBtn(this, w / 2, h - FOOTER_H / 2, 200, 56, { depth: 7 })
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.scene.stop('MonsterListScene'))
      .on('pointerover', () => closeBtn.setFillStyle(0x2a4090))
      .on('pointerout', () => closeBtn.setFillStyle(T.panelMid));
    this.add.text(w / 2, h - FOOTER_H / 2, 'もどる', { ...TS.btn }).setOrigin(0.5).setDepth(8);
  }
}
