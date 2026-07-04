import Phaser from 'phaser';
import { getState, setFlag, addToParty, createMonsterInstance, addItem } from '../state/playerState';

// ナレーション演出は行わず、初期パーティ・アイテムのセットアップだけを行って
// すぐにマップへ遷移する（オープニングムービーの直後に呼ばれる）。
export class OpeningScene extends Phaser.Scene {
  constructor() { super('OpeningScene'); }

  create(): void {
    // クロスケをイベントで仲間にする（Lv5スタート）
    const kurosuke = createMonsterInstance('kurosuke', 5);
    addToParty(kurosuke);
    setFlag('metKurosuke');
    // 初期アイテム
    addItem('honyakuki', 2);   // かいふくすい ×2
    addItem('okyuball', 3);    // かるいきびだんご ×3
    getState().position = { field: 'kouen', x: 400, y: 300 };
    this.scene.start('MapScene');
  }
}
