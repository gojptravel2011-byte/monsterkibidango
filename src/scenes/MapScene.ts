import Phaser from 'phaser';
import { MessageWindow } from '../ui/MessageWindow';
import { getState, setFlag, getFlag, addItem, createMonsterInstance } from '../state/playerState';
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
    // セーブデータがダンジョン内の場合は DungeonMazeScene で再開
    if (pos.field === 'dungeon') {
      this.scene.start('DungeonMazeScene');
      return;
    }
    if (pos.field === 'yami_world') {
      this.scene.start('DungeonMazeScene', { mode: 'yami' });
      return;
    }
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
      .on('pointerdown', () => this.scene.run('MenuScene'));
    for (let i = 0; i < 3; i++) {
      this.add.rectangle(menuBtnX, menuBtnY - 10 + i * 10, 30, 3, T.borderGold)
        .setDepth(151).setScrollFactor(0);
    }

    this.events.on('resume', () => {
      this.updateHUD();
      const f = getState().position.field;
      const darkF = ['jinja', 'shogakko', 'dungeon', 'kaminari_world', 'yami_world', 'mizu_world', 'koori_world'];
      BGM.play(darkF.includes(f) ? 'field_dark' : 'field');
    });

    // BGM開始（フィールドに応じて）
    const startField = getState().position.field;
    const darkFieldsStart = ['jinja', 'shogakko', 'dungeon', 'kaminari_world', 'yami_world', 'mizu_world', 'koori_world'];
    BGM.play(darkFieldsStart.includes(startField) ? 'field_dark' : 'field');
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
      // 警告テキスト（撃破前のみ）
      if (!getFlag('rasubossDefeated')) {
        this.decorations.push(
          this.add.text(w / 2, h * 0.45, 'あやしい　けはいが\nする…', {
            fontSize: '28px', color: '#aaaaff', fontFamily: 'sans-serif', align: 'center',
            stroke: '#000000', strokeThickness: 3,
          }).setOrigin(0.5).setDepth(5),
        );
      }

      // ── 別世界ワープポータル（校庭中央）────────────────────────
      const warpX = w / 2, warpY = h * 0.60;
      const defeated = getFlag('rasubossDefeated');
      const portalColor = defeated ? 0xaa44ff : 0x554477;
      const portalAlpha = defeated ? 1.0 : 0.5;

      // 背景グロー
      const glow = this.add.circle(warpX, warpY, 54, portalColor, 0.12).setDepth(3);
      this.tweens.add({ targets: glow, scaleX: 1.35, scaleY: 1.35, alpha: 0.04,
        duration: 1100, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      this.decorations.push(glow);

      // 外リング：3つの弧セグメントで隙間ありリング → angleツイーンで回転が見える
      const gOuter = this.add.graphics({ x: warpX, y: warpY }).setDepth(4);
      for (let i = 0; i < 3; i++) {
        const s = (i * Math.PI * 2 / 3) + 0.2;
        const e = (i * Math.PI * 2 / 3) + Math.PI * 2 / 3 - 0.2;
        gOuter.lineStyle(6, portalColor, portalAlpha);
        gOuter.beginPath();
        gOuter.arc(0, 0, 42, s, e, false);
        gOuter.strokePath();
      }
      this.tweens.add({ targets: gOuter, angle: 360, duration: 2400, repeat: -1, ease: 'Linear' });
      this.decorations.push(gOuter);

      // 内リング：4つの弧、逆回転
      const gInner = this.add.graphics({ x: warpX, y: warpY }).setDepth(4);
      for (let i = 0; i < 4; i++) {
        const s = (i * Math.PI * 2 / 4) + 0.25;
        const e = (i * Math.PI * 2 / 4) + Math.PI * 2 / 4 - 0.25;
        gInner.lineStyle(4, portalColor, portalAlpha * 0.75);
        gInner.beginPath();
        gInner.arc(0, 0, 24, s, e, false);
        gInner.strokePath();
      }
      this.tweens.add({ targets: gInner, angle: -360, duration: 1600, repeat: -1, ease: 'Linear' });
      this.decorations.push(gInner);

      // 中央の光点
      const gCenter = this.add.graphics({ x: warpX, y: warpY }).setDepth(4);
      gCenter.fillStyle(portalColor, portalAlpha * 0.6);
      gCenter.fillCircle(0, 0, 10);
      this.tweens.add({ targets: gCenter, scaleX: 1.5, scaleY: 1.5, alpha: 0.2,
        duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      this.decorations.push(gCenter);
      const warpLabel = this.add.text(warpX, warpY + 60, getFlag('rasubossDefeated') ? 'べつのせかいへ' : 'なにかの\nけはいがする…', {
        fontSize: '20px', color: '#cc88ff', fontFamily: 'sans-serif', align: 'center',
        stroke: '#000000', strokeThickness: 2,
      }).setOrigin(0.5).setDepth(5);
      this.decorations.push(warpLabel);

      if (getFlag('rasubossDefeated')) {
        this.addTriggerZone(warpX, warpY, 'ワープ', portalColor,
          'べつのせかいへの\nとびらへ　いきますか？',
          () => this.changeField('angel_hoikuen'),
        );
      } else {
        this.addTriggerZone(warpX, warpY, 'けはい', 0x554477,
          'なにかが　いる…\nでも　まだ　ひらかない。',
          () => { /* 封印中 - ダイアログのみ */ },
        );
      }
    } else if (fieldId === 'dungeon') {
      // ─── 地下迷路 ────────────────────────────────────────────
      // 正解ルート: 入口(375,1020)→右→上→左→上→右→上→左→上→中央→ボス
      // ギャップは全て220px以上確保（当たり判定r=18を差し引いても184px余裕）
      //
      // ゾーン構成（下から上）:
      //   Z1: y=900→1200  入口ゾーン（右の行き止まりに宝箱1）
      //   Z2: y=700→900   F1通過後（左側に行き止まり・右へ進む）
      //   Z3: y=500→700   F2通過後（右の行き止まりに宝箱2、左へ進む）
      //   Z4: y=300→500   F3通過後（左から右へ、行き止まり多数）
      //   Z5: y=150→300   F4通過後（中央上へ・回復ゾーン）
      const WC  = 0x3a1a5a;
      const GC  = 0x9955dd;
      const WC2 = 0x1e0a30;

      this.decorations.push(
        this.add.rectangle(w / 2, h / 2, w, h, 0x080012).setDepth(0),
      );

      // ── 主要横バリア壁 [cx, cy, width, height] ──
      // F1 y=900: 右ギャップ x=520→750(230px)  → blocks x=0→520
      // F2 y=700: 左ギャップ x=0→230(230px)    → blocks x=230→750
      // F3 y=500: 右ギャップ x=520→750(230px)  → blocks x=0→520
      // F4 y=300: 左ギャップ x=0→230(230px)    → blocks x=230→750
      // F5 y=160: 中央ギャップ x=250→490(240px) → blocks 両端
      const floorWalls: [number, number, number, number][] = [
        [260, 900, 520, 40],      // F1: x=0→520
        [490, 700, 520, 40],      // F2: x=230→750
        [260, 500, 520, 40],      // F3: x=0→520
        [490, 300, 520, 40],      // F4: x=230→750
        [125, 160, 250, 40],      // F5 左: x=0→250
        [620, 160, 260, 40],      // F5 右: x=490→750
      ];

      // ── 行き止まり壁・ポケット壁 ──
      // Z1: 中央に縦壁(x=370)でエリアを左右に分け、左側のみギャップへ誘導
      //     右側は宝箱1(きびだんご)へのポケット
      // Z2: F1ギャップ(右端)から入り左へ。右端に縦壁。左側は浅い行き止まり
      // Z3: F2ギャップ(左端)から入り右へ。中央に縦壁。右側ポケットに宝箱2
      // Z4: F3ギャップ(右端)から入り左へ。中央横壁で行き止まり
      // Z5: 回復ゾーン配置
      const pocketWalls: [number, number, number, number][] = [
        // Z1: 縦壁(x=370, y=910→1140)でエリア分断 + 右ポケット蓋
        [370, 1035, 40, 250],    // 縦壁 y=910→1160
        [560, 980, 340, 40],     // 右ポケット蓋（行き止まり）y=980
        // Z2: 右側縦壁(x=630, y=710→895)で右エリアを絞る
        [630, 800, 40, 190],     // 右縦壁
        [400, 800, 400, 40],     // 左エリア行き止まり横壁
        // Z3: 中央縦壁(x=370, y=510→695)でエリア分断 + 右ポケット蓋
        [370, 600, 40, 190],     // 縦壁
        [200, 580, 340, 40],     // 左ポケット行き止まり
        // Z4: 中央横壁(y=400) + 左縦壁で複雑化
        [375, 400, 500, 40],     // 中央横壁
        [130, 400, 260, 40],     // 左部分（右に重複しないよう調整）→ 削除して下の縦壁のみに
        [120, 400, 40, 190],     // 左縦壁(x=120, y=305→495)
        // Z5: ボス手前の空間（特に壁なし、広々と）
      ];

      // Z4 のダブル壁を修正
      // → pocketWalls から [130, 400, 260, 40] を除外し、正しい壁のみ

      const allWalls: [number, number, number, number][] = [
        ...floorWalls,
        // Z1
        [370, 1035, 40, 250],
        [560, 980, 340, 40],
        // Z2
        [630, 800, 40, 190],
        [400, 800, 400, 40],
        // Z3
        [370, 600, 40, 190],
        [200, 580, 340, 40],
        // Z4
        [375, 400, 500, 40],
        [120, 400, 40, 190],
        // 追加行き止まり
        [630, 430, 220, 40],    // Z4右側行き止まり
        [375, 220, 240, 40],    // Z5中央横壁（行き止まり）
      ];

      // 当たり判定登録
      allWalls.forEach(([cx, cy, ww, wh]) => {
        this.dungeonWalls.push({ x: cx, y: cy, w: ww, h: wh });
      });

      // 描画（壁）
      allWalls.forEach(([cx, cy, ww, wh]) => {
        this.decorations.push(
          this.add.rectangle(cx, cy, ww, wh, WC).setStrokeStyle(2, GC).setDepth(3),
          this.add.rectangle(cx, cy, Math.max(ww - 10, 4), Math.max(wh - 10, 4), WC2).setDepth(3),
        );
      });

      // 床グリッド（薄線）
      for (let ty = 80; ty < h; ty += 100) {
        this.decorations.push(
          this.add.rectangle(w / 2, ty, w, 1, 0x4a2a6a, 0.2).setDepth(1),
        );
      }
      for (let tx = 50; tx < w; tx += 100) {
        this.decorations.push(
          this.add.rectangle(tx, h / 2, 1, h, 0x4a2a6a, 0.2).setDepth(1),
        );
      }

      // ── 宝箱1: きびだんご（Z1 右ポケット x=600, y=1050）──
      if (!getFlag('treasure_kibidango')) {
        const bx1 = 600, by1 = 1050;
        const chest1 = this.add.rectangle(bx1, by1, 50, 40, 0xaa6600)
          .setStrokeStyle(3, 0xffdd44).setDepth(5);
        this.add.rectangle(bx1, by1 - 10, 50, 14, 0xcc8800)
          .setStrokeStyle(2, 0xffee88).setDepth(6);
        this.add.text(bx1, by1 + 30, 'たからばこ', {
          fontSize: '18px', color: '#ffdd44', fontFamily: 'sans-serif',
          stroke: '#000', strokeThickness: 2,
        }).setOrigin(0.5).setDepth(6);
        this.decorations.push(chest1);
        this.addTriggerZone(bx1, by1, 'あける', 0xffcc00,
          'たからばこを あけますか？\n（きびだんご ×1）',
          () => {
            addItem('daikyuball', 1);
            setFlag('treasure_kibidango', true);
            this.showMessage('きびだんごを\nてにいれた！');
          },
        );
      }

      // ── 宝箱2: かるいきびだんご（Z3 右ポケット x=600, y=600）──
      if (!getFlag('treasure_karui')) {
        const bx2 = 600, by2 = 600;
        const chest2 = this.add.rectangle(bx2, by2, 50, 40, 0xaa6600)
          .setStrokeStyle(3, 0xffdd44).setDepth(5);
        this.add.rectangle(bx2, by2 - 10, 50, 14, 0xcc8800)
          .setStrokeStyle(2, 0xffee88).setDepth(6);
        this.add.text(bx2, by2 + 30, 'たからばこ', {
          fontSize: '18px', color: '#ffdd44', fontFamily: 'sans-serif',
          stroke: '#000', strokeThickness: 2,
        }).setOrigin(0.5).setDepth(6);
        this.decorations.push(chest2);
        this.addTriggerZone(bx2, by2, 'あける', 0xffcc00,
          'たからばこを あけますか？\n（かるいきびだんご ×2）',
          () => {
            addItem('okyuball', 2);
            setFlag('treasure_karui', true);
            this.showMessage('かるいきびだんごを\n2こ てにいれた！');
          },
        );
      }

      // ── 回復ゾーン（Z5 右寄り x=620, y=230）──
      const healX = 620, healY = 230;
      const healCircle = this.add.circle(healX, healY, 40, 0x00ff88, 0.15)
        .setStrokeStyle(3, 0x00ff88, 0.8).setDepth(4);
      this.add.text(healX, healY, '✦', {
        fontSize: '30px', color: '#00ffaa',
        stroke: '#005522', strokeThickness: 2,
      }).setOrigin(0.5).setDepth(5);
      this.add.text(healX, healY + 52, 'かいふく\nゾーン', {
        fontSize: '18px', color: '#00ffaa', fontFamily: 'sans-serif',
        align: 'center', stroke: '#000', strokeThickness: 2,
      }).setOrigin(0.5).setDepth(5);
      this.tweens.add({
        targets: healCircle, scaleX: 1.25, scaleY: 1.25, alpha: 0.3,
        duration: 1000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
      });
      this.decorations.push(healCircle);
      this.addTriggerZone(healX, healY, 'かいふく', 0x00ff88,
        'かいふくゾーンです。\nパーティのHPを\nかいふくしますか？',
        () => {
          const state = getState();
          state.party.forEach(m => { m.hp = m.maxHp; });
          this.showMessage('パーティのHPが\nかいふくした！');
        },
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

    // ── 別世界フィールド ────────────────────────────────────────
    } else if (fieldId === 'angel_hoikuen') {
      this.buildAngelHoikuen(w, h);
    } else if (fieldId === 'honoo_world') {
      this.buildAnotherWorld(w, h, 'ほのおのせかい', 0xff3300, [0xcc2200, 0xff6600],
        ['🔥', '🌋', '🔥', '🔥'],
        { bossId: 'boss_honoo_nushi', bossSpeciesId: 'honoo_nushi', bossName: 'ほのおのぬし', bossFlag: 'honoo_nushi_defeated', bossLevel: 20,
          childId: 'child_riri', childSpeciesId: 'riri', childName: 'りり', childLevel: 16 });
    } else if (fieldId === 'koori_world') {
      this.buildAnotherWorld(w, h, 'こおりのせかい', 0x88ddff, [0x336699, 0x66aacc],
        ['❄', '🧊', '❄', '❄'],
        { bossId: 'boss_koori_nushi', bossSpeciesId: 'koori_nushi', bossName: 'こおりのぬし', bossFlag: 'koori_nushi_defeated', bossLevel: 20,
          childId: 'child_asa', childSpeciesId: 'asa', childName: 'あさ', childLevel: 16 });
    } else if (fieldId === 'kaminari_world') {
      this.buildAnotherWorld(w, h, 'かみなりのせかい', 0xffff00, [0x330055, 0x660099],
        ['⚡', '⚡', '⚡', '⚡'],
        { bossId: 'boss_kaminari_nushi', bossSpeciesId: 'kaminari_nushi', bossName: 'かみなりのぬし', bossFlag: 'kaminari_nushi_defeated', bossLevel: 20,
          childId: 'child_kaho', childSpeciesId: 'kaho', childName: 'かほ', childLevel: 16 });
    } else if (fieldId === 'mizu_world') {
      this.buildAnotherWorld(w, h, 'みずのせかい', 0x4488ff, [0x003366, 0x336699],
        ['🌊', '💧', '🌊', '🐟'],
        { bossId: 'boss_mizu_nushi', bossSpeciesId: 'mizu_nushi', bossName: 'みずのぬし', bossFlag: 'mizu_nushi_defeated', bossLevel: 20,
          childId: 'child_haru', childSpeciesId: 'haru', childName: 'はる', childLevel: 16 });
    } else if (fieldId === 'sora_world') {
      this.buildAnotherWorld(w, h, 'そらのせかい', 0xaaddff, [0x4488cc, 0x88bbee],
        ['☁', '✨', '☁', '🕊'],
        { bossId: 'boss_sora_nushi', bossSpeciesId: 'sora_nushi', bossName: 'そらのぬし', bossFlag: 'sora_nushi_defeated', bossLevel: 20,
          childId: 'child_yuuki', childSpeciesId: 'yuuki', childName: 'ゆうき', childLevel: 16 });
    } else if (fieldId === 'angel_school') {
      this.buildAngelSchool(w, h);
    } else if (fieldId === 'yami_world') {
      this.buildYamiWorld(w, h);
    }
  }

  private buildAngelHoikuen(w: number, h: number): void {
    // 金色のほいくえん
    this.decorations.push(
      this.add.rectangle(w / 2, h / 2, w, h, 0xfff8e0),
      this.add.rectangle(w / 2, 120, w * 0.9, 160, 0xffeeaa).setStrokeStyle(3, 0xddaa44).setDepth(1),
      this.add.text(w / 2, 80, 'えんじぇるほいくえん', {
        fontSize: '28px', color: '#886600', fontFamily: 'sans-serif', fontStyle: 'bold',
        stroke: '#ffffff', strokeThickness: 3,
      }).setOrigin(0.5).setDepth(3),
    );
    // 光のエフェクト
    for (let i = 0; i < 12; i++) {
      const star = this.add.circle(
        30 + Math.random() * (w - 60), 200 + Math.random() * (h - 400),
        3 + Math.random() * 4, 0xffee88, 0.4 + Math.random() * 0.4,
      ).setDepth(2);
      this.decorations.push(star);
      this.tweens.add({ targets: star, alpha: 0, scaleX: 2, scaleY: 2, duration: 1500 + Math.random() * 1000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }

    // 回復NPC
    this.decorations.push(
      this.add.text(w / 2 - 160, h * 0.24, 'せんせい', {
        fontSize: '22px', color: '#886622', fontFamily: 'sans-serif', stroke: '#ffffff', strokeThickness: 2,
      }).setOrigin(0.5).setDepth(3),
    );
    this.addTriggerZone(w / 2 - 160, h * 0.28, 'はなす', 0xffcc44,
      'ここは えんじぇるほいくえん。\nせんせいが かいふくしてあげるよ！',
      () => {
        const state = getState();
        state.party.forEach(m => { m.hp = m.maxHp; });
        this.updateHUD();
        this.showMessage('パーティのHPが\nすべてかいふくした！');
      },
    );

    // 7つのとびら
    const doors: { label: string; field: string; color: number; x: number; y: number; locked: boolean }[] = [
      { label: 'ほのおのとびら', field: 'honoo_world',    color: 0xff4400, x: w * 0.20, y: h * 0.38, locked: false },
      { label: 'こおりのとびら', field: 'koori_world',    color: 0x44aaff, x: w * 0.50, y: h * 0.38, locked: false },
      { label: 'かみなりのとびら', field: 'kaminari_world', color: 0xffee00, x: w * 0.80, y: h * 0.38, locked: false },
      { label: 'みずのとびら',   field: 'mizu_world',    color: 0x2266ff, x: w * 0.20, y: h * 0.56, locked: false },
      { label: 'そらのとびら',   field: 'sora_world',    color: 0x88ccff, x: w * 0.80, y: h * 0.56, locked: false },
      { label: 'えんじぇるのとびら', field: 'angel_school', color: 0xffdd44, x: w * 0.50, y: h * 0.70, locked: false },
      { label: 'やみのとびら',   field: 'yami_world',    color: 0x440066, x: w * 0.50, y: h * 0.86, locked: false },
    ];

    for (const door of doors) {
      const bg = this.add.rectangle(door.x, door.y, 90, 130, door.color, 0.8)
        .setStrokeStyle(3, 0xffffff, 0.9).setDepth(3);
      const top = this.add.rectangle(door.x, door.y - 65, 90, 20, door.color, 1)
        .setStrokeStyle(2, 0xffffff, 0.8).setDepth(3);
      const label = this.add.text(door.x, door.y + 80, door.label, {
        fontSize: '16px', color: '#ffffff', fontFamily: 'sans-serif', align: 'center',
        stroke: '#000000', strokeThickness: 2,
      }).setOrigin(0.5).setDepth(4);
      this.decorations.push(bg, top, label);
      this.tweens.add({ targets: bg, alpha: 0.6, duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

      const d = door;
      if (d.field === 'yami_world') {
        this.addTriggerZone(d.x, d.y, 'とびら', d.color,
          `${d.label}を\nくぐりますか？`,
          () => this.tryEnterYamiWorld(),
        );
      } else {
        this.addTriggerZone(d.x, d.y, 'とびら', d.color,
          `${d.label}を\nくぐりますか？`,
          () => this.changeField(d.field),
        );
      }
    }

    // えんちょう先生（別世界版）- 銅・銀のきびだんご販売
    const awEnchoX = w * 0.82, awEnchoY = h * 0.20;
    this.decorations.push(
      this.add.image(awEnchoX, awEnchoY + 80, 'npc_encho').setDisplaySize(44, 56).setDepth(3),
      this.add.text(awEnchoX, awEnchoY + 114, 'えんちょう', {
        fontSize: '18px', color: '#886622', fontFamily: 'sans-serif', fontStyle: 'bold',
        stroke: '#ffffff', strokeThickness: 2,
      }).setOrigin(0.5).setDepth(4),
    );
    this.addTriggerZone(awEnchoX, awEnchoY + 148, 'きびだんご\nやさん', 0xddaa22,
      'べつのせかいの\nきびだんごやさんに\nはいりますか？',
      () => {
        this.scene.launch('BallShopScene', {
          items: ['douball', 'ginball'],
          title: 'えんちょうせんせいの\nべつせかいきびだんご',
        }).pause();
      },
    );
  }

  private tryEnterYamiWorld(): void {
    const bosses = ['honoo_nushi', 'koori_nushi', 'kaminari_nushi', 'mizu_nushi', 'sora_nushi'];
    const allDefeated = bosses.every(b => getFlag(`${b}_defeated`));
    if (!allDefeated) {
      const names: Record<string, string> = {
        honoo_nushi: 'ほのおのぬし', koori_nushi: 'こおりのぬし',
        kaminari_nushi: 'かみなりのぬし', mizu_nushi: 'みずのぬし', sora_nushi: 'そらのぬし',
      };
      const missingNames = bosses.filter(b => !getFlag(`${b}_defeated`)).map(b => names[b]).join('、');
      this.msgWin.show('', `やみのとびらは　しまっている…\nまだ　たおしていない　ぬしがいる！\n【${missingNames}】`);
      return;
    }
    const state = getState();
    state.position = { field: 'yami_world', x: 0, y: 0 };
    this.scene.start('DungeonMazeScene', { mode: 'yami' });
  }

  private buildAnotherWorld(w: number, h: number, name: string, accentColor: number, bgColors: number[], decorEmoji: string[], opts?: {
    bossId?: string; bossSpeciesId?: string; bossName?: string; bossFlag?: string; bossLevel?: number;
    childId?: string; childSpeciesId?: string; childName?: string; childLevel?: number;
  }): void {
    // グラデーション風の背景（2層の長方形）
    this.decorations.push(
      this.add.rectangle(w / 2, h * 0.3, w, h * 0.6, bgColors[0]).setDepth(0),
      this.add.rectangle(w / 2, h * 0.8, w, h * 0.4, bgColors[1]).setDepth(0),
    );
    this.decorations.push(
      this.add.text(w / 2, 36, name, {
        fontSize: '30px', color: '#ffffff', fontFamily: 'sans-serif', fontStyle: 'bold',
        stroke: '#000000', strokeThickness: 3,
      }).setOrigin(0.5).setDepth(3),
    );
    // 装飾エフェクト
    for (let i = 0; i < 8; i++) {
      const emo = this.add.text(
        40 + Math.random() * (w - 80), 200 + Math.random() * (h - 400),
        decorEmoji[i % decorEmoji.length], { fontSize: '28px' },
      ).setDepth(2).setAlpha(0.7);
      this.decorations.push(emo);
      this.tweens.add({ targets: emo, y: emo.y - 20, alpha: 0.3, duration: 2000 + i * 200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }
    // 発光床（エネルギーライン）
    for (let i = 0; i < 4; i++) {
      this.decorations.push(
        this.add.rectangle(w / 2, 300 + i * 220, w, 3, accentColor, 0.15).setDepth(1),
      );
    }

    // ── ぬし（フィールドボス）NPC ──────────────────────────
    if (opts?.bossId && opts.bossName && opts.bossFlag) {
      const bossX = w / 2, bossY = h * 0.22;
      const bossDefeated = getFlag(opts.bossFlag);
      const bossColor = bossDefeated ? 0x888888 : accentColor;
      this.decorations.push(
        this.add.rectangle(bossX, bossY, 90, 90, bossColor, 0.7).setStrokeStyle(3, 0xffffff, 0.9).setDepth(3),
        this.add.image(bossX, bossY, opts.bossId).setDisplaySize(80, 80).setDepth(4),
        this.add.text(bossX, bossY + 54, bossDefeated ? `${opts.bossName}（たおした）` : opts.bossName, {
          fontSize: '17px', color: bossDefeated ? '#aaaaaa' : '#ffffff',
          fontFamily: 'sans-serif', stroke: '#000000', strokeThickness: 2,
          align: 'center',
        }).setOrigin(0.5).setDepth(4),
      );
      if (!bossDefeated) {
        const bSpeciesId = opts.bossSpeciesId ?? opts.bossId ?? '';
        const bName = opts.bossName, bLv = opts.bossLevel ?? 20;
        this.addTriggerZone(bossX, bossY, 'たたかう', 0xff2200,
          `${bName}が\nにらんでいる…\nたたかいますか？`,
          () => {
            const state = getState();
            state.position.x = this.player.x;
            state.position.y = this.player.y;
            const enemy = createMonsterInstance(bSpeciesId, bLv);
            enemy.uid = `${bSpeciesId}_boss`;
            this.scene.start('BattleScene', { enemy, isBoss: true });
          },
        );
      }
    }

    // ── こども NPC ──────────────────────────────────────────
    if (opts?.childId && opts.childName) {
      const childX = w * 0.25, childY = h * 0.55;
      this.decorations.push(
        this.add.image(childX, childY, opts.childId).setDisplaySize(52, 52).setDepth(3),
        this.add.text(childX, childY + 36, opts.childName, {
          fontSize: '20px', color: '#ffeeaa', fontFamily: 'sans-serif', fontStyle: 'bold',
          stroke: '#220000', strokeThickness: 2,
        }).setOrigin(0.5).setDepth(4),
      );
      const cSpecies = opts.childSpeciesId ?? '', cName = opts.childName, cLv = opts.childLevel ?? 15;
      this.addTriggerZone(childX, childY, 'はなす', 0xffcc44,
        `${cName}：「きびだんごを\nもってたら　くれる？」\nバトルしますか？`,
        () => {
          const state = getState();
          state.position.x = this.player.x;
          state.position.y = this.player.y;
          const enemy = createMonsterInstance(cSpecies, cLv);
          this.scene.start('BattleScene', { enemy, isBoss: false });
        },
      );
    }
  }

  private buildAngelSchool(w: number, h: number): void {
    this.buildAnotherWorld(w, h, 'エンジェルしょうがっこう', 0xffdd44, [0xfff0cc, 0xffeeaa], ['✨', '⭐', '✨', '📚']);
    // 学校の建物
    this.decorations.push(
      this.add.rectangle(w / 2, 130, w * 0.7, 140, 0xffffee).setStrokeStyle(3, 0xddaa44).setDepth(1),
      this.add.text(w / 2, 80, 'とくべつきょうしつ', {
        fontSize: '22px', color: '#886600', fontFamily: 'sans-serif', fontStyle: 'bold',
        stroke: '#ffffff', strokeThickness: 2,
      }).setOrigin(0.5).setDepth(3),
    );
    // 先生NPC（計算ゲームトリガー）
    this.decorations.push(
      this.add.text(w / 2, h * 0.40, '⭐せんせい⭐', {
        fontSize: '24px', color: '#886600', fontFamily: 'sans-serif', stroke: '#ffffff', strokeThickness: 2,
      }).setOrigin(0.5).setDepth(3),
    );
    this.addTriggerZone(w / 2, h * 0.48, 'とくべつ\nけいさん', 0xffcc44,
      'とくべつけいさんゲームに\nちょうせんしますか？\n（むずかしいよ！）',
      () => this.scene.start('ArithmeticScene', { difficulty: 'hard' }),
    );
  }

  private buildYamiWorld(w: number, h: number): void {
    // 暗い世界
    this.decorations.push(
      this.add.rectangle(w / 2, h / 2, w, h, 0x050008),
      this.add.rectangle(w / 2, h / 2, w, h, 0x0a000f, 0.5).setDepth(0),
    );
    // 紫の霧
    for (let i = 0; i < 6; i++) {
      const fog = this.add.circle(
        60 + i * 120, 300 + (i % 2) * 200, 80, 0x330044, 0.2,
      ).setDepth(1);
      this.decorations.push(fog);
      this.tweens.add({ targets: fog, scaleX: 1.5, scaleY: 1.5, alpha: 0.05, duration: 2500 + i * 300, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }
    // やみのていおうのしろ（上部）
    this.decorations.push(
      this.add.rectangle(w / 2, 100, 180, 140, 0x220033).setStrokeStyle(3, 0x9900ff, 0.8).setDepth(2),
      this.add.rectangle(w / 2, 100, 160, 120, 0x110022).setDepth(2),
      this.add.text(w / 2, 70, 'やみのていおうの\nしろ', {
        fontSize: '20px', color: '#cc00ff', fontFamily: 'sans-serif', align: 'center',
        stroke: '#000000', strokeThickness: 3,
      }).setOrigin(0.5).setDepth(3),
    );
    for (let i = 0; i < 3; i++) {
      this.decorations.push(
        this.add.rectangle(w / 2 - 60 + i * 60, 30, 20, 40, 0x330044).setDepth(2),
      );
    }
    // ボストリガー
    this.addTriggerZone(w / 2, 148, 'しろへ', 0x9900ff,
      'やみのていおうが\nよんでいる…\nいどみますか？',
      () => this.triggerYamiTeiou(),
    );
    this.decorations.push(
      this.add.text(w / 2, 36, 'やみのせかい', {
        fontSize: '28px', color: '#cc00ff', fontFamily: 'sans-serif', fontStyle: 'bold',
        stroke: '#000000', strokeThickness: 3,
      }).setOrigin(0.5).setDepth(3),
    );
    // 浮島
    for (let i = 0; i < 4; i++) {
      this.decorations.push(
        this.add.rectangle(80 + i * 180, 250 + (i % 2) * 150, 100, 30, 0x220033).setStrokeStyle(2, 0x660099, 0.6).setDepth(1),
      );
    }
  }

  update(time: number, delta: number): void {
    if (this.msgWin.isVisible()) return;
    if (this.scene.isActive('MenuScene')) return;

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

  private showMessage(text: string): void {
    this.msgWin.show('', text);
  }

  private changeField(toField: string): void {
    const state = getState();
    const field = FIELDS[toField];
    if (!field) return;

    // ちかめいろ → グリッド迷路シーンへ切り替え
    if (toField === 'dungeon') {
      state.position = { field: 'dungeon', x: 0, y: 0 }; // x=0 で新規入場扱い
      this.scene.start('DungeonMazeScene');
      return;
    }

    // （しょうがっこうの制限は撤廃：撃破後は別世界ワープポイントが開く）

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
    const darkFields = ['jinja', 'shogakko', 'dungeon', 'kaminari_world', 'yami_world', 'mizu_world', 'koori_world'];
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

  private triggerYamiTeiou(): void {
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
      { speaker: '', text: 'しろの　おくから　やみのていおうが\nあらわれた！' },
      { speaker: 'やみのていおう', text: 'フフフ…　ようやく\nここまで　きたか。' },
      { speaker: 'やみのていおう', text: 'だが　ここで　おまえの\nたびは　おわりだ！' },
    ];
    this.msgWin.showSequence(dialogs, () => {
      const enemy = createMonsterInstance('yami_no_teiou', 30);
      enemy.uid = 'yami_teiou_boss';
      state.position.x = this.player.x;
      state.position.y = this.player.y;
      this.scene.start('BattleScene', { enemy, isBoss: true });
    });
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
