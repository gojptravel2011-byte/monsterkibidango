import Phaser from 'phaser';
import { addCoins, addItem, addKeisanLevel, getState } from '../state/playerState';
import { T } from '../ui/theme';
import { TS } from '../ui/StyledText';

// たしざん・ひきざんミニゲーム
// 5問出題、正解数に応じてコインゲット（hard モードは10問・かけ算あり）

type Problem = { a: number; op: '+' | '-'; b: number; answer: number };

export class ArithmeticScene extends Phaser.Scene {
  private score: number = 0;
  private question: number = 0;
  private done: boolean = false;
  private timeLeft: number = 15;
  private difficulty: 'normal' | 'hard' = 'normal';
  private timer!: Phaser.Time.TimerEvent;

  private get totalQuestions(): number { return this.difficulty === 'hard' ? 10 : 5; }
  private get timePerQuestion(): number { return this.difficulty === 'hard' ? 20 : 20; }

  private questionText!: Phaser.GameObjects.Text;
  private scoreText!: Phaser.GameObjects.Text;
  private timeText!: Phaser.GameObjects.Text;
  private questionNoText!: Phaser.GameObjects.Text;
  private feedbackText!: Phaser.GameObjects.Text;
  private choiceButtons: Phaser.GameObjects.GameObject[] = [];
  private currentProblem!: Problem;

  constructor() { super({ key: 'ArithmeticScene' }); }

  init(data?: { difficulty?: 'normal' | 'hard' }): void {
    this.score = 0;
    this.question = 0;
    this.done = false;
    this.difficulty = data?.difficulty ?? 'normal';
    this.timeLeft = this.timePerQuestion;
  }

