import Phaser from 'phaser';
import { addCoins, addItem } from '../state/playerState';

// たしざん・ひきざんミニゲーム
// 5問出題、正解数に応じてコインゲット

type Problem = { a: number; op: '+' | '-'; b: number; answer: number };

export class ArithmeticScene extends Phaser.Scene {
  private score: number = 0;
  private question: number = 0;
  private readonly totalQuestions = 5;
  private done: boolean = false;
  private timeLeft: number = 15;
  private timer!: Phaser.Time.TimerEvent;

  private questionText!: Phaser.GameObjects.Text;
  private scoreText!: Phaser.GameObjects.Text;
  private timeText!: Phaser.GameObjects.Text;
  private questionNoText!: Phaser.GameObjects.Text;
  private feedbackText!: Phaser.GameObjects.Text;
  private choiceButtons: Phaser.GameObjects.GameObject[] = [];
  private currentProblem!: Problem;

  constructor() { super({ key: 'ArithmeticScene' }); }

  init(): void {
    this.score = 0;
    this.question = 0;
    this.done = false;
    this.timeLeft = 15;
  }

  create(): void {
    const w = this.scale.width;
    const h = this.scale.height;

    this.add.rectangle(w / 2, h / 2, w, h, 0x112244);
    this.add.text(w / 2, 36, 'たしざん・ひきざん', {
      fontSize: '30px', color: '#ffdd44', fontFamily: 'sans-serif',
    }).setOrigin(0.5);

    this.questionNoText = this.add.text(w / 2, 72, '', {
      fontSize: '36px', color: '#aaaaff', fontFamily: 'sans-serif',
    }).setOrigin(0.5);

    this.scoreText = this.add.text(10, 36, 'せいかい: 0', {
      fontSize: '36px', color: '#88ffaa', fontFamily: 'sans-serif',
    });

    this.timeText = this.add.text(w - 10, 36, 'のこり: 15', {
      fontSize: '36px', color: '#ffaaaa', fontFamily: 'sans-serif',
    }).setOrigin(1, 0.5);

    this.questionText = this.add.text(w / 2, h * 0.35, '', {
      fontSize: '52px', color: '#ffffff', fontFamily: 'sans-serif',
      stroke: '#000066', strokeThickness: 4,
    }).setOrigin(0.5);

    this.feedbackText = this.add.text(w / 2, h * 0.52, '', {
      fontSize: '36px', color: '#ffff44', fontFamily: 'sans-serif',
      stroke: '#333300', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(10);

    this.nextQuestion();
  }

  private makeProblem(): Problem {
    const op = Math.random() < 0.5 ? '+' : '-' as '+' | '-';
    let a: number, b: number, answer: number;
    if (op === '+') {
      a = 1 + Math.floor(Math.random() * 9);
      b = 1 + Math.floor(Math.random() * 9);
      answer = a + b;
    } else {
      // ひきざん：a >= b, 結果 >= 0
      a = 2 + Math.floor(Math.random() * 18);
      b = 1 + Math.floor(Math.random() * (a));
      answer = a - b;
    }
    return { a, op, b, answer };
  }

  private makeChoices(correct: number): number[] {
    const choices = new Set<number>([correct]);
    while (choices.size < 4) {
      const offset = Math.floor(Math.random() * 7) - 3;
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
    this.timeLeft = 15;
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
      const bg = this.add.rectangle(pos.x, pos.y, 150, 68, 0x334488)
        .setStrokeStyle(3, 0x8888ff)
        .setInteractive({ useHandCursor: true });
      const txt = this.add.text(pos.x, pos.y, `${val}`, {
        fontSize: '36px', color: '#ffffff', fontFamily: 'sans-serif',
      }).setOrigin(0.5);

      bg.on('pointerover', () => bg.setFillStyle(0x5566cc));
      bg.on('pointerout', () => bg.setFillStyle(0x334488));
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
      this.feedbackText.setText('せいかい！ ✓').setColor('#44ff44');
    } else {
      btn.setFillStyle(0x662222).setStrokeStyle(3, 0xff4444);
      this.feedbackText.setText(`ざんねん…\nこたえは　${this.currentProblem.answer}`).setColor('#ff6666');
    }

    this.time.delayedCall(1200, () => this.nextQuestion());
  }

  private onTimeout(): void {
    if (this.done) return;
    this.clearChoicesInteraction();
    this.feedbackText.setText(`じかんぎれ！\nこたえは　${this.currentProblem.answer}`).setColor('#ffaa44');
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

    const coins = this.score * 15;
    addCoins(coins);
    if (this.score >= 4) addItem('tabenoko', 1);

    const resultColor = this.score >= 4 ? '#ffff44' : this.score >= 2 ? '#88ffaa' : '#ffaaaa';
    const resultMsg = this.score === this.totalQuestions
      ? 'ぜんもん　せいかい！\nすごい！！'
      : this.score >= 4 ? 'とても　よくできました！'
      : this.score >= 2 ? 'がんばりました！'
      : 'またちゃれんじしてね！';

    this.add.text(w / 2, h * 0.28, `せいかい：${this.score} / ${this.totalQuestions}`, {
      fontSize: '36px', color: '#ffffff', fontFamily: 'sans-serif',
    }).setOrigin(0.5);

    this.add.text(w / 2, h * 0.40, resultMsg, {
      fontSize: '34px', color: resultColor, fontFamily: 'sans-serif', align: 'center',
    }).setOrigin(0.5);

    this.add.text(w / 2, h * 0.55, `コイン　${coins}まい　ゲット！`, {
      fontSize: '30px', color: '#88ff88', fontFamily: 'sans-serif',
    }).setOrigin(0.5);

    if (this.score >= 4) {
      this.add.text(w / 2, h * 0.63, 'たべのこ　ゲット！', {
        fontSize: '36px', color: '#aaffaa', fontFamily: 'sans-serif',
      }).setOrigin(0.5);
    }

    this.time.delayedCall(3000, () => this.scene.start('MapScene'));
  }
}
