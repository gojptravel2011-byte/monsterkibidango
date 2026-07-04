import { getState, setState } from '../state/playerState';
import type { PlayerState } from '../state/playerState';

const SAVE_KEY = 'monstarfriend_save';

export function saveGame(): void {
  const state = getState();
  localStorage.setItem(SAVE_KEY, JSON.stringify(state));
}

export function loadGame(): boolean {
  const raw = localStorage.getItem(SAVE_KEY);
  if (!raw) return false;
  try {
    const state: PlayerState = JSON.parse(raw);
    if (!state.dex) state.dex = {};
    if (typeof state.katakanaLevel !== 'number' || isNaN(state.katakanaLevel)) state.katakanaLevel = 0;
    if (typeof state.keisanLevel !== 'number' || isNaN(state.keisanLevel)) state.keisanLevel = 0;
    setState(state);
    return true;
  } catch {
    return false;
  }
}

export function hasSaveData(): boolean {
  return localStorage.getItem(SAVE_KEY) !== null;
}

export function deleteSave(): void {
  localStorage.removeItem(SAVE_KEY);
}
