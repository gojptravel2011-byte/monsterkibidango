import type { MonsterSpecies } from '../monsters';

// 合体でしか手に入らない専用モンスター（新規10体）。
// FF9風「精霊・幻獣」寄りのデザインコンセプト。
// MONSTER_SPECIES にマージするだけで図鑑・バトル・育成など既存機能にそのまま乗る。
export const FUSION_MONSTER_SPECIES: Record<string, MonsterSpecies> = {
  mori_seirei: {
    id: 'mori_seirei', name: 'もりのせいれい', baseMaxHp: 140,
    spriteKey: 'fusion_mori_seirei', placeholderColor: 0x33aa55, catchable: false,
    learnset: [
      { level: 1, skill: 'seinaru' },
      { level: 1, skill: 'mizudeppo' },
      { level: 5, skill: 'shellbash' },
      { level: 10, skill: 'tidalwave' },
    ],
  },
  maguroc: {
    id: 'maguroc', name: 'マグロック', baseMaxHp: 170,
    spriteKey: 'fusion_maguroc', placeholderColor: 0xdd5522, catchable: false,
    learnset: [
      { level: 1, skill: 'magumakick' },
      { level: 1, skill: 'iwanage' },
      { level: 5, skill: 'neppuu' },
      { level: 10, skill: 'shakunetsu' },
    ],
  },
  thunder_fairy: {
    id: 'thunder_fairy', name: 'サンダーフェアリー', baseMaxHp: 120,
    spriteKey: 'fusion_thunder_fairy', placeholderColor: 0xffee44, catchable: false,
    learnset: [
      { level: 1, skill: 'raigeki' },
      { level: 1, skill: 'skyfist' },
      { level: 5, skill: 'thunderstorm' },
      { level: 10, skill: 'trivolbolt' },
    ],
  },
  ice_phoenix: {
    id: 'ice_phoenix', name: 'アイスフェニックス', baseMaxHp: 150,
    spriteKey: 'fusion_ice_phoenix', placeholderColor: 0x66ddee, catchable: false,
    learnset: [
      { level: 1, skill: 'fubuki' },
      { level: 1, skill: 'kamaitachi' },
      { level: 5, skill: 'zettaireid' },
      { level: 10, skill: 'soulfreeze' },
    ],
  },
  crystal_golem: {
    id: 'crystal_golem', name: 'クリスタルゴーレム', baseMaxHp: 220,
    spriteKey: 'fusion_crystal_golem', placeholderColor: 0x88ccff, catchable: false,
    learnset: [
      { level: 1, skill: 'iwanage' },
      { level: 1, skill: 'mizukabe' },
      { level: 5, skill: 'shinkaiuzu' },
      { level: 10, skill: 'hyouketsu' },
    ],
  },
  element_dragon: {
    id: 'element_dragon', name: 'エレメントドラゴン', baseMaxHp: 210,
    spriteKey: 'fusion_element_dragon', placeholderColor: 0x44ddaa, catchable: false,
    learnset: [
      { level: 1, skill: 'ryuukaze' },
      { level: 1, skill: 'ryuuibuki' },
      { level: 5, skill: 'skyfall' },
      { level: 10, skill: 'kairaibuki' },
    ],
  },
  shine_unicorn: {
    id: 'shine_unicorn', name: 'シャインユニコーン', baseMaxHp: 160,
    spriteKey: 'fusion_shine_unicorn', placeholderColor: 0xffffff, catchable: false,
    learnset: [
      { level: 1, skill: 'hikari' },
      { level: 1, skill: 'seinaru' },
      { level: 5, skill: 'raimei' },
      { level: 10, skill: 'sanderclaw' },
    ],
  },
  dark_chimera: {
    id: 'dark_chimera', name: 'ダークキメラ', baseMaxHp: 190,
    spriteKey: 'fusion_dark_chimera', placeholderColor: 0x552266, catchable: false,
    learnset: [
      { level: 1, skill: 'kuroihane' },
      { level: 1, skill: 'skyslash' },
      { level: 5, skill: 'shadowclaw' },
      { level: 10, skill: 'darkholy' },
    ],
  },
  // ── 2段階目：合体専用モンスター同士の再合体で生まれる「精霊の王」 ──
  seirei_ou: {
    id: 'seirei_ou', name: 'せいれいおう', baseMaxHp: 260,
    spriteKey: 'fusion_seirei_ou', placeholderColor: 0xffdd88, catchable: false,
    learnset: [
      { level: 1, skill: 'hikari' },
      { level: 1, skill: 'seinaru' },
      { level: 10, skill: 'metsubou' },
      { level: 15, skill: 'zettaireid' },
    ],
  },
  // ── 特殊合体（ドラゴン系）の最終形態 ──
  ultimate_dragon: {
    id: 'ultimate_dragon', name: 'きゅうきょくのドラゴン', baseMaxHp: 320,
    spriteKey: 'fusion_ultimate_dragon', placeholderColor: 0xff2266, catchable: false,
    learnset: [
      { level: 1, skill: 'kokuryuibuki' },
      { level: 1, skill: 'dragonbreath' },
      { level: 10, skill: 'ryuuanger' },
      { level: 15, skill: 'zetsumetsu' },
    ],
  },
};

export type FusionRarity = 'rare' | 'epic' | 'legendary';

interface FusionMonsterMeta {
  rarity: FusionRarity;
  stage: 1 | 2;               // 1=通常合体の結果、2=合体専用モンスター同士のさらなる合体
  concept: string;            // 見た目コンセプト（図鑑・設計資料用）
}

// バトルデータ(MonsterSpecies)を汚さず、演出・図鑑向けの付加情報だけ別テーブルで管理。
export const FUSION_MONSTER_META: Record<string, FusionMonsterMeta> = {
  mori_seirei:     { rarity: 'rare',      stage: 1, concept: '木漏れ日をまとった小さな森の精霊。緑の光の粒子を纏う。' },
  maguroc:         { rarity: 'rare',      stage: 1, concept: '溶岩と岩でできた重量級の巨体。背中に燃える鉱石の結晶。' },
  thunder_fairy:   { rarity: 'rare',      stage: 1, concept: '雷雲の中を飛び回る小さな妖精。羽が帯電して光る。' },
  ice_phoenix:     { rarity: 'epic',      stage: 1, concept: '氷の羽を持つ不死鳥。羽ばたくたびに雪の結晶が舞う。' },
  crystal_golem:   { rarity: 'epic',      stage: 1, concept: '透き通る水晶でできたゴーレム。核が青く脈打つ。' },
  element_dragon:  { rarity: 'epic',      stage: 1, concept: '風とドラゴンの力を宿した俊敏なドラゴン。半透明の翼。' },
  shine_unicorn:   { rarity: 'epic',      stage: 1, concept: '聖なる光をまとう一角獣。角の先から光の粒がこぼれる。' },
  dark_chimera:    { rarity: 'epic',      stage: 1, concept: '炎と風が混ざり合った禍々しいキメラ。紫の炎をまとう。' },
  seirei_ou:       { rarity: 'legendary', stage: 2, concept: '精霊たちを束ねる王。金色の光の玉座をイメージ。' },
  ultimate_dragon: { rarity: 'legendary', stage: 2, concept: '古代竜の力を極限まで高めた最終形態。紅と黒のオーラ。' },
};
