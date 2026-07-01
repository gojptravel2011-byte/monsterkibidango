import Phaser from 'phaser';
import { getState, spendCoins, addCoins } from '../state/playerState';
import { MONSTER_SPECIES } from '../data/monsters';
import { drawPanel } from '../ui/Panel';
import { T } from '../ui/theme';
import { BGM } from '../systems/bgm';

// ── レーサー定義 ────────────────────────────────────────────────────
interface Racer {
  name: string;
  color: number;
  baseSpeed: number;   // 6-14
  maxStamina: number;  // 40-90
  stamina: number;
  position: number;    // 0-1000 (1周)
  finished: boolean;
  rank: number;
  isPlayer: boolean;
  odds: number;
}

const NPC_TEMPLATES: Pick<Racer, 'name' | 'color' | 'baseSpeed' | 'maxStamina'>[] = [
  { name: 'ピヨン',   color: 0xffee22, baseSpeed: 8,  maxStamina: 65 },
  { name: 'カゼポン', color: 0x88ff88, baseSpeed: 12, maxStamina: 50 },
  { name: 'ホノン',   color: 0xff6633, baseSpeed: 9,  maxStamina: 72 },
  { name: 'デンコン', color: 0xffff00, baseSpeed: 11, maxStamina: 58 },
  { name: 'ミズボン', color: 0x44aaff, baseSpeed: 10, maxStamina: 65 },
  { name: 'クサグミ', color: 0x66cc44, baseSpeed: 7,  maxStamina: 82 },
  { name: 'イワゴン', color: 0xaa8855, baseSpeed: 6,  maxStamina: 90 },
  { name: 'ドラゴン', color: 0xff4444, baseSpeed: 14, maxStamina: 42 },
];

// トラック楕円パラメータ
const CX = 375, CY = 360;
const RX = 260, RY = 145;
const LAP = 1000;

function trackPos(progress: number): [number, number] {
  const angle = -Math.PI / 2 + (progress / LAP) * 2 * Math.PI;
  return [CX + RX * Math.cos(angle), CY + RY * Math.sin(angle)];
}

function calcOdds(speed: number): number {
  // 速いほど低オッズ、遅いほど高オッズ
  return Math.max(0.5, parseFloat((8 / speed * 1.2).toFixed(1)));
}

type Phase = 'setup' | 'countdown' | 'race' | 'result';

// ── シーン ────────────────────────────────────────────────────────────
export class ElmoRaceScene extends Phaser.Scene {
  private phase: Phase = 'setup';
  private racers: Racer[] = [];
  private selectedIdx = -1;
  private betAmount = 100;
  private finishRank = 0; // player's bet racer finish rank

  // UI objects (groups by phase)
  private setupObjs: Phaser.GameObjects.GameObject[] = [];
  private raceObjs:  Phaser.GameObjects.GameObject[] = [];

  private trackGfx!: Phaser.GameObjects.Graphics;
  private racerDots: Phaser.GameObjects.Graphics[] = [];
  private racerLbls: Phaser.GameObjects.Text[] = [];
  private standingsTxt!: Phaser.GameObjects.Text;
  private countdownTxt!: Phaser.GameObjects.Text;
  private coinsTxt!: Phaser.GameObjects.Text;
  private betTxt!: Phaser.GameObjects.Text;

  private raceTimer?: Phaser.Time.TimerEvent;

  constructor() { super('ElmoRaceScene'); }

