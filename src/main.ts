import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { TitleScene } from './scenes/TitleScene';
import { NameInputScene } from './scenes/NameInputScene';
import { OpeningScene } from './scenes/OpeningScene';
import { MapScene } from './scenes/MapScene';
import { BattleScene } from './scenes/BattleScene';
import { MonsterListScene } from './scenes/MonsterListScene';
import { CareScene } from './scenes/CareScene';
import { ShopScene } from './scenes/ShopScene';
import { MenuScene } from './scenes/MenuScene';
import { EndingScene } from './scenes/EndingScene';
import { MinigameScene } from './scenes/MinigameScene';
import { ArithmeticScene } from './scenes/ArithmeticScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 750,
  height: 1200,
  backgroundColor: '#000011',
  scene: [
    BootScene,
    TitleScene,
    NameInputScene,
    OpeningScene,
    MapScene,
    BattleScene,
    MonsterListScene,
    CareScene,
    ShopScene,
    MenuScene,
    EndingScene,
    MinigameScene,
    ArithmeticScene,
  ],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  input: {
    activePointers: 4,
  },
};

new Phaser.Game(config);
