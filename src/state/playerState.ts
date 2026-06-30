import { MONSTER_SPECIES } from '../data/monsters';
import type { MonsterSpecies } from '../data/monsters';

export interface MonsterInstance {
  uid: string;
  speciesId: string;
  level: number;
  exp: number;
  hp: number;
  maxHp: number;
  skills: string[];
  affection: number;
  isRare?: boolean; // レアエンカウントフラグ（encounter.ts がセット）
  // 将来の進化・アクセサリー用（MVPでは未使用）
  // equippedAccessory?: string;
}

export interface PlayerState {
  name: string;
  coins: number;
  party: MonsterInstance[];
  box: MonsterInstance[];
  inventory: { itemId: string; count: number }[];
  position: { field: string; x: number; y: number };
  flags: Record<string, boolean>;
}

let _state: PlayerState = createInitialState();

function createInitialState(): PlayerState {
  return {
    name: 'あなた',
    coins: 100,
    party: [],
    box: [],
    inventory: [],
    position: { field: 'hoikuen', x: 400, y: 300 },
    flags: {},
  };
}

export function getState(): PlayerState {
  return _state;
}

export function setState(newState: PlayerState): void {
  _state = newState;
}

export function calcMaxHp(species: MonsterSpecies, level: number): number {
  return Math.floor(species.baseMaxHp + (species.baseMaxHp * 0.1 * (level - 1)));
}

export function calcExpToNextLevel(level: number): number {
  return level * level * 10;
}

function getSkillsForLevel(speciesId: string, level: number): string[] {
  const species = MONSTER_SPECIES[speciesId];
  if (!species) return [];
  const learned = species.learnset
    .filter(e => e.level <= level)
    .map(e => e.skill);
  // 重複除去・最大4つ
  return [...new Set(learned)].slice(-4);
}

export function createMonsterInstance(speciesId: string, level: number): MonsterInstance {
  const species = MONSTER_SPECIES[speciesId];
  if (!species) throw new Error(`Unknown species: ${speciesId}`);
  const maxHp = calcMaxHp(species, level);
  return {
    uid: `${speciesId}_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    speciesId,
    level,
    exp: 0,
    hp: maxHp,
    maxHp,
    skills: getSkillsForLevel(speciesId, level),
    affection: 0,
  };
}

export function addToParty(monster: MonsterInstance): void {
  if (_state.party.length < 6) {
    _state.party.push(monster);
  } else {
    _state.box.push(monster);
  }
}

export function addItem(itemId: string, count: number = 1): void {
  const existing = _state.inventory.find(i => i.itemId === itemId);
  if (existing) {
    existing.count += count;
  } else {
    _state.inventory.push({ itemId, count });
  }
}

export function removeItem(itemId: string, count: number = 1): boolean {
  const existing = _state.inventory.find(i => i.itemId === itemId);
  if (!existing || existing.count < count) return false;
  existing.count -= count;
  if (existing.count === 0) {
    _state.inventory = _state.inventory.filter(i => i.itemId !== itemId);
  }
  return true;
}

export function addCoins(amount: number): void {
  _state.coins += amount;
}

export function spendCoins(amount: number): boolean {
  if (_state.coins < amount) return false;
  _state.coins -= amount;
  return true;
}

export function setFlag(key: string, value: boolean = true): void {
  _state.flags[key] = value;
}

export function getFlag(key: string): boolean {
  return !!_state.flags[key];
}

// レベルアップ処理。新しく覚えた技を返す
export function gainExp(monster: MonsterInstance, amount: number): string[] {
  monster.exp += amount;
  const newSkills: string[] = [];
  const species = MONSTER_SPECIES[monster.speciesId];
  const expRate = species?.expRate ?? 1.0;
  while (monster.exp >= calcExpToNextLevel(monster.level) * expRate) {
    monster.exp -= Math.ceil(calcExpToNextLevel(monster.level) * expRate);
    monster.level += 1;
    const newMaxHp = calcMaxHp(species, monster.level);
    monster.hp = Math.min(monster.hp + (newMaxHp - monster.maxHp), newMaxHp);
    monster.maxHp = newMaxHp;
    // 新しい技チェック
    species.learnset
      .filter(e => e.level === monster.level && !monster.skills.includes(e.skill))
      .forEach(e => {
        if (monster.skills.length < 4) {
          monster.skills.push(e.skill);
          newSkills.push(e.skill);
        }
      });
  }
  return newSkills;
}