  create(): void {
    const w = this.scale.width;
    const h = this.scale.height;

    this.add.rectangle(w / 2, h / 2, w, h, T.panelDark);
    this.add.text(w / 2, 36, this.difficulty === 'hard' ? 'とくべつけいさん' : 'たしざん・ひきざん', {
      ...TS.heading,
    }).setOrigin(0.5);

    this.questionNoText = this.add.text(w / 2, 72, '', {
      ...TS.sub,
    }).setOrigin(0.5);

    this.scoreText = this.add.text(10, 36, 'せいかい: 0', {
      ...TS.hp,
    });

    this.timeText = this.add.text(w - 10, 36, `のこり: ${this.timePerQuestion}`, {
      ...TS.coin,
    }).setOrigin(1, 0.5);

    this.questionText = this.add.text(w / 2, h * 0.35, '', {
      fontSize: '52px', color: T.textLight, fontFamily: T.font,
      stroke: '#050b1a', strokeThickness: 4,
    }).setOrigin(0.5);

    this.feedbackText = this.add.text(w / 2, h * 0.52, '', {
      ...TS.damage,
      stroke: '#333300',
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(10);

    this.nextQuestion();
  }

  // けいさんレベル（0〜10）に応じて問題の難易度を変える
  private get keisanLevel(): number {
    return getState().keisanLevel;
  }

  private makeProblem(): Problem {
    if (this.difficulty === 'hard') {
      // とくべつけいさん：常に高難度（2〜3桁の足し算・引き算）
      const op = Math.random() < 0.5 ? '+' : '-';
      let a: number, b: number, answer: number;
      if (op === '+') {
        a = 10 + Math.floor(Math.random() * 891);
        b = 10 + Math.floor(Math.random() * 891);
        answer = a + b;
      } else {
        a = 100 + Math.floor(Math.random() * 901);
        b = 10 + Math.floor(Math.random() * (a - 10));
        answer = a - b;
      }
      return { a, op, b, answer };
    }

    const lv = this.keisanLevel;

    const add1 = (allowCarry: boolean): Problem => {
      // ひとけた＋ひとけた
      let a: number, b: number, answer: number;
      do {
        a = 1 + Math.floor(Math.random() * 9);
        b = 1 + Math.floor(Math.random() * 9);
        answer = a + b;
      } while (!allowCarry && answer > 9);
      return { a, op: '+', b, answer };
    };
    const sub1 = (allowCarry: boolean): Problem => {
      // ひとけたひくひとけた（引く数はひとけた、答えが2桁になることもある場合は引かれる数を10〜18に広げる）
      let a: number, b: number;
      if (allowCarry) {
        a = 10 + Math.floor(Math.random() * 9); // 10〜18
        b = 1 + Math.floor(Math.random() * 9);
      } else {
        a = 1 + Math.floor(Math.random() * 9);
        b = 1 + Math.floor(Math.random() * 9);
        if (b > a) [a, b] = [b, a];
      }
      return { a, op: '-', b, answer: a - b };
    };
    const add2 = (): Problem => {
      const a = 10 + Math.floor(Math.random() * 90);
      const b = 10 + Math.floor(Math.random() * 90);
      return { a, op: '+', b, answer: a + b };
    };
    const sub2 = (): Problem => {
      let a = 10 + Math.floor(Math.random() * 90);
      let b = 10 + Math.floor(Math.random() * 90);
      if (b > a) [a, b] = [b, a];
      return { a, op: '-', b, answer: a - b };
    };
    const add23 = (): Problem => {
      const a = 10 + Math.floor(Math.random() * 990);
      const b = 10 + Math.floor(Math.random() * 990);
      return { a, op: '+', b, answer: a + b };
    };
    const sub23 = (): Problem => {
      let a = 10 + Math.floor(Math.random() * 990);
      let b = 10 + Math.floor(Math.random() * 990);
      if (b > a) [a, b] = [b, a];
      return { a, op: '-', b, answer: a - b };
    };

    switch (lv) {
      case 0: return add1(false);
      case 1: return add1(true);
      case 2: return sub1(false);
      case 3: return sub1(true);
      case 4: return Math.random() < 0.5 ? add1(true) : sub1(true);
      case 5: return add2();
      case 6: return sub2();
      case 7: return Math.random() < 0.5 ? add2() : sub2();
      case 8: return add23();
      case 9: return sub23();
      default: return Math.random() < 0.5 ? add23() : sub23();
    }
  }

  private makeChoices(correct: number): number[] {
    const choices = new Set<number>([correct]);
    while (choices.size < 4) {
      const spread = correct > 1000 ? 100 : correct > 100 ? 50 : 10;
      const offset = (Math.floor(Math.random() * (spread * 2 + 1)) - spread) || spread;
      const wrong = correct + offset;
      if (wrong >= 0 && wrong !== correct) choices.add(wrong);
    }
    // シャッフル
    return [...choices].sort(() => Math.random() - 0.5);
  }

  private nextQuestion(): void {
    if (this.question >= this.totalQuestions) {
      this.endGame();
      return;
    }
    this.clearChoices();
    this.feedbackText.setText('');

    this.question++;
    this.timeLeft = this.timePerQuestion;
    this.questionNoText.setText(`もんだい ${this.question} / ${this.totalQuestions}`);

    this.currentProblem = this.makeProblem();
    const { a, op, b } = this.currentProblem;
    const opDisp = op === '+' ? 'たす' : 'ひく';
    this.questionText.setText(`${a}  ${opDisp}  ${b}  ＝  ？`);

    const choices = this.makeChoices(this.currentProblem.answer);
    this.showChoices(choices);

    this.timer?.remove();
    this.timer = this.time.addEvent({
      delay: 1000,
      repeat: 14,
      callback: () => {
        this.timeLeft--;
        this.timeText.setText(`のこり: ${this.timeLeft}`);
        if (this.timeLeft <= 0) {
          this.onTimeout();
        }
      },
    });
  }

  private showChoices(choices: number[]): void {
    const w = this.scale.width;
    const h = this.scale.height;
    const positions = [
      { x: w * 0.27, y: h * 0.65 },
      { x: w * 0.73, y: h * 0.65 },
      { x: w * 0.27, y: h * 0.80 },
      { x: w * 0.73, y: h * 0.80 },
    ];
    choices.forEach((val, i) => {
      const pos = positions[i];
      const bg = this.add.rectangle(pos.x, pos.y, 180, 76, T.panelMid, 0.92)
        .setStrokeStyle(1.5, T.borderGold)
        .setInteractive({ useHandCursor: true });
      const txt = this.add.text(pos.x, pos.y, `${val}`, {
        fontSize: '40px', color: T.textLight, fontFamily: T.font,
        stroke: '#050b1a', strokeThickness: 3,
      }).setOrigin(0.5);

      bg.on('pointerover', () => bg.setFillStyle(0x2a4090));
      bg.on('pointerout', () => bg.setFillStyle(T.panelMid));
      bg.on('pointerdown', () => this.onChoose(val, bg));

      this.choiceButtons.push(bg, txt);
    });
  }

  private onChoose(val: number, btn: Phaser.GameObjects.Rectangle): void {
    if (this.done) return;
    this.timer.remove();
    this.clearChoicesInteraction();

    if (val === this.currentProblem.answer) {
      this.score++;
      this.scoreText.setText(`せいかい: ${this.score}`);
      btn.setFillStyle(0x226622).setStrokeStyle(3, 0x44ff44);
      this.feedbackText.setText('せいかい！ ✓').setColor(T.textGreen);
    } else {
      btn.setFillStyle(0x662222).setStrokeStyle(3, 0xff4444);
      this.feedbackText.setText(`ざんねん…\nこたえは　${this.currentProblem.answer}`).setColor(T.textRed);
    }

    this.time.delayedCall(1200, () => this.nextQuestion());
  }

  private onTimeout(): void {
    if (this.done) return;
    this.clearChoicesInteraction();
    this.feedbackText.setText(`じかんぎれ！\nこたえは　${this.currentProblem.answer}`).setColor(T.textYellow);
    this.time.delayedCall(1200, () => this.nextQuestion());
  }

  private clearChoicesInteraction(): void {
    this.choiceButtons.forEach(b => {
      if (b instanceof Phaser.GameObjects.Rectangle) {
        b.disableInteractive();
      }
    });
  }

  private clearChoices(): void {
    this.choiceButtons.forEach(b => b.destroy());
    this.choiceButtons = [];
  }

  private endGame(): void {
    if (this.done) return;
    this.done = true;
    this.timer?.remove();
    this.clearChoices();
    this.feedbackText.setText('');

    const w = this.scale.width;
    const h = this.scale.height;
    this.questionText.setText('');
    this.questionNoText.setText('');
    this.timeText.setText('');

    const isHard = this.difficulty === 'hard';
    const coinPerCorrect = isHard ? 30 : 15;
    const coins = this.score * coinPerCorrect;
    addCoins(coins);
    const passScore = isHard ? 8 : 4;
    let leveledUp = false;
    if (this.score >= passScore) {
      addItem('tabenoko', isHard ? 3 : 1);
      addKeisanLevel(1);
      leveledUp = true;
    }

    const resultColor = this.score >= passScore ? T.textGold : this.score >= Math.floor(this.totalQuestions / 2) ? T.textGreen : T.textRed;
    const resultMsg = this.score === this.totalQuestions
      ? 'ぜんもん　せいかい！\nかんぺき！！'
      : this.score >= passScore ? 'すばらしい！'
      : this.score >= Math.floor(this.totalQuestions / 2) ? 'がんばりました！'
      : 'またちゃれんじしてね！';

    this.add.text(w / 2, h * 0.28, `せいかい：${this.score} / ${this.totalQuestions}`, {
      ...TS.body,
    }).setOrigin(0.5);

    this.add.text(w / 2, h * 0.40, resultMsg, {
      ...TS.heading,
      color: resultColor,
      align: 'center',
    }).setOrigin(0.5);

    this.add.text(w / 2, h * 0.55, `コイン　${coins}まい　ゲット！`, {
      ...TS.coin,
    }).setOrigin(0.5);

    if (this.score >= passScore) {
      this.add.text(w / 2, h * 0.63, 'たべのこ　ゲット！', {
        ...TS.body,
        color: T.textGreen,
      }).setOrigin(0.5);
    }

    if (leveledUp) {
      this.add.text(w / 2, h * 0.71, `けいさんレベルが\n${getState().keisanLevel}に　あがった！`, {
        ...TS.body,
        color: T.textGold,
        align: 'center',
      }).setOrigin(0.5);
    }

    this.time.delayedCall(3000, () => this.scene.start('MapScene'));
  }
}
