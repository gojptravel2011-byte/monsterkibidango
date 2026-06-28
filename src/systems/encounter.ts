import { FIELDS } from '../data/fields';
import { createMonsterInstance } from '../state/playerState';
import type { MonsterInstance } from '../state/playerState';

// ランダムエンカウント方式（シンボルエンカウントより実装が簡単なためデフォルト採用）
// 一定歩数ごとに確率でモンスターが出現する

const STEPS_PER_ENCOUNTER_CHECK = 8; // 何歩ごとにチェックするか
const ENCOUNTER_RATE = 0.4;          // エンカウント判定の確率

let stepCount = 0;

export function countStep(): boolean {
  stepCount++;
  if (stepCount >= STEPS_PER_ENCOUNTER_CHECK) {
    stepCount = 0;
    return Math.random() < ENCOUNTER_RATE;
  }
  return false;
}

export function resetStepCount(): void {
  stepCount = 0;
}

export function generateEncounter(fieldId: string, _playerLevel: number): MonsterInstance | null {
  const field = FIELDS[fieldId];
  if (!field || field.isSafeZone || field.encounters.length === 0) return null;

  // 重みつきランダム選択
  const total = field.encounters.reduce((s, e) => s + e.weight, 0);
  let rand = Math.random() * total;
  let chosen: string | null = null;
  for (const enc of field.encounters) {
    rand -= enc.weight;
    if (rand <= 0) { chosen = enc.speciesId; break; }
  }
  if (!chosen) chosen = field.encounters[0].speciesId;

  // プレイヤーレベルではなくフィールド固定レベルで出現（難易度調整しやすい）
  const minL = field.encounterLevelMin;
  const maxL = field.encounterLevelMax;
  const level = minL + Math.floor(Math.random() * (maxL - minL + 1));
  return createMonsterInstance(chosen, level);
}

// 捕獲判定
export function tryCatch(
  enemy: MonsterInstance,
  catchBonus: number = 0,
): boolean {
  const hpRatio = enemy.hp / enemy.maxHp;
  const baseRate = (1 - hpRatio * 0.5) * 0.3 + catchBonus;
  return Math.random() < Math.min(baseRate, 0.95);
}
