import Phaser from 'phaser';
import { T } from './theme';
import { TS } from './StyledText';
import { drawPanel, makeBtn } from './Panel';
import { MONSTER_SPECIES } from '../data/monsters';
import type { MonsterInstance } from '../state/playerState';

// 「○○が うまれた！」の新モンスターお披露目ダイアログ。
// 閉じるボタンを押すと onClose が呼ばれる。
export function showFusionResultDialog(
  scene: Phaser.Scene,
  result: MonsterInstance,
  onClose: () => void,
): void {
  const w = scene.scale.width;
  const h = scene.scale.height;
  const species = MONSTER_SPECIES[result.speciesId];

  const overlay = scene.add.rectangle(w / 2, h / 2, w, h, 0x000000, 0.7).setDepth(40).setInteractive();
  const panel = drawPanel(scene, w / 2 - (w - 100) / 2, h / 2 - 220, w - 100, 380, { depth: 41, cornerDeco: true });

  const icon = scene.add.image(w / 2, h / 2 - 90, species?.spriteKey ?? 'player')
    .setDisplaySize(120, 120).setDepth(42).setAlpha(0).setScale(0.2);
  scene.tweens.add({
    targets: icon, alpha: 1, scale: 1, duration: 500, ease: 'Back.easeOut',
  });

  const nameText = scene.add.text(w / 2, h / 2 - 10, `${species?.name ?? result.speciesId}`, {
    ...TS.heading,
  }).setOrigin(0.5).setDepth(42);

  const lvText = scene.add.text(w / 2, h / 2 + 30, `Lv.${result.level}`, {
    ...TS.subheading,
  }).setOrigin(0.5).setDepth(42);

  const msgText = scene.add.text(w / 2, h / 2 + 74, `${species?.name ?? result.speciesId}が　うまれた！`, {
    ...TS.body,
  }).setOrigin(0.5).setDepth(42);

  const closeBtn = makeBtn(scene, w / 2, h / 2 + 140, 220, 56, { depth: 42 })
    .setInteractive({ useHandCursor: true })
    .on('pointerdown', () => {
      [overlay, panel, icon, nameText, lvText, msgText, closeBtn, closeTxt].forEach(o => o.destroy());
      onClose();
    })
    .on('pointerover', () => closeBtn.setFillStyle(0x2a4090))
    .on('pointerout', () => closeBtn.setFillStyle(T.panelMid));
  const closeTxt = scene.add.text(w / 2, h / 2 + 140, 'とじる', { ...TS.btn }).setOrigin(0.5).setDepth(43);
}
