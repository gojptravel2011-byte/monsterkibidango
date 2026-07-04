import Phaser from 'phaser';
import { getState } from '../state/playerState';
import type { MonsterInstance } from '../state/playerState';
import { MONSTER_SPECIES } from '../data/monsters';
import { T } from '../ui/theme';
import { TS } from '../ui/StyledText';
import { drawPanel, makeBtn } from '../ui/Panel';
import { previewFusion, fuse } from '../systems/FusionManager';
import { playFusionAnimation } from '../ui/FusionAnimation';
import { showFusionResultDialog } from '../ui/FusionResultDialog';

const CARD_W = 140;
const CARD_H = 150;
const CARD_GAP = 12;

export class FusionScene extends Phaser.Scene {
  private selected: string[] = []; // uid を最大2件
  private cards = new Map<string, { bg: Phaser.GameObjects.Rectangle }>();
  private feedbackText!: Phaser.GameObjects.Text;
  private fuseBtn!: Phaser.GameObjects.Rectangle;
  private fuseBtnTxt!: Phaser.GameObjects.Text;
  private busy = false;

  constructor() { super({ key: 'FusionScene', active: false }); }

  create(): void {
    this.selected = [];
    this.busy = false;
    const w = this.scale.width;
    const h = this.scale.height;

    drawPanel(this, 0, 0, w, h, { depth: 5 });
    this.add.text(w / 2, 30, 'モンスターがったい', { ...TS.heading }).setOrigin(0.5).setDepth(6);
    this.add.text(w / 2, 66, 'まぜる　なかまを　2たい　えらんでね', {
      ...TS.sub, color: T.textSub,
    }).setOrigin(0.5).setDepth(6);

    const party = getState().party;
    const cols = Math.max(1, Math.floor((w - 20) / (CARD_W + CARD_GAP)));
    const startX = (w - (cols * (CARD_W + CARD_GAP) - CARD_GAP)) / 2 + CARD_W / 2;

    party.forEach((m, i) => {
      // クロスケは合体の素材にできない（逃がせないのと同じ固定ルール）
      if (m.speciesId === 'kurosuke') return;
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = startX + col * (CARD_W + CARD_GAP);
      const y = 130 + row * (CARD_H + CARD_GAP);
      this.buildCard(m, x, y);
    });

    this.feedbackText = this.add.text(w / 2, h - 140, '', {
      ...TS.body, align: 'center',
    }).setOrigin(0.5).setDepth(7);

    this.fuseBtn = makeBtn(this, w / 2, h - 90, 260, 56, { depth: 7 });
    this.fuseBtnTxt = this.add.text(w / 2, h - 90, 'がったいする', { ...TS.btn }).setOrigin(0.5).setDepth(8);
    this.updateFuseBtnState();
    this.fuseBtn.setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.tryStartFusion())
      .on('pointerover', () => { if (this.selected.length === 2) this.fuseBtn.setFillStyle(0x2a4090); })
      .on('pointerout', () => { if (this.selected.length === 2) this.fuseBtn.setFillStyle(T.panelMid); });

