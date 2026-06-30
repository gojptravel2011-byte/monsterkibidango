import Phaser from 'phaser';
import { MessageWindow } from '../ui/MessageWindow';
import { STORY_EVENTS } from '../data/story';
import { getState } from '../state/playerState';
import { saveGame } from '../systems/save';

export class EndingScene extends Phaser.Scene {
  private chapter: number = 1;

  constructor() { super('EndingScene'); }

  init(data: { chapter?: number }): void {
    this.chapter = data?.chapter ?? 1;
  }

  create(): void {
    const w = this.scale.width;
    const h = this.scale.height;

    this.add.rectangle(w / 2, h / 2, w, h, 0x000011);

    // 星
    for (let i = 0; i < 80; i++) {
      this.add.circle(Math.random() * w, Math.random() * h, Math.random() * 2 + 1, 0xffffff, Math.random());
    }

    const msgWin = new MessageWindow(this);
    this.input.on('pointerdown', () => { if (msgWin.isVisible()) msgWin.advance(); });

    const state = getState();

    if (this.chapter === 2) {
      // ── エンディング第2章（やみのていおう撃破）──────────────
      const ch2Dialogs = [
        { speaker: '', text: 'やみのていおうを　たおした！' },
        { speaker: '', text: 'べつのせかいに　ひかりが　もどった…' },
        { speaker: '', text: 'すべての　せかいの　やみが　きえていく。' },
        { speaker: state.name, text: 'みんな　ありがとう…！\nいっしょに　たたかえて　よかった！' },
        { speaker: '', text: 'こうして　ふたつのせかいに\nほんとうの　へいわが　おとずれた。' },
      ];
      msgWin.showSequence(ch2Dialogs, () => {
        saveGame();
        this.add.text(w / 2, h * 0.50, 'かんぜんせいふく！', {
          fontSize: '42px', color: '#ffff00', fontFamily: 'sans-serif',
          stroke: '#888800', strokeThickness: 3,
        }).setOrigin(0.5);
        this.add.text(w / 2, h * 0.62, `なかまモンスター: ${state.party.length}ひき`, {
          fontSize: '20px', color: '#aaffaa', fontFamily: 'sans-serif',
        }).setOrigin(0.5);
        this.add.text(w / 2, h * 0.70, `コイン: ${state.coins}まい`, {
          fontSize: '20px', color: '#ffdd44', fontFamily: 'sans-serif',
        }).setOrigin(0.5);
        const titleBtn = this.add.rectangle(w / 2, h * 0.86, 240, 56, 0x553300)
          .setStrokeStyle(3, 0xffcc44).setInteractive({ useHandCursor: true })
          .on('pointerdown', () => this.scene.start('TitleScene'));
        this.add.text(w / 2, h * 0.86, 'タイトルへ', {
          fontSize: '22px', color: '#ffffff', fontFamily: 'sans-serif',
        }).setOrigin(0.5);
        void titleBtn;
      });
      return;
    }

    // ── エンディング第1章（やみのぬし撃破）─────────────────────
    const dialogs = STORY_EVENTS.ending.dialogs.map(d => ({
      speaker: d.speaker === 'あなた' ? state.name : d.speaker,
      text: d.text,
    }));
    // 撃破後のメッセージを追加
    const extraDialogs = [
      { speaker: '', text: 'やみのぬしは　べつのせかいへ\nにげていった…' },
      { speaker: '', text: 'あの　せかいへの　とびらが\nひらいた　きがする。' },
      { speaker: '', text: 'しょうがっこうの　こうてい…\nなにかが　かわった…？' },
    ];

    msgWin.showSequence([...dialogs, ...extraDialogs], () => {
      saveGame();
      this.add.text(w / 2, h * 0.48, 'おわり（だいいちしょう）', {
        fontSize: '36px', color: '#ffff88', fontFamily: 'sans-serif',
      }).setOrigin(0.5);

      this.add.text(w / 2, h * 0.60, `なかまモンスター: ${state.party.length}ひき`, {
        fontSize: '20px', color: '#aaffaa', fontFamily: 'sans-serif',
      }).setOrigin(0.5);
      this.add.text(w / 2, h * 0.68, `コイン: ${state.coins}まい`, {
        fontSize: '20px', color: '#ffdd44', fontFamily: 'sans-serif',
      }).setOrigin(0.5);

      // 別世界へ続けられるボタン
      const contBtn = this.add.rectangle(w / 2, h * 0.80, 300, 56, 0x223388)
        .setStrokeStyle(3, 0x8888ff).setInteractive({ useHandCursor: true })
        .on('pointerdown', () => {
          state.position = { field: 'shogakko', x: 375, y: 600 };
          this.scene.start('MapScene');
        });
      this.add.text(w / 2, h * 0.80, 'べつのせかいへ　いく', {
        fontSize: '20px', color: '#aaaaff', fontFamily: 'sans-serif',
      }).setOrigin(0.5);

      const titleBtn = this.add.rectangle(w / 2, h * 0.91, 240, 48, 0x333355)
        .setStrokeStyle(2, 0x6666aa).setInteractive({ useHandCursor: true })
        .on('pointerdown', () => this.scene.start('TitleScene'));
      this.add.text(w / 2, h * 0.91, 'タイトルへ', {
        fontSize: '20px', color: '#ccccff', fontFamily: 'sans-serif',
      }).setOrigin(0.5);
      void contBtn; void titleBtn;
    });
  }
}
