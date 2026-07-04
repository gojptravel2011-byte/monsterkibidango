import Phaser from 'phaser';
import { addCoins, addItem, addKatakanaLevel, getState } from '../state/playerState';
import { T } from '../ui/theme';
import { TS } from '../ui/StyledText';
import { KATAKANA_QUIZ_SET, SIMILAR_KATAKANA_GROUPS, type KatakanaQuizItem } from '../data/katakanaQuiz';

// ひらがな→カタカナ対応クイズ（既存のたしざん・ひきざんゲームと同じ構造・報酬を流用）

const TOTAL_QUESTIONS = 5;

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

function makeChoices(correct: KatakanaQuizItem): string[] {
  const choices = new Set<string>([correct.katakana]);
  // 見た目が似ているカタカナを優先的に混ぜる
  const group = SIMILAR_KATAKANA_GROUPS.find(g => g.includes(correct.katakana));
  if (group) {
    for (const k of shuffle(group)) {
      if (choices.size >= 4) break;
      if (k !== correct.katakana) choices.add(k);
    }
  }
  const allKatakana = KATAKANA_QUIZ_SET.map(i => i.katakana);
  for (const k of shuffle(allKatakana)) {
    if (choices.size >= 4) break;
    if (k !== correct.katakana) choices.add(k);
  }
  return shuffle([...choices]);
}

function parseReading(entry: string): { hira: string; kata: string } | null {
  const m = entry.match(/^(.+?)（(.+?)）$/);
  return m ? { hira: m[1], kata: m[2] } : null;
}

export class KatakanaQuizScene extends Phaser.Scene {
  private score = 0;
  private question = 0;
  private done = false;
  private questions: KatakanaQuizItem[] = [];
  private currentItem!: KatakanaQuizItem;

  private questionText!: Phaser.GameObjects.Text;
  private scoreText!: Phaser.GameObjects.Text;
  private questionNoText!: Phaser.GameObjects.Text;
  private feedbackText!: Phaser.GameObjects.Text;
  private explainText!: Phaser.GameObjects.Text;
  private choiceButtons: Phaser.GameObjects.GameObject[] = [];

  constructor() { super({ key: 'KatakanaQuizScene' }); }

  init(): void {
    this.score = 0;
    this.question = 0;
    this.done = false;
    // カタカナレベル（0〜10）に応じて出題範囲を広げる
    // Lv0-3: 清音のみ / Lv4-6: 濁音・半濁音まで / Lv7-10: 拗音まで
    const lv = getState().katakanaLevel;
    const maxTier = lv <= 3 ? 1 : lv <= 6 ? 2 : 3;
    const pool = KATAKANA_QUIZ_SET.filter(i => i.tier <= maxTier);
    this.questions = shuffle(pool).slice(0, TOTAL_QUESTIONS);
  }

