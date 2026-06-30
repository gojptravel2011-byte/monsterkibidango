import type { MonsterSpecies } from './monsters';

// 別世界モンスター（Lv.15以上でエンカウント、技威力は通常より高め）
export const ANOTHER_WORLD_SPECIES: Record<string, MonsterSpecies> = {

  // ── ほのおのせかい ───────────────────────────────────────────
  inferno_golem: {
    id: 'inferno_golem', name: 'インフェルノゴーレム', baseMaxHp: 180,
    spriteKey: 'aw_inferno_golem', placeholderColor: 0xcc3300, catchable: true,
    learnset: [
      { level: 15, skill: 'honooibuki' },
      { level: 17, skill: 'magumakick' },
      { level: 19, skill: 'honootate' },
      { level: 22, skill: 'neppuu' },
    ],
  },
  flame_dragon: {
    id: 'flame_dragon', name: 'フレイムドラゴン', baseMaxHp: 200,
    spriteKey: 'aw_flame_dragon', placeholderColor: 0xff2200, catchable: true,
    learnset: [
      { level: 15, skill: 'ryuuibuki' },
      { level: 18, skill: 'honooibuki' },
      { level: 20, skill: 'kaenhou' },
      { level: 24, skill: 'shakunetsu' },
    ],
  },
  vulcan_phoenix: {
    id: 'vulcan_phoenix', name: 'バルカンフェニックス', baseMaxHp: 160,
    spriteKey: 'aw_vulcan_phoenix', placeholderColor: 0xff8800, catchable: true,
    learnset: [
      { level: 15, skill: 'phoenixfire' },
      { level: 16, skill: 'honooibuki' },
      { level: 20, skill: 'hikari' },
      { level: 23, skill: 'taiyanohonoo' },
    ],
  },

  // ── こおりのせかい ───────────────────────────────────────────
  blizzard_wolf: {
    id: 'blizzard_wolf', name: 'ブリザードウルフ', baseMaxHp: 170,
    spriteKey: 'aw_blizzard_wolf', placeholderColor: 0x88ddff, catchable: true,
    learnset: [
      { level: 15, skill: 'koorikiba' },
      { level: 17, skill: 'fubuki' },
      { level: 19, skill: 'kamitsuku' },
      { level: 22, skill: 'reitouray' },
    ],
  },
  frost_giant: {
    id: 'frost_giant', name: 'フロストジャイアント', baseMaxHp: 220,
    spriteKey: 'aw_frost_giant', placeholderColor: 0xaaeeff, catchable: true,
    learnset: [
      { level: 15, skill: 'hyouketsu' },
      { level: 18, skill: 'kogoekaze' },
      { level: 21, skill: 'fubuki' },
      { level: 25, skill: 'zettaireid' },
    ],
  },
  ice_specter: {
    id: 'ice_specter', name: 'アイススペクター', baseMaxHp: 150,
    spriteKey: 'aw_ice_specter', placeholderColor: 0xccffff, catchable: true,
    learnset: [
      { level: 15, skill: 'kogoekaze' },
      { level: 17, skill: 'reitouray' },
      { level: 20, skill: 'kurayami' },
      { level: 23, skill: 'soulfreeze' },
    ],
  },

  // ── かみなりのせかい ─────────────────────────────────────────
  thunder_beast: {
    id: 'thunder_beast', name: 'サンダービースト', baseMaxHp: 185,
    spriteKey: 'aw_thunder_beast', placeholderColor: 0xffee00, catchable: true,
    learnset: [
      { level: 15, skill: 'raigeki' },
      { level: 17, skill: 'denjipou' },
      { level: 20, skill: 'sanderclaw' },
      { level: 23, skill: 'denkogeki' },
    ],
  },
  storm_lord: {
    id: 'storm_lord', name: 'ストームロード', baseMaxHp: 210,
    spriteKey: 'aw_storm_lord', placeholderColor: 0x9933ff, catchable: true,
    learnset: [
      { level: 15, skill: 'raimei' },
      { level: 18, skill: 'raigeki' },
      { level: 21, skill: 'denjipou' },
      { level: 25, skill: 'thunderstorm' },
    ],
  },
  volt_hydra: {
    id: 'volt_hydra', name: 'ボルトヒドラ', baseMaxHp: 195,
    spriteKey: 'aw_volt_hydra', placeholderColor: 0xccff00, catchable: true,
    learnset: [
      { level: 15, skill: 'trivolbolt' },
      { level: 17, skill: 'sanderclaw' },
      { level: 20, skill: 'raigeki' },
      { level: 24, skill: 'thunderstorm' },
    ],
  },

  // ── みずのせかい ─────────────────────────────────────────────
  abyss_kraken: {
    id: 'abyss_kraken', name: 'アビスクラーケン', baseMaxHp: 230,
    spriteKey: 'aw_abyss_kraken', placeholderColor: 0x334488, catchable: true,
    learnset: [
      { level: 15, skill: 'shinkaiuzu' },
      { level: 17, skill: 'taiatarikko' },
      { level: 20, skill: 'mizudeppo' },
      { level: 23, skill: 'mizukabe' },
    ],
  },
  tide_leviathan: {
    id: 'tide_leviathan', name: 'タイドレヴィアタン', baseMaxHp: 250,
    spriteKey: 'aw_tide_leviathan', placeholderColor: 0x1166cc, catchable: true,
    learnset: [
      { level: 15, skill: 'ryuuibuki' },
      { level: 18, skill: 'tidalwave' },
      { level: 21, skill: 'mizukabe' },
      { level: 26, skill: 'kairaibuki' },
    ],
  },
  coral_golem: {
    id: 'coral_golem', name: 'コーラルゴーレム', baseMaxHp: 190,
    spriteKey: 'aw_coral_golem', placeholderColor: 0xff8866, catchable: true,
    learnset: [
      { level: 15, skill: 'taiatarikko' },
      { level: 17, skill: 'mizukabe' },
      { level: 20, skill: 'shellbash' },
      { level: 22, skill: 'shinkaiuzu' },
    ],
  },

  // ── そらのせかい ─────────────────────────────────────────────
  heaven_knight: {
    id: 'heaven_knight', name: 'ヘブンナイト', baseMaxHp: 175,
    spriteKey: 'aw_heaven_knight', placeholderColor: 0xeeeeff, catchable: true,
    learnset: [
      { level: 15, skill: 'hikariKen' },
      { level: 17, skill: 'skyslash' },
      { level: 20, skill: 'seinaru' },
      { level: 23, skill: 'airslash' },
    ],
  },
  sky_titan: {
    id: 'sky_titan', name: 'スカイタイタン', baseMaxHp: 240,
    spriteKey: 'aw_sky_titan', placeholderColor: 0x99ccff, catchable: true,
    learnset: [
      { level: 15, skill: 'cloudpunch' },
      { level: 18, skill: 'skyfist' },
      { level: 21, skill: 'kaze' },
      { level: 25, skill: 'skyfall' },
    ],
  },
  wind_serpent: {
    id: 'wind_serpent', name: 'ウィンドサーペント', baseMaxHp: 165,
    spriteKey: 'aw_wind_serpent', placeholderColor: 0xaaffcc, catchable: true,
    learnset: [
      { level: 15, skill: 'kamaitachi' },
      { level: 17, skill: 'senpuken' },
      { level: 20, skill: 'tailwhip' },
      { level: 23, skill: 'ryuukaze' },
    ],
  },

  // ── エンジェルしょうがっこう ─────────────────────────────────
  dark_angel: {
    id: 'dark_angel', name: 'ダークエンジェル', baseMaxHp: 200,
    spriteKey: 'aw_dark_angel', placeholderColor: 0x6633aa, catchable: true,
    learnset: [
      { level: 15, skill: 'kuroihane' },
      { level: 17, skill: 'darkholy' },
      { level: 20, skill: 'kurayami' },
      { level: 24, skill: 'shadowclaw' },
    ],
  },
  golem_teacher: {
    id: 'golem_teacher', name: 'ゴーレムせんせい', baseMaxHp: 260,
    spriteKey: 'aw_golem_teacher', placeholderColor: 0x888888, catchable: false,
    learnset: [
      { level: 15, skill: 'chalktoss' },
      { level: 18, skill: 'blackboardcrash' },
      { level: 22, skill: 'taiatarikko' },
      { level: 26, skill: 'problembomb' },
    ],
  },
  shadow_student: {
    id: 'shadow_student', name: 'シャドウせいと', baseMaxHp: 155,
    spriteKey: 'aw_shadow_student', placeholderColor: 0x333355, catchable: true,
    learnset: [
      { level: 15, skill: 'shadowclaw' },
      { level: 17, skill: 'darknote' },
      { level: 20, skill: 'hikkaku' },
      { level: 23, skill: 'kurayami' },
    ],
  },

  // ── やみのせかい ─────────────────────────────────────────────
  void_reaper: {
    id: 'void_reaper', name: 'ヴォイドリーパー', baseMaxHp: 220,
    spriteKey: 'aw_void_reaper', placeholderColor: 0x220033, catchable: true,
    learnset: [
      { level: 15, skill: 'yamikama' },
      { level: 18, skill: 'deathscythe' },
      { level: 21, skill: 'voidslash' },
      { level: 25, skill: 'metsubou' },
    ],
  },
  nightmare_wolf: {
    id: 'nightmare_wolf', name: 'ナイトメアウルフ', baseMaxHp: 210,
    spriteKey: 'aw_nightmare_wolf', placeholderColor: 0x550022, catchable: true,
    learnset: [
      { level: 15, skill: 'akumukiba' },
      { level: 17, skill: 'kamitsuku' },
      { level: 20, skill: 'yamiikari' },
      { level: 24, skill: 'kurayami' },
    ],
  },
  shadow_colossus: {
    id: 'shadow_colossus', name: 'シャドウコロッサス', baseMaxHp: 280,
    spriteKey: 'aw_shadow_colossus', placeholderColor: 0x110011, catchable: true,
    learnset: [
      { level: 15, skill: 'taiatarikko' },
      { level: 18, skill: 'shadowcrush' },
      { level: 22, skill: 'yamiikari' },
      { level: 26, skill: 'horobi' },
    ],
  },

  // ── レアモンスター（別世界共通）──────────────────────────────
  black_dragon: {
    id: 'black_dragon', name: 'くろいドラゴン', baseMaxHp: 350,
    spriteKey: 'aw_black_dragon', placeholderColor: 0x110022, catchable: true,
    learnset: [
      { level: 25, skill: 'kokuryuibuki' },
      { level: 25, skill: 'yamiikaze' },
      { level: 25, skill: 'ryuuanger' },
      { level: 28, skill: 'zetsumetsu' },
    ],
  },
  coin_slime: {
    id: 'coin_slime', name: 'ゴールドスライム', baseMaxHp: 120,
    spriteKey: 'aw_coin_slime', placeholderColor: 0xffcc00, catchable: false,
    learnset: [
      { level: 15, skill: 'coinatk' },
      { level: 15, skill: 'nigeruS' },
      { level: 15, skill: 'goldsplash' },
      { level: 15, skill: 'nigeruS' },
    ],
  },
  exp_ghost: {
    id: 'exp_ghost', name: 'けいけんちのゆうれい', baseMaxHp: 80,
    spriteKey: 'aw_exp_ghost', placeholderColor: 0xeeeeff, catchable: false,
    learnset: [
      { level: 15, skill: 'hikari' },
      { level: 15, skill: 'jishibari' },
      { level: 15, skill: 'kurayami' },
      { level: 15, skill: 'nigeruS' },
    ],
  },

  // ── ラスボス第2形態 ──────────────────────────────────────────
  yami_no_teiou: {
    id: 'yami_no_teiou', name: 'やみのていおう', baseMaxHp: 600,
    spriteKey: 'aw_yami_no_teiou', placeholderColor: 0x330044, catchable: false,
    learnset: [
      { level: 30, skill: 'metsubou' },
      { level: 30, skill: 'yamiteiouikari' },
      { level: 30, skill: 'sekaikowasu' },
      { level: 30, skill: 'zettaiankok' },
    ],
  },
};

// 別世界モンスターのコイン・経験値倍率（BattleScene で参照）
export const AW_MONSTER_REWARDS: Record<string, { coins: number; exp: number }> = {
  black_dragon:  { coins: 500, exp: 800 },
  coin_slime:    { coins: 800, exp: 50 },
  exp_ghost:     { coins: 30,  exp: 1500 },
};
