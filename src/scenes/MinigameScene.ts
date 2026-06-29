import Phaser from 'phaser';
import { addCoins, addItem } from '../state/playerState';
import { T } from '../ui/theme';
import { TS } from '../ui/StyledText';

// ミニゲーム：おちばあつめ
// 画面に落ち葉が降ってくるのでタップして集める。10枚集めるとクリア

export class MinigameScene extends Phaser.Scene {
  private leaves: Phaser.GameObjects.Text[] = [];
  private collected: number = 0;
  private countText!: Phaser.GameObjects.Text;
  private timer!: Phaser.Time.TimerEvent;
  private timeLeft: number = 20;
  private timeText!: Phaser.GameObjects.Text;
  private done: boolean = false;
  private fromField: string = 'hoikuen';

  constructor() { super({ key: 'MinigameScene' }); }

  init(data: { fromField?: string }): void {
    this.fromField = data.fromField ?? 'hoikuen';
    this.collected = 0;
    this.timeLeft = 20;
    this.done = false;
  }

  create(): void {
    const w = this.scale.width;
    const h = this.scale.height;

    this.add.rectangle(w / 2, h / 2, w, h, T.panelDark);
    this.add.text(w / 2, 36, 'おちばを　あつめよう！', {
      ...TS.heading,
    }).setOrigin(0.5);

    this.countText = this.add.text(w / 2, 70, 'あつめた: 0 / 10', {
      ...TS.body,
    }).setOrigin(0.5);

    this.timeText = this.add.text(w - 10, 36, 'のこり: 20', {
      ...TS.coin,
    }).setOrigin(1, 0.5);

    // 落ち葉を定期的に生成
    this.time.addEvent({
      delay: 800,
      repeat: 30,
      callback: () => {
        if (!this.done) this.spawnLeaf();
      },
    });

    // タイマー
    this.timer = this.time.addEvent({
      delay: 1000,
      repeat: 19,
      callback: () => {
        this.timeLeft--;
        this.timeText.setText(`のこり: ${this.timeLeft}`);
        if (this.timeLeft <= 0) this.endGame();
      },
    });
  }

  private spawnLeaf(): void {
    const w = this.scale.width;
    const h = this.scale.height;
    const x = 40 + Math.random() * (w - 80);
    const emojis = ['🍂', '🍁', '🌿', '🍃'];
    const leaf = this.add.text(x, 80, emojis[Math.floor(Math.random() * emojis.length)], {
      fontSize: '36px',
    }).setInteractive({ useHandCursor: true });

    leaf.on('pointerdown', () => {
      if (this.done) return;
      this.collected++;
      this.countText.setText(`あつめた: ${this.collected} / 10`);
      leaf.destroy();
      this.leaves = this.leaves.filter(l => l !== leaf);
      if (this.collected >= 10) this.endGame(true);
    });

    this.tweens.add({
      targets: leaf,
      y: h - 60,
      duration: 3000 + Math.random() * 2000,
      onComplete: () => {
        leaf.destroy();
        this.leaves = this.leaves.filter(l => l !== leaf);
      },
    });

    this.leaves.push(leaf);
  }

  private endGame(success: boolean = false): void {
    if (this.done) return;
    this.done = true;
    this.timer.remove();
    this.leaves.forEach(l => l.destroy());
    this.leaves = [];

    const w = this.scale.width;
    const h = this.scale.height;

    if (success || this.collected >= 5) {
      const coins = this.collected * 10;
      addCoins(coins);
      if (success) addItem('tabenoko', 1);

      this.add.text(w / 2, h / 2 - 40, success ? 'すごい！　ぜんぶ　あつめた！' : 'がんばった！', {
        ...TS.heading,
      }).setOrigin(0.5);
      this.add.text(w / 2, h / 2 + 10, `コイン　${coins}まい　ゲット！`, {
        ...TS.coin,
      }).setOrigin(0.5);
      if (success) {
        this.add.text(w / 2, h / 2 + 45, 'たべのこ　ゲット！', {
          ...TS.body,
          color: T.textGreen,
        }).setOrigin(0.5);
      }
    } else {
      this.add.text(w / 2, h / 2, 'ざんねん…\nまた　ちゃれんじ　してね！', {
        ...TS.body,
        align: 'center',
      }).setOrigin(0.5);
    }

    this.time.delayedCall(2500, () => {
      this.scene.start('MapScene');
    });
  }
}
