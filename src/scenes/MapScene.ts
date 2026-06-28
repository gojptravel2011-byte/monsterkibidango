import Phaser from 'phaser';
import { MessageWindow } from '../ui/MessageWindow';
import { getState, setFlag, getFlag, createMonsterInstance } from '../state/playerState';
import { countStep, resetStepCount, generateEncounter } from '../systems/encounter';
import { FIELDS } from '../data/fields';
import { STORY_EVENTS } from '../data/story';
import { PLACEHOLDER_COLORS } from '../assets/assetKeys';
import { saveGame } from '../systems/save';
import { BGM } from '../systems/bgm';

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

  constructor() { super('MapScene'); }

  create(): void {
    const pos = getState().position;
    this.buildField(pos.field);

    // プレイヤーは create() で必ず生成（shutdown で破棄された参照を再利用しないよう）
    this.player = this.add.sprite(pos.x, pos.y, 'player_f0')
      .setDisplaySize(PLAYER_SIZE * 1.4, PLAYER_SIZE * 1.8).setDepth(10);
    this.player.play('player_idle');
    this.playerLabel = this.add.text(pos.x, pos.y - 30, getState().name.charAt(0), {
      fontSize: '18px', color: '#ffffff', fontFamily: 'sans-serif',
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
    this.fieldNameText = this.add.text(10, 10, '', {
      fontSize: '18px', color: '#ffffff', fontFamily: 'sans-serif',
      stroke: '#000000', strokeThickness: 3,
    }).setDepth(150).setScrollFactor(0);

    this.coinsText = this.add.text(10, 36, '', {
      fontSize: '20px', color: '#ffdd44', fontFamily: 'sans-serif',
      stroke: '#000000', strokeThickness: 3,
    }).setDepth(150).setScrollFactor(0);

    this.updateHUD();
    this.showFieldEvent(pos.field);

    // ハンバーガーメニュー（右上）
    const menuBtnX = w - 36;
    const menuBtnY = 36;
    this.add.rectangle(menuBtnX, menuBtnY, 56, 56, 0x334466, 0.9)
      .setStrokeStyle(2, 0x8888ff).setDepth(150).setScrollFactor(0)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.scene.launch('MenuScene').pause());
    for (let i = 0; i < 3; i++) {
      this.add.rectangle(menuBtnX, menuBtnY - 10 + i * 10, 30, 3, 0xffffff)
        .setDepth(151).setScrollFactor(0);
    }

    this.events.on('resume', () => {
      this.updateHUD();
      const f = getState().position.field;
      BGM.play(['jinja', 'shogakko'].includes(f) ? 'field_dark' : 'field');
    });

    // BGM開始（フィールドに応じて）
    const startField = getState().position.field;
    const darkFields = ['jinja', 'shogakko'];
    BGM.play(darkFields.includes(startField) ? 'field_dark' : 'field');
  }

  private buildField(fieldId: string): void {
    this.decorations.forEach(d => d.destroy());
    this.decorations = [];
    this.connections = [];
    this.triggers = [];
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
        fontSize: '18px', color: '#ffffff', fontFamily: 'sans-serif',
        stroke: '#000000', strokeThickness: 2,
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
    // ラベル
    const txt = this.add.text(x, y - 46, label, {
      fontSize: '17px', color: '#ffffff', fontFamily: 'sans-serif',
      stroke: '#000000', strokeThickness: 3, align: 'center',
    }).setOrigin(0.5).setDepth(5);
    this.decorations.push(circle, txt);
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
          fontSize: '22px', color: '#664400', fontFamily: 'sans-serif', fontStyle: 'bold',
          stroke: '#ffffff', strokeThickness: 3,
        }).setOrigin(0.5).setDepth(3),
      );

      // おみせ（右の建物）→ 近づくと発動
      this.decorations.push(
        this.add.rectangle(500, 280, 80, 40, 0xddaa44).setStrokeStyle(2, 0xffcc66).setDepth(3),
        this.add.text(500, 280, 'おみせ', { fontSize: '18px', color: '#ffffff', fontFamily: 'sans-serif' }).setOrigin(0.5).setDepth(4),
      );
      this.addTriggerZone(500, 320, 'おみせ\nはいる', 0xffcc44,
        'おみせに\nはいりますか？',
        () => { this.scene.launch('ShopScene').pause(); },
      );

      // 砂場
      this.decorations.push(
        this.add.rectangle(w / 2 - 150, h * 0.45, 100, 70, 0xeedd88).setDepth(2).setStrokeStyle(2, 0xaa9944),
        this.add.text(w / 2 - 150, h * 0.45, 'すなば', { fontSize: '17px', color: '#886622', fontFamily: 'sans-serif' }).setOrigin(0.5).setDepth(3),
      );

      // おちばひろいエリア（ほいくえんに移動）
      const kouyouTree = this.add.circle(w / 2 - 240, h * 0.40, 32, 0xcc6622).setDepth(2);
      this.decorations.push(
        kouyouTree,
        this.add.text(w / 2 - 240, h * 0.40, '🍂', { fontSize: '24px' }).setOrigin(0.5).setDepth(3),
      );
      this.addTriggerZone(w / 2 - 240, h * 0.45, 'おちば\nひろい', 0xcc6622,
        'おちばひろいを\nしますか？',
        () => { this.scene.start('MinigameScene'); },
      );

      // たしざん・ひきざんゲーム
      const calcArea = this.add.rectangle(w / 2 + 180, h * 0.65, 90, 60, 0x3355aa).setDepth(2)
        .setStrokeStyle(2, 0x8888ff);
      const calcLabel = this.add.text(w / 2 + 180, h * 0.65, 'けいさん\nコーナー', {
        fontSize: '17px', color: '#ffffff', fontFamily: 'sans-serif', align: 'center',
      }).setOrigin(0.5).setDepth(3);
      this.decorations.push(calcArea, calcLabel);
      this.addTriggerZone(w / 2 + 180, h * 0.70, 'けいさん\nゲーム', 0x4466cc,
        'たしざん・ひきざん\nゲームをしますか？',
        () => { this.scene.start('ArithmeticScene'); },
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
          fontSize: '20px', color: '#3333aa', fontFamily: 'sans-serif', fontStyle: 'bold',
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
            fontSize: '20px', color: '#333333', fontFamily: 'sans-serif',
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
      this.decorations.push(
        this.add.image(w / 2, 130, 'deco_school').setDepth(2),
        this.add.rectangle(w / 2, h / 2, w, h, 0x000022).setAlpha(0.3).setDepth(3),
        this.add.rectangle(w / 2, h * 0.68, w * 0.8, h * 0.2, 0xcc9966).setDepth(1),
      );
      // ボスゾーン：近づくと発動
      this.decorations.push(
        this.add.text(w / 2, h / 2 - 80, 'くらやみの\nあるじ', {
          fontSize: '20px', color: '#ff4444', fontFamily: 'sans-serif', align: 'center',
          stroke: '#000000', strokeThickness: 3,
        }).setOrigin(0.5).setDepth(6),
      );
      this.addTriggerZone(w / 2, h / 2 - 40, 'ちかづく', 0x880000,
        'くらやみのあるじに\nいどみますか？',
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
      this.player.x = Phaser.Math.Clamp(this.player.x + vx * dt, 20, w - 20);
      this.player.y = Phaser.Math.Clamp(this.player.y + vy * dt, 20, h - 20);
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
    const darkFields = ['jinja', 'shogakko'];
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
