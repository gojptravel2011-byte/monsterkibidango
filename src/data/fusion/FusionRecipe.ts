import type { FusionCategory } from './fusionCategories';

// レシピを1件足すだけで新しい合体を追加できるようにする。
// 分岐は一切 switch を使わず、すべて Map 参照で解決する。
export interface FusionRecipe {
  id: string;
  resultSpeciesId: string;
}

// 素材2体の組み合わせを、順序に依存しないキー文字列に変換する。
// 例: pairKey('dragon','kodai_dragon') === pairKey('kodai_dragon','dragon')
export function pairKey(a: string, b: string): string {
  return [a, b].sort().join('__');
}

// ── 特殊合体：speciesId の組み合わせを直接指定するレシピ ──
// カテゴリレシピより優先して判定される。
export const SPECIAL_RECIPES: Map<string, FusionRecipe> = new Map([
  [pairKey('dragon', 'kodai_dragon'), { id: 'special_dragon_kodai', resultSpeciesId: 'ultimate_dragon' }],
  [pairKey('black_dragon', 'kodai_dragon'), { id: 'special_black_kodai', resultSpeciesId: 'ultimate_dragon' }],

  // 合体専用モンスター同士のさらなる合体（2段階目）
  [pairKey('mori_seirei', 'shine_unicorn'), { id: 'special_seirei_ou', resultSpeciesId: 'seirei_ou' }],
]);

// ── 通常合体：カテゴリの組み合わせで結果が決まる固定レシピ ──
export const CATEGORY_RECIPES: Map<string, FusionRecipe> = new Map([
  [pairKey('grass', 'water'), { id: 'cat_grass_water', resultSpeciesId: 'mori_seirei' }],
  [pairKey('fire', 'rock'), { id: 'cat_fire_rock', resultSpeciesId: 'maguroc' }],
  [pairKey('thunder', 'wind'), { id: 'cat_thunder_wind', resultSpeciesId: 'thunder_fairy' }],
  [pairKey('water', 'wind'), { id: 'cat_water_wind', resultSpeciesId: 'ice_phoenix' }],
  [pairKey('rock', 'water'), { id: 'cat_rock_water', resultSpeciesId: 'crystal_golem' }],
  [pairKey('dragon', 'wind'), { id: 'cat_dragon_wind', resultSpeciesId: 'element_dragon' }],
  [pairKey('grass', 'thunder'), { id: 'cat_grass_thunder', resultSpeciesId: 'shine_unicorn' }],
  [pairKey('fire', 'wind'), { id: 'cat_fire_wind', resultSpeciesId: 'dark_chimera' }],
]);

export function pairKeyFromCategories(a: FusionCategory, b: FusionCategory): string {
  return pairKey(a, b);
}
