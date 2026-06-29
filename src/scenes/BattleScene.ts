import Phaser from 'phaser';
import { MessageWindow } from '../ui/MessageWindow';
import { BGM } from '../systems/bgm';
import type { MonsterInstance } from '../state/playerState';
import { getState, addToParty, gainExp, addCoins, removeItem, setFlag } from '../state/playerState';
import { MONSTER_SPECIES } from '../data/monsters';
import { SKILLS } from '../data/skills';
import { ITEMS } from '../data/items';
import { calcDamage, enemyChooseSkill, applyDamage, isFainted, calcExpGain, calcCoinGain } from '../systems/battle';
import { tryCatch } from '../systems/encounter';
import { T } from '../ui/theme';
import { TS } from '../ui/StyledText';
import { drawPanel, makeBtn } from '../ui/Panel';

type Phase = 'command' | 'item' | 'ball' | 'anim' | 'end';

export class BattleScene extends Phaser.Scene {
  private enemy!: MonsterInstance;
  private isBoss: boolean = false;
  private ally!: MonsterInstance;
  private msgWin!: MessageWindow;
  private phase: Phase = 'command';

  // UI要素
  private allySprite!: Phaser.GameObjects.Image;
  private enemySprite!: Phaser.GameObjects.Image;
  private allyHpText!: Phaser.GameObjects.Text;
  private enemyHpText!: Phaser.GameObjects.Text;
  private allyNameText!: Phaser.GameObjects.Text;
  private enemyNameText!: Phaser.GameObjects.Text;
  private commandButtons: Phaser.GameObjects.GameObject[] = [];

  constructor() { super('BattleScene'); }

  init(data: { enemy: MonsterInstance; isBoss?: boolean }): void {
    this.enemy = data.enemy;
    this.isBoss = data.isBoss ?? false;
  }

  create(): void {
    const w = this.scale.width;
    const h = this.scale.height;
    const state = getState();

    // 手持ちの先頭（HP > 0）を選ぶ
    this.ally = state.party.find(m => m.hp > 0) ?? state.party[0];

    // 背景（フィールド別）
    const fieldColors: Record<string, number> = {
      kouen: 0x336633,
      jutakugai: 0x664422,
      jinja: 0x220033,
      shotengai: 0x553300,
      shogakko: 0x111133,
    };
    const fieldId = getState().position.field;
    const bgColor = fieldColors[fieldId] ?? 0x221122;
    this.add.rectangle(w / 2, h / 2, w, h, bgColor);
    const groundColor = fieldId === 'jinja' ? 0x442200 : fieldId === 'shogakko' ? 0x223355 : 0x334455;
    this.add.rectangle(w / 2, h * 0.35, w, h * 0.5, groundColor);

    // 敵スプライト
    const eSpecies = MONSTER_SPECIES[this.enemy.speciesId];
    this.enemySprite = this.add.image(w * 0.65, h * 0.26, eSpecies?.spriteKey ?? 'monster_kurosuke')
      .setDisplaySize(96, 96).setFlipX(true);

    // 敵ステータスパネル
    drawPanel(this, 10, 80, 340, 80, { depth: 10 });
    this.enemyNameText = this.add.text(w * 0.35, h * 0.12, `${eSpecies?.name ?? this.enemy.speciesId} Lv.${this.enemy.level}`, {
      ...TS.subheading,
    }).setDepth(11);
    this.enemyHpText = this.add.text(w * 0.35, h * 0.18, '', {
      ...TS.hp,
    }).setDepth(11);

    // 味方スプライト
    const aSpecies = MONSTER_SPECIES[this.ally?.speciesId];
    this.allySprite = this.add.image(w * 0.25, h * 0.49, aSpecies?.spriteKey ?? 'player')
      .setDisplaySize(96, 96);

    // 味方ステータスパネル
    drawPanel(this, w - 350, 350, 340, 80, { depth: 10 });
    this.allyNameText = this.add.text(w * 0.5, h * 0.37, `${aSpecies?.name ?? 'なかま'} Lv.${this.ally?.level ?? 1}`, {
      ...TS.subheading,
    }).setDepth(11);
    this.allyHpText = this.add.text(w * 0.5, h * 0.43, '', {
      ...TS.hp,
    }).setDepth(11);

    this.msgWin = new MessageWindow(this);
    this.input.on('pointerdown', (_: Phaser.Input.Pointer, objs: Phaser.GameObjects.GameObject[]) => {
      if (objs.length === 0 && this.msgWin.isVisible()) {
        this.msgWin.advance();
      }
    });

    BGM.play(this.isBoss ? 'boss' : 'battle');

    this.updateHpDisplay();
    this.showCommandMenu();

    // バトル開始メッセージ
    this.msgWin.show(
      '',
      `${eSpecies?.name ?? 'モンスター'}が　あらわれた！`,
      () => this.showCommandMenu(),
    );
  }

