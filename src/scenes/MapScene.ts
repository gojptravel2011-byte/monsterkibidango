import Phaser from 'phaser';
import { MessageWindow } from '../ui/MessageWindow';
import { getState, setFlag, getFlag, createMonsterInstance } from '../state/playerState';
import { countStep, resetStepCount, generateEncounter } from '../systems/encounter';
import { FIELDS } from '../data/fields';
import { STORY_EVENTS } from '../data/story';
import { PLACEHOLDER_COLORS } from '../assets/assetKeys';
import { saveGame } from '../systems/save';
import { BGM } from '../systems/bgm';
import { T } from '../ui/theme';
import { TS } from '../ui/StyledText';
import { drawPanel } from '../ui/Panel';

const SPEED = 150;
const PLAYER_SIZE = 28;

export class MapScene extends Phaser.Scene {
  private player!: Phaser.GameObjects.Sprite;
  private lastVx: number = 1;
  private playerLabel!: Phaser.GameObjects.Text;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: { up: Phaser.Input.Keyboard.Key; down: Phaser.Input.Keyboard.Key; left: Phaser.Input.Keyboard.Key; right: Phaser.Input.Keyboard.Key };
  private msgWin!: MessageWindow;
  private fieldNameText!: Phaser.GameObjects.Text;
  private coinsText!: Phaser.GameObjects.Text;
  private connections: { zone: Phaser.GameObjects.Rectangle; toField: string }[] = [];
  private triggers: { x: number; y: number; action: () => void; confirmMsg: string; fired: boolean }[] = [];
  private decorations: Phaser.GameObjects.GameObject[] = [];
  private bgRect: Phaser.GameObjects.Rectangle | null = null;
  private moveTimer: number = 0;
  private dungeonWalls: { x: number; y: number; w: number; h: number }[] = [];

  constructor() { super('MapScene'); }

  create(): void {
    const pos = getState().position;
    this.buildField(pos.field);

    // プレイヤーは create() で必ず生成（shutdown で破棄された参照を再利用しないよう）
    this.player = this.add.sprite(pos.x, pos.y, 'player_f0')
      .setDisplaySize(PLAYER_SIZE * 1.4, PLAYER_SIZE * 1.8).setDepth(10);
    this.player.play('player_idle');
    this.playerLabel = this.add.text(pos.x, pos.y - 30, getState().name.charAt(0), {
      fontSize: '34px', color: '#ffffff', fontFamily: 'sans-serif',
      stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5).setDepth(11);

    this.cursors = this.input.keyboard!.createCursorKeys();
    this.wasd = {
      up: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      down: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      left: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      right: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };

    this.msgWin = new MessageWindow(this);
    this.input.on('pointerdown', (_: Phaser.Input.Pointer, objs: Phaser.GameObjects.GameObject[]) => {
      if (objs.length === 0 && this.msgWin.isVisible()) {
        this.msgWin.advance();
      }
    });

    // HUD
    const w = this.scale.width;
    drawPanel(this, 0, 0, w, 58, { depth: 148, scrollFactor: 0 });
    this.fieldNameText = this.add.text(10, 10, '', {
      ...TS.label,
    }).setDepth(150).setScrollFactor(0);

    this.coinsText = this.add.text(10, 32, '', {
      ...TS.coin,
    }).setDepth(150).setScrollFactor(0);

    this.updateHUD();
    this.showFieldEvent(pos.field);

    // ハンバーガーメニュー（右上）
    const menuBtnX = w - 36;
    const menuBtnY = 36;
    this.add.rectangle(menuBtnX, menuBtnY, 56, 56, T.panelMid, 0.9)
      .setStrokeStyle(2, T.borderGold).setDepth(150).setScrollFactor(0)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.scene.launch('MenuScene').pause());
    for (let i = 0; i < 3; i++) {
      this.add.rectangle(menuBtnX, menuBtnY - 10 + i * 10, 30, 3, T.borderGold)
        .setDepth(151).setScrollFactor(0);
    }

    this.events.on('resume', () => {
      this.updateHUD();
      const f = getState().position.field;
      BGM.play(['jinja', 'shogakko', 'dungeon'].includes(f) ? 'field_dark' : 'field');
    });

    // BGM開始（フィールドに応じて）
    const startField = getState().position.field;
    const darkFields = ['jinja', 'shogakko', 'dungeon'];
    BGM.play(darkFields.includes(startField) ? 'field_dark' : 'field');
  }

