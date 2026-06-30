import Phaser from 'phaser';
import {
  MAZE_GRID_ROWS, MAZE_START, MAZE_GOAL, MAZE_HEAL, MAZE_TREASURES,
} from '../data/maze';
import { MessageWindow } from '../ui/MessageWindow';
import {
  getState, addItem, setFlag, getFlag, createMonsterInstance,
} from '../state/playerState';
import { BGM } from '../systems/bgm';
import { countStep, generateEncounter, resetStepCount } from '../systems/encounter';
import { STORY_EVENTS } from '../data/story';
import { T } from '../ui/theme';
import { TS } from '../ui/StyledText';
import { drawPanel, makeBtn } from '../ui/Panel';

const TILE   = 50;            // 1マスのピクセルサイズ
const COLS   = 22;
const ROWS   = 30;
const WORLD_W = COLS * TILE;  // 1100px
const WORLD_H = ROWS * TILE;  // 1500px
const PLAYER_R = 15;          // 当たり判定半径（TILE/2 - 10 = 15、余裕10px）
const SPEED    = 180;

function tileCenter(row: number, col: number): { x: number; y: number } {
  return { x: col * TILE + TILE / 2, y: row * TILE + TILE / 2 };
}

export class DungeonMazeScene extends Phaser.Scene {
  private player!: Phaser.GameObjects.Sprite;
  private playerLabel!: Phaser.GameObjects.Text;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: {
    up: Phaser.Input.Keyboard.Key; down: Phaser.Input.Keyboard.Key;
    left: Phaser.Input.Keyboard.Key; right: Phaser.Input.Keyboard.Key;
  };
  private msgWin!: MessageWindow;
  private lastVx = 1;
  private moveTimer = 0;
  private currentCell = '';   // 直前にいたグリッドセル "row_col"（重複起動防止）
  private padState = { up: false, down: false, left: false, right: false };
  // 宝箱ビジュアル（取得後に空箱に切り替えるため参照を保持）
  private chestObjs = new Map<string, Phaser.GameObjects.GameObject[]>();

  constructor() { super('DungeonMazeScene'); }

