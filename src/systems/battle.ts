import type { MonsterInstance } from '../state/playerState';
import { SKILLS } from '../data/skills';

export interface BattleResult {
  damage: number;
  message: string;
}

export function calcDamage(
  attacker: MonsterInstance,
  skillId: string,
): number {
  const skill = SKILLS[skillId];
  if (!skill) return 5;
  // シンプルダメージ計算：威力 × (レベル/10) × 乱数
  const base = skill.power;
  const levelBonus = attacker.level / 10;
  const rand = 0.85 + Math.random() * 0.3;
  return Math.max(1, Math.floor(base * levelBonus * rand));
}

export function enemyChooseSkill(enemy: MonsterInstance): string {
  if (enemy.skills.length === 0) return 'taiatarikko';
  return enemy.skills[Math.floor(Math.random() * enemy.skills.length)];
}

export function applyDamage(target: MonsterInstance, damage: number): void {
  target.hp = Math.max(0, target.hp - damage);
}

export function isFainted(monster: MonsterInstance): boolean {
  return monster.hp <= 0;
}

export function calcExpGain(enemy: MonsterInstance): number {
  return enemy.level * 10 + enemy.level * enemy.level;
}

export function calcCoinGain(enemy: MonsterInstance): number {
  return enemy.level * 5 + Math.floor(Math.random() * 10);
}
