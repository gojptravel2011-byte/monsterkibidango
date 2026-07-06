import Phaser from 'phaser';
import { generateAllSprites } from '../assets/generateSprites';
import { createHeroAnims, HERO_SHEET_KEY } from '../systems/heroAnim';

// 起動時にスプライトテクスチャを生成してからタイトルへ進む
export class BootScene extends Phaser.Scene {
  constructor() { super('BootScene'); }

  preload(): void {
    // 主人公スプライトシート（64×64セル相当 / 2フレーム × 8方向）
    this.load.spritesheet(HERO_SHEET_KEY, 'hero_walk.png', { frameWidth: 256, frameHeight: 258 });

    // 実画像を先にロード（generateSprites側でexistsチェックしてスキップ）
    // public/monsters/monster_0NN.png が正式なモンスター素材の管理場所
    // （番号は public/monsters/manifest.json に対応）
    const realSprites: [string, string][] = [
      ['kodai_dragon', 'monster_kodai_dragon.png'], // タワーボス（63体の通し番号には含まれない別枠）

      // #1-10 基本モンスター
      ['monster_kurosuke', 'monsters/monster_001.png'],
      ['monster_piyon',    'monsters/monster_002.png'],
      ['monster_mizubon',  'monsters/monster_003.png'],
      ['monster_honon',    'monsters/monster_004.png'],
      ['monster_kusagumi', 'monsters/monster_005.png'],
      ['monster_iwagon',   'monsters/monster_006.png'],
      ['monster_kazepon',  'monsters/monster_007.png'],
      ['monster_denkon',   'monsters/monster_008.png'],
      ['monster_dragon',   'monsters/monster_009.png'],
      ['monster_rasuboss', 'monsters/monster_010.png'],

      // #11-35 別世界モンスター
      ['aw_inferno_golem',   'monsters/monster_011.png'],
      ['aw_flame_dragon',    'monsters/monster_012.png'],
      ['aw_vulcan_phoenix',  'monsters/monster_013.png'],
      ['aw_blizzard_wolf',   'monsters/monster_014.png'],
      ['aw_frost_giant',     'monsters/monster_015.png'],
      ['aw_ice_specter',     'monsters/monster_016.png'],
      ['aw_thunder_beast',   'monsters/monster_017.png'],
      ['aw_storm_lord',      'monsters/monster_018.png'],
      ['aw_volt_hydra',      'monsters/monster_019.png'],
      ['aw_abyss_kraken',    'monsters/monster_020.png'],
      ['aw_tide_leviathan',  'monsters/monster_021.png'],
      ['aw_coral_golem',     'monsters/monster_022.png'],
      ['aw_heaven_knight',   'monsters/monster_023.png'],
      ['aw_sky_titan',       'monsters/monster_024.png'],
      ['aw_wind_serpent',    'monsters/monster_025.png'],
      ['aw_dark_angel',      'monsters/monster_026.png'],
      ['aw_golem_teacher',   'monsters/monster_027.png'],
      ['aw_shadow_student',  'monsters/monster_028.png'],
      ['aw_void_reaper',     'monsters/monster_029.png'],
      ['aw_nightmare_wolf',  'monsters/monster_030.png'],
      ['aw_shadow_colossus', 'monsters/monster_031.png'],
      ['aw_black_dragon',    'monsters/monster_032.png'],
      ['aw_coin_slime',      'monsters/monster_033.png'],
      ['aw_exp_ghost',       'monsters/monster_034.png'],
      ['aw_yami_no_teiou',   'monsters/monster_035.png'],

      // #36-42 こどもたち
      ['child_riri',   'monsters/monster_036.png'],
      ['child_asa',    'monsters/monster_037.png'],
      ['child_kaho',   'monsters/monster_038.png'],
      ['child_haru',   'monsters/monster_039.png'],
      ['child_yuuki',  'monsters/monster_040.png'],
      ['child_takeru', 'monsters/monster_041.png'],
      ['child_yuzu',   'monsters/monster_042.png'],

      // #43-47 フィールドぬし
      ['boss_honoo_nushi',    'monsters/monster_043.png'],
      ['boss_koori_nushi',    'monsters/monster_044.png'],
      ['boss_kaminari_nushi', 'monsters/monster_045.png'],
      ['boss_mizu_nushi',     'monsters/monster_046.png'],
      ['boss_sora_nushi',     'monsters/monster_047.png'],

      // #48-57 合体専用モンスター
      ['fusion_mori_seirei',     'monsters/monster_048.png'],
      ['fusion_maguroc',         'monsters/monster_049.png'],
      ['fusion_thunder_fairy',   'monsters/monster_050.png'],
      ['fusion_ice_phoenix',     'monsters/monster_051.png'],
      ['fusion_crystal_golem',   'monsters/monster_052.png'],
      ['fusion_element_dragon',  'monsters/monster_053.png'],
      ['fusion_shine_unicorn',   'monsters/monster_054.png'],
      ['fusion_dark_chimera',    'monsters/monster_055.png'],
      ['fusion_seirei_ou',       'monsters/monster_056.png'],
      ['fusion_ultimate_dragon', 'monsters/monster_057.png'],

      // #58-60 レアエンカウント上位種
      ['aw_coin_slime_king',     'monsters/monster_058.png'],
      ['aw_exp_ghost_giant',     'monsters/monster_059.png'],
      ['aw_betsusekai_kamisama', 'monsters/monster_060.png'],

      // #61-63 NPC
      ['npc_encho',         'monsters/monster_061.png'],
      ['npc_sensei',        'monsters/monster_062.png'],
      ['npc_fusion_ojisan', 'monsters/monster_063.png'],
    ];
    for (const [key, file] of realSprites) {
      this.load.image(key, file);
    }
  }

  create(): void {
    generateAllSprites(this);

    // 主人公: 8方向 walk/idle アニメーション
    createHeroAnims(this);

    // 他画面(バトル/図鑑/おせわ)で使う代表アイコン用の静止テクスチャ「player」
    // （下向き・フレーム0を切り出して固定テクスチャ化）
    const downFrame0 = 6 * 2; // HERO_DIRS 内 'down' の行番号(6) × 2フレーム
    const frame = this.textures.getFrame(HERO_SHEET_KEY, downFrame0);
    const tmp = this.add.image(0, 0, HERO_SHEET_KEY, downFrame0).setOrigin(0, 0).setVisible(false);
    const rt = this.make.renderTexture({ width: frame.width, height: frame.height }, false);
    rt.draw(tmp, 0, 0);
    rt.saveTexture('player');
    rt.destroy();
    tmp.destroy();

    this.scene.start('TitleScene');
  }
}
