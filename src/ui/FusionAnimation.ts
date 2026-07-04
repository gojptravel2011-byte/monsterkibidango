import Phaser from 'phaser';
import { BGM } from '../systems/bgm';

// 合体演出：光る・回転・煙・SE・振動 をまとめて再生する。
// FusionScene はこの関数を呼ぶだけでよく、演出の中身を知る必要はない。
export function playFusionAnimation(
  scene: Phaser.Scene,
  spriteA: Phaser.GameObjects.Image,
  spriteB: Phaser.GameObjects.Image,
  centerX: number,
  centerY: number,
  onComplete: () => void,
): void {
  // ① 素材が中央に吸い寄せられながら回転
  scene.tweens.add({
    targets: [spriteA, spriteB],
    x: centerX,
    y: centerY,
    angle: '+=360',
    scale: 0.4,
    duration: 700,
    ease: 'Cubic.easeIn',
  });

  // ② 光る球（グロー）
  const glow = scene.add.circle(centerX, centerY, 10, 0xffffee, 0.9).setDepth(30).setBlendMode(Phaser.BlendModes.ADD);
  scene.tweens.add({
    targets: glow,
    scale: 22,
    alpha: 0,
    duration: 900,
    delay: 650,
    ease: 'Cubic.easeOut',
  });

  // ③ 煙（膨らんで消える円を複数）
  scene.time.delayedCall(650, () => {
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const smoke = scene.add.circle(
        centerX + Math.cos(angle) * 10,
        centerY + Math.sin(angle) * 10,
        14, 0xcccccc, 0.55,
      ).setDepth(29);
      scene.tweens.add({
        targets: smoke,
        x: centerX + Math.cos(angle) * 90,
        y: centerY + Math.sin(angle) * 90,
        scale: 2.2,
        alpha: 0,
        duration: 800,
        ease: 'Cubic.easeOut',
        onComplete: () => smoke.destroy(),
      });
    }
  });

  // ④ SE
  scene.time.delayedCall(650, () => BGM.playFusionJingle());

  // ⑤ 振動（画面シェイク）
  scene.time.delayedCall(700, () => scene.cameras.main.shake(400, 0.012));

  // 素材スプライトを消して完了コールバック
  scene.time.delayedCall(1500, () => {
    spriteA.destroy();
    spriteB.destroy();
    glow.destroy();
    onComplete();
  });
}
