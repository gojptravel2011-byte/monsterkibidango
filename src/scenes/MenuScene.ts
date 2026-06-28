import Phaser from 'phaser';
import { getState } from '../state/playerState';
import { saveGame } from '../systems/save';

export class MenuScene extends Phaser.Scene {
  private buttons: Phaser.GameObjects.GameObject[] = [];

  constructor() { super({ key: 'MenuScene', active: false }) ; }

  create(): void {
    const w = this.scale.width;
    const h = this.scale.height;

    // 半透明オーバーレイ
    this.add.rectangle(w / 2, h / 2, w, h, 0x000000, 0.6);

    const panel = this.add.rectangle(w / 2, h / 2, 320, 420, 0x112244)
      .setStrokeStyle(3, 0x8888ff);

    this.add.text(w / 2, h * 0.18, 'メニュー', {
      fontSize: '26px', color: '#ffff88', fontFamily: 'sans-serif',
    }).setOrigin(0.5);

    const items = [
      { label: 'モンスター　いちらん', action: () => { this.scene.launch('MonsterListScene'); this.close(); } },
      { label: 'そだてる', action: () => { this.scene.launch('CareScene'); this.close(); } },
      { label: 'セーブ', action: () => this.doSave() },
      { label: 'とじる', action: () => this.close() },
    ];

    items.forEach((item, i) => {
      const y = h * 0.33 + i * 72;
      const bg = this.add.rectangle(w / 2, y, 280, 56, 0x334488)
        .setStrokeStyle(2, 0x8888ff)
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', item.action)
        .on('pointerover', () => bg.setFillStyle(0x5566aa))
        .on('pointerout', () => bg.setFillStyle(0x334488));
      const text = this.add.text(w / 2, y, item.label, {
        fontSize: '18px', color: '#ffffff', fontFamily: 'sans-serif',
      }).setOrigin(0.5);
      this.buttons.push(bg, text);
    });

    // コイン表示
    this.add.text(w / 2, h * 0.88, `コイン: ${getState().coins}まい`, {
      fontSize: '18px', color: '#ffdd44', fontFamily: 'sans-serif',
    }).setOrigin(0.5);
  }

  private doSave(): void {
    saveGame();
    this.buttons.forEach(b => b.destroy());
    this.buttons = [];
    const w = this.scale.width;
    const h = this.scale.height;
    this.add.text(w / 2, h / 2, 'セーブしたよ！', {
      fontSize: '24px', color: '#88ff88', fontFamily: 'sans-serif',
    }).setOrigin(0.5);
    this.time.delayedCall(1500, () => this.close());
  }

  private close(): void {
    this.scene.stop('MenuScene');
    const mapScene = this.scene.get('MapScene');
    if (mapScene) this.scene.resume('MapScene');
  }
}