  private buildField(fieldId: string): void {
    this.decorations.forEach(d => d.destroy());
    this.decorations = [];
    this.connections = [];
    this.triggers = [];
    this.dungeonWalls = [];
    this.bgRect?.destroy();

    const w = this.scale.width;
    const h = this.scale.height;
    const field = FIELDS[fieldId];
    if (!field) return;

    this.bgRect = this.add.rectangle(w / 2, h / 2, w, h, field.bgColor);

    // フィールド装飾
    this.addFieldDecorations(fieldId, w, h);

    // 出入口ゾーン
    for (const conn of field.connections) {
      const zone = this.add.rectangle(conn.x, conn.y, 60, 80, 0xffffff, 0.2)
        .setStrokeStyle(2, 0xffffff);
      const label = this.add.text(conn.x, conn.y - 50, conn.label, {
        ...TS.sub,
        color: T.textSub,
      }).setOrigin(0.5);
      this.connections.push({ zone, toField: conn.toField });
      this.decorations.push(zone, label);
    }
  }

  // トリガーゾーンを追加：プレイヤーが近づくと確認ダイアログ→ action が発動
  private addTriggerZone(
    x: number, y: number,
    label: string,
    color: number,
    confirmMsg: string,
    action: () => void,
  ): void {
    // 床マーカー（半透明の丸）
    const circle = this.add.circle(x, y, 36, color, 0.25).setDepth(4)
      .setStrokeStyle(2, color, 0.8);
    // パルスアニメ
    this.tweens.add({
      targets: circle, scaleX: 1.15, scaleY: 1.15,
      duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    });
    this.decorations.push(circle);
    this.triggers.push({ x, y, action, confirmMsg, fired: false });
  }

