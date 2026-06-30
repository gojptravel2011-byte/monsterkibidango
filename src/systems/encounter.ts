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

// 神社・小学校・迷路でのみ出現するレアモンスター（5%）
const RARE_ENCOUNTER_FIELDS = new Set(['jinja', 'shogakko', 'dungeon']);
const RARE_RATE = 0.05;
const RARE_TABLE: Record<string, { speciesId: string; minL: number; maxL: number }[]> = {
  jinja:    [{ speciesId: 'dragon', minL: 10, maxL: 14 }],
  shogakko: [{ speciesId: 'dragon', minL: 10, maxL: 14 }],
  dungeon:  [{ speciesId: 'dragon', minL: 12, maxL: 16 }],
};

export function generateEncounter(fieldId: string, _playerLevel: number): MonsterInstance | null {
  const field = FIELDS[fieldId];
  if (!field || field.isSafeZone || field.encounters.length === 0) return null;

  // ── レアエンカウント判定（5%）──────────────────────────────────
  if (RARE_ENCOUNTER_FIELDS.has(fieldId) && Math.random() < RARE_RATE) {
    const rares = RARE_TABLE[fieldId];
    if (rares && rares.length > 0) {
      const r = rares[Math.floor(Math.random() * rares.length)];
      const level = r.minL + Math.floor(Math.random() * (r.maxL - r.minL + 1));
      const inst = createMonsterInstance(r.speciesId, level);
      inst.isRare = true;
      return inst;
    }
  }

  // ── 通常エンカウント（重みつきランダム選択）────────────────────
  const total = field.encounters.reduce((s, e) => s + e.weight, 0);
  let rand = Math.random() * total;
  let chosen: string | null = null;
  for (const enc of field.encounters) {
    rand -= enc.weight;
    if (rand <= 0) { chosen = enc.speciesId; break; }
  }
  if (!chosen) chosen = field.encounters[0].speciesId;

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
