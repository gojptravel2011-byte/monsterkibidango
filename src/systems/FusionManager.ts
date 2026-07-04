import { getState, createMonsterInstance, releaseMonster, addToParty } from '../state/playerState';
import type { MonsterInstance } from '../state/playerState';
import { MONSTER_SPECIES } from '../data/monsters';
import { getFusionCategory } from '../data/fusion/fusionCategories';
import { SPECIAL_RECIPES, CATEGORY_RECIPES, pairKey } from '../data/fusion/FusionRecipe';

// 合体まわりのビジネスロジックを一手に引き受けるモジュール。
// UI(FusionScene)は「誰と誰を選んだか」だけを渡し、判定・生成・パーティ更新は
// すべてここで完結させる。レシピの追加は FusionRecipe.ts / fusionMonsters.ts の
// データを増やすだけでよく、このファイルを変更する必要はない。

export interface FusionPreview {
  resultSpeciesId: string;
  resultLevel: number;
}

export interface FusionSuccess {
  ok: true;
  resultInstance: MonsterInstance;
}

export interface FusionFailure {
  ok: false;
  reason: string;
}

export type FusionOutcome = FusionSuccess | FusionFailure;

function findPartyMember(uid: string): MonsterInstance | undefined {
  return getState().party.find(m => m.uid === uid);
}

// 素材2体の speciesId から、生成される結果 speciesId を解決する。
// 優先順位: ① 特殊合体(speciesId同士の固定ペア) → ② 通常合体(カテゴリの組み合わせ)
export function resolveResultSpeciesId(speciesIdA: string, speciesIdB: string): string | undefined {
  const special = SPECIAL_RECIPES.get(pairKey(speciesIdA, speciesIdB));
  if (special) return special.resultSpeciesId;

  const catA = getFusionCategory(speciesIdA);
  const catB = getFusionCategory(speciesIdB);
  if (!catA || !catB) return undefined;

  const category = CATEGORY_RECIPES.get(pairKey(catA, catB));
  return category?.resultSpeciesId;
}

// 合体後レベル = max(素材A, 素材B) + 1
export function calcFusionLevel(levelA: number, levelB: number): number {
  return Math.max(levelA, levelB) + 1;
}

export function previewFusion(uidA: string, uidB: string): FusionPreview | undefined {
  const a = findPartyMember(uidA);
  const b = findPartyMember(uidB);
  if (!a || !b || a.uid === b.uid) return undefined;

  const resultSpeciesId = resolveResultSpeciesId(a.speciesId, b.speciesId);
  if (!resultSpeciesId || !MONSTER_SPECIES[resultSpeciesId]) return undefined;

  return { resultSpeciesId, resultLevel: calcFusionLevel(a.level, b.level) };
}

// 実際に合体を実行する：素材2体を消滅させ、新モンスターをパーティに加える。
export function fuse(uidA: string, uidB: string): FusionOutcome {
  const a = findPartyMember(uidA);
  const b = findPartyMember(uidB);
  if (!a || !b || a.uid === b.uid) {
    return { ok: false, reason: 'ざいりょうが　えらばれていないよ！' };
  }

  const preview = previewFusion(uidA, uidB);
  if (!preview) {
    return { ok: false, reason: 'そのくみあわせは　まだ　わからない…' };
  }

  releaseMonster(a.uid);
  releaseMonster(b.uid);

  const resultInstance = createMonsterInstance(preview.resultSpeciesId, preview.resultLevel);
  addToParty(resultInstance);

  return { ok: true, resultInstance };
}