  private addFieldDecorations(fieldId: string, w: number, h: number): void {
    if (fieldId === 'hoikuen') {
      // 雲
      [{ x: 80, y: 80 }, { x: 220, y: 100 }, { x: 500, y: 80 }].forEach(p => {
        this.decorations.push(this.add.image(p.x, p.y, 'deco_cloud').setDepth(1));
      });
      // 園舎×2
      this.decorations.push(
        this.add.image(200, 180, 'deco_house').setDepth(2),
        this.add.image(500, 180, 'deco_house').setDepth(2),
      );
      // 看板
      this.decorations.push(
        this.add.text(w / 2, 60, 'ほいくえん', {
          fontSize: '30px', color: '#664400', fontFamily: 'sans-serif', fontStyle: 'bold',
          stroke: '#ffffff', strokeThickness: 3,
        }).setOrigin(0.5).setDepth(3),
      );

      // おみせ（右の建物）→ 近づくと発動
      this.decorations.push(
        this.add.rectangle(500, 280, 80, 40, 0xddaa44).setStrokeStyle(2, 0xffcc66).setDepth(3),
        this.add.text(500, 280, 'おみせ', { fontSize: '34px', color: '#ffffff', fontFamily: 'sans-serif' }).setOrigin(0.5).setDepth(4),
      );
      this.addTriggerZone(500, 320, 'おみせ\nはいる', 0xffcc44,
        'おみせに\nはいりますか？',
        () => { this.scene.launch('ShopScene').pause(); },
      );

      // 砂場
      this.decorations.push(
        this.add.rectangle(w / 2 - 150, h * 0.45, 100, 70, 0xeedd88).setDepth(2).setStrokeStyle(2, 0xaa9944),
        this.add.text(w / 2 - 150, h * 0.45, 'すなば', { fontSize: '32px', color: '#886622', fontFamily: 'sans-serif' }).setOrigin(0.5).setDepth(3),
      );

      // おちばひろいエリア：大きい木
      const treeX = w / 2 - 240, treeY = h * 0.38;
      // 幹
      this.decorations.push(
        this.add.rectangle(treeX, treeY + 60, 24, 80, 0x774422).setDepth(2),
      );
      // 葉（3層の円で大きな木）
      this.decorations.push(
        this.add.circle(treeX, treeY + 20, 56, 0x228833).setDepth(2),
        this.add.circle(treeX - 34, treeY + 6, 40, 0x33aa44).setDepth(2),
        this.add.circle(treeX + 34, treeY + 6, 40, 0x33aa44).setDepth(2),
        this.add.circle(treeX, treeY - 22, 44, 0x44cc55).setDepth(2),
      );
      // 落ち葉
      [[-20, 32], [22, 52], [-12, 72], [16, 36], [-32, 56]].forEach(([dx, dy]) => {
        this.decorations.push(
          this.add.text(treeX + dx, treeY + dy, '🍂', { fontSize: '22px' }).setDepth(3),
        );
      });
      this.addTriggerZone(treeX, treeY + 95, 'おちば\nひろい', 0xcc6622,
        'おちばひろいを\nしますか？',
        () => { this.scene.start('MinigameScene'); },
      );

      // たしざん・ひきざんゲーム（算数マーク付き黒板）
      const calcX = w / 2 + 180, calcY = h * 0.64;
      this.decorations.push(
        this.add.rectangle(calcX, calcY, 120, 100, 0x1a3d1a).setDepth(2).setStrokeStyle(3, 0x8888ff),
        this.add.text(calcX, calcY - 14, '＋ －', {
          fontSize: '30px', color: '#ffff88', fontFamily: 'sans-serif', fontStyle: 'bold',
        }).setOrigin(0.5).setDepth(3),
        this.add.text(calcX, calcY + 24, 'けいさん', {
          fontSize: '18px', color: '#aaffaa', fontFamily: 'sans-serif',
        }).setOrigin(0.5).setDepth(3),
      );
      this.addTriggerZone(w / 2 + 180, h * 0.70, 'けいさん\nゲーム', 0x4466cc,
        'たしざん・ひきざん\nゲームをしますか？',
        () => { this.scene.start('ArithmeticScene'); },
      );

      // えんちょうせんせい（きびだんご屋）おみせ(x=500)の右横
      const enchoX = 630, enchoY = 280;
      this.decorations.push(
        // 看板（建物）
        this.add.rectangle(enchoX, enchoY, 80, 40, 0xffdd44).setStrokeStyle(2, 0xcc9900).setDepth(3),
        this.add.text(enchoX, enchoY, 'だんご', {
          fontSize: '22px', color: '#442200', fontFamily: 'sans-serif', fontStyle: 'bold',
        }).setOrigin(0.5).setDepth(4),
        // えんちょうせんせいのスプライト
        this.add.image(enchoX, enchoY + 80, 'npc_encho')
          .setDisplaySize(PLAYER_SIZE * 1.4, PLAYER_SIZE * 1.8).setDepth(3),
        this.add.text(enchoX, enchoY + 114, 'えんちょう', {
          fontSize: '18px', color: '#112244', fontFamily: 'sans-serif', fontStyle: 'bold',
          stroke: '#ffffff', strokeThickness: 2,
        }).setOrigin(0.5).setDepth(4),
      );
      this.addTriggerZone(enchoX, enchoY + 150, 'きびだんご\nやさん', 0xffaa22,
        'えんちょうせんせいの\nきびだんごやさんに\nはいりますか？',
        () => { this.scene.launch('BallShopScene').pause(); },
      );

      // 花
      for (let i = 0; i < 8; i++) {
        this.decorations.push(this.add.image(60 + i * 80, h * 0.7, 'deco_flower').setDepth(2));
      }

      // 先生スプライト
      const teacherX = w / 2 + 60, teacherY = h * 0.50;
      this.decorations.push(
        this.add.image(teacherX, teacherY, 'npc_sensei')
          .setDisplaySize(PLAYER_SIZE * 1.4, PLAYER_SIZE * 1.8).setDepth(3),
        this.add.text(teacherX, teacherY + 36, 'せんせい', {
          fontSize: '36px', color: '#3333aa', fontFamily: 'sans-serif', fontStyle: 'bold',
          stroke: '#ffffff', strokeThickness: 2,
        }).setOrigin(0.5).setDepth(4),
      );
      // せんせいに近づくと話しかける
      this.addTriggerZone(teacherX, teacherY + 50, 'はなす', 0x4488ff,
        'せんせいに\nはなしかけますか？',
        () => this.talkToTeacher(),
      );

      // 生徒たち
      const npcKeys = ['npc_gaku', 'npc_ritsu', 'npc_soto', 'npc_kaya'];
      const studentPositions = [
        { x: w / 2 - 160, y: h * 0.55 },
        { x: w / 2 - 60,  y: h * 0.60 },
        { x: w / 2 + 40,  y: h * 0.57 },
        { x: w / 2 + 140, y: h * 0.62 },
      ];
      const studentNames = ['がく', 'りつ', 'そうと', 'かや'];
      studentPositions.forEach((pos, i) => {
        this.decorations.push(
          this.add.image(pos.x, pos.y, npcKeys[i])
            .setDisplaySize(PLAYER_SIZE * 1.3, PLAYER_SIZE * 1.7).setDepth(3)
            .setFlipX(i % 2 === 0),
          this.add.text(pos.x, pos.y + 34, studentNames[i], {
            fontSize: '36px', color: '#333333', fontFamily: 'sans-serif',
            stroke: '#ffffff', strokeThickness: 2,
          }).setOrigin(0.5).setDepth(4),
        );
      });

    } else if (fieldId === 'kouen') {
      [60, 200, 400, 600].forEach((x, i) => {
        this.decorations.push(this.add.image(x, [70, 90, 75, 85][i], 'deco_cloud').setDepth(1));
      });
      [80, 180, 300, 480, 620].forEach((x, i) => {
        this.decorations.push(this.add.image(x, [200, 230, 210, 240, 200][i], 'deco_tree').setDepth(2));
      });
      this.decorations.push(
        this.add.image(200, h * 0.55, 'deco_bench').setDepth(2),
        this.add.image(500, h * 0.55, 'deco_bench').setDepth(2),
        this.add.circle(w / 2, h * 0.5, 30, 0x4488ff).setDepth(2),
        this.add.circle(w / 2, h * 0.5 - 30, 10, 0xffffff, 0.7).setDepth(3),
        this.add.circle(w / 2 - 15, h * 0.5 - 20, 6, 0xffffff, 0.6).setDepth(3),
        this.add.circle(w / 2 + 15, h * 0.5 - 20, 6, 0xffffff, 0.6).setDepth(3),
      );

    } else if (fieldId === 'jutakugai') {
      [80, 220, 420, 580].forEach(x => {
        this.decorations.push(this.add.image(x, 200, 'deco_house').setDepth(2));
      });
      [150, 350, 550].forEach(x => {
        this.decorations.push(this.add.image(x, h * 0.55, 'deco_lamp').setDepth(2));
      });
      this.decorations.push(
        this.add.rectangle(w / 2, h * 0.72, w, h * 0.15, 0x888888).setDepth(1),
      );

    } else if (fieldId === 'jinja') {
      this.decorations.push(
        this.add.image(w / 2, 120, 'deco_torii').setScale(1.5).setDepth(2),
      );
      [{ x: w / 2 - 80 }, { x: w / 2 + 80 }].forEach(p => {
        this.decorations.push(
          this.add.rectangle(p.x, h * 0.45, 18, 40, 0x999988).setDepth(2),
          this.add.rectangle(p.x, h * 0.45 - 28, 22, 14, 0x888877).setDepth(2),
        );
      });
      this.decorations.push(
        this.add.rectangle(w / 2, h * 0.6, w * 0.6, h * 0.25, 0xccccbb).setDepth(1),
        this.add.rectangle(w / 2, h * 0.42, 160, 100, 0x885533).setDepth(3),
        this.add.triangle(w / 2, h * 0.42 - 80, -80, 0, 80, 0, 0, -60, 0x663311).setDepth(4),
      );

    } else if (fieldId === 'shotengai') {
      [100, 320, 540].forEach(x => {
        this.decorations.push(this.add.image(x, 180, 'deco_shopfront').setDepth(2));
      });
      const bannerColors = [0xff4444, 0x4444ff, 0xffcc00, 0x44cc44, 0xff44cc];
      for (let i = 0; i < 10; i++) {
        this.decorations.push(
          this.add.rectangle(60 + i * 65, h * 0.35, 8, 30, bannerColors[i % 5]).setDepth(3),
        );
      }
      for (let i = 0; i < 8; i++) {
        this.decorations.push(
          this.add.circle(80 + i * 80, h * 0.6 + (i % 2) * 20, 10, 0xffccaa).setDepth(3),
        );
      }
      this.decorations.push(
        this.add.image(200, h * 0.55, 'deco_lamp').setDepth(2),
        this.add.image(500, h * 0.55, 'deco_lamp').setDepth(2),
      );

    } else if (fieldId === 'shogakko') {
      // 学校の建物
      this.decorations.push(
        this.add.image(w / 2, 130, 'deco_school').setDepth(2),
        this.add.rectangle(w / 2, h / 2, w, h, 0x000022).setAlpha(0.3).setDepth(3),
        this.add.rectangle(w / 2, h * 0.68, w * 0.8, h * 0.2, 0xcc9966).setDepth(1),
      );
      // 地下への入口（上部・暗い穴）
      this.decorations.push(
        this.add.rectangle(w / 2, 80, 80, 60, 0x110022).setStrokeStyle(3, 0x6633aa).setDepth(4),
        this.add.text(w / 2, 80, 'ちか\nへ', {
          fontSize: '22px', color: '#cc88ff', fontFamily: 'sans-serif', align: 'center',
          stroke: '#000000', strokeThickness: 2,
        }).setOrigin(0.5).setDepth(5),
      );
      // 警告テキスト
      this.decorations.push(
        this.add.text(w / 2, h * 0.45, 'あやしい　けはいが\nする…', {
          fontSize: '28px', color: '#aaaaff', fontFamily: 'sans-serif', align: 'center',
          stroke: '#000000', strokeThickness: 3,
        }).setOrigin(0.5).setDepth(5),
      );
    } else if (fieldId === 'dungeon') {
      // ─── 地下迷路 ────────────────────────────────────────────
      // 5枚の横壁（ギャップが左右交互）+ 縦の仕切り壁（ギャップあり）で複雑な迷路を形成
      // 正解ルート: 下中央→左→上→右→上→左→上→右→上→中央→ボス
      const WC  = 0x2a1040;
      const GC  = 0x8844cc;
      const WC2 = 0x1a0830;

      this.decorations.push(
        this.add.rectangle(w / 2, h / 2, w, h, 0x0d0018).setDepth(0),
      );

      // 横壁バリア + 追加の行き止まり壁 [cx, cy, width, height]
      const floorWalls: [number, number, number, number][] = [
        // F1 @ y=960: ギャップ左(x=0→160)
        [455, 960, 590, 36],
        // F2 @ y=750: ギャップ右(x=580→750)
        [290, 750, 580, 36],
        // F3 @ y=560: ギャップ左(x=0→160)
        [455, 560, 590, 36],
        // F4 @ y=360: ギャップ右(x=580→750)
        [290, 360, 580, 36],
        // F5 @ y=180: ギャップ中央のみ(x=310→440)
        [155, 180, 310, 36],
        [595, 180, 320, 36],
        // 行き止まり・偽の道
        [600, 1070, 36, 200],   // 右端の行き止まり縦壁(Z1)
        [375, 850, 36, 200],    // 中央の行き止まり縦壁(Z1内)
        [290, 1100, 200, 32],   // 入口付近の偽バリア
        [80, 870, 120, 32],     // 左レーンZ2の行き止まり
        [375, 655, 220, 32],    // Z3中央の偽道
        [520, 640, 32, 160],    // Z3内の縦バリア（偽の分断）
        [80, 460, 120, 32],     // 左レーンZ4の行き止まり
        [230, 440, 32, 140],    // Z4の縦バリア
        [695, 270, 32, 140],    // 右端Z5行き止まり縦壁
        [460, 250, 32, 140],    // Z5の縦バリア
      ];

      // 縦の仕切り壁（各ゾーンでレーンを区切る・ギャップあり）
      // V1: x=160, Z2(y=760→960), ギャップ y=860→930
      // V2: x=580, Z3(y=570→740), ギャップ y=640→710
      // V3: x=160, Z4(y=370→555), ギャップ y=450→525
      // V4: x=580, Z5(y=190→355), ギャップ y=255→330
      const laneWalls: [number, number, number, number][] = [
        [160, 810, 36, 100], [160, 945, 36, 30],
        [580, 602, 36,  64], [580, 727, 36,  34],
        [160, 410, 36,  80], [160, 540, 36,  30],
        [580, 222, 36,  64], [580, 347, 36,  26],
      ];

      const allWalls = [...floorWalls, ...laneWalls];

      // 当たり判定登録
      allWalls.forEach(([cx, cy, ww, wh]) => {
        this.dungeonWalls.push({ x: cx, y: cy, w: ww, h: wh });
      });

      // 描画
      allWalls.forEach(([cx, cy, ww, wh]) => {
        this.decorations.push(
          this.add.rectangle(cx, cy, ww, wh, WC).setStrokeStyle(2, GC).setDepth(3),
          this.add.rectangle(cx, cy, Math.max(ww - 8, 4), Math.max(wh - 8, 4), WC2).setDepth(3),
        );
      });

      // 床グリッド（薄線）
      for (let ty = 100; ty < h; ty += 80) {
        this.decorations.push(
          this.add.rectangle(w / 2, ty, w, 1, 0x3a1a5a, 0.25).setDepth(1),
        );
      }
      for (let tx = 60; tx < w; tx += 80) {
        this.decorations.push(
          this.add.rectangle(tx, h / 2, 1, h, 0x3a1a5a, 0.25).setDepth(1),
        );
      }

      // 松明（炎アニメーション）
      const torches: [number, number][] = [
        [80, 780], [80, 580], [80, 400],
        [670, 680], [670, 460], [670, 270],
        [375, 830], [200, 630], [560, 450],
      ];
      torches.forEach(([tx, ty]) => {
        this.decorations.push(
          this.add.circle(tx, ty, 18, 0xff6600, 0.85).setDepth(4),
          this.add.circle(tx, ty, 34, 0xff3300, 0.18).setDepth(4),
          this.add.circle(tx, ty,  8, 0xffee88, 0.9).setDepth(5),
        );
        const flicker = this.add.circle(tx, ty, 22, 0xff8800, 0.35).setDepth(4);
        this.decorations.push(flicker);
        this.tweens.add({
          targets: flicker, scaleX: 1.3, scaleY: 0.8, alpha: 0.15,
          duration: 600 + Math.random() * 400,
          yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
        });
      });

      // ヒントテキスト
      this.decorations.push(
        this.add.text(375, 1035, 'さきにすすめ', {
          fontSize: '22px', color: '#9966cc', fontFamily: 'sans-serif',
          stroke: '#000000', strokeThickness: 2,
        }).setOrigin(0.5).setDepth(5),
      );

      // ボスの扉
      this.decorations.push(
        this.add.rectangle(w / 2, 80, 120, 80, 0x440022).setStrokeStyle(3, 0xff2200).setDepth(4),
        this.add.rectangle(w / 2, 80, 104, 64, 0x220011).setStrokeStyle(1, 0xff6644).setDepth(4),
        this.add.text(w / 2, 80, 'ボスの\nへや', {
          fontSize: '22px', color: '#ff5555', fontFamily: 'sans-serif', align: 'center',
          stroke: '#000000', strokeThickness: 3,
        }).setOrigin(0.5).setDepth(5),
      );

      this.addTriggerZone(w / 2, 148, 'とびら', 0x880000,
        'くらやみのあるじが\nよんでいる…\nいどみますか？',
        () => this.triggerRasuboss(),
      );
    }
  }

