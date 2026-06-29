import Phaser from 'phaser';
import { getState } from '../state/playerState';
import { saveGame } from '../systems/save';
import { T } from '../ui/theme';
import { TS } from '../ui/StyledText';
import { drawPanel, makeBtn } from '../ui/Panel';

export class MenuScene extends Phaser.Scene {
  private buttons: Phaser.GameObjects.GameObject[] = [];

  constructor() { super({ key: 'MenuScene', active: false }) ; }

  create(): void {
    const w = this.scale.width;
    const h = this.scale.height;

    // 半透明オーバーレイ
    this.add.rectangle(w / 2, h / 2, w, h, 0x000011, 0.7);

    drawPanel(this, w / 2 - 190, h / 2 - 260, 380, 520);

    this.add.text(w / 2, h * 0.18, 'メニュー', {
      ...TS.heading,
    }).setOrigin(0.5);

    const items = [
      { label: 'モンスター　いちらん', action: () => { this.scene.launch('MonsterListScene'); this.close(); } },
      { label: 'そだてる', action: () => { this.scene.launch('CareScene'); this.close(); } },
      { label: 'もちもの', action: () => { this.scene.launch('ItemListScene'); this.close(); } },
      { label: 'セーブ', action: () => this.doSave() },
      { label: 'とじる', action: () => this.close() },
    ];

    items.forEach((item, i) => {
      const y = h * 0.33 + i * 72;
      const bg = makeBtn(this, w / 2, y, 320, 60)
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', item.action)
        .on('pointerover', () => bg.setFillStyle(0x2a4090))
        .on('pointerout', () => bg.setFillStyle(T.panelMid));
      const text = this.add.text(w / 2, y, item.label, {
        ...TS.btn,
      }).setOrigin(0.5);
      this.buttons.push(bg, text);
    });

    // コイン表示
    this.add.text(w / 2, h * 0.88, `コイン: ${getState().coins}まい`, {
      ...TS.coin,
    }).setOrigin(0.5);
  }

  private doSave(): void {
    saveGame();
    this.buttons.forEach(b => b.destroy());
    this.buttons = [];
    const w = this.scale.width;
    const h = this.scale.height;
    this.add.text(w / 2, h / 2, 'セーブしたよ！', {
      ...TS.body,
      color: T.textGreen,
    }).setOrigin(0.5);
    this.time.delayedCall(1500, () => this.close());
  }

  private close(): void {
    this.scene.stop('MenuScene');
    const mapScene = this.scene.get('MapScene');
    if (mapScene) this.scene.resume('MapScene');
  }
}
