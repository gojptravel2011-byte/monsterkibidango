import Phaser from 'phaser';
import { getState, setFlag, getFlag, addItem, addCoins, createMonsterInstance } from '../state/playerState';
import { MessageWindow } from '../ui/MessageWindow';
import { drawPanel } from '../ui/Panel';
import { TS } from '../ui/StyledText';
import { T } from '../ui/theme';
import { BGM } from '../systems/bgm';
import { activateRepel, isRepelActive, getRepelRemainSec } from '../systems/encounter';
import { playHeroIdle, type HeroDir } from '../systems/heroAnim';

const OY      = 80;  // HUD height
const MAX_FLOOR = 30;

// 階層ごとの迷路サイズ（深いほど大きくなる、奇数必須）
function floorDims(floor: number): { cols: number; rows: number; tile: number } {
  if (floor <= 5)  return { cols: 11, rows: 13, tile: 48 };
  if (floor <= 10) return { cols: 13, rows: 15, tile: 48 };
  if (floor <= 15) return { cols: 15, rows: 17, tile: 48 };
  if (floor <= 20) return { cols: 15, rows: 19, tile: 44 };
  return               { cols: 15, rows: 21, tile: 40 };
}

// ── フロア状態を戦闘後も保持するモジュールレベルキャッシュ ──────────
interface TreasureCell { r: number; c: number; taken: boolean; def: TreasureDef }
interface FloorCache {
  floor: number; cols: number; rows: number; tile: number;
  grid: boolean[][];
  stairsC: number; stairsR: number;
  healC: number;   healR: number; healUsed: boolean;
  playerC: number; playerR: number;
  treasures: TreasureCell[];
}
let _cache: FloorCache | null = null;

// ── Encounter pools scaled by floor
const POOLS: { max: number; species: string[]; lv: number }[] = [
  { max:  5,  species: ['piyon','kazepon','kusagumi'],                                  lv: 3  },
  { max: 10,  species: ['honon','denkon','iwagon','mizubon'],                           lv: 6  },
  { max: 15,  species: ['inferno_golem','blizzard_wolf','thunder_beast'],               lv: 10 },
  { max: 20,  species: ['flame_dragon','frost_giant','storm_lord'],                     lv: 15 },
  { max: 25,  species: ['vulcan_phoenix','abyss_kraken','heaven_knight'],               lv: 20 },
  { max: 29,  species: ['void_reaper','nightmare_wolf','shadow_colossus'],              lv: 26 },
  { max: 30,  species: ['kodai_dragon'],                                                lv: 80 },
];

// Treasure table by floor range
interface TreasureDef {
  itemId?: string; count?: number;
  healId?: string; healCount?: number;
  coins?: number;
  label: string;
}