  create(): void {
    BGM.play('field');
    this.phase = 'setup';
    this.selectedIdx = -1;
    this.betAmount = 100;
    this.setupObjs = [];
    this.raceObjs = [];
    this.racerDots = [];
    this.racerLbls = [];
    this.racers = [];
    this.finishRank = 0;

    this.initRacers();

    // 背景
    this.add.rectangle(375, 600, 750, 1200, 0x0a1a0a);

    // HUD
    drawPanel(this, 0, 0, 750, 72, { depth: 9, scrollFactor: 0 });
    this.add.text(375, 22, 'エルモレース！', {
      fontSize: '28px', color: '#ffdd22', fontFamily: 'sans-serif', fontStyle: 'bold',
      stroke: '#442200', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(10).setScrollFactor(0);
    this.coinsTxt = this.add.text(16, 50, `コイン: ${getState().coins}`, {
      fontSize: '18px', color: '#ffcc44', fontFamily: 'sans-serif',
    }).setOrigin(0, 0.5).setDepth(10).setScrollFactor(0);

    // もどるボタン
    const backBtn = this.add.rectangle(680, 36, 100, 44, T.panelMid, 0.9)
      .setStrokeStyle(2, T.borderGold).setDepth(10).setScrollFactor(0)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.goBack());
    this.add.text(680, 36, 'もどる', {
      fontSize: '18px', color: '#ffffff', fontFamily: 'sans-serif',
    }).setOrigin(0.5).setDepth(11).setScrollFactor(0);
    this.setupObjs.push(backBtn);

    // トラック描画（常時表示）
    this.trackGfx = this.add.graphics().setDepth(2);
    this.drawTrack();

    // カウントダウンテキスト
    this.countdownTxt = this.add.text(CX, CY, '', {
      fontSize: '90px', color: '#ffffff', fontFamily: 'sans-serif', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 8,
    }).setOrigin(0.5).setDepth(20).setAlpha(0).setScrollFactor(0);

    // レーサードット＆ラベル
    for (let i = 0; i < this.racers.length; i++) {
      const dot = this.add.graphics().setDepth(6);
      const lbl = this.add.text(0, 0, `${i + 1}`, {
        fontSize: '13px', color: '#ffffff', fontFamily: 'sans-serif', fontStyle: 'bold',
        stroke: '#000000', strokeThickness: 2,
      }).setOrigin(0.5).setDepth(7).setAlpha(0);
      this.racerDots.push(dot);
      this.racerLbls.push(lbl);
      this.raceObjs.push(dot, lbl);
    }

    // 順位テキスト（レース中）
    this.standingsTxt = this.add.text(375, 540, '', {
      fontSize: '17px', color: '#ffffff', fontFamily: 'sans-serif',
      align: 'center', lineSpacing: 4,
    }).setOrigin(0.5, 0).setDepth(6).setAlpha(0);
    this.raceObjs.push(this.standingsTxt);

    // 賭けテキスト（HUD内）
    this.betTxt = this.add.text(375, 50, '', {
      fontSize: '14px', color: '#aaffaa', fontFamily: 'sans-serif',
    }).setOrigin(0.5, 0.5).setDepth(11).setScrollFactor(0);

    this.buildSetupUI();
  }

  // ── レーサー初期化 ───────────────────────────────────────────────
  private initRacers(): void {
    const templates = [...NPC_TEMPLATES];
    // プレイヤーの先頭モンスターがいれば最後枠と置き換え
    const party = getState().party;
    if (party.length > 0) {
      const lead = party[0];
      const sp = MONSTER_SPECIES[lead.speciesId];
      const spd = Math.max(6, Math.min(13, Math.floor(lead.level / 5) + 5));
      const sta = Math.max(40, Math.min(90, Math.floor(lead.maxHp / 8)));
      templates[7] = {
        name: sp ? sp.name : lead.speciesId,
        color: sp?.placeholderColor ?? 0xffffff,
        baseSpeed: spd,
        maxStamina: sta,
      };
    }

    this.racers = templates.map(t => ({
      ...t,
      stamina: t.maxStamina,
      position: 0,
      finished: false,
      rank: 0,
      isPlayer: false,
      odds: calcOdds(t.baseSpeed),
    }));
    // プレイヤー枠マーク（最後のもの）
    if (party.length > 0) this.racers[7].isPlayer = true;
  }

  // ── トラック描画 ─────────────────────────────────────────────────
  private drawTrack(): void {
    const g = this.trackGfx;
    g.clear();
    // 草地背景
    g.fillStyle(0x1a3d1a, 1);
    g.fillEllipse(CX, CY, (RX + 36) * 2, (RY + 36) * 2);
    // 外縁
    g.lineStyle(6, 0x88ff88, 0.8);
    g.strokeEllipse(CX, CY, (RX + 32) * 2, (RY + 32) * 2);
    // トラック面
    g.fillStyle(0x8b6914, 1);
    g.fillEllipse(CX, CY, (RX + 28) * 2, (RY + 28) * 2);
    // 内側芝
    g.fillStyle(0x1a3d1a, 1);
    g.fillEllipse(CX, CY, (RX - 28) * 2, (RY - 28) * 2);
    // 内縁
    g.lineStyle(4, 0x88ff88, 0.6);
    g.strokeEllipse(CX, CY, (RX - 28) * 2, (RY - 28) * 2);
    // スタート/ゴールライン
    const [sx, sy] = trackPos(0);
    g.lineStyle(4, 0xffffff, 0.9);
    const angle0 = -Math.PI / 2;
    const nx = -Math.sin(angle0), ny = Math.cos(angle0);
    g.lineBetween(sx + nx * 30, sy + ny * 30, sx - nx * 30, sy - ny * 30);
    g.fillStyle(0xffffff, 1);
    this.add.text(CX, CY, 'ELMO\nRACE', {
      fontSize: '28px', color: '#33aa33', fontFamily: 'sans-serif', fontStyle: 'bold',
      align: 'center', stroke: '#004400', strokeThickness: 2,
    }).setOrigin(0.5).setDepth(3);
  }

  // ── セットアップUI ───────────────────────────────────────────────
  private buildSetupUI(): void {
    const y0 = 532;
    // 「だれに かけますか？」ヘッダー
    const hdr = this.add.text(375, y0, 'だれに　かけますか？', {
      fontSize: '20px', color: '#ffdd88', fontFamily: 'sans-serif', fontStyle: 'bold',
      stroke: '#442200', strokeThickness: 2,
    }).setOrigin(0.5).setDepth(5);
    this.setupObjs.push(hdr);

    // レーサーカード (2列×4行)
    for (let i = 0; i < this.racers.length; i++) {
      const r = this.racers[i];
      const col = i % 2, row = Math.floor(i / 2);
      const bx = 185 + col * 370, by = y0 + 40 + row * 76;
      const card = this.add.rectangle(bx, by, 340, 66, 0x112211, 0.95)
        .setStrokeStyle(2, i === this.selectedIdx ? 0xffdd22 : 0x336633).setDepth(5)
        .setInteractive({ useHandCursor: true });
      // 色マーク
      this.add.circle(bx - 145, by, 16, r.color, 1).setDepth(6);
      // 名前
      const nameTxt = this.add.text(bx - 122, by - 10, r.isPlayer ? `★${r.name}` : r.name, {
        fontSize: '18px', color: r.isPlayer ? '#ffff66' : '#ffffff',
        fontFamily: 'sans-serif', fontStyle: 'bold',
      }).setOrigin(0, 0.5).setDepth(6);
      // スピード・オッズ
      const infoTxt = this.add.text(bx - 122, by + 12, `スピード:${'★'.repeat(Math.round(r.baseSpeed / 2))}  ×${r.odds}`, {
        fontSize: '14px', color: '#aaffaa', fontFamily: 'sans-serif',
      }).setOrigin(0, 0.5).setDepth(6);
      const idx = i;
      card.on('pointerdown', () => this.selectRacer(idx));
      this.setupObjs.push(card, nameTxt, infoTxt);
    }

    // コイン賭け額
    const betY = y0 + 344;
    const betHdr = this.add.text(375, betY, 'いくら　かけますか？', {
      fontSize: '18px', color: '#ffdd88', fontFamily: 'sans-serif', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(5);
    this.setupObjs.push(betHdr);

    const amounts = [50, 100, 200, 500];
    amounts.forEach((amt, i) => {
      const bx = 100 + i * 165, by = betY + 46;
      const btn = this.add.rectangle(bx, by, 150, 50, 0x222244, 0.9)
        .setStrokeStyle(2, amt === this.betAmount ? 0xffdd22 : 0x4444aa).setDepth(5)
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => this.selectBet(amt));
      const t = this.add.text(bx, by, `${amt}コイン`, {
        fontSize: '17px', color: '#aaaaff', fontFamily: 'sans-serif', fontStyle: 'bold',
      }).setOrigin(0.5).setDepth(6);
      this.setupObjs.push(btn, t);
    });

    // スタートボタン
    const startBtn = this.add.rectangle(375, betY + 120, 320, 62, 0x228822, 0.95)
      .setStrokeStyle(3, 0x66ff66).setDepth(5)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.startRace());
    this.add.text(375, betY + 120, 'スタート！', {
      fontSize: '26px', color: '#ffffff', fontFamily: 'sans-serif', fontStyle: 'bold',
      stroke: '#004400', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(6);
    this.setupObjs.push(startBtn);
  }

  private selectRacer(idx: number): void {
    this.selectedIdx = idx;
    // カードのストロークを更新（再構築不要、色だけ）
    // 簡易実装：UI再構築
    this.setupObjs.forEach(o => o.destroy());
    this.setupObjs = [];
    this.buildSetupUI();
    this.coinsTxt.setText(`コイン: ${getState().coins}`);
  }

  private selectBet(amt: number): void {
    this.betAmount = amt;
    this.setupObjs.forEach(o => o.destroy());
    this.setupObjs = [];
    this.buildSetupUI();
  }

  // ── レース開始 ───────────────────────────────────────────────────
  private startRace(): void {
    if (this.selectedIdx < 0) {
      // 選択してない場合はランダム
      this.selectedIdx = Math.floor(Math.random() * this.racers.length);
    }
    const cost = this.betAmount;
    if (!spendCoins(cost)) {
      this.showMsg('コインが　たりないよ！', () => {});
      return;
    }
    this.coinsTxt.setText(`コイン: ${getState().coins}`);

    // セットアップUI非表示
    this.setupObjs.forEach(o => o.destroy());
    this.setupObjs = [];

    // HUDにベット情報
    const r = this.racers[this.selectedIdx];
    this.betTxt.setText(`ベット:${r.name}に　${cost}コイン（×${r.odds}）`);

    // レーサー初期位置：少しずつずらしてスタート
    for (let i = 0; i < this.racers.length; i++) {
      this.racers[i].position = -i * 18; // 負値：スタート前
      this.racers[i].stamina  = this.racers[i].maxStamina;
      this.racers[i].finished = false;
      this.racers[i].rank     = 0;
    }

    // カウントダウン
    this.phase = 'countdown';
    this.countdownTxt.setAlpha(1);
    let count = 3;
    const countdown = () => {
      if (count > 0) {
        this.countdownTxt.setText(`${count}`);
        this.tweens.add({ targets: this.countdownTxt, scaleX: 1.5, scaleY: 1.5, alpha: 0,
          duration: 850, ease: 'Sine.easeIn', onComplete: () => {
            this.countdownTxt.setScale(1).setAlpha(1);
            count--;
            countdown();
          }});
      } else {
        this.countdownTxt.setText('GO！');
        this.tweens.add({ targets: this.countdownTxt, scaleX: 2, scaleY: 2, alpha: 0,
          duration: 700, ease: 'Sine.easeIn', onComplete: () => this.beginRace() });
      }
    };
    countdown();
  }

  private beginRace(): void {
    this.phase = 'race';
    this.raceObjs.forEach(o => (o as Phaser.GameObjects.GameObject & { setAlpha?: (a: number) => void }).setAlpha?.(1));
    this.standingsTxt.setAlpha(1);

    let finishedCount = 0;
    this.raceTimer = this.time.addEvent({
      delay: 80,
      loop: true,
      callback: () => {
        if (this.phase !== 'race') return;
        let anyMoving = false;
        for (const rc of this.racers) {
          if (rc.finished) continue;
          anyMoving = true;
          const staminaFactor = 0.5 + (rc.stamina / rc.maxStamina) * 0.5;
          const tick = rc.baseSpeed * (0.65 + Math.random() * 0.7) * staminaFactor;
          rc.stamina = Math.max(0, rc.stamina - tick * 0.1);
          rc.position += tick;
          if (rc.position >= LAP) {
            rc.position = LAP;
            rc.finished = true;
            finishedCount++;
            rc.rank = finishedCount;
          }
        }
        this.updateRacerVisuals();
        this.updateStandings();
        if (!anyMoving) {
          this.raceTimer?.destroy();
          this.time.delayedCall(800, () => this.showResult());
        }
      },
    });
  }

  private updateRacerVisuals(): void {
    const sorted = [...this.racers].sort((a, b) => b.position - a.position);
    for (let i = 0; i < this.racers.length; i++) {
      const r = this.racers[i];
      const pos = Math.max(0, Math.min(LAP, r.position));
      const [wx, wy] = trackPos(pos);
      // ラーンオフセット（重なり防止）
      const rank = sorted.indexOf(r);
      const angleOff = (rank % 3 - 1) * 6;
      const angle = -Math.PI / 2 + (pos / LAP) * 2 * Math.PI;
      const perpX = -Math.sin(angle), perpY = Math.cos(angle);
      const fx = wx + perpX * angleOff, fy = wy + perpY * angleOff;

      const dot = this.racerDots[i];
      dot.clear();
      dot.fillStyle(r.color, r.finished ? 0.5 : 1);
      dot.fillCircle(fx, fy, 14);
      dot.lineStyle(2, 0xffffff, r.isPlayer ? 1 : 0.5);
      dot.strokeCircle(fx, fy, 14);

      const lbl = this.racerLbls[i];
      lbl.x = fx; lbl.y = fy;
      lbl.setText(r.isPlayer ? '★' : `${i + 1}`);
    }
  }

  private updateStandings(): void {
    const sorted = [...this.racers].sort((a, b) => b.position - a.position);
    const lines = sorted.map((r, i) => {
      const pct = Math.min(100, Math.round((r.position / LAP) * 100));
      const star = r.isPlayer ? '★' : '  ';
      const fin  = r.finished ? 'ゴール！' : `${pct}%`;
      return `${i + 1}い: ${star}${r.name}  ${fin}`;
    });
    this.standingsTxt.setText(lines.join('\n'));
  }

  // ── 結果 ─────────────────────────────────────────────────────────
  private showResult(): void {
    this.phase = 'result';
    this.raceObjs.forEach(o => o.destroy());
    this.raceObjs = [];

    const bet = this.racers[this.selectedIdx];
    const winner = this.racers.find(r => r.rank === 1)!;
    const betWon = bet.rank === 1;
    const winAmt = betWon ? Math.round(this.betAmount * bet.odds) : 0;
    if (betWon) addCoins(winAmt);

    this.coinsTxt.setText(`コイン: ${getState().coins}`);
    this.betTxt.setText('');

    // 結果パネル
    const py = 540;
    drawPanel(this, 60, py - 20, 630, 440, { depth: 14 });
    this.add.text(375, py + 20, betWon ? '🎉 やった！' : '残念…', {
      fontSize: '36px', color: betWon ? '#ffdd22' : '#ff6644',
      fontFamily: 'sans-serif', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 4,
    }).setOrigin(0.5).setDepth(15);

    this.add.text(375, py + 80, `ゆうしょうは\n★${winner.name}★`, {
      fontSize: '24px', color: '#ffffff', fontFamily: 'sans-serif', align: 'center',
      stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(15);

    if (betWon) {
      this.add.text(375, py + 160, `+${winAmt}コイン\nゲット！`, {
        fontSize: '30px', color: '#ffee44', fontFamily: 'sans-serif',
        fontStyle: 'bold', align: 'center', stroke: '#442200', strokeThickness: 3,
      }).setOrigin(0.5).setDepth(15);
    } else {
      this.add.text(375, py + 160, `${this.betAmount}コイン　なくなった`, {
        fontSize: '20px', color: '#ff9966', fontFamily: 'sans-serif', align: 'center',
      }).setOrigin(0.5).setDepth(15);
    }

    // 順位一覧
    const sorted = [...this.racers].sort((a, b) => a.rank - b.rank);
    const rankLines = sorted.map((r, i) =>
      `${i + 1}い: ${r.isPlayer ? '★' : '  '}${r.name}`
    ).join('  ');
    this.add.text(375, py + 250, rankLines, {
      fontSize: '14px', color: '#cccccc', fontFamily: 'sans-serif', align: 'center',
    }).setOrigin(0.5).setDepth(15);

    // もう一度ボタン
    const again = this.add.rectangle(270, py + 350, 220, 60, 0x224422, 0.95)
      .setStrokeStyle(2, 0x66ff66).setDepth(15)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.scene.restart());
    this.add.text(270, py + 350, 'もう一度', {
      fontSize: '22px', color: '#ffffff', fontFamily: 'sans-serif', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(16);

    const back = this.add.rectangle(500, py + 350, 200, 60, 0x442211, 0.95)
      .setStrokeStyle(2, T.borderGold).setDepth(15)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.goBack());
    this.add.text(500, py + 350, 'もどる', {
      fontSize: '22px', color: '#ffffff', fontFamily: 'sans-serif', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(16);
    void again; void back;
  }

  // ── ヘルパー ─────────────────────────────────────────────────────
  private showMsg(text: string, cb: () => void): void {
    const panel = this.add.rectangle(375, 600, 500, 120, 0x111122, 0.95)
      .setStrokeStyle(2, T.borderGold).setDepth(30);
    const txt = this.add.text(375, 590, text, {
      fontSize: '22px', color: '#ffffff', fontFamily: 'sans-serif', align: 'center',
    }).setOrigin(0.5).setDepth(31);
    const btn = this.add.rectangle(375, 640, 150, 44, 0x334433, 0.9)
      .setStrokeStyle(2, 0x66bb66).setDepth(30)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => { panel.destroy(); txt.destroy(); btn.destroy(); okTxt.destroy(); cb(); });
    const okTxt = this.add.text(375, 640, 'OK', {
      fontSize: '20px', color: '#ffffff', fontFamily: 'sans-serif',
    }).setOrigin(0.5).setDepth(31);
  }

  private goBack(): void {
    this.raceTimer?.destroy();
    const pos = getState().position;
    this.scene.start('MapScene');
    void pos;
  }
}