  private updateHpDisplay(): void {
    if (this.enemy) {
      this.enemyHpText.setText(`HP: ${this.enemy.hp} / ${this.enemy.maxHp}`);
    }
    if (this.ally) {
      this.allyHpText.setText(`HP: ${this.ally.hp} / ${this.ally.maxHp}`);
    }
  }

  private clearButtons(): void {
    this.commandButtons.forEach(b => b.destroy());
    this.commandButtons = [];
  }

  private showCommandMenu(): void {
    this.clearButtons();
    const w = this.scale.width;
    const h = this.scale.height;
    this.phase = 'command';

    // 上4つは2列、最後1つは中央
    const commands = [
      { label: 'わざ', action: () => this.showSkillMenu() },
      { label: 'アイテム', action: () => this.showItemMenu() },
      { label: 'きびだんご', action: () => this.showBallMenu() },
      { label: 'こうたい', action: () => this.showSwitchMenu() },
      { label: 'にげる', action: () => this.tryEscape() },
    ];

    commands.forEach((cmd, i) => {
      const isLast = i === commands.length - 1;
      const x = isLast ? w * 0.5 : (i % 2 === 0 ? w * 0.3 : w * 0.72);
      const y = isLast ? h * 0.84 : h * 0.68 + Math.floor(i / 2) * 70;
      const bg = makeBtn(this, x, y, isLast ? 340 : 180, 60)
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => { this.clearButtons(); cmd.action(); })
        .on('pointerover', () => bg.setFillStyle(0x2a4090))
        .on('pointerout', () => bg.setFillStyle(T.panelMid));
      const text = this.add.text(x, y, cmd.label, {
        ...TS.btn,
      }).setOrigin(0.5).setDepth(52);
      this.commandButtons.push(bg, text);
    });
  }

  private showSwitchMenu(): void {
    const state = getState();
    const w = this.scale.width;
    const h = this.scale.height;

    // 手持ちから現在のモンスター以外でHP>0のものを取得
    const candidates = state.party.filter(m => m.uid !== this.ally.uid && m.hp > 0);

    if (candidates.length === 0) {
      this.msgWin.show('', 'ほかに　たたかえる\nなかまが　いない！', () => this.showCommandMenu());
      return;
    }

    // リスト背景
    const panelH = candidates.length * 80 + 20;
    const panelY = h * 0.62;
    const panel = drawPanel(this, 10, panelY, w - 20, panelH, { depth: 49 });
    this.commandButtons.push(panel);

    // 戻るボタン
    const backBg = makeBtn(this, w / 2, h * 0.58, 200, 44)
      .setFillStyle(T.accent1)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.showCommandMenu())
      .on('pointerover', () => backBg.setFillStyle(0x5c1f28))
      .on('pointerout', () => backBg.setFillStyle(T.accent1));
    const backTxt = this.add.text(w / 2, h * 0.58, 'もどる', {
      ...TS.btn,
    }).setOrigin(0.5).setDepth(52);
    this.commandButtons.push(backBg, backTxt);

    candidates.forEach((m, i) => {
      const species = MONSTER_SPECIES[m.speciesId];
      const y = h * 0.64 + i * 80;
      const hpRatio = m.hp / m.maxHp;
      const hpColor = hpRatio > 0.5 ? T.textGreen : hpRatio > 0.2 ? T.textYellow : T.textRed;
      const btn = makeBtn(this, w / 2, y, w - 40, 66)
        .setInteractive({ useHandCursor: true })
        .on('pointerover', () => btn.setFillStyle(0x2a4090))
        .on('pointerout', () => btn.setFillStyle(T.panelMid))
        .on('pointerdown', () => {
          this.clearButtons();
          this.switchAlly(m);
        });
      const nameTxt = this.add.text(60, y - 10, `${species?.name ?? m.speciesId}  Lv.${m.level}`, {
        ...TS.subheading,
      }).setOrigin(0, 0.5).setDepth(52);
      const hpTxt = this.add.text(60, y + 16, `HP: ${m.hp} / ${m.maxHp}`, {
        ...TS.hp,
        color: hpColor,
      }).setOrigin(0, 0.5).setDepth(52);
      const icon = this.add.image(36, y, species?.spriteKey ?? 'player').setDisplaySize(44, 44).setDepth(52);
      this.commandButtons.push(btn, nameTxt, hpTxt, icon);
    });
  }

  private switchAlly(next: MonsterInstance): void {
    this.ally = next;
    const aSpecies = MONSTER_SPECIES[this.ally.speciesId];
    this.allyNameText.setText(`${aSpecies?.name ?? 'なかま'} Lv.${this.ally.level}`);
    this.allySprite.setTexture(aSpecies?.spriteKey ?? 'player').setDisplaySize(96, 96);
    this.updateHpDisplay();
    // こうたいは敵のターンを消費しない（即時交代）
    this.msgWin.show('', `${aSpecies?.name}、いくよ！`, () => this.showCommandMenu());
  }

  private showSkillMenu(): void {
    if (!this.ally) return;
    const w = this.scale.width;
    const h = this.scale.height;

    const back = drawPanel(this, 10, h * 0.60, w - 20, 200, { depth: 49 });
    this.commandButtons.push(back);

    this.ally.skills.forEach((skillId, i) => {
      const skill = SKILLS[skillId];
      if (!skill) return;
      const x = i < 2 ? w * 0.3 : w * 0.72;
      const y = h * 0.63 + (i % 2) * 70;
      const bg = makeBtn(this, x, y, 180, 60)
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => { this.clearButtons(); this.playerAttack(skillId); })
        .on('pointerover', () => bg.setFillStyle(0x2a4090))
        .on('pointerout', () => bg.setFillStyle(T.panelMid));
      const text = this.add.text(x, y, `${skill.name}\nいりょく:${skill.power}`, {
        ...TS.btn,
        align: 'center',
      }).setOrigin(0.5).setDepth(52);
      this.commandButtons.push(bg, text);
    });

    const cancelBg = makeBtn(this, w / 2, h * 0.85, 140, 48)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => { this.clearButtons(); this.showCommandMenu(); });
    const cancelText = this.add.text(w / 2, h * 0.85, 'もどる', {
      ...TS.btn,
    }).setOrigin(0.5).setDepth(52);
    this.commandButtons.push(cancelBg, cancelText);
  }

  private showItemMenu(): void {
    const state = getState();
    const healItems = state.inventory.filter(i => {
      const item = ITEMS[i.itemId];
      return item?.type === 'heal' && i.count > 0;
    });

    const w = this.scale.width;
    const h = this.scale.height;

    if (healItems.length === 0) {
      this.msgWin.show('', 'かいふくアイテムが　ないよ！', () => this.showCommandMenu());
      return;
    }

    healItems.forEach((inv, i) => {
      const item = ITEMS[inv.itemId];
      const x = w / 2;
      const y = h * 0.63 + i * 65;
      const bg = makeBtn(this, x, y, 260, 52)
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => {
          removeItem(inv.itemId);
          const heal = item.healAmount ?? 20;
          this.ally.hp = Math.min(this.ally.hp + heal, this.ally.maxHp);
          this.clearButtons();
          this.updateHpDisplay();
          this.msgWin.show('', `${item.name}を　つかった！\nHPが ${heal} かいふく！`, () => this.enemyTurn());
        });
      const text = this.add.text(x, y, `${item.name}（${inv.count}こ）`, {
        ...TS.btn,
      }).setOrigin(0.5).setDepth(52);
      this.commandButtons.push(bg, text);
    });

    const cancelBg = makeBtn(this, w / 2, h * 0.85, 140, 48)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => { this.clearButtons(); this.showCommandMenu(); });
    this.commandButtons.push(cancelBg, this.add.text(w / 2, h * 0.85, 'もどる', {
      ...TS.btn,
    }).setOrigin(0.5).setDepth(52));
  }

  private showBallMenu(): void {
    if (this.isBoss || !MONSTER_SPECIES[this.enemy.speciesId]?.catchable) {
      this.msgWin.show('', 'このモンスターには\nきびだんごが　きかないよ！', () => this.showCommandMenu());
      return;
    }

    const state = getState();
    const balls = state.inventory.filter(i => ITEMS[i.itemId]?.type === 'ball' && i.count > 0);
    const w = this.scale.width;
    const h = this.scale.height;

    if (balls.length === 0) {
      this.msgWin.show('', 'きびだんごを　もっていないよ！\nおみせで　かってね！', () => this.showCommandMenu());
      return;
    }

    balls.forEach((inv, i) => {
      const item = ITEMS[inv.itemId];
      const x = w / 2;
      const y = h * 0.63 + i * 65;
      const bg = makeBtn(this, x, y, 260, 52)
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => {
          removeItem(inv.itemId);
          this.clearButtons();
          const caught = tryCatch(this.enemy, item.catchBonus ?? 0);
          if (caught) {
            addToParty(this.enemy);
            const eSpecies = MONSTER_SPECIES[this.enemy.speciesId];
            this.msgWin.show('', `${eSpecies?.name}を\nつかまえた！`, () => this.endBattle(false));
          } else {
            this.msgWin.show('', 'のがしちゃった…\nもう　いちど　がんばろう！', () => this.enemyTurn());
          }
        });
      const ballText = this.add.text(x, y, `${item.name}（${inv.count}こ）`, {
        ...TS.btn,
      }).setOrigin(0.5).setDepth(52);
      this.commandButtons.push(bg, ballText);
    });

    const cancelBg = makeBtn(this, w / 2, h * 0.85, 140, 48)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => { this.clearButtons(); this.showCommandMenu(); });
    this.commandButtons.push(cancelBg, this.add.text(w / 2, h * 0.85, 'もどる', {
      ...TS.btn,
    }).setOrigin(0.5).setDepth(52));
  }

  private playerAttack(skillId: string): void {
    const skill = SKILLS[skillId];
    const dmg = calcDamage(this.ally, skillId);
    applyDamage(this.enemy, dmg);
    this.updateHpDisplay();
    const eSpecies = MONSTER_SPECIES[this.enemy.speciesId];

    this.msgWin.show(
      '',
      `${MONSTER_SPECIES[this.ally.speciesId]?.name}の\n${skill?.name}！\n${dmg}の　ダメージ！`,
      () => {
        if (isFainted(this.enemy)) {
          this.onEnemyFaint();
        } else {
          this.enemyTurn();
        }
      },
    );
  }

  private enemyTurn(): void {
    if (isFainted(this.enemy)) { this.onEnemyFaint(); return; }

    const skillId = enemyChooseSkill(this.enemy);
    const dmg = calcDamage(this.enemy, skillId);
    applyDamage(this.ally, dmg);
    this.updateHpDisplay();
    const skill = SKILLS[skillId];
    const eSpecies = MONSTER_SPECIES[this.enemy.speciesId];

    this.msgWin.show(
      '',
      `${eSpecies?.name}の\n${skill?.name}！\n${dmg}の　ダメージ！`,
      () => {
        if (isFainted(this.ally)) {
          this.onAllyFaint();
        } else {
          this.showCommandMenu();
        }
      },
    );
  }

  private onEnemyFaint(): void {
    const state = getState();
    const eSpecies = MONSTER_SPECIES[this.enemy.speciesId];
    let exp = calcExpGain(this.enemy);
    const coins = calcCoinGain(this.enemy);
    addCoins(coins);

    // アクセサリー（きらこら）の経験値ボーナス適用
    const hasExpBonus = state.inventory.some(i => {
      const item = ITEMS[i.itemId];
      return item?.type === 'accessory' && item.expBonus && i.count > 0;
    });
    if (hasExpBonus) exp = Math.floor(exp * 1.5);

    const prevLevel = this.ally.level;
    const newSkills = gainExp(this.ally, exp);
    const didLevelUp = this.ally.level > prevLevel;

    const messages: string[] = [
      `${eSpecies?.name}を　たおした！`,
      `けいけんち　${exp}　ゲット！`,
      `コイン　${coins}まい　ゲット！`,
    ];
    if (didLevelUp) {
      messages.push(`${MONSTER_SPECIES[this.ally.speciesId]?.name}は\nレベル${this.ally.level}に　なった！`);
    }
    if (newSkills.length > 0) {
      newSkills.forEach(s => messages.push(`${MONSTER_SPECIES[this.ally.speciesId]?.name}は\n${SKILLS[s]?.name}を　おぼえた！`));
    }

    this.updateHpDisplay();
    if (didLevelUp) {
      const w = this.scale.width, h = this.scale.height;
      const lvBanner = this.add.text(w / 2, h * 0.3, `★ LEVEL UP! Lv.${this.ally.level} ★`, {
        ...TS.heading,
        fontSize: '38px',
        color: T.textGold,
        stroke: '#ff6600',
        strokeThickness: 6,
      }).setOrigin(0.5).setDepth(200);
      this.tweens.add({
        targets: lvBanner, scaleX: 1.2, scaleY: 1.2, alpha: 0,
        duration: 1800, ease: 'Sine.easeIn',
        onComplete: () => lvBanner.destroy(),
      });
    }
    const dialogs = messages.map(m => ({ speaker: '', text: m }));
    this.msgWin.showSequence(dialogs, () => {
      if (this.isBoss) {
        setFlag('rasubossDefeated');
        this.scene.start('EndingScene');
      } else {
        this.endBattle(false);
      }
    });
  }

  private onAllyFaint(): void {
    // 倒れた演出：ぐらぐら→フェードアウト
    this.tweens.add({
      targets: this.allySprite,
      angle: { from: 0, to: 90 },
      alpha: { from: 1, to: 0 },
      y: this.allySprite.y + 30,
      duration: 600,
      ease: 'Power2',
      onComplete: () => {
        const w = this.scale.width, h = this.scale.height;
        const faintTxt = this.add.text(w * 0.25, h * 0.46, 'たおれた…', {
          ...TS.damage,
          stroke: '#330000',
          strokeThickness: 3,
        }).setOrigin(0.5).setDepth(50);
        this.time.delayedCall(700, () => {
          faintTxt.destroy();
          this.allySprite.setAngle(0).setAlpha(1);
          this.doAllyFaintNext();
        });
      },
    });
  }

  private doAllyFaintNext(): void {
    const state = getState();
    const nextAlly = state.party.find(m => m.hp > 0 && m.uid !== this.ally.uid);
    if (nextAlly) {
      this.ally = nextAlly;
      this.updateHpDisplay();
      const aSpecies = MONSTER_SPECIES[this.ally.speciesId];
      this.allyNameText.setText(`${aSpecies?.name ?? 'なかま'} Lv.${this.ally.level}`);
      this.allySprite.setTexture(aSpecies?.spriteKey ?? 'player').setDisplaySize(96, 96);
      this.msgWin.show('', `${aSpecies?.name}、いくよ！`, () => this.showCommandMenu());
    } else {
      this.msgWin.show('', 'なかまが　みんな　たおれた…\nほいくえんに　もどるよ！', () => {
        state.party.forEach(m => { m.hp = Math.max(1, Math.floor(m.maxHp * 0.3)); });
        state.position = { field: 'hoikuen', x: 400, y: 300 };
        this.scene.start('MapScene');
      });
    }
  }

  private tryEscape(): void {
    if (this.isBoss) {
      this.msgWin.show('', 'ここで　にげるわけには　いかない！', () => this.showCommandMenu());
      return;
    }
    // 逃げる成功率 70%
    if (Math.random() < 0.7) {
      this.msgWin.show('', 'うまく　にげられた！', () => this.endBattle(true));
    } else {
      this.msgWin.show('', 'にげられなかった！', () => this.enemyTurn());
    }
  }

  private endBattle(_escaped: boolean): void {
    const field = getState().position.field;
    const darkFields = ['jinja', 'shogakko'];
    BGM.play(darkFields.includes(field) ? 'field_dark' : 'field');
    this.scene.start('MapScene');
  }
}