  update(time: number, delta: number): void {
    if (this.msgWin.isVisible()) return;
    if (this.scene.isPaused()) return;

    const state = getState();
    // タッチ：プレイヤーから見た方向で移動
    let touchLeft = false, touchRight = false, touchUp = false, touchDown = false;
    const ptr = this.input.activePointer;
    if (ptr.isDown) {
      const dx = ptr.x - this.player.x;
      const dy = ptr.y - this.player.y;
      const DEAD = 28;
      if (Math.abs(dx) > Math.abs(dy)) {
        if (dx > DEAD) touchRight = true;
        else if (dx < -DEAD) touchLeft = true;
      } else {
        if (dy > DEAD) touchDown = true;
        else if (dy < -DEAD) touchUp = true;
      }
    }
    const left  = touchLeft  || this.cursors.left.isDown  || this.wasd.left.isDown;
    const right = touchRight || this.cursors.right.isDown || this.wasd.right.isDown;
    const up    = touchUp    || this.cursors.up.isDown    || this.wasd.up.isDown;
    const down  = touchDown  || this.cursors.down.isDown  || this.wasd.down.isDown;

    let vx = 0, vy = 0;
    if (left) vx = -SPEED;
    if (right) vx = SPEED;
    if (up) vy = -SPEED;
    if (down) vy = SPEED;

    const moved = vx !== 0 || vy !== 0;
    if (moved) {
      if (vx !== 0) this.lastVx = vx;
      this.player.setFlipX(this.lastVx < 0);
      if (this.player.anims.currentAnim?.key !== 'player_walk') this.player.play('player_walk');

      const dt = delta / 1000;
      const w = this.scale.width, h = this.scale.height;
      const nx = Phaser.Math.Clamp(this.player.x + vx * dt, 20, w - 20);
      const ny = Phaser.Math.Clamp(this.player.y + vy * dt, 20, h - 20);
      const [rx, ry] = this.resolveWalls(nx, ny);
      this.player.x = rx;
      this.player.y = ry;
      this.playerLabel.x = this.player.x;
      this.playerLabel.y = this.player.y - 30;

      // 歩数カウント（フレームではなく一定間隔）
      this.moveTimer += delta;
      if (this.moveTimer > 500) {
        this.moveTimer = 0;
        const field = FIELDS[state.position.field];
        if (!field?.isSafeZone && countStep()) {
          const party = state.party;
          const playerLevel = party.length > 0 ? party[0].level : 1;
          const enemy = generateEncounter(state.position.field, playerLevel);
          if (enemy) {
            state.position.x = this.player.x;
            state.position.y = this.player.y;
            this.scene.start('BattleScene', { enemy });
            return;
          }
        }
      }

      // エリア遷移チェック
      for (const conn of this.connections) {
        const px = this.player.x, py = this.player.y;
        const cx = conn.zone.x, cy = conn.zone.y;
        if (Math.abs(px - cx) < 50 && Math.abs(py - cy) < 60) {
          this.changeField(conn.toField);
          return;
        }
      }

      // トリガーゾーンチェック（近づいたら確認ダイアログ→発動）
      for (const trig of this.triggers) {
        const dx = Math.abs(this.player.x - trig.x);
        const dy = Math.abs(this.player.y - trig.y);
        const inZone = dx < 52 && dy < 52;
        if (inZone && !trig.fired && !this.msgWin.isVisible()) {
          trig.fired = true;
          this.msgWin.showConfirm('', trig.confirmMsg, trig.action);
        } else if (!inZone) {
          trig.fired = false;
        }
      }
    } else {
      this.moveTimer = 0;
      if (this.player.anims.currentAnim?.key !== 'player_idle') this.player.play('player_idle');
    }
  }

