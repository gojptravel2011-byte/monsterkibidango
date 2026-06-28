import Phaser from 'phaser';

export interface PadState {
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
}

export class VirtualPad {
  private scene: Phaser.Scene;
  private buttons: { rect: Phaser.GameObjects.Rectangle; label: Phaser.GameObjects.Text }[] = [];
  state: PadState = { left: false, right: false, up: false, down: false };

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    const w = scene.scale.width;
    const h = scene.scale.height;
    const size = 64;
    const margin = 20;
    const baseX = w - margin - size;
    const baseY = h - margin - size * 1.5;

    const dirs: { dx: number; dy: number; key: keyof PadState; label: string }[] = [
      { dx: -1, dy: 0, key: 'left', label: '◀' },
      { dx: 1, dy: 0, key: 'right', label: '▶' },
      { dx: 0, dy: -1, key: 'up', label: '▲' },
      { dx: 0, dy: 1, key: 'down', label: '▼' },
    ];

    for (const d of dirs) {
      const x = baseX + d.dx * (size + 4);
      const y = baseY + d.dy * (size + 4);
      const rect = scene.add.rectangle(x, y, size, size, 0x334466, 0.7)
        .setStrokeStyle(2, 0x8888ff)
        .setDepth(200)
        .setScrollFactor(0)
        .setInteractive();

      const label = scene.add.text(x, y, d.label, {
        fontSize: '24px',
        color: '#ffffff',
        fontFamily: 'sans-serif',
      }).setOrigin(0.5).setDepth(201).setScrollFactor(0);

      rect.on('pointerdown', () => { this.state[d.key] = true; });
      rect.on('pointerup', () => { this.state[d.key] = false; });
      rect.on('pointerout', () => { this.state[d.key] = false; });

      this.buttons.push({ rect, label });
    }
  }

  destroy(): void {
    this.buttons.forEach(b => { b.rect.destroy(); b.label.destroy(); });
    this.buttons = [];
  }

  setVisible(v: boolean): void {
    this.buttons.forEach(b => { b.rect.setVisible(v); b.label.setVisible(v); });
  }
}
