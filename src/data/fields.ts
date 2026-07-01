export interface FieldDef {
  id: string;
  name: string;
  bgColor: number;
  skyColor?: number;
  encounters: { speciesId: string; weight: number }[];
  encounterLevelMin: number;
  encounterLevelMax: number;
  connections: { toField: string; label: string; x: number; y: number }[];
  hasShop?: boolean;
  isSafeZone?: boolean;
}

export const FIELDS: Record<string, FieldDef> = {
  hoikuen: {
    id: 'hoikuen',
    name: 'ほいくえん',
    bgColor: 0xaaddaa,
    skyColor: 0xaaeeff,
    encounters: [],
    encounterLevelMin: 1,
    encounterLevelMax: 1,
    isSafeZone: true,
    hasShop: true,
    connections: [
      { toField: 'kouen', label: 'こうえんへ', x: 710, y: 600 },
    ],
  },
  kouen: {
    id: 'kouen',
    name: 'こうえん',
    bgColor: 0x88cc66,
    skyColor: 0x88ddff,
    encounters: [
      { speciesId: 'piyon', weight: 40 },
      { speciesId: 'kazepon', weight: 30 },
      { speciesId: 'kusagumi', weight: 30 },
    ],
    encounterLevelMin: 1,
    encounterLevelMax: 3,
    connections: [
      { toField: 'hoikuen', label: 'ほいくえんへ', x: 40, y: 600 },
      { toField: 'jutakugai', label: 'じゅうたくがいへ', x: 710, y: 600 },
      { toField: 'jinja', label: 'じんじゃへ', x: 375, y: 60 },
    ],
  },
  jutakugai: {
    id: 'jutakugai',
    name: 'じゅうたくがい',
    bgColor: 0xddbb88,
    skyColor: 0x99ccff,
    encounters: [
      { speciesId: 'honon', weight: 30 },
      { speciesId: 'denkon', weight: 30 },
      { speciesId: 'iwagon', weight: 20 },
      { speciesId: 'mizubon', weight: 20 },
    ],
    encounterLevelMin: 3,
    encounterLevelMax: 5,
    connections: [
      { toField: 'kouen', label: 'こうえんへ', x: 40, y: 600 },
      { toField: 'shotengai', label: 'しょうてんがいへ', x: 710, y: 600 },
    ],
  },
  jinja: {
    id: 'jinja',
    name: 'じんじゃ',
    bgColor: 0x886644,
    skyColor: 0x554433,
    encounters: [
      { speciesId: 'kazepon', weight: 35 },
      { speciesId: 'denkon', weight: 35 },
      { speciesId: 'mizubon', weight: 30 },
    ],
    encounterLevelMin: 5,
    encounterLevelMax: 8,
    connections: [
      { toField: 'kouen', label: 'こうえんへ', x: 375, y: 1140 },
      { toField: 'shogakko', label: 'しょうがっこうへ', x: 375, y: 60 },
    ],
  },
  shotengai: {
    id: 'shotengai',
    name: 'しょうてんがい',
    bgColor: 0xffcc88,
    skyColor: 0xffeecc,
    encounters: [
      { speciesId: 'piyon', weight: 35 },
      { speciesId: 'denkon', weight: 35 },
      { speciesId: 'kusagumi', weight: 30 },
    ],
    encounterLevelMin: 3,
    encounterLevelMax: 6,
    connections: [
      { toField: 'jutakugai', label: 'じゅうたくがいへ', x: 40, y: 600 },
    ],
  },
  shogakko: {
    id: 'shogakko',
    name: 'しょうがっこう',
    bgColor: 0x8899bb,
    skyColor: 0x334466,
    encounters: [],
    encounterLevelMin: 1,
    encounterLevelMax: 1,
    connections: [
      { toField: 'jinja', label: 'じんじゃへ', x: 375, y: 1140 },
      { toField: 'dungeon', label: 'ちかへ', x: 375, y: 60 },
    ],
  },
  dungeon: {
    id: 'dungeon',
    name: 'ちかめいろ',
    bgColor: 0x221133,
    skyColor: 0x110022,
    encounters: [
      { speciesId: 'honon', weight: 25 },
      { speciesId: 'denkon', weight: 25 },
      { speciesId: 'iwagon', weight: 25 },
      { speciesId: 'mizubon', weight: 25 },
    ],
    encounterLevelMin: 8,
    encounterLevelMax: 12,
    connections: [
      { toField: 'shogakko', label: 'もどる', x: 375, y: 1140 },
    ],
  },

  // ── 別世界 ──────────────────────────────────────────────────
  angel_hoikuen: {
    id: 'angel_hoikuen',
    name: 'えんじぇるほいくえん',
    bgColor: 0xfff8e0,
    skyColor: 0xffeecc,
    encounters: [],
    encounterLevelMin: 1,
    encounterLevelMax: 1,
    isSafeZone: true,
    hasShop: true,
    connections: [
      { toField: 'shogakko', label: 'もとのせかいへ', x: 375, y: 1140 },
    ],
  },
  honoo_world: {
    id: 'honoo_world',
    name: 'ほのおのせかい',
    bgColor: 0x330800,
    skyColor: 0x661100,
    encounters: [
      { speciesId: 'inferno_golem', weight: 30 },
      { speciesId: 'flame_dragon',  weight: 25 },
      { speciesId: 'vulcan_phoenix',weight: 30 },
      { speciesId: 'riri',          weight: 15 },
    ],
    encounterLevelMin: 15,
    encounterLevelMax: 22,
    connections: [
      { toField: 'angel_hoikuen', label: 'もどる', x: 375, y: 1140 },
    ],
  },
  koori_world: {
    id: 'koori_world',
    name: 'こおりのせかい',
    bgColor: 0x001133,
    skyColor: 0x003366,
    encounters: [
      { speciesId: 'blizzard_wolf', weight: 30 },
      { speciesId: 'frost_giant',   weight: 25 },
      { speciesId: 'ice_specter',   weight: 30 },
      { speciesId: 'asa',           weight: 15 },
    ],
    encounterLevelMin: 15,
    encounterLevelMax: 22,
    connections: [
      { toField: 'angel_hoikuen', label: 'もどる', x: 375, y: 1140 },
    ],
  },
  kaminari_world: {
    id: 'kaminari_world',
    name: 'かみなりのせかい',
    bgColor: 0x110022,
    skyColor: 0x220044,
    encounters: [
      { speciesId: 'thunder_beast', weight: 30 },
      { speciesId: 'storm_lord',    weight: 25 },
      { speciesId: 'volt_hydra',    weight: 30 },
      { speciesId: 'kaho',          weight: 15 },
    ],
    encounterLevelMin: 15,
    encounterLevelMax: 22,
    connections: [
      { toField: 'angel_hoikuen', label: 'もどる', x: 375, y: 1140 },
    ],
  },
  mizu_world: {
    id: 'mizu_world',
    name: 'みずのせかい',
    bgColor: 0x001122,
    skyColor: 0x002244,
    encounters: [
      { speciesId: 'abyss_kraken',   weight: 30 },
      { speciesId: 'tide_leviathan', weight: 25 },
      { speciesId: 'coral_golem',    weight: 30 },
      { speciesId: 'haru',           weight: 15 },
    ],
    encounterLevelMin: 15,
    encounterLevelMax: 22,
    connections: [
      { toField: 'angel_hoikuen', label: 'もどる', x: 375, y: 1140 },
    ],
  },
  sora_world: {
    id: 'sora_world',
    name: 'そらのせかい',
    bgColor: 0x4488cc,
    skyColor: 0x66aadd,
    encounters: [
      { speciesId: 'heaven_knight', weight: 30 },
      { speciesId: 'sky_titan',     weight: 25 },
      { speciesId: 'wind_serpent',  weight: 30 },
      { speciesId: 'yuuki',         weight: 15 },
    ],
    encounterLevelMin: 15,
    encounterLevelMax: 22,
    connections: [
      { toField: 'angel_hoikuen', label: 'もどる', x: 375, y: 1140 },
    ],
  },
  angel_school: {
    id: 'angel_school',
    name: 'エンジェルしょうがっこう',
    bgColor: 0xfff5cc,
    skyColor: 0xffeeaa,
    encounters: [
      { speciesId: 'dark_angel',     weight: 28 },
      { speciesId: 'golem_teacher',  weight: 22 },
      { speciesId: 'shadow_student', weight: 28 },
      { speciesId: 'takeru',         weight: 12 },
      { speciesId: 'yuzu',           weight: 10 },
    ],
    encounterLevelMin: 15,
    encounterLevelMax: 22,
    connections: [
      { toField: 'angel_hoikuen', label: 'もどる', x: 375, y: 1140 },
    ],
  },
  yami_world: {
    id: 'yami_world',
    name: 'やみのせかい',
    bgColor: 0x050008,
    skyColor: 0x0a000f,
    encounters: [
      { speciesId: 'void_reaper',     weight: 35 },
      { speciesId: 'nightmare_wolf',  weight: 30 },
      { speciesId: 'shadow_colossus', weight: 35 },
    ],
    encounterLevelMin: 20,
    encounterLevelMax: 26,
    connections: [
      { toField: 'angel_hoikuen', label: 'もどる', x: 375, y: 1140 },
    ],
  },
};
