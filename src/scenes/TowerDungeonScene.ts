import Phaser from 'phaser';
import { getState, setFlag, getFlag, addItem, createMonsterInstance } from '../state/playerState';
import { MessageWindow } from '../ui/MessageWindow';
import { drawPanel } from '../ui/Panel';
import { TS } from '../ui/StyledText';
import { T } from '../ui/theme';
import { BGM } from '../systems/bgm';

const TILE    = 48;
const COLS    = 15; // must be odd
const ROWS    = 21; // must be odd
const OX      = Math.floor((750 - COLS * TILE) / 2); // 15px
const OY      = 80;  // HUD height
const MAX_FLOOR = 30;

// Encounter pools scaled by floor
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
interface TreasureDef { itemId: string; count: number; label: string }
function getTreasureItem(floor: number): TreasureDef {
  if (floor >= 26) return { itemId: 'kinball',    count: 1, label: 'きんのきびだんご ×1' };
  if (floor >= 21) return { itemId: 'ginball',    count: 2, label: 'ぎんのきびだんご ×2' };
  if (floor >= 16) return { itemId: 'ginball',    count: 1, label: 'ぎんのきびだんご ×1' };
  if (floor >= 11) return { itemId: 'douball',    count: 2, label: 'どうのきびだんご ×2' };
  if (floor >= 6)  return { itemId: 'daikyuball', count: 2, label: 'きびだんご ×2' };
  return              { itemId: 'okyuball',    count: 2, label: 'かるいきびだんご ×2' };
}

interface TreasureCell { r: number; c: number; taken: boolean; def: TreasureDef }

export class TowerDungeonScene extends Phaser.Scene {
  private floor      = 1;
  private grid       : boolean[][] = [];
  private startC     = 7;
  private startR     = ROWS - 2;
  private stairsC    = 7;
  private stairsR    = 1;
  private healC      = -1;
  private healR      = -1;
  private healUsed   = false;
  private treasures  : TreasureCell[] = [];

  private playerC    = 7;
  private playerR    = ROWS - 2;
  private playerSpr  !: Phaser.GameObjects.Sprite;
  private playerLbl  !: Phaser.GameObjects.Text;

  private tileGfx    !: Phaser.GameObjects.Graphics;
  private overlays   : Phaser.GameObjects.GameObject[] = [];

  private msgWin     !: MessageWindow;
  private floorTxt   !: Phaser.GameObjects.Text;
  private coinsTxt   !: Phaser.GameObjects.Text;

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
    this.playerSpr = this.add.sprite(px, py, 'player_f0')
      .setDisplaySize(30, 38).setDepth(10);
    this.playerSpr.play('player_idle');
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

    // Back button
    this.add.rectangle(700, 40, 80, 44, T.panelMid, 0.9)
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

  private generateFloor(): void {
    this.grid = Array.from({ length: ROWS }, () => Array(COLS).fill(false));

    this.startC = Math.floor(COLS / 2); // = 7 (odd ✓)
    this.startR = ROWS - 2;             // = 19 (odd ✓)

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

    // Stairs: random maze cell in top quarter
    const topCells: [number, number][] = [];
    for (let r = 1; r <= Math.floor(ROWS / 4); r += 2)
      for (let c = 1; c <= COLS - 2; c += 2)
        topCells.push([r, c]);
    [this.stairsR, this.stairsC] = topCells[Math.floor(Math.random() * topCells.length)];

    // Heal zone every 5 floors (not on boss floor)
    this.healUsed = false;
    if (this.floor % 5 === 0 && this.floor < MAX_FLOOR) {
      const midCells: [number, number][] = [];
      for (let r = 9; r <= 13; r += 2)
        for (let c = 1; c <= COLS - 2; c += 2)
          midCells.push([r, c]);
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
  }

  // ── Drawing ──────────────────────────────────────────────────────

  private drawTiles(): void {
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
    const cy = OY + ROWS * TILE + 56; // below maze
    type DK = 'up' | 'down' | 'left' | 'right';
    const dirs: { label: string; key: DK; dx: number; dy: number }[] = [
      { label: '▲', key: 'up',    dx:   0, dy: -44 },
      { label: '▼', key: 'down',  dx:   0, dy:  44 },
      { label: '◀', key: 'left',  dx: -58, dy:   0 },
      { label: '▶', key: 'right', dx:  58, dy:   0 },
    ];
    const dp = this.dpadState;
    for (const d of dirs) {
      const bx = 375 + d.dx, by = cy + d.dy;
      const btn = this.add.rectangle(bx, by, 52, 44, T.panelMid, 0.85)
        .setStrokeStyle(2, T.borderGold).setDepth(20)
        .setInteractive({ useHandCursor: true });
      this.add.text(bx, by, d.label, {
        fontSize: '22px', color: '#ffffff', fontFamily: 'sans-serif',
      }).setOrigin(0.5).setDepth(21);
      const k = d.key;
      btn.on('pointerdown', () => { dp[k] = true; });
      btn.on('pointerup',   () => { dp[k] = false; });
      btn.on('pointerout',  () => { dp[k] = false; });
    }
  }

  // ── Update ───────────────────────────────────────────────────────

  update(time: number, _delta: number): void {
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
    const nc = this.playerC + dc, nr = this.playerR + dr;
    if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) return;
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
      this.floor++;
      this.generateFloor();
      this.drawTiles();
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
    addItem(t.def.itemId, t.def.count);
    this.coinsTxt.setText(`コイン: ${getState().coins}`);
    // Redraw tiles to remove treasure chest icon
    this.drawTiles();
    const [px, py] = this.cell2px(this.playerC, this.playerR);
    this.playerSpr.x = px; this.playerSpr.y = py;
    this.playerLbl.x = px; this.playerLbl.y = py - 22;
    this.msgWin.show('', `たからばこを　あけた！\n${t.def.label}を　てにいれた！`);
  }

  private maybeEncounter(): void {
    const chance = this.floor <= 10 ? 0.12 : this.floor <= 20 ? 0.14 : 0.16;
    if (Math.random() > chance) return;
    const state = getState();
    if (state.party.length === 0) return;

    const pool = POOLS.find(p => this.floor <= p.max) ?? POOLS[POOLS.length - 1];
    const sId  = pool.species[Math.floor(Math.random() * pool.species.length)];
    const lv   = pool.lv + Math.floor(Math.random() * 4);
    const enemy = createMonsterInstance(sId, lv);
    state.position = { field: 'tower_dungeon', x: this.floor, y: 0 };
    this.scene.start('BattleScene', { enemy });
  }

  // ── Helpers ──────────────────────────────────────────────────────

  private cell2px(c: number, r: number): [number, number] {
    return [OX + c * TILE + TILE / 2, OY + r * TILE + TILE / 2];
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
