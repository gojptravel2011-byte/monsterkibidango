import Phaser from 'phaser';

export class MessageWindow {
  private scene: Phaser.Scene;
  private bg: Phaser.GameObjects.Rectangle;
  private speakerText: Phaser.GameObjects.Text;
  private bodyText: Phaser.GameObjects.Text;
  private continueIndicator: Phaser.GameObjects.Text;
  private visible: boolean = false;
  private confirmMode: boolean = false;
  private onComplete?: () => void;
  private confirmButtons: Phaser.GameObjects.GameObject[] = [];

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    const w = scene.scale.width;
    const h = scene.scale.height;
    const winH = 160;
    const y = h - winH - 10;

    this.bg = scene.add.rectangle(w / 2, y + winH / 2, w - 20, winH, 0x000033, 0.88)
      .setStrokeStyle(3, 0x8888ff).setDepth(100).setScrollFactor(0).setVisible(false);

    this.speakerText = scene.add.text(20, y + 12, '', {
      fontSize: '18px', color: '#aaffaa', fontFamily: 'sans-serif',
    }).setDepth(101).setScrollFactor(0).setVisible(false);

    this.bodyText = scene.add.text(20, y + 40, '', {
      fontSize: '20px', color: '#ffffff', fontFamily: 'sans-serif',
      wordWrap: { width: w - 50 },
    }).setDepth(101).setScrollFactor(0).setVisible(false);

    this.continueIndicator = scene.add.text(w - 40, y + winH - 30, '▼', {
      fontSize: '20px', color: '#ffff88',
    }).setDepth(101).setScrollFactor(0).setVisible(false);

    scene.tweens.add({
      targets: this.continueIndicator,
      alpha: 0, duration: 500, yoyo: true, repeat: -1,
    });
  }

  show(speaker: string, text: string, onComplete?: () => void): void {
    this.visible = true;
    this.confirmMode = false;
    this.onComplete = onComplete;
    this.bg.setVisible(true);
    this.speakerText.setText(speaker).setVisible(true);
    this.bodyText.setText(text).setVisible(true);
    this.continueIndicator.setVisible(true);
  }

  // はい／いいえ 確認ダイアログ
  showConfirm(
    speaker: string,
    text: string,
    onYes: () => void,
    onNo: () => void = () => {},
  ): void {
    this.cleanupConfirmButtons();
    this.visible = true;
    this.confirmMode = true;
    this.bg.setVisible(true);
    this.speakerText.setText(speaker).setVisible(true);
    this.bodyText.setText(text).setVisible(true);
    this.continueIndicator.setVisible(false);

    const scene = this.scene;
    const w = scene.scale.width;
    const h = scene.scale.height;
    const btnY = h - 50;

    const yesBg = scene.add.rectangle(w * 0.30, btnY, 140, 48, 0x224422, 0.95)
      .setStrokeStyle(2, 0x44ee44).setDepth(110).setScrollFactor(0)
      .setInteractive({ useHandCursor: true });
    const yesLbl = scene.add.text(w * 0.30, btnY, 'はい', {
      fontSize: '22px', color: '#44ee44', fontFamily: 'sans-serif',
    }).setOrigin(0.5).setDepth(111).setScrollFactor(0);

    const noBg = scene.add.rectangle(w * 0.70, btnY, 140, 48, 0x442222, 0.95)
      .setStrokeStyle(2, 0xee4444).setDepth(110).setScrollFactor(0)
      .setInteractive({ useHandCursor: true });
    const noLbl = scene.add.text(w * 0.70, btnY, 'いいえ', {
      fontSize: '22px', color: '#ee4444', fontFamily: 'sans-serif',
    }).setOrigin(0.5).setDepth(111).setScrollFactor(0);

    yesBg.on('pointerdown', () => { this.hide(); onYes(); });
    noBg.on('pointerdown', () => { this.hide(); onNo(); });

    this.confirmButtons = [yesBg, yesLbl, noBg, noLbl];
  }

  hide(): void {
    this.visible = false;
    this.confirmMode = false;
    this.bg.setVisible(false);
    this.speakerText.setVisible(false);
    this.bodyText.setVisible(false);
    this.continueIndicator.setVisible(false);
    this.cleanupConfirmButtons();
  }

  advance(): void {
    if (!this.visible || this.confirmMode) return;
    this.hide();
    this.onComplete?.();
  }

  isVisible(): boolean { return this.visible; }

  showSequence(
    dialogs: { speaker: string; text: string }[],
    onDone?: () => void,
  ): void {
    let index = 0;
    const next = () => {
      if (index >= dialogs.length) { onDone?.(); return; }
      const d = dialogs[index++];
      this.show(d.speaker, d.text, next);
    };
    next();
  }

  private cleanupConfirmButtons(): void {
    this.confirmButtons.forEach(b => b.destroy());
    this.confirmButtons = [];
  }
}
