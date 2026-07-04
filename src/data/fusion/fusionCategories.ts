// 合体システムのカテゴリ定義。
// MonsterSpecies 本体には手を入れず、speciesId → カテゴリ の対応表だけを
// ここに集約する（既存モンスターの定義を一切書き換えずに済む設計）。
export type FusionCategory =
  | 'grass' | 'water' | 'fire' | 'rock' | 'thunder' | 'wind' | 'dragon';

export const MONSTER_CATEGORY: Record<string, FusionCategory> = {
  kusagumi: 'grass',
  mizubon: 'water',
  honon: 'fire',
  iwagon: 'rock',
  denkon: 'thunder',
  kazepon: 'wind',
  dragon: 'dragon',
  black_dragon: 'dragon',
  kodai_dragon: 'dragon',
};

export function getFusionCategory(speciesId: string): FusionCategory | undefined {
  return MONSTER_CATEGORY[speciesId];
}