    const closeBtn = makeBtn(this, w / 2, h - 30, 200, 48, { depth: 7 })
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        if (this.busy) return;
        this.scene.stop('FusionScene');
        this.scene.resume('MapScene');
      })
      .on('pointerover', () => closeBtn.setFillStyle(0x2a4090))
      .on('pointerout', () => closeBtn.setFillStyle(T.panelMid));
    this.add.text(w / 2, h - 30, 'やめる', { ...TS.btn }).setOrigin(0.5).setDepth(8);
  }

  private buildCard(m: MonsterInstance, x: number, y: number): void {
    const species = MONSTER_SPECIES[m.speciesId];
    const bg = this.add.rectangle(x, y, CARD_W, CARD_H, T.panelMid, 0.92)
      .setStrokeStyle(2, T.borderGold).setDepth(6)
      .setInteractive({ useHandCursor: true });
    this.add.image(x, y - 30, species?.spriteKey ?? 'player').setDisplaySize(64, 64).setDepth(7);
    this.add.text(x, y + 20, `${species?.name ?? m.speciesId}`, { ...TS.sub }).setOrigin(0.5).setDepth(7);
    this.add.text(x, y + 46, `Lv.${m.level}`, { ...TS.sub, color: T.textSub }).setOrigin(0.5).setDepth(7);

    this.cards.set(m.uid, { bg });
    bg.on('pointerdown', () => this.toggleSelect(m.uid, bg));
  }

  private toggleSelect(uid: string, bg: Phaser.GameObjects.Rectangle): void {
    if (this.busy) return;
    const idx = this.selected.indexOf(uid);
    if (idx >= 0) {
      this.selected.splice(idx, 1);
      bg.setStrokeStyle(2, T.borderGold);
    } else {
      if (this.selected.length >= 2) return;
      this.selected.push(uid);
      bg.setStrokeStyle(4, 0x66ffcc);
    }
    this.updateFuseBtnState();
  }

  private updateFuseBtnState(): void {
    const ready = this.selected.length === 2;
    this.fuseBtn.setFillStyle(ready ? T.panelMid : 0x333333);
    this.fuseBtnTxt.setAlpha(ready ? 1 : 0.5);
    this.feedbackText.setText('');
  }

  private tryStartFusion(): void {
    if (this.busy || this.selected.length !== 2) return;
    const [uidA, uidB] = this.selected;
    const preview = previewFusion(uidA, uidB);
    if (!preview) {
      this.feedbackText.setText('その　くみあわせでは\nがったい　できないよ！').setColor(T.textRed);
      return;
    }
    this.confirmFusion(uidA, uidB);
  }

  private confirmFusion(uidA: string, uidB: string): void {
    const w = this.scale.width, h = this.scale.height;
    const overlay = this.add.rectangle(w / 2, h / 2, w, h, 0x000000, 0.6).setDepth(20).setInteractive();
    const panel = this.add.rectangle(w / 2, h / 2, w - 100, 200, T.panelMid, 0.98)
      .setStrokeStyle(2, T.borderGold).setDepth(21);
    const msg = this.add.text(w / 2, h / 2 - 40, 'ほんとうに\nがったいする？', {
      ...TS.body, align: 'center',
    }).setOrigin(0.5).setDepth(22);

    const objs: Phaser.GameObjects.GameObject[] = [overlay, panel, msg];

    const yesBtn = this.add.rectangle(w / 2 - 90, h / 2 + 50, 150, 56, 0x224422, 0.95)
      .setStrokeStyle(2, 0x66dd88).setDepth(22)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        objs.forEach(o => o.destroy());
        this.executeFusion(uidA, uidB);
      });
    const yesTxt = this.add.text(w / 2 - 90, h / 2 + 50, 'はい', { ...TS.btn }).setOrigin(0.5).setDepth(23);

    const noBtn = this.add.rectangle(w / 2 + 90, h / 2 + 50, 150, 56, T.panelMid, 0.95)
      .setStrokeStyle(2, T.borderGold).setDepth(22)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => objs.forEach(o => o.destroy()));
    const noTxt = this.add.text(w / 2 + 90, h / 2 + 50, 'いいえ', { ...TS.btn }).setOrigin(0.5).setDepth(23);

    objs.push(yesBtn, yesTxt, noBtn, noTxt);
  }

  private executeFusion(uidA: string, uidB: string): void {
    this.busy = true;
    const w = this.scale.width, h = this.scale.height;
    const state = getState();
    const a = state.party.find(m => m.uid === uidA);
    const b = state.party.find(m => m.uid === uidB);
    if (!a || !b) { this.busy = false; return; }

    const speciesA = MONSTER_SPECIES[a.speciesId];
    const speciesB = MONSTER_SPECIES[b.speciesId];

    // 演出用に選ばれた2体を画面中央左右に大きく表示
    const spriteA = this.add.image(w * 0.22, h / 2, speciesA?.spriteKey ?? 'player')
      .setDisplaySize(110, 110).setDepth(30);
    const spriteB = this.add.image(w * 0.78, h / 2, speciesB?.spriteKey ?? 'player')
      .setDisplaySize(110, 110).setDepth(30);

    playFusionAnimation(this, spriteA, spriteB, w / 2, h / 2, () => {
      const result = fuse(uidA, uidB);
      if (result.ok) {
        showFusionResultDialog(this, result.resultInstance, () => {
          this.scene.stop('FusionScene');
          this.scene.resume('MapScene');
        });
      } else {
        this.feedbackText.setText(result.reason).setColor(T.textRed);
        this.busy = false;
      }
    });
  }
}