  /** ダンジョン壁との衝突解決（X軸・Y軸を独立に処理してスライド移動を実現） */
  private resolveWalls(nextX: number, nextY: number): [number, number] {
    if (this.dungeonWalls.length === 0) return [nextX, nextY];
    const r = 18; // プレイヤーの当たり判定半径
    const cx = this.player.x, cy = this.player.y;

    // X軸: 現在のY位置で判定
    let rx = nextX;
    for (const wall of this.dungeonWalls) {
      const wl = wall.x - wall.w / 2 - r, wr = wall.x + wall.w / 2 + r;
      const wt = wall.y - wall.h / 2 - r, wb = wall.y + wall.h / 2 + r;
      if (rx > wl && rx < wr && cy > wt && cy < wb) { rx = cx; break; }
    }
    // Y軸: 解決後のX位置で判定
    let ry = nextY;
    for (const wall of this.dungeonWalls) {
      const wl = wall.x - wall.w / 2 - r, wr = wall.x + wall.w / 2 + r;
      const wt = wall.y - wall.h / 2 - r, wb = wall.y + wall.h / 2 + r;
      if (rx > wl && rx < wr && ry > wt && ry < wb) { ry = cy; break; }
    }
    return [rx, ry];
  }

  private changeField(toField: string): void {
    const state = getState();
    const field = FIELDS[toField];
    if (!field) return;

    // しょうがっこうは特殊
    if (toField === 'shogakko' && getFlag('rasubossDefeated')) return;

    // 入ってきた方向の出口付近にスポーン（戻り口を探す）
    const fromField = state.position.field;
    const reverseConn = field.connections.find(c => c.toField === fromField);
    let spawnX = 375;
    let spawnY = 600;
    if (reverseConn) {
      const cx = reverseConn.x;
      const cy = reverseConn.y;
      // 端にある出口から内側へ100px寄せる
      spawnX = cx <= 60 ? cx + 120 : cx >= 690 ? cx - 120 : cx;
      spawnY = cy <= 80 ? cy + 120 : cy >= 1100 ? cy - 120 : cy;
    }

    state.position.field = toField;
    state.position.x = spawnX;
    state.position.y = spawnY;

    this.player.x = spawnX;
    this.player.y = spawnY;
    this.playerLabel.x = spawnX;
    this.playerLabel.y = spawnY - 30;

    // フィールドを再構築
    this.buildField(toField);
    resetStepCount();
    this.updateHUD();
    this.showFieldEvent(toField);
    // BGM切り替え
    const darkFields = ['jinja', 'shogakko', 'dungeon'];
    BGM.play(darkFields.includes(toField) ? 'field_dark' : 'field');
  }

