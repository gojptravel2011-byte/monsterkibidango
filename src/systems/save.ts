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
