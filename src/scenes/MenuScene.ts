import Phaser from 'phaser';
import { getState } from '../state/playerState';
import { saveGame } from '../systems/save';
import { BGM } from '../systems/bgm';
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
    this.add.rectangle(w / 2, h / 2, w, h, 0x000011, 0.7).setDepth(10);

    drawPanel(this, w / 2 - 200, h / 2 - 290, 400, 580, { depth: 11 });

    this.add.text(w / 2, h * 0.18, 'メニュー', {
      ...TS.heading,
    }).setOrigin(0.5).setDepth(12);

    const items: { label: () => string; action: () => void }[] = [
      { label: () => 'モンスター　いちらん', action: () => { this.scene.launch('MonsterListScene'); this.close(); } },
      { label: () => 'そだてる', action: () => { this.scene.launch('CareScene'); this.close(); } },
      { label: () => 'もちもの', action: () => { this.scene.launch('ItemListScene'); this.close(); } },
      { label: () => 'セーブ', action: () => this.doSave() },
      { label: () => BGM.isMuted ? 'BGM: OFF（タップでON）' : 'BGM: ON（タップでOFF）', action: () => this.toggleBgm() },
      { label: () => 'とじる', action: () => this.close() },
    ];

    items.forEach((item, i) => {
      const y = h * 0.28 + i * 66;
      const bg = makeBtn(this, w / 2, y, 340, 58, { depth: 12 })
        .setInteractive({ useHandCursor: true })
        .on('pointerover', () => bg.setFillStyle(0x2a4090))
        .on('pointerout', () => bg.setFillStyle(T.panelMid));
      const text = this.add.text(w / 2, y, item.label(), {
        ...TS.btn, fontSize: '22px',
      }).setOrigin(0.5).setDepth(13);
      bg.on('pointerdown', () => { item.action(); text.setText(item.label()); });
      this.buttons.push(bg, text);
    });

    // コイン表示
    this.add.text(w / 2, h * 0.92, `コイン: ${getState().coins}まい`, {
      ...TS.coin,
    }).setOrigin(0.5).setDepth(12);
  }

  private toggleBgm(): void {
    BGM.toggleMute();
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
    }).setOrigin(0.5).setDepth(13);
    this.time.delayedCall(1500, () => this.close());
  }

  private close(): void {
    // DungeonMazeScene / MapScene は pause していないのでそのまま stop するだけでよい。
    // 呼び元シーンは MenuScene が stop された後も継続して動いている。
    this.scene.stop('MenuScene');
  }
}