  private showFieldEvent(fieldId: string): void {
    const state = getState();
    if (fieldId === 'kouen' && !getFlag('shownKouenMsg')) {
      setFlag('shownKouenMsg');
      const dialogs = STORY_EVENTS.metKurosuke.dialogs.map(d => ({
        speaker: d.speaker === 'あなた' ? state.name : d.speaker,
        text: d.text,
      }));
      this.msgWin.showSequence(dialogs);
    }
  }

  private triggerRasuboss(): void {
    if (getFlag('rasubossDefeated')) return;
    const state = getState();
    if (state.party.length === 0) {
      this.msgWin.show('クロスケ', 'なかまが　いないと　たたかえないよ！\nこうえんで　モンスターと　なかよくなってね！');
      return;
    }
    const dialogs = STORY_EVENTS.preRasuboss.dialogs.map(d => ({
      speaker: d.speaker === 'あなた' ? state.name : d.speaker,
      text: d.text,
    }));
    this.msgWin.showSequence(dialogs, () => {
      const enemy = createMonsterInstance('rasuboss', 12);
      enemy.uid = 'rasuboss_boss';
      state.position.x = this.player.x;
      state.position.y = this.player.y;
      this.scene.start('BattleScene', { enemy, isBoss: true });
    });
  }

  private talkToTeacher(): void {
    if (this.msgWin.isVisible()) return;
    const state = getState();
    if (state.party.length === 0) {
      this.msgWin.show('せんせい', 'あら、まだ　なかまが　いないのね。\nなかまを　みつけたら　また　きてね！');
      return;
    }
    const needsHeal = state.party.some(m => m.hp < m.maxHp);
    if (!needsHeal) {
      this.msgWin.show('せんせい', 'みんな　げんきそうね♪\nなにか　あったら　いつでも　きてね！');
      return;
    }
    const dialogs: { speaker: string; text: string }[] = [
      { speaker: 'せんせい', text: 'あら、みんな　つかれているのね。\nせんせいが　なおして　あげるわよ！' },
      { speaker: 'せんせい', text: 'はい、なおった～！\nまた　つかれたら　きてね♪' },
    ];
    this.msgWin.showSequence(dialogs, () => {
      state.party.forEach(m => { m.hp = m.maxHp; });
      this.updateHUD();
    });
  }

  private updateHUD(): void {
    const state = getState();
    const field = FIELDS[state.position.field];
    this.fieldNameText.setText(field?.name ?? '');
    this.coinsText.setText(`コイン: ${state.coins}`);
  }
}