function getTreasureItem(floor: number): TreasureDef {
  const r = Math.random();
  const coins = Math.floor((floor * 25 + Math.random() * 80) / 10) * 10; // 10刻みコイン

  // 26F以上：金きびだんごまたはぎん+コイン
  if (floor >= 26) {
    if (r < 0.5) return { itemId: 'kinball', count: 1, coins, label: `きんのきびだんご＋${coins}コイン` };
    return { itemId: 'ginball', count: 2, healId: 'honyakuki', healCount: 2, label: 'ぎんだんご×2＋かいふくすい×2' };
  }
  // 21-25F
  if (floor >= 21) {
    if (r < 0.35) return { itemId: 'ginball', count: 2, coins, label: `ぎんだんご×2＋${coins}コイン` };
    if (r < 0.65) return { coins: coins + 200, healId: 'honyakuki', healCount: 3, label: `${coins + 200}コイン＋かいふくすい×3` };
    return { itemId: 'ginball', count: 1, healId: 'honyakuki', healCount: 2, label: 'ぎんだんご×1＋かいふくすい×2' };
  }
  // 16-20F
  if (floor >= 16) {
    if (r < 0.4) return { itemId: 'ginball', count: 1, coins, label: `ぎんだんご×1＋${coins}コイン` };
    if (r < 0.7) return { itemId: 'douball', count: 2, healId: 'honyakuki', healCount: 2, label: 'どうだんご×2＋かいふくすい×2' };
    return { coins: coins + 150, healId: 'honyakuki', healCount: 2, label: `${coins + 150}コイン＋かいふくすい×2` };
  }
  // 11-15F
  if (floor >= 11) {
    if (r < 0.4) return { itemId: 'douball', count: 2, coins, label: `どうだんご×2＋${coins}コイン` };
    if (r < 0.7) return { coins: coins + 100, healId: 'honyakuki', healCount: 1, label: `${coins + 100}コイン＋かいふくすい` };
    return { itemId: 'daikyuball', count: 2, healId: 'honyakuki', healCount: 1, label: 'きびだんご×2＋かいふくすい' };
  }
  // 6-10F
  if (floor >= 6) {
    if (r < 0.5) return { itemId: 'daikyuball', count: 2, coins, label: `きびだんご×2＋${coins}コイン` };
    return { coins, healId: 'honyakuki', healCount: 1, label: `${coins}コイン＋かいふくすい` };
  }
  // 1-5F
  if (r < 0.5) return { itemId: 'okyuball', count: 2, coins, label: `かるいきびだんご×2＋${coins}コイン` };
  return { coins, healId: 'honyakuki', healCount: 1, label: `${coins}コイン＋かいふくすい` };
}

export class TowerDungeonScene extends Phaser.Scene {
  private floor      = 1;
  private _cols      = 11;
  private _rows      = 13;
  private _tile      = 48;
  private get ox()   { return Math.floor((750 - this._cols * this._tile) / 2); }

  private grid       : boolean[][] = [];
  private startC     = 5;
  private startR     = 11;
  private stairsC    = 5;
  private stairsR    = 1;
  private healC      = -1;
  private healR      = -1;
  private healUsed   = false;
  private treasures  : TreasureCell[] = [];

  private playerC    = 5;
  private playerR    = 11;
  private playerSpr  !: Phaser.GameObjects.Sprite;
  private lastDir    : HeroDir = 'down';
  private playerLbl  !: Phaser.GameObjects.Text;

  private tileGfx    !: Phaser.GameObjects.Graphics;
  private overlays   : Phaser.GameObjects.GameObject[] = [];
  private dpadObjs   : Phaser.GameObjects.GameObject[] = [];

  private msgWin     !: MessageWindow;
  private floorTxt   !: Phaser.GameObjects.Text;
  private coinsTxt   !: Phaser.GameObjects.Text;
  private repelTxt   !: Phaser.GameObjects.Text;

  private cursors    !: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd       !: { up: Phaser.Input.Keyboard.Key; down: Phaser.Input.Keyboard.Key; left: Phaser.Input.Keyboard.Key; right: Phaser.Input.Keyboard.Key };
  private dpadState  = { up: false, down: false, left: false, right: false };
  private lastMove   = 0;
  private readonly MOVE_CD = 180;

  constructor() { super('TowerDungeonScene'); }

  init(data?: { floor?: number }): void {
    const pos = getState().position;
    if (data?.floor !== undefined) {
      this.floor = data.floor;
    } else if (pos.field === 'tower_dungeon') {
      this.floor = pos.x > 0 ? pos.x : 1;
    } else {
      this.floor = 1;
    }
  }

