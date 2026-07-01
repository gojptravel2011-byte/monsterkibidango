import Phaser from 'phaser';
import { getState, setFlag, getFlag, addItem, createMonsterInstance } from '../state/playerState';
import { MessageWindow } from '../ui/MessageWindow';
import { drawPanel } from '../ui/Panel';
import { TS } from '../ui/StyledText';
import { T } from '../ui/theme';
import { BGM } from '../systems/bgm';

const TILE  = 48;
const COLS  = 15; // must be odd
const ROWS  = 21; // must be odd
const OX    = Math.floor((750 - COLS * TILE) / 2); // 15
const OY    = 80;  // HUD height

// Encounter pools scaled by floor
const POOLS: { max: number; species: string[]; lv: number }[] = [
  { max: 10,  species: ['piyon','kazepon','kusagumi','honon'],                            lv: 3  },
  { max: 20,  species: ['honon','denkon','iwagon','mizubon'],                             lv: 7  },
  { max: 40,  species: ['inferno_golem','blizzard_wolf','thunder_beast','abyss_kraken'], lv: 12 },
  { max: 70,  species: ['flame_dragon','frost_giant','storm_lord','tide_leviathan'],      lv: 18 },
  { max: 99,  species: ['vulcan_phoenix','void_reaper','nightmare_wolf','shadow_colossus'], lv: 24 },
  { max: 100, species: ['yami_no_teiou'],                                                 lv: 40 },
];

export class TowerDungeonScene extends Phaser.Scene {
  private floor     = 1;
  private grid      : boolean[][] = [];
  private startC    = 7;
  private startR    = ROWS - 2;
  private stairsC   = 7;
  private stairsR   = 1;
  private healC     = -1;
  private healR     = -1;
  private healUsed  = false;
  private treasureC = -1;
  private treasureR = -1;
  private treasureTaken = false;

  private playerC   = 7;
  private playerR   = ROWS - 2;
  private playerSpr !: Phaser.GameObjects.Sprite;
  private playerLbl !: Phaser.GameObjects.Text;

  private tileGfx   !: Phaser.GameObjects.Graphics;
  private overlays  : Phaser.GameObjects.GameObject[] = [];

  private msgWin    !: MessageWindow;
  private floorTxt  !: Phaser.GameObjects.Text;
  private coinsTxt  !: Phaser.GameObjects.Text;

  private cursors   !: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd      !: { up: Phaser.Input.Keyboard.Key; down: Phaser.Input.Keyboard.Key; left: Phaser.Input.Keyboard.Key; right: Phaser.Input.Keyboard.Key };
  private dpadState = { up: false, down: false, left: false, right: false };
  private lastMove  = 0;
  private readonly MOVE_CD = 180; // ms between steps

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
    this.add.rectangle(375, 600, 750, 1200, 0x08001a);

    // Tiles
    this.tileGfx = this.add.graphics();
    this.drawTiles();

    // Player
    const [px, py] = this.cell2px(this.playerC, this.playerR);
    this.playerSpr = this.add.sprite(px, py, 'player_f0')
      .setDisplaySize(30, 38).setDepth(10);
    this.playerSpr.play('player_idle');
    const state = getState();
    this.playerLbl = this.add.text(px, py - 22, state.name.charAt(0), {
      fontSize: '18px', color: '#ffffff', fontFamily: 'sans-serif',
      stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5).setDepth(11);

    // HUD panel
    drawPanel(this, 0, 0, 750, OY, { depth: 148, scrollFactor: 0 });
    this.floorTxt = this.add.text(10, 10, this.floorLabel(), { ...TS.label })
      .setDepth(150).setScrollFactor(0);
    this.coinsTxt = this.add.text(10, 38, `コイン: ${state.coins}`, { ...TS.coin })
      .setDepth(150).setScrollFactor(0);

    // Back button (top-right)
    const bx = 700, by = 40;
    this.add.rectangle(bx, by, 80, 44, T.panelMid, 0.9)
      .setStrokeStyle(2, T.borderGold).setDepth(150).setScrollFactor(0)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.goBack());
    this.add.text(bx, by, 'もどる', {
      fontSize: '18px', color: '#ffffff', fontFamily: 'sans-serif',
    }).setOrigin(0.5).setDepth(151).setScrollFactor(0);

