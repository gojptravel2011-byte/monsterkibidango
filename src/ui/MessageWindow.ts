import Phaser from 'phaser';
import { drawPanel, makeBtn } from './Panel';
import { T } from './theme';
import { TS } from './StyledText';

export class MessageWindow {
  private scene: Phaser.Scene;
  private panel!: Phaser.GameObjects.Graphics;
  private speakerText!: Phaser.GameObjects.Text;
  private bodyText!: Phaser.GameObjects.Text;
  private indicator!: Phaser.GameObjects.Text;
  private visible: boolean = false;
  private confirmMode: boolean = false;
  private onComplete?: () => void;
  private confirmButtons: Phaser.GameObjects.GameObject[] = [];

  private readonly W: number;
  private readonly H: number;
  private readonly WIN_H = 190;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.W = scene.scale.width;
    this.H = scene.scale.height;
    this.build();
  }

  private get panelY(): number { return this.H - this.WIN_H - 12; }

  private build(): void {
    const py = this.panelY;
    const W = this.W;

    this.panel = drawPanel(this.scene, 10, py, W - 20, this.WIN_H, {
      depth: 100, scrollFactor: 0, cornerDeco: true,
    }).setVisible(false);

    this.speakerText = this.scene.add.text(26, py + 14, '', TS.speaker)
      .setDepth(101).setScrollFactor(0).setVisible(false);

    this.bodyText = this.scene.add.text(26, py + 46, '', {
      ...TS.body,
      wordWrap: { width: W - 52 },
    }).setDepth(101).setScrollFactor(0).setVisible(false);

    this.indicator = this.scene.add.text(W - 36, py + this.WIN_H - 32, '▼', {
      ...TS.label, fontSize: '22px',
    }).setDepth(101).setScrollFactor(0).setVisible(false);

    this.scene.tweens.add({
      targets: this.indicator, alpha: 0, duration: 600, yoyo: true, repeat: -1,
    });
  }

  show(speaker: string, text: string, onComplete?: () => void): void {
    this.confirmMode = false;
    this.visible = true;
    this.onComplete = onComplete;
    this.panel.setVisible(true);
    this.speakerText.setText(speaker).setVisible(!!speaker);
    this.bodyText
      .setY(speaker ? this.panelY + 46 : this.panelY + 28)
      .setText(text).setVisible(true);
    this.indicator.setVisible(true);
  }

  showConfirm(speaker: string, text: string, onYes: () => void, onNo: () => void = () => {}): void {
    this.cleanupConfirm();
    this.confirmMode = true;
    this.visible = true;
    this.panel.setVisible(true);
    this.speakerText.setText(speaker).setVisible(!!speaker);
    this.bodyText
      .setY(speaker ? this.panelY + 46 : this.panelY + 28)
      .setText(text).setVisible(true);
    this.indicator.setVisible(false);

    const { W, H } = this;
    const btnY = H - 36;
    const bw = 160, bh = 50;

    const yesBg = makeBtn(this.scene, W * 0.28, btnY, bw, bh, { depth: 110 });
    const yesLbl = this.scene.add.text(W * 0.28, btnY, 'はい', TS.btn)
      .setOrigin(0.5).setDepth(111).setScrollFactor(0);
    yesBg.setInteractive({ useHandCursor: true })
      .on('pointerover', () => yesBg.setFillStyle(0x2a4090))
      .on('pointerout',  () => yesBg.setFillStyle(T.panelMid))
      .on('pointerdown', () => { this.hide(); onYes(); });

    const noBg = makeBtn(this.scene, W * 0.72, btnY, bw, bh, { depth: 110 });
    const noLbl = this.scene.add.text(W * 0.72, btnY, 'いいえ', TS.btn)
      .setOrigin(0.5).setDepth(111).setScrollFactor(0);
    noBg.setInteractive({ useHandCursor: true })
      .on('pointerover', () => noBg.setFillStyle(0x5c1f28))
      .on('pointerout',  () => noBg.setFillStyle(T.panelMid))
      .on('pointerdown', () => { this.hide(); onNo(); });

    this.confirmButtons = [yesBg, yesLbl, noBg, noLbl];
  }

  hide(): void {
    this.visible = false;
    this.confirmMode = false;
    this.panel.setVisible(false);
    this.speakerText.setVisible(false);
    this.bodyText.setVisible(false);
    this.indicator.setVisible(false);
    this.cleanupConfirm();
  }

  advance(): void {
    if (!this.visible || this.confirmMode) return;
    this.hide();
    this.onComplete?.();
  }

  isVisible(): boolean { return this.visible; }

  showSequence(dialogs: { speaker: string; text: string }[], onDone?: () => void): void {
    let i = 0;
    const next = () => {
      if (i >= dialogs.length) { onDone?.(); return; }
      const d = dialogs[i++];
      this.show(d.speaker, d.text, next);
    };
    next();
  }

  private cleanupConfirm(): void {
    this.confirmButtons.forEach(b => b.destroy());
    this.confirmButtons = [];
  }
}
