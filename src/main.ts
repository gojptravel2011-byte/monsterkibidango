import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { TitleScene } from './scenes/TitleScene';
import { NameInputScene } from './scenes/NameInputScene';
import { OpeningScene } from './scenes/OpeningScene';
import { OpeningMovieScene } from './scenes/OpeningMovieScene';
import { MapScene } from './scenes/MapScene';
import { BattleScene } from './scenes/BattleScene';
import { MonsterListScene } from './scenes/MonsterListScene';
import { CareScene } from './scenes/CareScene';
import { ShopScene } from './scenes/ShopScene';
import { MenuScene } from './scenes/MenuScene';
import { EndingScene } from './scenes/EndingScene';
import { MinigameScene } from './scenes/MinigameScene';
import { ArithmeticScene } from './scenes/ArithmeticScene';
import { BallShopScene } from './scenes/BallShopScene';
import { ItemListScene } from './scenes/ItemListScene';
import { DungeonMazeScene } from './scenes/DungeonMazeScene';
import { MonsterDexScene } from './scenes/MonsterDexScene';
import { TowerDungeonScene } from './scenes/TowerDungeonScene';
import { ElmoRaceScene } from './scenes/ElmoRaceScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 750,
  height: 1200,
  backgroundColor: '#000011',
  scene: [
    BootScene,
    TitleScene,
    NameInputScene,
    OpeningMovieScene,
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
    BallShopScene,
    ItemListScene,
    DungeonMazeScene,
    MonsterDexScene,
    TowerDungeonScene,
    ElmoRaceScene,
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
