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
  black_dragon:   { coins: 500,  exp: 800 },
  coin_slime:     { coins: 800,  exp: 50 },
  exp_ghost:      { coins: 30,   exp: 1500 },
  yami_no_teiou:  { coins: 2000, exp: 5000 },
};

// ボス専用報酬（monsters.tsのrasubossなどはここで参照）
export const BOSS_REWARDS: Record<string, { coins: number; exp: number }> = {
  rasuboss:        { coins: 1000, exp: 2000 },
  honoo_nushi:     { coins: 600,  exp: 1200 },
  koori_nushi:     { coins: 600,  exp: 1200 },
  kaminari_nushi:  { coins: 600,  exp: 1200 },
  mizu_nushi:      { coins: 600,  exp: 1200 },
  sora_nushi:      { coins: 600,  exp: 1200 },
};

// ── こどもたち（別世界の各フィールドで出会える）────────────────
export const CHILDREN_SPECIES: Record<string, MonsterSpecies> = {
  riri: {
    id: 'riri', name: 'りり', baseMaxHp: 52,
    spriteKey: 'child_riri', placeholderColor: 0xff88aa, catchable: true,
    learnset: [
      { level: 1, skill: 'honoo' },
      { level: 5, skill: 'taiatarikko' },
      { level: 10, skill: 'hikkaku' },
      { level: 15, skill: 'honooibuki' },
    ],
  },
  asa: {
    id: 'asa', name: 'あさ', baseMaxHp: 55,
    spriteKey: 'child_asa', placeholderColor: 0x88ddff, catchable: true,
    learnset: [
      { level: 1, skill: 'mizudeppo' },
      { level: 5, skill: 'taiatarikko' },
      { level: 10, skill: 'koorikiba' },
      { level: 15, skill: 'fubuki' },
    ],
  },
  kaho: {
    id: 'kaho', name: 'かほ', baseMaxHp: 50,
    spriteKey: 'child_kaho', placeholderColor: 0xffee44, catchable: true,
    learnset: [
      { level: 1, skill: 'denkogeki' },
      { level: 5, skill: 'taiatarikko' },
      { level: 10, skill: 'kamitsuku' },
      { level: 15, skill: 'raigeki' },
    ],
  },
  haru: {
    id: 'haru', name: 'はる', baseMaxHp: 58,
    spriteKey: 'child_haru', placeholderColor: 0x44aaff, catchable: true,
    learnset: [
      { level: 1, skill: 'mizudeppo' },
      { level: 5, skill: 'taiatarikko' },
      { level: 10, skill: 'kamitsuku' },
      { level: 15, skill: 'shinkaiuzu' },
    ],
  },
  yuuki: {
    id: 'yuuki', name: 'ゆうき', baseMaxHp: 50,
    spriteKey: 'child_yuuki', placeholderColor: 0xaaeeff, catchable: true,
    learnset: [
      { level: 1, skill: 'kaze' },
      { level: 5, skill: 'taiatarikko' },
      { level: 10, skill: 'hikkaku' },
      { level: 15, skill: 'kamaitachi' },
    ],
  },
  takeru: {
    id: 'takeru', name: 'たける', baseMaxHp: 65,
    spriteKey: 'child_takeru', placeholderColor: 0xffaa44, catchable: true,
    learnset: [
      { level: 1, skill: 'taiatarikko' },
      { level: 5, skill: 'iwanage' },
      { level: 10, skill: 'kamitsuku' },
      { level: 15, skill: 'hikkaku' },
    ],
  },
  yuzu: {
    id: 'yuzu', name: 'ゆず', baseMaxHp: 48,
    spriteKey: 'child_yuzu', placeholderColor: 0xffcc88, catchable: true,
    learnset: [
      { level: 1, skill: 'hikari' },
      { level: 5, skill: 'kaze' },
      { level: 10, skill: 'taiatarikko' },
      { level: 15, skill: 'honoo' },
    ],
  },
};

// ── フィールドぬし（各世界のボス）──────────────────────────────
export const FIELD_BOSS_SPECIES: Record<string, MonsterSpecies> = {
  honoo_nushi: {
    id: 'honoo_nushi', name: 'ほのおのぬし', baseMaxHp: 220,
    spriteKey: 'boss_honoo_nushi', placeholderColor: 0xff4400, catchable: false,
    learnset: [
      { level: 1, skill: 'honooibuki' },
      { level: 1, skill: 'magumakick' },
      { level: 1, skill: 'kaenhou' },
      { level: 1, skill: 'shakunetsu' },
    ],
  },
  koori_nushi: {
    id: 'koori_nushi', name: 'こおりのぬし', baseMaxHp: 220,
    spriteKey: 'boss_koori_nushi', placeholderColor: 0x66ccff, catchable: false,
    learnset: [
      { level: 1, skill: 'koorikiba' },
      { level: 1, skill: 'fubuki' },
      { level: 1, skill: 'zettaireid' },
      { level: 1, skill: 'soulfreeze' },
    ],
  },
  kaminari_nushi: {
    id: 'kaminari_nushi', name: 'かみなりのぬし', baseMaxHp: 210,
    spriteKey: 'boss_kaminari_nushi', placeholderColor: 0xffff00, catchable: false,
    learnset: [
      { level: 1, skill: 'denkogeki' },
      { level: 1, skill: 'raigeki' },
      { level: 1, skill: 'thunderstorm' },
      { level: 1, skill: 'kamitsuku' },
    ],
  },
  mizu_nushi: {
    id: 'mizu_nushi', name: 'みずのぬし', baseMaxHp: 230,
    spriteKey: 'boss_mizu_nushi', placeholderColor: 0x2266ff, catchable: false,
    learnset: [
      { level: 1, skill: 'mizudeppo' },
      { level: 1, skill: 'shinkaiuzu' },
      { level: 1, skill: 'tidalwave' },
      { level: 1, skill: 'kamitsuku' },
    ],
  },
  sora_nushi: {
    id: 'sora_nushi', name: 'そらのぬし', baseMaxHp: 200,
    spriteKey: 'boss_sora_nushi', placeholderColor: 0x88bbff, catchable: false,
    learnset: [
      { level: 1, skill: 'kaze' },
      { level: 1, skill: 'kamaitachi' },
      { level: 1, skill: 'skyfall' },
      { level: 1, skill: 'taiatarikko' },
    ],
  },
};

export const TOWER_BOSS_SPECIES: Record<string, MonsterSpecies> = {
  kodai_dragon: {
    id: 'kodai_dragon',
    name: 'いにしえのドラゴン',
    baseMaxHp: 500,
    spriteKey: 'kodai_dragon',
    placeholderColor: 0xff88ff,
    catchable: true,
    requiresGoldBall: true,
    expRate: 0.3,
    learnset: [
      { level:  1, skill: 'taiatari' },
      { level: 10, skill: 'honoo' },
      { level: 20, skill: 'raikou' },
      { level: 30, skill: 'dragonbreath' },
      { level: 50, skill: 'reizoku' },
      { level: 70, skill: 'honoo' },
    ],
  },
};