  create(): void {
    const w = this.scale.width;
    const h = this.scale.height;

    this.add.rectangle(w / 2, h / 2, w, h, T.panelDark);
    this.add.text(w / 2, 36, 'カタカナクイズ', {
      ...TS.heading,
    }).setOrigin(0.5);

    this.questionNoText = this.add.text(w / 2, 72, '', {
      ...TS.sub,
    }).setOrigin(0.5);

    this.scoreText = this.add.text(10, 36, 'せいかい: 0', {
      ...TS.hp,
    });

    this.questionText = this.add.text(w / 2, h * 0.30, '', {
      fontSize: '30px', color: T.textLight, fontFamily: T.font,
      stroke: '#050b1a', strokeThickness: 4, align: 'center',
    }).setOrigin(0.5);

    this.feedbackText = this.add.text(w / 2, h * 0.46, '', {
      ...TS.damage,
      stroke: '#333300',
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(10);

    this.explainText = this.add.text(w / 2, h * 0.56, '', {
      fontSize: '18px', color: T.textLight, fontFamily: T.font,
      align: 'center', lineSpacing: 6,
    }).setOrigin(0.5).setDepth(10);

    this.nextQuestion();
  }

  private nextQuestion(): void {
    if (this.question >= this.questions.length) {
      this.endGame();
      return;
    }
    this.clearChoices();
    this.feedbackText.setText('');
    this.explainText.setText('');

    this.currentItem = this.questions[this.question];
    this.question++;
    this.questionNoText.setText(`もんだい ${this.question} / ${this.questions.length}`);
    this.questionText.setText(`「${this.currentItem.hiragana}」の　カタカナは\nどれでしょう？`);

    const choices = makeChoices(this.currentItem);
    this.showChoices(choices);
  }

  private showChoices(choices: string[]): void {
    const w = this.scale.width;
    const h = this.scale.height;
    const positions = [
      { x: w * 0.27, y: h * 0.72 },
      { x: w * 0.73, y: h * 0.72 },
      { x: w * 0.27, y: h * 0.86 },
      { x: w * 0.73, y: h * 0.86 },
    ];
    choices.forEach((val, i) => {
      const pos = positions[i];
      const bg = this.add.rectangle(pos.x, pos.y, 180, 76, T.panelMid, 0.92)
        .setStrokeStyle(1.5, T.borderGold)
        .setInteractive({ useHandCursor: true });
      const txt = this.add.text(pos.x, pos.y, val, {
        fontSize: '40px', color: T.textLight, fontFamily: T.font,
        stroke: '#050b1a', strokeThickness: 3,
      }).setOrigin(0.5);

      bg.on('pointerover', () => bg.setFillStyle(0x2a4090));
      bg.on('pointerout', () => bg.setFillStyle(T.panelMid));
      bg.on('pointerdown', () => this.onChoose(val, bg));

      this.choiceButtons.push(bg, txt);
    });
  }

  private onChoose(val: string, btn: Phaser.GameObjects.Rectangle): void {
    if (this.done) return;
    this.clearChoicesInteraction();

    const item = this.currentItem;
    if (val === item.katakana) {
      this.score++;
      this.scoreText.setText(`せいかい: ${this.score}`);
      btn.setFillStyle(0x226622).setStrokeStyle(3, 0x44ff44);
      this.feedbackText.setText('せいかい！ ✓').setColor(T.textGreen);
    } else {
      btn.setFillStyle(0x662222).setStrokeStyle(3, 0xff4444);
      this.feedbackText.setText(`ちがうよ、せいかいは\n「${item.katakana}」だよ`).setColor(T.textRed);
    }

    // 読み方の解説（正誤にかかわらず必ず表示）
    let explain = `「${item.katakana}」は　カタカナで\n「${item.hiragana}」と　よみます。`;
    if (item.relatedReadings && item.relatedReadings.length > 0) {
      const extras = item.relatedReadings
        .map(r => parseReading(r))
        .filter((r): r is { hira: string; kata: string } => r !== null)
        .map(r => `「${r.kata}」は「${r.hira}」`)
        .join('、');
      if (extras) explain += `\nにたじで${extras}ともよむよ。`;
    }
    this.explainText.setText(explain);

    this.time.delayedCall(2200, () => this.nextQuestion());
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
    this.clearChoices();
    this.feedbackText.setText('');
    this.explainText.setText('');

    const w = this.scale.width;
    const h = this.scale.height;
    this.questionText.setText('');
    this.questionNoText.setText('');

    const total = this.questions.length;
    const coinPerCorrect = 10;
    const coins = this.score * coinPerCorrect;
    addCoins(coins);
    const passScore = Math.ceil(total * 0.8);
    let leveledUp = false;
    if (this.score >= passScore) {
      addItem('tabenoko', 1);
      addKatakanaLevel(1);
      leveledUp = true;
    }

    const resultColor = this.score >= passScore ? T.textGold : this.score >= Math.floor(total / 2) ? T.textGreen : T.textRed;
    const resultMsg = this.score === total
      ? 'ぜんもん　せいかい！\nかんぺき！！'
      : this.score >= passScore ? 'すばらしい！'
      : this.score >= Math.floor(total / 2) ? 'がんばりました！'
      : 'またちゃれんじしてね！';

    this.add.text(w / 2, h * 0.30, `せいかい：${this.score} / ${total}`, {
      ...TS.body,
    }).setOrigin(0.5);

    this.add.text(w / 2, h * 0.42, resultMsg, {
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
      this.add.text(w / 2, h * 0.71, `カタカナレベルが\n${getState().katakanaLevel}に　あがった！`, {
        ...TS.body,
        color: T.textGold,
        align: 'center',
      }).setOrigin(0.5);
    }

    this.time.delayedCall(3000, () => this.scene.start('MapScene'));
  }
}
