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
