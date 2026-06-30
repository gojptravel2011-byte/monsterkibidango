// アセットキー集約ファイル
// 本番素材に差し替える際はここのキーとpublic/assetsのファイルを対応させる

export const ASSET_KEYS = {
  // プレイヤー
  PLAYER: 'player',

  // モンスター
  MONSTERS: {
    KUROSUKE: 'monster_kurosuke',
    PIYON: 'monster_piyon',
    MIZUBON: 'monster_mizubon',
    HONON: 'monster_honon',
    KUSAGUMI: 'monster_kusagumi',
    IWAGON: 'monster_iwagon',
    KAZEPON: 'monster_kazepon',
    DENKON: 'monster_denkon',
    RASBOSS: 'monster_rasuboss',
    DRAGON: 'monster_dragon',
    // 別世界
    AW_INFERNO_GOLEM:   'aw_inferno_golem',
    AW_FLAME_DRAGON:    'aw_flame_dragon',
    AW_VULCAN_PHOENIX:  'aw_vulcan_phoenix',
    AW_BLIZZARD_WOLF:   'aw_blizzard_wolf',
    AW_FROST_GIANT:     'aw_frost_giant',
    AW_ICE_SPECTER:     'aw_ice_specter',
    AW_THUNDER_BEAST:   'aw_thunder_beast',
    AW_STORM_LORD:      'aw_storm_lord',
    AW_VOLT_HYDRA:      'aw_volt_hydra',
    AW_ABYSS_KRAKEN:    'aw_abyss_kraken',
    AW_TIDE_LEVIATHAN:  'aw_tide_leviathan',
    AW_CORAL_GOLEM:     'aw_coral_golem',
    AW_HEAVEN_KNIGHT:   'aw_heaven_knight',
    AW_SKY_TITAN:       'aw_sky_titan',
    AW_WIND_SERPENT:    'aw_wind_serpent',
    AW_DARK_ANGEL:      'aw_dark_angel',
    AW_GOLEM_TEACHER:   'aw_golem_teacher',
    AW_SHADOW_STUDENT:  'aw_shadow_student',
    AW_VOID_REAPER:     'aw_void_reaper',
    AW_NIGHTMARE_WOLF:  'aw_nightmare_wolf',
    AW_SHADOW_COLOSSUS: 'aw_shadow_colossus',
    AW_BLACK_DRAGON:    'aw_black_dragon',
    AW_COIN_SLIME:      'aw_coin_slime',
    AW_EXP_GHOST:       'aw_exp_ghost',
    AW_YAMI_NO_TEIOU:   'aw_yami_no_teiou',
  },

  // マップタイル
  TILES: {
    GRASS: 'tile_grass',
    WATER: 'tile_water',
    TREE: 'tile_tree',
    BUILDING: 'tile_building',
    PATH: 'tile_path',
  },

  // UI
  UI: {
    MESSAGE_BOX: 'ui_messagebox',
    BUTTON: 'ui_button',
  },
} as const;

// カラーパレット（プレースホルダー用）
export const PLACEHOLDER_COLORS = {
  PLAYER: 0x3399ff,
  GRASS: 0x66cc44,
  WATER: 0x3388ff,
  TREE: 0x226622,
  BUILDING: 0xcc9966,
  PATH: 0xddbb88,
  NPC: 0xffaa44,
  MONSTER_KUROSUKE: 0x333333,
  MONSTER_PIYON: 0xffff44,
  MONSTER_MIZUBON: 0x44aaff,
  MONSTER_HONON: 0xff4422,
  MONSTER_KUSAGUMI: 0x44cc44,
  MONSTER_IWAGON: 0x887766,
  MONSTER_KAZEPON: 0xaaddff,
  MONSTER_DENKON: 0xffff00,
  MONSTER_RASUBOSS: 0x880000,
} as const;
