// 「へんなおじさん」に関する定数をまとめたデータモジュール。
// MapScene からはこの定数を読むだけで、NPCの見た目・セリフを差し替えられる。
export const FUSION_NPC = {
  spriteKey: 'npc_fusion_ojisan',
  name: 'へんなおじさん',
  greeting: 'へんなおじさん：\n「どれどれ…\nモンスターを　まぜてみようか？」',
  labelColor: '#cc66ff',
  triggerColor: 0xaa44ff,
} as const;
