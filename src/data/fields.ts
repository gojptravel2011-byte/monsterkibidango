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
};