  create(): void {
    BGM.play('field_dark');
    this.generateFloor();

    // BG
    this.add.rectangle(375, 600, 750, 1200, 0x06001a);

    // Tiles
    this.tileGfx = this.add.graphics();
    this.drawTiles();

    // Player sprite
    const [px, py] = this.cell2px(this.playerC, this.playerR);
    this.playerSpr = this.add.sprite(px, py, 'player')
      .setDisplaySize(54, 69).setDepth(10);
    playHeroIdle(this.playerSpr, this.lastDir);
    const state = getState();
    this.playerLbl = this.add.text(px, py - 22, state.name.charAt(0), {
      fontSize: '18px', color: '#ffffff', fontFamily: 'sans-serif',
      stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5).setDepth(11);

    // HUD
    drawPanel(this, 0, 0, 750, OY, { depth: 148, scrollFactor: 0 });
    this.floorTxt = this.add.text(10, 10, this.floorLabel(), { ...TS.label })
      .setDepth(150).setScrollFactor(0);
    this.coinsTxt = this.add.text(10, 38, `コイン: ${state.coins}`, { ...TS.coin })
      .setDepth(150).setScrollFactor(0);

    // においくさボタン（テスト用：消費しない）
    this.add.rectangle(420, 40, 140, 40, 0x1a3a1a, 0.9)
      .setStrokeStyle(2, 0x44bb44).setDepth(150).setScrollFactor(0)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        activateRepel(180000);
        this.repelTxt.setText('においくさ：3:00');
        this.repelTxt.setColor('#44ff44');
        this.msgWin.show('', 'においくさを　つかった！\n3ぷんかん　モンスターが\nでてこなくなった！');
      });
    this.add.text(420, 40, 'においくさ', {
      fontSize: '17px', color: '#44ff44', fontFamily: 'sans-serif', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(151).setScrollFactor(0);

    // においくさ残り時間表示
    this.repelTxt = this.add.text(375, 68, '', {
      fontSize: '14px', color: '#44ff44', fontFamily: 'sans-serif',
    }).setOrigin(0.5).setDepth(151).setScrollFactor(0);

    // Back button
    this.add.rectangle(665, 40, 80, 44, T.panelMid, 0.9)
      .setStrokeStyle(2, T.borderGold).setDepth(150).setScrollFactor(0)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.goBack());
    this.add.text(700, 40, 'もどる', {
      fontSize: '18px', color: '#ffffff', fontFamily: 'sans-serif',
    }).setOrigin(0.5).setDepth(151).setScrollFactor(0);

    // D-pad
    this.buildDpad();

    // Input
    this.msgWin = new MessageWindow(this);
    // Dismiss messages by tapping anywhere
    this.input.on('pointerdown', () => {
      if (this.msgWin.isVisible()) this.msgWin.advance();
    });

    this.cursors = this.input.keyboard!.createCursorKeys();
    this.wasd = {
      up:    this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      down:  this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      left:  this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      right: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };

    this.events.on('resume', () => {
      const s = getState();
      this.coinsTxt.setText(`コイン: ${s.coins}`);
      BGM.play('field_dark');
    });

    // Entry message
    const entryMsg = this.floor === MAX_FLOOR
      ? 'とうのさいしんかい！\nいにしえのドラゴンが　まちかまえている…'
      : this.floor % 5 === 0
      ? `${this.floor}かいに　とうちゃく！\nかいふくゾーンがあるよ！`
      : `${this.floor}かいに　とうちゃく！\nかいだんを　みつけよう。`;
    this.msgWin.show('', entryMsg);
  }

  // ── Maze generation ──────────────────────────────────────────────

  private applyFloorDims(): void {
    const d = floorDims(this.floor);
    this._cols = d.cols; this._rows = d.rows; this._tile = d.tile;
  }