  create(): void {
    BGM.play('field_dark');
    resetStepCount();

    // ── 背景 ──────────────────────────────────────
    this.add.rectangle(WORLD_W / 2, WORLD_H / 2, WORLD_W, WORLD_H, 0x080012).setDepth(0);

    // ── タイル描画 ──────────────────────────────────
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        const cell = MAZE_GRID_ROWS[row][col];
        const cx = col * TILE + TILE / 2;
        const cy = row * TILE + TILE / 2;

        if (cell === 'W') {
          this.add.rectangle(cx, cy, TILE, TILE, 0x3a1a5a).setStrokeStyle(1, 0x9955dd).setDepth(2);
          this.add.rectangle(cx, cy, TILE - 8, TILE - 8, 0x1e0a30).setDepth(2);
        } else {
          // 通路・特殊タイルの床
          this.add.rectangle(cx, cy, TILE, TILE, 0x110022).setDepth(1);
          this.add.rectangle(cx, cy, TILE - 2, TILE - 2, 0x180028).setDepth(1);
        }
      }
    }

    // ── 特殊タイルマーカー描画 ────────────────────
    this.drawGoalMarker();
    this.drawHealMarker();
    this.drawTreasureMarkers();

    // ── プレイヤー ────────────────────────────────
    const state = getState();
    const startPos = this.resolveStartPos(state);
    this.player = this.add.sprite(startPos.x, startPos.y, 'player_f0')
      .setDisplaySize(28, 38).setDepth(10);
    this.player.play('player_idle');

    this.playerLabel = this.add.text(startPos.x, startPos.y - 24, state.name.charAt(0), {
      fontSize: '22px', color: '#ffffff', fontFamily: 'sans-serif',
      stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5).setDepth(11);

    // ── カメラ ────────────────────────────────────
    this.cameras.main.setBounds(0, 0, WORLD_W, WORLD_H);
    this.cameras.main.startFollow(this.player, true, 0.12, 0.12);

    // ── キーボード ────────────────────────────────
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.wasd = {
      up:    this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      down:  this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      left:  this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      right: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };

    // ── メッセージウィンドウ ──────────────────────
    this.msgWin = new MessageWindow(this);
    this.input.on('pointerdown', (_: Phaser.Input.Pointer, objs: Phaser.GameObjects.GameObject[]) => {
      if (objs.length === 0 && this.msgWin.isVisible()) this.msgWin.advance();
    });

    // ── HUD ──────────────────────────────────────
    this.buildHUD();
    this.buildDPad();

    // 初回入場メッセージ
    if (!getFlag('shownDungeonMsg')) {
      setFlag('shownDungeonMsg');
      this.msgWin.show('', 'ちかめいろへ　ようこそ！\nゴールをめざして　すすもう！');
    }
  }

  // BattleSceneから戻ったとき保存済み座標を復元、新規入場ならスタート地点
  private resolveStartPos(state: ReturnType<typeof getState>): { x: number; y: number } {
    if (state.position.field === 'dungeon' && state.position.x > 0) {
      return { x: state.position.x, y: state.position.y };
    }
    return tileCenter(MAZE_START.row, MAZE_START.col);
  }

  // ── ゴールマーカー（ボスの扉）─────────────────
  private drawGoalMarker(): void {
    const { x, y } = tileCenter(MAZE_GOAL.row, MAZE_GOAL.col);
    this.add.rectangle(x, y, TILE, TILE, 0x440022).setStrokeStyle(2, 0xff2200).setDepth(3);
    this.add.text(x, y - 6, 'ボス', {
      fontSize: '16px', color: '#ff5555', fontFamily: 'sans-serif',
      stroke: '#000', strokeThickness: 2,
    }).setOrigin(0.5).setDepth(4);
    // 点滅
    const glow = this.add.rectangle(x, y, TILE - 4, TILE - 4, 0x880022, 0.4).setDepth(3);
    this.tweens.add({ targets: glow, alpha: 0.05, duration: 800, yoyo: true, repeat: -1 });
  }

  // ── 回復スポットマーカー ─────────────────────
  private drawHealMarker(): void {
    if (getFlag('dungeon_heal_used')) return;
    const { x, y } = tileCenter(MAZE_HEAL.row, MAZE_HEAL.col);
    const circle = this.add.circle(x, y, TILE / 2 - 4, 0x00ff88, 0.2)
      .setStrokeStyle(2, 0x00ff88, 0.9).setDepth(3);
    this.add.text(x, y, '✦', {
      fontSize: '22px', color: '#00ffaa', stroke: '#005522', strokeThickness: 2,
    }).setOrigin(0.5).setDepth(4);
    this.tweens.add({
      targets: circle, scaleX: 1.3, scaleY: 1.3, alpha: 0.1,
      duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    });
  }

  // ── 宝箱マーカー ─────────────────────────────
  private drawTreasureMarkers(): void {
    for (const t of MAZE_TREASURES) {
      const key = `${t.row}_${t.col}`;
      const alreadyTaken = getFlag(`dungeon_t_${key}`);
      const { x, y } = tileCenter(t.row, t.col);
      if (alreadyTaken) {
        this.drawEmptyChest(x, y);
      } else {
        this.drawFullChest(x, y, key);
      }
    }
  }

  private drawFullChest(x: number, y: number, key: string): void {
    const base = this.add.rectangle(x, y, TILE - 10, TILE / 2, 0xaa6600)
      .setStrokeStyle(2, 0xffdd44).setDepth(3);
    const lid  = this.add.rectangle(x, y - TILE / 8, TILE - 10, TILE / 6, 0xcc8800)
      .setStrokeStyle(1, 0xffee88).setDepth(4);
    const lbl  = this.add.text(x, y + TILE * 0.32, 'たからばこ', {
      fontSize: '13px', color: '#ffdd44', fontFamily: 'sans-serif',
      stroke: '#000', strokeThickness: 2,
    }).setOrigin(0.5).setDepth(4);
    this.chestObjs.set(key, [base, lid, lbl]);
  }

  private drawEmptyChest(x: number, y: number): void {
    // 色をグレー系に落とし蓋が開いた見た目
    this.add.rectangle(x, y + 4, TILE - 10, TILE / 2 - 4, 0x554433)
      .setStrokeStyle(1, 0x887766).setDepth(3);
    // 開いた蓋（上に跳ね上げ）
    this.add.rectangle(x, y - TILE / 2 + 2, TILE - 10, TILE / 6, 0x665544)
      .setStrokeStyle(1, 0x998877).setDepth(4);
    this.add.text(x, y + TILE * 0.38, 'からっぽ', {
      fontSize: '13px', color: '#887766', fontFamily: 'sans-serif',
      stroke: '#000', strokeThickness: 2,
    }).setOrigin(0.5).setDepth(4);
  }

  // ── HUD（カメラ固定）──────────────────────────
  private buildHUD(): void {
    const sw = this.scale.width;

    drawPanel(this, 0, 0, sw, 54, { depth: 148, scrollFactor: 0 });
    this.add.text(14, 16, 'ちかめいろ', { ...TS.label })
      .setDepth(150).setScrollFactor(0);

    const backBtn = makeBtn(this, sw - 64, 27, 110, 40, { depth: 150 })
      .setScrollFactor(0)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.goBack())
      .on('pointerover', () => backBtn.setFillStyle(T.accent1))
      .on('pointerout',  () => backBtn.setFillStyle(T.panelMid));
    this.add.text(sw - 64, 27, 'もどる', { ...TS.btn, fontSize: '20px' })
      .setOrigin(0.5).setDepth(151).setScrollFactor(0);
  }

  // ── 仮想十字ボタン（タッチ操作用）─────────────
  // ドラッグ方向判定だと迷路の画面外まで指を動かす必要があり下方向などが
  // 押せなくなるため、画面に固定された4方向ボタンに変更する
  private buildDPad(): void {
    // HUD（高さ54）のすぐ下・左上に配置
    // メッセージウィンドウ（画面下200px）に被らないよう上部に固定
    const cx = 74;   // パッド中心X
    const cy = 150;  // パッド中心Y（HUD下 + 余白）
    const btnR = 26; // ボタン半径（小さめ・目立たせすぎない）
    const gap  = 34;

    const makeDir = (dx: number, dy: number, label: string, key: 'up' | 'down' | 'left' | 'right') => {
      const bx = cx + dx * gap;
      const by = cy + dy * gap;
      const circle = this.add.circle(bx, by, btnR, 0x000000, 0.28)
        .setStrokeStyle(1, 0x9955dd, 0.5)
        .setDepth(150).setScrollFactor(0)
        .setInteractive({ useHandCursor: true });
      this.add.text(bx, by, label, {
        fontSize: '18px', color: '#ccaaff', fontFamily: 'sans-serif',
      }).setOrigin(0.5).setDepth(151).setScrollFactor(0).setAlpha(0.7);

      const setOn = () => { this.padState[key] = true; circle.setFillStyle(0x6633aa, 0.65); };
      const setOff = () => { this.padState[key] = false; circle.setFillStyle(0x000000, 0.28); };

      circle.on('pointerdown', setOn);
      circle.on('pointerup', setOff);
      circle.on('pointerout', setOff);
      circle.on('pointerupoutside', setOff);
    };

    makeDir(0, -1, '▲', 'up');
    makeDir(0,  1, '▼', 'down');
    makeDir(-1, 0, '◀', 'left');
    makeDir(1,  0, '▶', 'right');

    // ボタン以外の場所でポインターを離した場合も確実に解除する
    this.input.on('pointerup', () => {
      this.padState.up = false; this.padState.down = false;
      this.padState.left = false; this.padState.right = false;
    });
  }

  // ── update ───────────────────────────────────
  update(_time: number, delta: number): void {
    if (this.msgWin.isVisible()) return;

    const left  = this.padState.left  || this.cursors.left.isDown  || this.wasd.left.isDown;
    const right = this.padState.right || this.cursors.right.isDown || this.wasd.right.isDown;
    const up    = this.padState.up    || this.cursors.up.isDown    || this.wasd.up.isDown;
    const down  = this.padState.down  || this.cursors.down.isDown  || this.wasd.down.isDown;

    let vx = 0, vy = 0;
    if (left)  vx = -SPEED;
    if (right) vx =  SPEED;
    if (up)    vy = -SPEED;
    if (down)  vy =  SPEED;

    if (vx !== 0 || vy !== 0) {
      if (vx !== 0) this.lastVx = vx;
      this.player.setFlipX(this.lastVx < 0);
      if (this.player.anims.currentAnim?.key !== 'player_walk') this.player.play('player_walk');

      const dt = delta / 1000;
      const nx = Phaser.Math.Clamp(this.player.x + vx * dt, PLAYER_R, WORLD_W - PLAYER_R);
      const ny = Phaser.Math.Clamp(this.player.y + vy * dt, PLAYER_R, WORLD_H - PLAYER_R);
      const [rx, ry] = this.resolveWalls(nx, ny);
      this.player.x = rx;
      this.player.y = ry;
      this.playerLabel.x = rx;
      this.playerLabel.y = ry - 24;

      // ランダムエンカウント
      this.moveTimer += delta;
      if (this.moveTimer > 500) {
        this.moveTimer = 0;
        const state = getState();
        const playerLevel = state.party.length > 0 ? state.party[0].level : 1;
        if (countStep()) {
          const enemy = generateEncounter('dungeon', playerLevel);
          if (enemy) {
            state.position = { field: 'dungeon', x: this.player.x, y: this.player.y };
            this.scene.start('BattleScene', { enemy });
            return;
          }
        }
      }

      // セル変化を検知して特殊タイル判定
      const col = Math.floor(this.player.x / TILE);
      const row = Math.floor(this.player.y / TILE);
      const cellKey = `${row}_${col}`;
      if (cellKey !== this.currentCell) {
        this.currentCell = cellKey;
        this.checkSpecialTile(row, col);
      }
    } else {
      this.moveTimer = 0;
      if (this.player.anims.currentAnim?.key !== 'player_idle') this.player.play('player_idle');
    }
  }

  // ── 壁判定ヘルパー ────────────────────────────
  private isTileWall(row: number, col: number): boolean {
    if (row < 0 || row >= ROWS || col < 0 || col >= COLS) return true;
    return MAZE_GRID_ROWS[row][col] === 'W';
  }

  // ── 壁衝突解決（X軸・Y軸を独立処理してスライド移動） ──
  private resolveWalls(nextX: number, nextY: number): [number, number] {
    const r  = PLAYER_R;
    const cx = this.player.x, cy = this.player.y;
    const baseCol = Math.floor(nextX / TILE);
    const baseRow = Math.floor(nextY / TILE);

    // X軸：現在のYで判定
    let rx = nextX;
    xLoop: for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (!this.isTileWall(baseRow + dr, baseCol + dc)) continue;
        const wx = (baseCol + dc) * TILE + TILE / 2;
        const wy = (baseRow + dr) * TILE + TILE / 2;
        if (rx > wx - TILE / 2 - r && rx < wx + TILE / 2 + r &&
            cy > wy - TILE / 2 - r && cy < wy + TILE / 2 + r) {
          rx = cx; break xLoop;
        }
      }
    }

    // Y軸：解決後のXで判定
    let ry = nextY;
    yLoop: for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (!this.isTileWall(baseRow + dr, baseCol + dc)) continue;
        const wx = (baseCol + dc) * TILE + TILE / 2;
        const wy = (baseRow + dr) * TILE + TILE / 2;
        if (rx > wx - TILE / 2 - r && rx < wx + TILE / 2 + r &&
            ry > wy - TILE / 2 - r && ry < wy + TILE / 2 + r) {
          ry = cy; break yLoop;
        }
      }
    }

    return [rx, ry];
  }

  // ── 特殊タイルイベント ────────────────────────
  private checkSpecialTile(row: number, col: number): void {
    if (row < 0 || row >= ROWS || col < 0 || col >= COLS) return;
    const cell = MAZE_GRID_ROWS[row][col];
    if (cell === 'G') this.triggerBoss();
    else if (cell === 'H') this.triggerHeal();
    else if (cell === 'T') this.triggerTreasure(row, col);
  }

  private triggerBoss(): void {
    if (getFlag('rasubossDefeated')) {
      this.msgWin.show('', 'もう　やみのぬしは　いない。\nここから　にげよう。');
      return;
    }
    const state = getState();
    if (state.party.length === 0) {
      this.msgWin.show('クロスケ', 'なかまが　いないと　たたかえないよ！\nほいくえんに　もどろう！');
      return;
    }
    const dialogs = STORY_EVENTS.preRasuboss.dialogs.map(d => ({
      speaker: d.speaker === 'あなた' ? state.name : d.speaker,
      text: d.text,
    }));
    this.msgWin.showSequence(dialogs, () => {
      const enemy = createMonsterInstance('rasuboss', 12);
      enemy.uid = 'rasuboss_boss';
      state.position = { field: 'dungeon', x: this.player.x, y: this.player.y };
      this.scene.start('BattleScene', { enemy, isBoss: true });
    });
  }

  private triggerHeal(): void {
    if (getFlag('dungeon_heal_used')) {
      this.msgWin.show('', 'かいふくゾーンは\nもう　つかった。');
      return;
    }
    this.msgWin.showConfirm(
      '',
      'かいふくゾーンです。\nパーティのHPを　かいふくしますか？',
      () => {
        getState().party.forEach(m => { m.hp = m.maxHp; });
        setFlag('dungeon_heal_used');
        this.msgWin.show('', 'パーティのHPが\nかいふくした！');
      },
    );
  }

  private triggerTreasure(row: number, col: number): void {
    const flagKey = `dungeon_t_${row}_${col}`;
    if (getFlag(flagKey)) return;

    const t = MAZE_TREASURES.find(t => t.row === row && t.col === col);
    if (!t) return;

    const chestKey = `${row}_${col}`;
    this.msgWin.showConfirm(
      '',
      `たからばこがある！\nあけますか？`,
      () => {
        addItem(t.itemId, t.count);
        setFlag(flagKey);
        // 宝箱ビジュアルを「からっぽ」に差し替え
        const objs = this.chestObjs.get(chestKey);
        if (objs) {
          objs.forEach(o => o.destroy());
          this.chestObjs.delete(chestKey);
          const { x, y } = tileCenter(row, col);
          this.drawEmptyChest(x, y);
        }
        this.msgWin.show('', `たからばこをあけた！\n${t.label}\nてにいれた！`);
      },
    );
  }

  private goBack(): void {
    // しょうがっこうのジンジャ側出口付近にスポーン
    const state = getState();
    state.position = { field: 'shogakko', x: 375, y: 900 };
    BGM.play('field_dark');
    this.scene.start('MapScene');
  }
}
