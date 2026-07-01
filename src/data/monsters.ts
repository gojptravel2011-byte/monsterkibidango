import { ASSET_KEYS } from '../assets/assetKeys';
import { ANOTHER_WORLD_SPECIES, CHILDREN_SPECIES, FIELD_BOSS_SPECIES, TOWER_BOSS_SPECIES } from './monsters_anotherworld';

export interface MonsterSpecies {
  id: string;
  name: string;
  baseMaxHp: number;
  spriteKey: string;
  placeholderColor: number;
  learnset: { level: number; skill: string }[];
  catchable: boolean;
  requiresGoldBall?: boolean; // true = きんのきびだんごでしかつかまえられない
  expRate?: number; // 必要経験値の倍率（低いほど速く育つ）。省略時は1.0
}

const BASE_MONSTER_SPECIES: Record<string, MonsterSpecies> = {
  kurosuke: {
    id: 'kurosuke',
    name: 'クロスケ',
    baseMaxHp: 30,
    spriteKey: ASSET_KEYS.MONSTERS.KUROSUKE,
    placeholderColor: 0x333333,
    catchable: false, // イベントで仲間になる
    expRate: 0.2,     // 必要経験値が通常の20%→5倍速で育つ
    learnset: [
      { level: 1, skill: 'taiatarikko' },
      { level: 3, skill: 'hikkaku' },
      { level: 5, skill: 'kamitsuku' },
      { level: 8, skill: 'kurayami' },
    ],
  },
  piyon: {
    id: 'piyon',
    name: 'ぴよん',
    baseMaxHp: 22,
    spriteKey: ASSET_KEYS.MONSTERS.PIYON,
    placeholderColor: 0xffff44,
    catchable: true,
    learnset: [
      { level: 1, skill: 'taiatarikko' },
      { level: 3, skill: 'kaze' },
      { level: 6, skill: 'kamitsuku' },
    ],
  },
  mizubon: {
    id: 'mizubon',
    name: 'みずぼん',
    baseMaxHp: 26,
    spriteKey: ASSET_KEYS.MONSTERS.MIZUBON,
    placeholderColor: 0x44aaff,
    catchable: true,
    learnset: [
      { level: 1, skill: 'taiatarikko' },
      { level: 2, skill: 'mizudeppo' },
      { level: 5, skill: 'kamitsuku' },
    ],
  },
  honon: {
    id: 'honon',
    name: 'ほのん',
    baseMaxHp: 24,
    spriteKey: ASSET_KEYS.MONSTERS.HONON,
    placeholderColor: 0xff4422,
    catchable: true,
    learnset: [
      { level: 1, skill: 'taiatarikko' },
      { level: 2, skill: 'honoo' },
      { level: 5, skill: 'hikkaku' },
    ],
  },
  kusagumi: {
    id: 'kusagumi',
    name: 'くさぐみ',
    baseMaxHp: 28,
    spriteKey: ASSET_KEYS.MONSTERS.KUSAGUMI,
    placeholderColor: 0x44cc44,
    catchable: true,
    learnset: [
      { level: 1, skill: 'hikkaku' },
      { level: 3, skill: 'taiatarikko' },
      { level: 6, skill: 'kaze' },
    ],
  },
  iwagon: {
    id: 'iwagon',
    name: 'いわごん',
    baseMaxHp: 35,
    spriteKey: ASSET_KEYS.MONSTERS.IWAGON,
    placeholderColor: 0x887766,
    catchable: true,
    learnset: [
      { level: 1, skill: 'taiatarikko' },
      { level: 3, skill: 'iwanage' },
      { level: 7, skill: 'kamitsuku' },
    ],
  },
  kazepon: {
    id: 'kazepon',
    name: 'かぜぽん',
    baseMaxHp: 20,
    spriteKey: ASSET_KEYS.MONSTERS.KAZEPON,
    placeholderColor: 0xaaddff,
    catchable: true,
    learnset: [
      { level: 1, skill: 'kaze' },
      { level: 4, skill: 'taiatarikko' },
      { level: 7, skill: 'denkogeki' },
    ],
  },
  denkon: {
    id: 'denkon',
    name: 'でんこん',
    baseMaxHp: 22,
    spriteKey: ASSET_KEYS.MONSTERS.DENKON,
    placeholderColor: 0xffff00,
    catchable: true,
    learnset: [
      { level: 1, skill: 'denkogeki' },
      { level: 3, skill: 'taiatarikko' },
      { level: 6, skill: 'kamitsuku' },
    ],
  },
  rasuboss: {
    id: 'rasuboss',
    name: 'やみのぬし',
    baseMaxHp: 80,
    spriteKey: ASSET_KEYS.MONSTERS.RASBOSS,
    placeholderColor: 0x880000,
    catchable: false,
    learnset: [
      { level: 1, skill: 'kurayami' },
      { level: 1, skill: 'honoo' },
      { level: 1, skill: 'denkogeki' },
      { level: 1, skill: 'hikari' },
    ],
  },
  // ── レアモンスター ──────────────────────────────
  dragon: {
    id: 'dragon',
    name: 'ドラゴン',
    baseMaxHp: 70,
    spriteKey: ASSET_KEYS.MONSTERS.DRAGON,
    placeholderColor: 0xcc2200,
    catchable: true,
    learnset: [
      { level:  1, skill: 'honoo' },
      { level:  4, skill: 'taiatarikko' },
      { level:  7, skill: 'kamitsuku' },
      { level: 10, skill: 'kurayami' },
      { level: 14, skill: 'denkogeki' },
    ],
  },
};

export const MONSTER_SPECIES: Record<string, MonsterSpecies> = {
  ...BASE_MONSTER_SPECIES,
  ...ANOTHER_WORLD_SPECIES,
  ...CHILDREN_SPECIES,
  ...FIELD_BOSS_SPECIES,
  ...TOWER_BOSS_SPECIES,
};