  private generateFloor(): void {
    this.applyFloorDims();
    const COLS = this._cols, ROWS = this._rows;

    // 戦闘後は同じフロアを復元（迷路が変わらないように）
    if (_cache && _cache.floor === this.floor) {
      this._cols = _cache.cols; this._rows = _cache.rows; this._tile = _cache.tile;
      this.grid      = _cache.grid.map(row => [...row]);
      this.stairsC   = _cache.stairsC; this.stairsR = _cache.stairsR;
      this.healC     = _cache.healC;   this.healR   = _cache.healR;
      this.healUsed  = _cache.healUsed;
      this.playerC   = _cache.playerC; this.playerR = _cache.playerR;
      this.treasures = _cache.treasures.map(t => ({ ...t }));
      return;
    }

    this.grid = Array.from({ length: ROWS }, () => Array(COLS).fill(false));

    this.startC = Math.floor(COLS / 2);
    this.startR = ROWS - 2;

    // DFS carving
    const dfs = (r: number, c: number): void => {
      this.grid[r][c] = true;
      const dirs = [[0, 2],[0, -2],[2, 0],[-2, 0]].sort(() => Math.random() - 0.5);
      for (const [dr, dc] of dirs) {
        const nr = r + dr, nc = c + dc;
        if (nr >= 1 && nr <= ROWS - 2 && nc >= 1 && nc <= COLS - 2 && !this.grid[nr][nc]) {
          this.grid[r + dr / 2][c + dc / 2] = true;
          dfs(nr, nc);
        }
      }
    };
    dfs(this.startR, this.startC);

    this.playerC = this.startC;
    this.playerR = this.startR;

    // Stairs: random maze cell in top quarter (通行可能なマスのみ対象)
    let topCells: [number, number][] = [];
    for (let r = 1; r <= Math.floor(ROWS / 4); r += 2)
      for (let c = 1; c <= COLS - 2; c += 2)
        if (this.grid[r][c]) topCells.push([r, c]);
    if (topCells.length === 0) {
      // 上部に通路がない場合は迷路全体から通行可能なマスを探す
      for (let r = 1; r <= ROWS - 2; r += 2)
        for (let c = 1; c <= COLS - 2; c += 2)
          if (this.grid[r][c] && !(r === this.startR && c === this.startC)) topCells.push([r, c]);
    }
    [this.stairsR, this.stairsC] = topCells[Math.floor(Math.random() * topCells.length)];

    // Heal zone every 5 floors (not on boss floor)
    this.healUsed = false;
    const midStart = Math.floor(ROWS * 0.4), midEnd = Math.floor(ROWS * 0.7);
    if (this.floor % 5 === 0 && this.floor < MAX_FLOOR) {
      let midCells: [number, number][] = [];
      for (let r = midStart % 2 === 0 ? midStart + 1 : midStart; r <= midEnd; r += 2)
        for (let c = 1; c <= COLS - 2; c += 2)
          if (this.grid[r][c] && !(r === this.stairsR && c === this.stairsC)) midCells.push([r, c]);
      if (midCells.length === 0) {
        for (let r = 1; r <= ROWS - 2; r += 2)
          for (let c = 1; c <= COLS - 2; c += 2)
            if (this.grid[r][c] && !(r === this.stairsR && c === this.stairsC) && !(r === this.startR && c === this.startC))
              midCells.push([r, c]);
      }
      [this.healR, this.healC] = midCells[Math.floor(Math.random() * midCells.length)];
    } else {
      this.healR = -1; this.healC = -1;
    }

    // Treasures: 1 on floors 1-10, 2 on 11-20, 3 on 21+
    const treasureCount = this.floor <= 10 ? 1 : this.floor <= 20 ? 2 : 3;
    const used = new Set<string>([
      `${this.stairsR},${this.stairsC}`,
      `${this.startR},${this.startC}`,
      ...(this.healR >= 0 ? [`${this.healR},${this.healC}`] : []),
    ]);
    const candidates: [number, number][] = [];
    for (let r = 1; r <= ROWS - 2; r += 2)
      for (let c = 1; c <= COLS - 2; c += 2)
        if (this.grid[r][c] && !used.has(`${r},${c}`))
          candidates.push([r, c]);
    candidates.sort(() => Math.random() - 0.5);

    this.treasures = [];
    for (let i = 0; i < Math.min(treasureCount, candidates.length); i++) {
      const [r, c] = candidates[i];
      this.treasures.push({ r, c, taken: false, def: getTreasureItem(this.floor) });
    }
    this.saveFloor();
  }

  private saveFloor(): void {
    _cache = {
      floor: this.floor, cols: this._cols, rows: this._rows, tile: this._tile,
      grid:  this.grid.map(row => [...row]),
      stairsC: this.stairsC, stairsR: this.stairsR,
      healC: this.healC, healR: this.healR, healUsed: this.healUsed,
      playerC: this.playerC, playerR: this.playerR,
      treasures: this.treasures.map(t => ({ ...t })),
    };
  }

