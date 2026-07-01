import Phaser from 'phaser';
import { getState } from '../state/playerState';
import { MONSTER_SPECIES } from '../data/monsters';
import { T } from '../ui/theme';
import { TS } from '../ui/StyledText';
import { drawPanel, makeBtn } from '../ui/Panel';

const COLS = 4;
const CELL_W = 148;
const CELL_H = 110;
const PAD_X = 12;
const PAD_Y = 64;
const GAP = 8;

export class MonsterDexScene extends Phaser.Scene {
  constructor() { super({ key: 'MonsterDexScene', active: false }); }

  create(): void {
    const w = this.scale.width;
    const h = this.scale.height;

    drawPanel(this, 0, 0, w, h, { depth: 5 });
    this.add.text(w / 2, 28, 'モンスター　ずかん', { ...TS.heading }).setOrigin(0.5).setDepth(6);

    const state = getState();
    const dex = state.dex ?? {};
    const allSpecies = Object.values(MONSTER_SPECIES);
    const caught = allSpecies.filter(s => dex[s.id] === 'caught').length;
    const total = allSpecies.filter(s => s.catchable).length;

    this.add.text(w / 2, 50, `つかまえた: ${caught} / ${total}`, { ...TS.sub, color: T.textGold }).setOrigin(0.5).setDepth(6);

    // スクロールコンテナ
    const container = this.add.container(0, 0).setDepth(6);

    allSpecies.forEach((species, i) => {
      const status = dex[species.id];
      const col = i % COLS;
      const row = Math.floor(i / COLS);
      const cx = PAD_X + col * (CELL_W + GAP) + CELL_W / 2;
      const cy = PAD_Y + row * (CELL_H + GAP) + CELL_H / 2;

      const isCaught = status === 'caught';
      const isSeen = status === 'seen';
      const isUnknown = !status;

      const bg = this.add.rectangle(cx, cy, CELL_W, CELL_H, isCaught ? 0x112244 : 0x0d0d1a)
        .setStrokeStyle(1.5, isCaught ? T.borderGold : 0x333355);
      container.add(bg);

      if (isCaught || isSeen) {
        const img = this.add.image(cx, cy - 18, species.spriteKey)
          .setDisplaySize(52, 52)
          .setAlpha(isCaught ? 1 : 0.35);
        container.add(img);
      } else {
        const q = this.add.text(cx, cy - 18, '？', { fontSize: '36px', color: '#444466', fontFamily: T.font }).setOrigin(0.5);
        container.add(q);
      }

      const nameLabel = isCaught ? species.name : isSeen ? '？？？' : '？？？';
      const nameColor = isCaught ? T.textLight : isSeen ? '#888899' : '#444466';
      const nameTxt = this.add.text(cx, cy + 34, nameLabel, { fontSize: '14px', color: nameColor, fontFamily: T.font }).setOrigin(0.5);
      container.add(nameTxt);

      if (isCaught) {
        const badge = this.add.text(cx + CELL_W / 2 - 6, cy - CELL_H / 2 + 6, '✓', { fontSize: '14px', color: T.textGreen, fontFamily: T.font }).setOrigin(1, 0);
        container.add(badge);
      }
    });

    // とじるボタン
    const closeBtn = makeBtn(this, w / 2, h - 36, 200, 48, { depth: 7 })
      .setInteractive({ useHandCursor: true })
      .on('pointerover', () => closeBtn.setFillStyle(0x2a4090))
      .on('pointerout', () => closeBtn.setFillStyle(T.panelMid))
      .on('pointerdown', () => this.scene.stop('MonsterDexScene'));
    this.add.text(w / 2, h - 36, 'とじる', { ...TS.btn }).setOrigin(0.5).setDepth(8);
  }
}