    // D-pad (below maze)
    this.buildDpad();

    // Keyboard
    this.msgWin = new MessageWindow(this);
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.wasd = {
      up:    this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      down:  this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      left:  this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      right: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };

    // Entry message
    if (this.floor === 100) {
      this.msgWin.show('', 'さいご　100かい！\nさいきょうの　てきが　まっている！');
    } else if (this.floor % 10 === 0) {
      this.msgWin.show('', `${this.floor}かいに　とうちゃく！\nとくべつなかい　だよ。かいふく　ゾーンがあるよ！`);
    } else {
      this.msgWin.show('', `${this.floor}かいに　とうちゃく！\nかいだんを　みつけよう。`);
    }

    this.events.on('resume', () => {
      const s = getState();
      this.coinsTxt.setText(`コイン: ${s.coins}`);
      BGM.play('field_dark');
    });
  }

  // ── Maze generation ──────────────────────────────────────────────

  private generateFloor(): void {
    // All walls
    this.grid = Array.from({ length: ROWS }, () => Array(COLS).fill(false));

    // DFS carving from bottom-center maze cell (odd positions only)
    this.startC = Math.floor(COLS / 2); // = 7 (odd ✓)
    this.startR = ROWS - 2;             // = 19 (odd ✓)

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

    // Stairs: random maze cell in top third (r=1..7)
    const topCells: [number, number][] = [];
    for (let r = 1; r <= Math.floor(ROWS / 3); r += 2)
      for (let c = 1; c <= COLS - 2; c += 2)
        topCells.push([r, c]);
    [this.stairsR, this.stairsC] = topCells[Math.floor(Math.random() * topCells.length)];

    // Heal zone every 5 floors (middle area)
    this.healUsed = false;
    if (this.floor % 5 === 0) {
      const midCells: [number, number][] = [];
      for (let r = 9; r <= 13; r += 2)
        for (let c = 1; c <= COLS - 2; c += 2)
          midCells.push([r, c]);
      [this.healR, this.healC] = midCells[Math.floor(Math.random() * midCells.length)];
    } else {
      this.healR = -1; this.healC = -1;
    }

    // Treasure every 10 floors (find a maze cell near start)
    this.treasureTaken = false;
    if (this.floor % 10 === 0) {
      // Place near bottom, adjacent to start
      const candidates: [number, number][] = [];
      for (const [dr, dc] of [[0, 2],[0, -2],[-2, 0]]) {
        const nr = this.startR + dr, nc = this.startC + dc;
        if (nr >= 1 && nr <= ROWS - 2 && nc >= 1 && nc <= COLS - 2 && this.grid[nr][nc])
          candidates.push([nr, nc]);
      }
      if (candidates.length > 0) {
        [this.treasureR, this.treasureC] = candidates[Math.floor(Math.random() * candidates.length)];
      } else {
        this.treasureR = -1; this.treasureC = -1;
      }
    } else {
      this.treasureR = -1; this.treasureC = -1;
    }
  }

  // ── Drawing ──────────────────────────────────────────────────────

  private drawTiles(): void {
    this.tileGfx.clear();
    this.overlays.forEach(o => (o as Phaser.GameObjects.GameObject).destroy?.());
    this.overlays = [];

    // Tiles
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const wx = OX + c * TILE, wy = OY + r * TILE;
        if (this.grid[r][c]) {
          this.tileGfx.fillStyle(0x1c0840); this.tileGfx.fillRect(wx + 1, wy + 1, TILE - 2, TILE - 2);
          this.tileGfx.lineStyle(1, 0x440088, 0.18); this.tileGfx.strokeRect(wx + 1, wy + 1, TILE - 2, TILE - 2);
        } else {
          this.tileGfx.fillStyle(0x080018); this.tileGfx.fillRect(wx, wy, TILE, TILE);
          this.tileGfx.lineStyle(1, 0x6600aa, 0.25); this.tileGfx.strokeRect(wx, wy, TILE, TILE);
        }
      }
    }

    // Floor number watermark
    const wm = this.add.text(375, OY + ROWS * TILE / 2, `${this.floor}F`, {
      fontSize: '120px', color: '#ffffff', fontFamily: 'sans-serif', fontStyle: 'bold',
    }).setOrigin(0.5).setAlpha(0.04).setDepth(1);
    this.overlays.push(wm);

    // Stairs
    const [sx, sy] = this.cell2px(this.stairsC, this.stairsR);
    const sg = this.add.graphics().setDepth(5);
    sg.fillStyle(0xffcc00);
    for (let i = 0; i < 4; i++) sg.fillRect(sx - 14 + i * 3, sy - 12 + i * 5, 28 - i * 6, 5);
    const sl = this.add.text(sx, sy + 16, 'かいだん↑', {
      fontSize: '13px', color: '#ffee44', fontFamily: 'sans-serif',
      stroke: '#000', strokeThickness: 2,
    }).setOrigin(0.5).setDepth(6);
    this.overlays.push(sg, sl);

    // Heal zone
    if (this.healR >= 0) {
      const [hx, hy] = this.cell2px(this.healC, this.healR);
      const hg = this.add.graphics().setDepth(5);
      hg.fillStyle(0x00ff88, 0.25); hg.fillCircle(hx, hy, 18);
      hg.lineStyle(2, 0x00ff88, 0.8); hg.strokeCircle(hx, hy, 18);
      const hl = this.add.text(hx, hy + 20, '✦かいふく', {
        fontSize: '12px', color: '#00ffaa', fontFamily: 'sans-serif',
        stroke: '#000', strokeThickness: 2,
      }).setOrigin(0.5).setDepth(6);
      this.overlays.push(hg, hl);
    }

    // Treasure
    if (this.treasureR >= 0) {
      const [tx, ty] = this.cell2px(this.treasureC, this.treasureR);
      const tg = this.add.graphics().setDepth(5);
      tg.fillStyle(0xaa6600); tg.fillRect(tx - 12, ty - 10, 24, 18);
      tg.fillStyle(0xcc8800); tg.fillRect(tx - 12, ty - 16, 24, 7);
      tg.lineStyle(2, 0xffdd44); tg.strokeRect(tx - 12, ty - 16, 24, 25);
      const tl = this.add.text(tx, ty + 14, 'たから', {
        fontSize: '12px', color: '#ffdd44', fontFamily: 'sans-serif',
        stroke: '#000', strokeThickness: 2,
      }).setOrigin(0.5).setDepth(6);
      this.overlays.push(tg, tl);
    }
  }

  private buildDpad(): void {
    const cy = OY + ROWS * TILE + 56;
    type DK = 'up' | 'down' | 'left' | 'right';
    const dirs: { label: string; key: DK; dx: number; dy: number }[] = [
      { label: '▲', key: 'up',    dx:   0, dy: -44 },
      { label: '▼', key: 'down',  dx:   0, dy:  44 },
      { label: '◀', key: 'left',  dx: -56, dy:   0 },
      { label: '▶', key: 'right', dx:  56, dy:   0 },
    ];
    const dp = this.dpadState;
    for (const d of dirs) {
      const bx = 375 + d.dx, by = cy + d.dy;
      const btn = this.add.rectangle(bx, by, 52, 44, T.panelMid, 0.85)
        .setStrokeStyle(2, T.borderGold).setDepth(20).setScrollFactor(0)
        .setInteractive({ useHandCursor: true });
      this.add.text(bx, by, d.label, {
        fontSize: '22px', color: '#ffffff', fontFamily: 'sans-serif',
      }).setOrigin(0.5).setDepth(21).setScrollFactor(0);
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
    if (this.cursors.left.isDown  || this.wasd.left.isDown  || this.dpadState.left)  dc = -1;
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

    // Stairs check
    if (nc === this.stairsC && nr === this.stairsR) { this.onStairs(); return; }

    // Heal check
    if (!this.healUsed && nc === this.healC && nr === this.healR) { this.onHeal(); return; }

    // Treasure check
    if (!this.treasureTaken && nc === this.treasureC && nr === this.treasureR) { this.onTreasure(); return; }

    // Random encounter
    this.maybeEncounter();
  }

  private onStairs(): void {
    if (this.floor >= 100) {
      if (getFlag('tower100cleared')) {
        this.msgWin.show('', '100かいは　もう　クリアした！\nもどっても　いいよ。');
        return;
      }
      const state = getState();
      if (state.party.length === 0) {
        this.msgWin.show('', 'なかまが　いないと　たたかえないよ！');
        return;
      }
      this.msgWin.showConfirm('', 'とうのてっぺん！\nさいきょうの　てきが　まちかまえている…\nいどみますか？', () => {
        const enemy = createMonsterInstance('yami_no_teiou', 45);
        enemy.uid = 'tower_master_boss';
        const s = getState();
        s.position = { field: 'tower_dungeon', x: 100, y: 0 };
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
      const msg = this.floor === 100 ? 'さいご　100かい！\nさいきょうの　てきが　まっている！'
        : this.floor % 10 === 0 ? `${this.floor}かいに　とうちゃく！\nとくべつなかい　だよ！`
        : `${this.floor}かいに　とうちゃく！`;
      this.msgWin.show('', msg);
    });
  }

  private onHeal(): void {
    const state = getState();
    const needsHeal = state.party.some(m => m.hp < m.maxHp);
    if (!needsHeal) return;
    this.healUsed = true;
    state.party.forEach(m => { m.hp = m.maxHp; });
    this.coinsTxt.setText(`コイン: ${state.coins}`);
    this.msgWin.show('', 'かいふくゾーン！\nパーティのHPが　かいふくした！');
  }

  private onTreasure(): void {
    this.treasureTaken = true;
    const rewards: { item: string; count: number; label: string }[] = [
      { item: 'ginball',    count: 1, label: 'ぎんのきびだんご ×1' },
      { item: 'douball',    count: 2, label: 'どうのきびだんご ×2' },
      { item: 'daikyuball', count: 3, label: 'きびだんご ×3' },
    ];
    const r = rewards[Math.floor(this.floor / 10 - 1) % rewards.length] ?? rewards[0];
    addItem(r.item, r.count);
    this.msgWin.show('', `たからばこを　あけた！\n${r.label}を　てにいれた！`);
    // Redraw to remove treasure icon
    this.treasureR = -1; this.treasureC = -1;
    this.drawTiles();
    const [px, py] = this.cell2px(this.playerC, this.playerR);
    this.playerSpr.x = px; this.playerSpr.y = py;
    this.playerLbl.x = px; this.playerLbl.y = py - 22;
    this.playerSpr.setDepth(10); this.playerLbl.setDepth(11);
  }

  private maybeEncounter(): void {
    const chance = this.floor <= 20 ? 0.10 : this.floor <= 50 ? 0.13 : 0.15;
    if (Math.random() > chance) return;
    const state = getState();
    if (state.party.length === 0) return;

    const pool = POOLS.find(p => this.floor <= p.max) ?? POOLS[POOLS.length - 1];
    const sId  = pool.species[Math.floor(Math.random() * pool.species.length)];
    const lv   = pool.lv + Math.floor(Math.random() * 4) + Math.floor(this.floor / 10);
    const enemy = createMonsterInstance(sId, lv);
    state.position = { field: 'tower_dungeon', x: this.floor, y: 0 };
    this.scene.start('BattleScene', { enemy });
  }

  // ── Helpers ──────────────────────────────────────────────────────

  private cell2px(c: number, r: number): [number, number] {
    return [OX + c * TILE + TILE / 2, OY + r * TILE + TILE / 2];
  }

  private floorLabel(): string {
    return `とうだんじょん　${this.floor}かい / 100かい`;
  }

  private goBack(): void {
    const state = getState();
    state.position = { field: 'angel_hoikuen', x: 375, y: 630 };
    this.scene.start('MapScene');
  }
}
