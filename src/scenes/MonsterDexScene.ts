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
const PAD_Y = 4;
const GAP = 8;
const HEADER_H = 68;
const FOOTER_H = 66;

export class MonsterDexScene extends Phaser.Scene {
  constructor() { super({ key: 'MonsterDexScene', active: false }); }

  create(): void {
    const w = this.scale.width;
    const h = this.scale.height;

    drawPanel(this, 0, 0, w, h, { depth: 5 });
    this.add.text(w / 2, 22, 'モンスター　ずかん', { ...TS.heading }).setOrigin(0.5).setDepth(6);

    const state = getState();
    const dex = state.dex ?? {};
    const allSpecies = Object.values(MONSTER_SPECIES);
    const caught = allSpecies.filter(s => dex[s.id] === 'caught').length;
    const total = allSpecies.filter(s => s.catchable).length;

    this.add.text(w / 2, 46, `つかまえた: ${caught} / ${total}`, { ...TS.sub, color: T.textGold }).setOrigin(0.5).setDepth(6);

    const viewH = h - HEADER_H - FOOTER_H;
    const rows = Math.ceil(allSpecies.length / COLS);
    const contentH = PAD_Y + rows * (CELL_H + GAP);
    const maxScroll = Math.max(0, contentH - viewH);

    // スクロールコンテナ
    const container = this.add.container(0, HEADER_H).setDepth(6);

    allSpecies.forEach((species, i) => {
      const status = dex[species.id];
      const col = i % COLS;
      const row = Math.floor(i / COLS);
      const cx = PAD_X + col * (CELL_W + GAP) + CELL_W / 2;
      const cy = PAD_Y + row * (CELL_H + GAP) + CELL_H / 2;

      const isCaught = status === 'caught';
      const isSeen   = status === 'seen';

      const bg = this.add.rectangle(cx, cy, CELL_W, CELL_H, isCaught ? 0x112244 : 0x0d0d1a)
        .setStrokeStyle(1.5, isCaught ? T.borderGold : 0x333355);
      container.add(bg);

      if (isCaught || isSeen) {
        const img = this.add.image(cx, cy - 18, species.spriteKey)
          .setDisplaySize(52, 52).setAlpha(isCaught ? 1 : 0.35);
        container.add(img);
      } else {
        container.add(this.add.text(cx, cy - 18, '？', { fontSize: '36px', color: '#444466', fontFamily: T.font }).setOrigin(0.5));
      }

      const nameLabel = isCaught ? species.name : '？？？';
      const nameColor = isCaught ? T.textLight : '#555577';
      container.add(this.add.text(cx, cy + 34, nameLabel, { fontSize: '14px', color: nameColor, fontFamily: T.font }).setOrigin(0.5));

      if (isCaught) {
        container.add(this.add.text(cx + CELL_W / 2 - 6, cy - CELL_H / 2 + 6, '✓', { fontSize: '14px', color: T.textGreen, fontFamily: T.font }).setOrigin(1, 0));
      }
    });

    // マスク
    const maskShape = this.add.graphics().fillRect(0, HEADER_H, w, viewH);
    container.setMask(maskShape.createGeometryMask());

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
        if (Math.abs(p.y - startY) > 8) moved = true;
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
        const ratio = maxScroll > 0 ? scrollY / maxScroll : 0;
        scrollBar.y = HEADER_H + ratio * (viewH - barH) + barH / 2;
      });
    }

    // とじるボタン
    const closeBtn = makeBtn(this, w / 2, h - FOOTER_H / 2, 200, 48, { depth: 7 })
      .setInteractive({ useHandCursor: true })
      .on('pointerover', () => closeBtn.setFillStyle(0x2a4090))
      .on('pointerout',  () => closeBtn.setFillStyle(T.panelMid))
      .on('pointerdown', () => this.scene.stop('MonsterDexScene'));
    this.add.text(w / 2, h - FOOTER_H / 2, 'とじる', { ...TS.btn }).setOrigin(0.5).setDepth(8);
  }
}
