import Phaser from 'phaser';
import {
  MAZE_GRID_ROWS, MAZE_START, MAZE_GOAL, MAZE_HEAL, MAZE_TREASURES,
  YAMI_MAZE_GRID, YAMI_START, YAMI_GOAL, YAMI_HEAL, YAMI_TREASURES,
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

const TILE     = 50;
const PLAYER_R = 15;
const SPEED    = 180;

function tileCenter(row: number, col: number): { x: number; y: number } {
  return { x: col * TILE + TILE / 2, y: row * TILE + TILE / 2 };
}

export class DungeonMazeScene extends Phaser.Scene {
  private mode: 'dungeon' | 'yami' = 'dungeon';
  private get mazeGrid()     { return this.mode === 'yami' ? YAMI_MAZE_GRID : MAZE_GRID_ROWS; }
  private get mazeCols()     { return this.mode === 'yami' ? 26 : 22; }
  private get mazeRows()     { return this.mode === 'yami' ? 44 : 30; }
  private get worldW()       { return this.mazeCols * TILE; }
  private get worldH()       { return this.mazeRows * TILE; }
  private get mazeStart()    { return this.mode === 'yami' ? YAMI_START    : MAZE_START; }
  private get mazeGoal()     { return this.mode === 'yami' ? YAMI_GOAL     : MAZE_GOAL; }
  private get mazeHeal()     { return this.mode === 'yami' ? YAMI_HEAL     : MAZE_HEAL; }
  private get mazeTreasures(){ return this.mode === 'yami' ? YAMI_TREASURES : MAZE_TREASURES; }
  private get sceneTitle()   { return this.mode === 'yami' ? 'やみのめいろ' : 'ちかめいろ'; }
  private get fieldKey()     { return this.mode === 'yami' ? 'yami_world'   : 'dungeon'; }
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

  init(data?: { mode?: 'dungeon' | 'yami' }): void {
    this.mode = data?.mode ?? 'dungeon';
  }

  create(): void {
    BGM.play('field_dark');
    resetStepCount();

    // ── 背景 ──────────────────────────────────────
    const bgColor = this.mode === 'yami' ? 0x03000a : 0x080012;
    this.add.rectangle(this.worldW / 2, this.worldH / 2, this.worldW, this.worldH, bgColor).setDepth(0);
    const wallColor = this.mode === 'yami' ? 0x1a0030 : 0x3a1a5a;
    const wallInner = this.mode === 'yami' ? 0x0a0018 : 0x1e0a30;
    const wallBorder = this.mode === 'yami' ? 0x8800cc : 0x9955dd;

    // ── タイル描画 ──────────────────────────────────
    for (let row = 0; row < this.mazeRows; row++) {
      for (let col = 0; col < this.mazeCols; col++) {
        const cell = this.mazeGrid[row][col];
        const cx = col * TILE + TILE / 2;
        const cy = row * TILE + TILE / 2;

        if (cell === 'W') {
          this.add.rectangle(cx, cy, TILE, TILE, wallColor).setStrokeStyle(1, wallBorder).setDepth(2);
          this.add.rectangle(cx, cy, TILE - 8, TILE - 8, wallInner).setDepth(2);
        } else {
          const floorA = this.mode === 'yami' ? 0x080010 : 0x110022;
          const floorB = this.mode === 'yami' ? 0x0c0018 : 0x180028;
          this.add.rectangle(cx, cy, TILE, TILE, floorA).setDepth(1);
          this.add.rectangle(cx, cy, TILE - 2, TILE - 2, floorB).setDepth(1);
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
    this.cameras.main.setBounds(0, 0, this.worldW, this.worldH);
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
    const shownKey = `shown_${this.fieldKey}_msg`;
    if (!getFlag(shownKey)) {
      setFlag(shownKey);
      const msg = this.mode === 'yami'
        ? 'やみのめいろへ　ようこそ！\nやみのていおうを　さがして　すすもう！'
        : 'ちかめいろへ　ようこそ！\nゴールをめざして　すすもう！';
      this.msgWin.show('', msg);
    }
  }

  // BattleSceneから戻ったとき保存済み座標を復元、新規入場ならスタート地点
  private resolveStartPos(state: ReturnType<typeof getState>): { x: number; y: number } {
    if (state.position.field === this.fieldKey && state.position.x > 0) {
      return { x: state.position.x, y: state.position.y };
    }
    return tileCenter(this.mazeStart.row, this.mazeStart.col);
  }

  // ── ゴールマーカー（ボスの扉）─────────────────
  private drawGoalMarker(): void {
    const { x, y } = tileCenter(this.mazeGoal.row, this.mazeGoal.col);
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
    const healFlag = `${this.fieldKey}_heal_used`;
    if (getFlag(healFlag)) return;
    const { x, y } = tileCenter(this.mazeHeal.row, this.mazeHeal.col);
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
    for (const t of this.mazeTreasures) {
      const key = `${t.row}_${t.col}`;
      const alreadyTaken = getFlag(`${this.fieldKey}_t_${key}`);
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
    this.add.text(sw / 2, 27, this.sceneTitle, { ...TS.label })
      .setOrigin(0.5).setDepth(150).setScrollFactor(0);

    // もどるボタン（確認あり）
    const backBtn = makeBtn(this, sw - 70, 27, 120, 40, { depth: 150 })
      .setScrollFactor(0)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        this.msgWin.showConfirm('', `${this.sceneTitle}を　でますか？`, () => this.goBack());
      })
      .on('pointerover', () => backBtn.setFillStyle(T.accent1))
      .on('pointerout',  () => backBtn.setFillStyle(T.panelMid));
    this.add.text(sw - 70, 27, 'もどる', { ...TS.btn, fontSize: '20px' })
      .setOrigin(0.5).setDepth(151).setScrollFactor(0);

    // メニューボタン（ハンバーガー）
    const menuX = 34, menuY = 27;
    this.add.rectangle(menuX, menuY, 52, 46, T.panelMid, 0.9)
      .setStrokeStyle(1, T.borderGold).setDepth(150).setScrollFactor(0)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        // pause/resume のキュー問題を避けるため、DungeonMazeScene は止めずに
        // MenuScene をオーバーレイ表示する。update() 内でメニュー開閉を確認する。
        this.scene.run('MenuScene');
      });
    for (let i = 0; i < 3; i++) {
      this.add.rectangle(menuX, menuY - 8 + i * 8, 26, 3, T.borderGold)
        .setDepth(151).setScrollFactor(0);
    }
  }

  // ── 仮想十字ボタン（タッチ操作用）─────────────
  // ドラッグ方向判定だと迷路の画面外まで指を動かす必要があり下方向などが
  // 押せなくなるため、画面に固定された4方向ボタンに変更する
  private buildDPad(): void {
    // HUD（高さ54）直下・左上に配置。メッセージウィンドウ（画面下202px）に被らない上部固定
    const cx  = 100;   // パッド中心X
    const cy  = 175;   // パッド中心Y
    const SZ  = 58;    // ボタン1辺サイズ
    const GAP = 60;    // 中心間距離（ボタンがぴったり隣接）

    const dirs: { dx: number; dy: number; label: string; key: 'up' | 'down' | 'left' | 'right' }[] = [
      { dx:  0, dy: -1, label: '▲', key: 'up'    },
      { dx:  0, dy:  1, label: '▼', key: 'down'  },
      { dx: -1, dy:  0, label: '◀', key: 'left'  },
      { dx:  1, dy:  0, label: '▶', key: 'right' },
    ];

    for (const d of dirs) {
      const bx = cx + d.dx * GAP;
      const by = cy + d.dy * GAP;

      // 四角ボタン（Graphics で角丸）
      const bg = this.add.graphics().setDepth(150).setScrollFactor(0);
      const drawBg = (pressed: boolean) => {
        bg.clear();
        bg.fillStyle(pressed ? 0x6633aa : 0x110022, pressed ? 0.75 : 0.38);
        bg.fillRoundedRect(bx - SZ / 2, by - SZ / 2, SZ, SZ, 10);
        bg.lineStyle(2, 0x9955dd, pressed ? 1.0 : 0.55);
        bg.strokeRoundedRect(bx - SZ / 2, by - SZ / 2, SZ, SZ, 10);
      };
      drawBg(false);

      // 当たり判定用の透明矩形
      const hit = this.add.rectangle(bx, by, SZ, SZ, 0x000000, 0)
        .setDepth(151).setScrollFactor(0)
        .setInteractive({ useHandCursor: true });

      // 矢印テキスト（統一フォント・大きめ）
      this.add.text(bx, by + 1, d.label, {
        fontSize: '30px',
        color: '#ddbbff',
        fontFamily: 'sans-serif',
        stroke: '#110022',
        strokeThickness: 2,
      }).setOrigin(0.5).setDepth(152).setScrollFactor(0).setAlpha(0.85);

      const setOn  = () => { this.padState[d.key] = true;  drawBg(true);  };
      const setOff = () => { this.padState[d.key] = false; drawBg(false); };

      hit.on('pointerdown',    setOn);
      hit.on('pointerup',      setOff);
      hit.on('pointerout',     setOff);
      hit.on('pointerupoutside', setOff);
    }

    // どこでポインターを離しても確実に解除
    this.input.on('pointerup', () => {
      this.padState.up = false; this.padState.down = false;
      this.padState.left = false; this.padState.right = false;
    });
  }

  // ── update ───────────────────────────────────
  update(_time: number, delta: number): void {
    if (this.msgWin.isVisible()) return;
    if (this.scene.isActive('MenuScene')) return;

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
      const nx = Phaser.Math.Clamp(this.player.x + vx * dt, PLAYER_R, this.worldW - PLAYER_R);
      const ny = Phaser.Math.Clamp(this.player.y + vy * dt, PLAYER_R, this.worldH - PLAYER_R);
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
          const enemy = generateEncounter(this.fieldKey, playerLevel);
          if (enemy) {
            state.position = { field: this.fieldKey, x: this.player.x, y: this.player.y };
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
    if (row < 0 || row >= this.mazeRows || col < 0 || col >= this.mazeCols) return true;
    return this.mazeGrid[row][col] === 'W';
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
    if (row < 0 || row >= this.mazeRows || col < 0 || col >= this.mazeCols) return;
    const cell = this.mazeGrid[row][col];
    if (cell === 'G') this.triggerBoss();
    else if (cell === 'H') this.triggerHeal();
    else if (cell === 'T') this.triggerTreasure(row, col);
  }

  private triggerBoss(): void {
    if (this.mode === 'yami') {
      this.triggerYamiBoss();
    } else {
      this.triggerDungeonBoss();
    }
  }

  private triggerDungeonBoss(): void {
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

  private triggerYamiBoss(): void {
    if (getFlag('yamiTeiouDefeated')) {
      this.msgWin.show('', 'やみのていおうは　すでに　たおれた。\nへいわは　もどった…');
      return;
    }
    const state = getState();
    if (state.party.length === 0) {
      this.msgWin.show('', 'なかまが　いないと\nたたかえないよ！');
      return;
    }
    const dialogs = [
      { speaker: '', text: 'やみのしろの　おくから\nなにかが　あらわれた！' },
      { speaker: 'やみのていおう', text: 'フフフ…　ここまで　よくきた。\nだが　きさまに　かつ　ことは　できん！' },
      { speaker: 'やみのていおう', text: 'このせかいは　すべて\nわしの　もの　だ！' },
    ];
    this.msgWin.showSequence(dialogs, () => {
      const enemy = createMonsterInstance('yami_no_teiou', 30);
      enemy.uid = 'yami_teiou_boss';
      state.position = { field: 'yami_world', x: this.player.x, y: this.player.y };
      this.scene.start('BattleScene', { enemy, isBoss: true });
    });
  }

  private triggerHeal(): void {
    const healFlagKey = `${this.fieldKey}_heal_used`;
    if (getFlag(healFlagKey)) {
      this.msgWin.show('', 'かいふくゾーンは\nもう　つかった。');
      return;
    }
    this.msgWin.showConfirm(
      '',
      'かいふくゾーンです。\nパーティのHPを　かいふくしますか？',
      () => {
        getState().party.forEach(m => { m.hp = m.maxHp; });
        setFlag(healFlagKey);
        this.msgWin.show('', 'パーティのHPが\nかいふくした！');
      },
    );
  }

  private triggerTreasure(row: number, col: number): void {
    const flagKey = `${this.fieldKey}_t_${row}_${col}`;
    if (getFlag(flagKey)) return;

    const t = this.mazeTreasures.find(t => t.row === row && t.col === col);
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
    const state = getState();
    if (this.mode === 'yami') {
      state.position = { field: 'angel_hoikuen', x: 375, y: 800 };
    } else {
      state.position = { field: 'shogakko', x: 375, y: 900 };
    }
    BGM.play('field_dark');
    this.scene.start('MapScene');
  }
}