  // ── Drawing ──────────────────────────────────────────────────────

  private drawTiles(): void {
    const COLS = this._cols, ROWS = this._rows, TILE = this._tile, OX = this.ox;
    this.tileGfx.clear();
    this.overlays.forEach(o => { if ((o as Phaser.GameObjects.Graphics).destroy) (o as Phaser.GameObjects.Graphics).destroy(); });
    this.overlays = [];

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const wx = OX + c * TILE, wy = OY + r * TILE;
        if (this.grid[r][c]) {
          this.tileGfx.fillStyle(0x1c0840); this.tileGfx.fillRect(wx + 1, wy + 1, TILE - 2, TILE - 2);
          this.tileGfx.lineStyle(1, 0x440088, 0.18); this.tileGfx.strokeRect(wx + 1, wy + 1, TILE - 2, TILE - 2);
        } else {
          this.tileGfx.fillStyle(0x080018); this.tileGfx.fillRect(wx, wy, TILE, TILE);
          this.tileGfx.lineStyle(1, 0x6600aa, 0.22); this.tileGfx.strokeRect(wx, wy, TILE, TILE);
        }
      }
    }

    // Floor number watermark
    const wm = this.add.text(375, OY + ROWS * TILE / 2, `${this.floor}F`, {
      fontSize: '120px', color: '#ffffff', fontFamily: 'sans-serif', fontStyle: 'bold',
    }).setOrigin(0.5).setAlpha(0.04).setDepth(1);
    this.overlays.push(wm);

    // Stairs (or dragon on floor 30)
    const [sx, sy] = this.cell2px(this.stairsC, this.stairsR);
    if (this.floor < MAX_FLOOR) {
      const sg = this.add.graphics().setDepth(5);
      sg.fillStyle(0xffcc00);
      for (let i = 0; i < 4; i++) sg.fillRect(sx - 14 + i * 3, sy - 11 + i * 5, 28 - i * 6, 5);
      const sl = this.add.text(sx, sy + 16, 'かいだん↑', {
        fontSize: '13px', color: '#ffee44', fontFamily: 'sans-serif',
        stroke: '#000', strokeThickness: 2,
      }).setOrigin(0.5).setDepth(6);
      this.overlays.push(sg, sl);
    } else {
      // Boss floor 30: dragon icon at stairs position
      const defeated = getFlag('kodai_dragon_defeated');
      const inParty  = getState().party.some(m => m.speciesId === 'kodai_dragon');
      if (!defeated && !inParty) {
        const di = this.add.image(sx, sy, 'kodai_dragon').setDisplaySize(80, 80).setDepth(5);
        const dlbl = this.add.text(sx, sy + 48, 'いにしえのドラゴン！', {
          fontSize: '13px', color: '#ff88ff', fontFamily: 'sans-serif',
          stroke: '#000', strokeThickness: 2,
        }).setOrigin(0.5).setDepth(6);
        // Rainbow glow
        const dg = this.add.graphics().setDepth(4);
        dg.fillStyle(0xff44ff, 0.12); dg.fillCircle(sx, sy, 44);
        this.tweens.add({ targets: [di, dg], scaleX: 1.08, scaleY: 1.08, duration: 800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        this.overlays.push(di, dlbl, dg);
      } else {
        const cl = this.add.text(sx, sy, defeated ? 'たおした！' : 'なかまに\nなった！', {
          fontSize: '16px', color: '#ffdd44', fontFamily: 'sans-serif', align: 'center',
          stroke: '#000', strokeThickness: 2,
        }).setOrigin(0.5).setDepth(6);
        this.overlays.push(cl);
      }
    }

    // Heal zone
    if (this.healR >= 0) {
      const [hx, hy] = this.cell2px(this.healC, this.healR);
      const hg = this.add.graphics().setDepth(5);
      if (this.healUsed) {
        hg.lineStyle(2, 0x336633, 0.4); hg.strokeCircle(hx, hy, 18);
      } else {
        hg.fillStyle(0x00ff88, 0.22); hg.fillCircle(hx, hy, 18);
        hg.lineStyle(2, 0x00ff88, 0.8); hg.strokeCircle(hx, hy, 18);
      }
      const hl = this.add.text(hx, hy + 22, this.healUsed ? 'つかいすみ' : '✦かいふく', {
        fontSize: '12px', color: this.healUsed ? '#446644' : '#00ffaa',
        fontFamily: 'sans-serif', stroke: '#000', strokeThickness: 2,
      }).setOrigin(0.5).setDepth(6);
      this.overlays.push(hg, hl);
    }

    // Treasures
    for (const t of this.treasures) {
      const [tx, ty] = this.cell2px(t.c, t.r);
      const tg = this.add.graphics().setDepth(5);
      if (t.taken) {
        tg.lineStyle(2, 0x554400, 0.3); tg.strokeRect(tx - 12, ty - 16, 24, 25);
      } else {
        tg.fillStyle(0xaa6600); tg.fillRect(tx - 12, ty - 10, 24, 18);
        tg.fillStyle(0xcc8800); tg.fillRect(tx - 12, ty - 16, 24, 7);
        tg.lineStyle(2, 0xffdd44); tg.strokeRect(tx - 12, ty - 16, 24, 25);
        tg.fillStyle(0xffdd44); tg.fillRect(tx - 3, ty - 13, 6, 6); // lock
      }
      const tl = this.add.text(tx, ty + 14, t.taken ? '' : 'たから', {
        fontSize: '12px', color: '#ffdd44', fontFamily: 'sans-serif',
        stroke: '#000', strokeThickness: 2,
      }).setOrigin(0.5).setDepth(6);
      this.overlays.push(tg, tl);
    }
  }

  private buildDpad(): void {
    const mazeBottom = OY + this._rows * this._tile;
    const cy = mazeBottom + 100;
    const cx = 375;

    // 背景パネル（十字ガイド）
    const bg = this.add.graphics().setDepth(19).setScrollFactor(0);
    bg.fillStyle(0x0a0a2a, 0.85);
    bg.fillRoundedRect(cx - 110, cy - 70, 220, 140, 20);
    bg.lineStyle(2, 0x3344aa, 0.6);
    bg.strokeRoundedRect(cx - 110, cy - 70, 220, 140, 20);
    // 十字ガイドライン
    bg.lineStyle(1, 0x224488, 0.4);
    bg.lineBetween(cx, cy - 60, cx, cy + 60);
    bg.lineBetween(cx - 100, cy, cx + 100, cy);
    this.dpadObjs.push(bg);

    type DK = 'up' | 'down' | 'left' | 'right';
    const dirs: { label: string; key: DK; dx: number; dy: number }[] = [
      { label: '▲', key: 'up',    dx:   0, dy: -50 },
      { label: '▼', key: 'down',  dx:   0, dy:  50 },
      { label: '◀', key: 'left',  dx: -78, dy:   0 },
      { label: '▶', key: 'right', dx:  78, dy:   0 },
    ];
    const dp = this.dpadState;
    for (const d of dirs) {
      const bx = cx + d.dx, by = cy + d.dy;
      const btn = this.add.circle(bx, by, 32, 0x1a2d88, 0.95)
        .setStrokeStyle(3, 0x7799ff, 1)
        .setDepth(20).setScrollFactor(0)
        .setInteractive({ useHandCursor: true });
      const lbl = this.add.text(bx, by - 2, d.label, {
        fontSize: '30px', color: '#eeeeff', fontFamily: 'sans-serif', fontStyle: 'bold',
        stroke: '#001166', strokeThickness: 3,
      }).setOrigin(0.5).setDepth(21).setScrollFactor(0);
      const k = d.key;
      btn.on('pointerdown',  () => { dp[k] = true;  btn.setFillStyle(0x4466ff, 1); });
      btn.on('pointerup',    () => { dp[k] = false; btn.setFillStyle(0x1a2d88, 0.95); });
      btn.on('pointerout',   () => { dp[k] = false; btn.setFillStyle(0x1a2d88, 0.95); });
      this.dpadObjs.push(btn, lbl);
    }
  }

  private rebuildDpad(): void {
    this.dpadObjs.forEach(o => o.destroy());
    this.dpadObjs = [];
    this.buildDpad();
  }

  // ── Update ───────────────────────────────────────────────────────

  update(time: number, _delta: number): void {
    // においくさ残り時間を毎フレーム更新
    if (isRepelActive()) {
      const s = getRepelRemainSec();
      const m = Math.floor(s / 60), sec = s % 60;
      this.repelTxt.setText(`においくさ：${m}:${sec.toString().padStart(2, '0')}`);
      this.repelTxt.setColor('#44ff44');
    } else if (this.repelTxt.text !== '') {
      this.repelTxt.setText('');
    }

    if (this.msgWin.isVisible()) return;
    if (time - this.lastMove < this.MOVE_CD) return;

    let dc = 0, dr = 0;
    if      (this.cursors.left.isDown  || this.wasd.left.isDown  || this.dpadState.left)  dc = -1;
    else if (this.cursors.right.isDown || this.wasd.right.isDown || this.dpadState.right) dc =  1;
    else if (this.cursors.up.isDown    || this.wasd.up.isDown    || this.dpadState.up)    dr = -1;
    else if (this.cursors.down.isDown  || this.wasd.down.isDown  || this.dpadState.down)  dr =  1;

    if (dc !== 0 || dr !== 0) {
      this.tryMove(dc, dr);
      this.lastMove = time;
    }
  }

  private tryMove(dc: number, dr: number): void {
    const dir: HeroDir = dc < 0 ? 'left' : dc > 0 ? 'right' : dr < 0 ? 'up' : 'down';
    this.lastDir = dir;
    playHeroIdle(this.playerSpr, dir);

    const nc = this.playerC + dc, nr = this.playerR + dr;
    if (nr < 0 || nr >= this._rows || nc < 0 || nc >= this._cols) return;
    if (!this.grid[nr][nc]) return;

    this.playerC = nc; this.playerR = nr;
    const [wx, wy] = this.cell2px(nc, nr);
    this.playerSpr.x = wx; this.playerSpr.y = wy;
    this.playerLbl.x = wx; this.playerLbl.y = wy - 22;

    // Stairs / boss check
    if (nc === this.stairsC && nr === this.stairsR) { this.onStairs(); return; }
    // Heal check
    if (!this.healUsed && nc === this.healC && nr === this.healR) { this.onHeal(); return; }
    // Treasure checks
    for (const t of this.treasures) {
      if (!t.taken && nc === t.c && nr === t.r) { this.onTreasure(t); return; }
    }
    // Random encounter
    this.maybeEncounter();
  }

  private onStairs(): void {
    if (this.floor >= MAX_FLOOR) {
      // Boss floor
      const defeated = getFlag('kodai_dragon_defeated');
      const inParty  = getState().party.some(m => m.speciesId === 'kodai_dragon');
      if (defeated || inParty) {
        this.msgWin.show('', 'とうを　せいはした！\nおめでとう！\nえんじぇるほいくえんへ　もどろう。',
          () => this.goBack());
        return;
      }
      const state = getState();
      if (state.party.length === 0) {
        this.msgWin.show('', 'なかまが　いないと\nたたかえないよ！'); return;
      }
      this.msgWin.showConfirm('', 'いにしえのドラゴンが　あらわれた！\nきんのきびだんごで　つかまえられるよ！\nいどみますか？', () => {
        const enemy = createMonsterInstance('kodai_dragon', 80);
        enemy.uid = 'kodai_dragon_boss';
        state.position = { field: 'tower_dungeon', x: MAX_FLOOR, y: 0 };
        this.scene.start('BattleScene', { enemy, isBoss: true });
      });
      return;
    }

    this.msgWin.showConfirm('', `${this.floor + 1}かいへ　のぼりますか？`, () => {
      _cache = null; // 新しいフロアは新規生成
      this.floor++;
      this.generateFloor();
      this.drawTiles();
      this.rebuildDpad();
      const [px, py] = this.cell2px(this.playerC, this.playerR);
      this.playerSpr.x = px; this.playerSpr.y = py;
      this.playerLbl.x = px; this.playerLbl.y = py - 22;
      this.floorTxt.setText(this.floorLabel());
      const msg = this.floor === MAX_FLOOR
        ? 'さいしんかい　30かい！\nいにしえのドラゴンが　まちかまえている！'
        : this.floor % 5 === 0
        ? `${this.floor}かいに　とうちゃく！\nかいふくゾーンがあるよ！`
        : `${this.floor}かいに　とうちゃく！`;
      this.msgWin.show('', msg);
    });
  }

  private onHeal(): void {
    const state = getState();
    const needsHeal = state.party.some(m => m.hp < m.maxHp);
    if (!needsHeal) {
      this.msgWin.show('', 'パーティは　もう　げんきだよ！'); return;
    }
    this.healUsed = true;
    if (_cache && _cache.floor === this.floor) _cache.healUsed = true;
    state.party.forEach(m => { m.hp = m.maxHp; });
    this.coinsTxt.setText(`コイン: ${state.coins}`);
    // Redraw to show "used" state
    this.drawTiles();
    const [px, py] = this.cell2px(this.playerC, this.playerR);
    this.playerSpr.x = px; this.playerSpr.y = py;
    this.playerLbl.x = px; this.playerLbl.y = py - 22;
    this.msgWin.show('', 'かいふくゾーン！\nパーティのHPが　かいふくした！');
  }

  private onTreasure(t: TreasureCell): void {
    t.taken = true;
    const def = t.def;
    if (def.itemId && def.count) addItem(def.itemId, def.count);
    if (def.healId && def.healCount) addItem(def.healId, def.healCount);
    if (def.coins) addCoins(def.coins);
    this.coinsTxt.setText(`コイン: ${getState().coins}`);
    this.drawTiles();
    const [px, py] = this.cell2px(this.playerC, this.playerR);
    this.playerSpr.x = px; this.playerSpr.y = py;
    this.playerLbl.x = px; this.playerLbl.y = py - 22;
    this.msgWin.show('', `たからばこを　あけた！\n${def.label}を\nてにいれた！`);
  }

  private maybeEncounter(): void {
    if (isRepelActive()) return; // においくさ効果中
    const chance = this.floor <= 10 ? 0.12 : this.floor <= 20 ? 0.14 : 0.16;
    if (Math.random() > chance) return;
    const state = getState();
    if (state.party.length === 0) return;

    const pool = POOLS.find(p => this.floor <= p.max) ?? POOLS[POOLS.length - 1];
    const sId  = pool.species[Math.floor(Math.random() * pool.species.length)];
    const lv   = pool.lv + Math.floor(Math.random() * 4);
    const enemy = createMonsterInstance(sId, lv);
    // 戦闘前にプレイヤー位置をキャッシュに保存
    if (_cache && _cache.floor === this.floor) {
      _cache.playerC = this.playerC; _cache.playerR = this.playerR;
    }
    state.position = { field: 'tower_dungeon', x: this.floor, y: 0 };
    this.scene.start('BattleScene', { enemy });
  }

  // ── Helpers ──────────────────────────────────────────────────────

  private cell2px(c: number, r: number): [number, number] {
    const T = this._tile, ox = this.ox;
    return [ox + c * T + T / 2, OY + r * T + T / 2];
  }

  private floorLabel(): string {
    return `とうだんじょん　${this.floor}かい / ${MAX_FLOOR}かい`;
  }

  private goBack(): void {
    const state = getState();
    state.position = { field: 'angel_hoikuen', x: 375, y: 630 };
    this.scene.start('MapScene');
  }
}
