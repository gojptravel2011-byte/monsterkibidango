export interface Skill {
  id: string;
  name: string;
  power: number;
  // flavorType は将来の属性システム用（MVPでは戦闘計算に使わない）
  flavorType?: string;
}

export const SKILLS: Record<string, Skill> = {
  taiatarikko: { id: 'taiatarikko', name: 'たいあたり', power: 20 },
  kamitsuku: { id: 'kamitsuku', name: 'かみつく', power: 35 },
  hikkaku: { id: 'hikkaku', name: 'ひっかく', power: 25 },
  honoo: { id: 'honoo', name: 'ほのおだま', power: 50, flavorType: 'fire' },
  mizudeppo: { id: 'mizudeppo', name: 'みずでっぽう', power: 45, flavorType: 'water' },
  kaze: { id: 'kaze', name: 'かぜのきり', power: 40, flavorType: 'wind' },
  denkogeki: { id: 'denkogeki', name: 'でんこうげき', power: 55, flavorType: 'thunder' },
  iwanage: { id: 'iwanage', name: 'いわなげ', power: 45, flavorType: 'rock' },
  kurayami: { id: 'kurayami', name: 'くらやみげき', power: 60, flavorType: 'dark' },
  hikari: { id: 'hikari', name: 'ひかりのたま', power: 70, flavorType: 'light' },

  // ── 別世界スキル ──────────────────────────────────────────────
  // ほのお系
  honooibuki:   { id: 'honooibuki',   name: 'ほのおのいぶき',       power: 75,  flavorType: 'fire' },
  magumakick:   { id: 'magumakick',   name: 'マグマキック',          power: 65,  flavorType: 'fire' },
  honootate:    { id: 'honootate',    name: 'ほのおのたて',          power: 40,  flavorType: 'fire' },
  neppuu:       { id: 'neppuu',       name: 'ねっぷう',              power: 80,  flavorType: 'fire' },
  kaenhou:      { id: 'kaenhou',      name: 'かえんほう',            power: 90,  flavorType: 'fire' },
  shakunetsu:   { id: 'shakunetsu',   name: 'しゃくねつ',            power: 110, flavorType: 'fire' },
  phoenixfire:  { id: 'phoenixfire',  name: 'フェニックスファイア',  power: 95,  flavorType: 'fire' },
  taiyanohonoo: { id: 'taiyanohonoo', name: 'たいようのほのお',      power: 120, flavorType: 'fire' },
  ryuuibuki:    { id: 'ryuuibuki',    name: 'りゅうのいぶき',        power: 85,  flavorType: 'fire' },
  // こおり系
  koorikiba:    { id: 'koorikiba',    name: 'こおりのきば',          power: 65,  flavorType: 'ice' },
  fubuki:       { id: 'fubuki',       name: 'ふぶき',                power: 90,  flavorType: 'ice' },
  reitouray:    { id: 'reitouray',    name: 'れいとうこうせん',      power: 80,  flavorType: 'ice' },
  hyouketsu:    { id: 'hyouketsu',    name: 'ひょうけつパンチ',      power: 70,  flavorType: 'ice' },
  kogoekaze:    { id: 'kogoekaze',    name: 'こごえるかぜ',          power: 60,  flavorType: 'ice' },
  zettaireid:   { id: 'zettaireid',   name: 'ぜったいれいど',        power: 120, flavorType: 'ice' },
  soulfreeze:   { id: 'soulfreeze',   name: 'ソウルフリーズ',        power: 100, flavorType: 'ice' },
  // かみなり系
  raigeki:      { id: 'raigeki',      name: 'らいげき',              power: 85,  flavorType: 'thunder' },
  denjipou:     { id: 'denjipou',     name: 'でんじほう',            power: 75,  flavorType: 'thunder' },
  sanderclaw:   { id: 'sanderclaw',   name: 'サンダークロー',        power: 70,  flavorType: 'thunder' },
  raimei:       { id: 'raimei',       name: 'らいめいぎり',          power: 90,  flavorType: 'thunder' },
  thunderstorm: { id: 'thunderstorm', name: 'サンダーストーム',      power: 110, flavorType: 'thunder' },
  trivolbolt:   { id: 'trivolbolt',   name: 'トリプルボルト',        power: 80,  flavorType: 'thunder' },
  // みず系
  shinkaiuzu:   { id: 'shinkaiuzu',   name: 'しんかいのうず',        power: 85,  flavorType: 'water' },
  tidalwave:    { id: 'tidalwave',    name: 'タイダルウェーブ',      power: 120, flavorType: 'water' },
  mizukabe:     { id: 'mizukabe',     name: 'みずのかべ',            power: 50,  flavorType: 'water' },
  kairaibuki:   { id: 'kairaibuki',   name: 'かいりゅうのいぶき',    power: 90,  flavorType: 'water' },
  shellbash:    { id: 'shellbash',    name: 'シェルバッシュ',        power: 75,  flavorType: 'water' },
  // そら・かぜ系
  kamaitachi:   { id: 'kamaitachi',   name: 'かまいたち',            power: 75,  flavorType: 'wind' },
  senpuken:     { id: 'senpuken',     name: 'つむじかぜ',            power: 65,  flavorType: 'wind' },
  ryuukaze:     { id: 'ryuukaze',     name: 'りゅうのかぜ',          power: 80,  flavorType: 'wind' },
  airslash:     { id: 'airslash',     name: 'エアロスラッシュ',      power: 70,  flavorType: 'wind' },
  skyfist:      { id: 'skyfist',      name: 'てんくうパンチ',        power: 85,  flavorType: 'wind' },
  skyslash:     { id: 'skyslash',     name: 'てんくうぎり',          power: 80,  flavorType: 'wind' },
  cloudpunch:   { id: 'cloudpunch',   name: 'くものこぶし',          power: 75,  flavorType: 'wind' },
  skyfall:      { id: 'skyfall',      name: 'そらのほろび',          power: 110, flavorType: 'wind' },
  tailwhip:     { id: 'tailwhip',     name: 'テールウィップ',        power: 55,  flavorType: 'wind' },
  hikariKen:    { id: 'hikariKen',    name: 'ひかりのつるぎ',        power: 80,  flavorType: 'light' },
  seinaru:      { id: 'seinaru',      name: 'せいなるたて',          power: 45,  flavorType: 'light' },
  // えんじぇる・がっこう系
  kuroihane:    { id: 'kuroihane',    name: 'くろいはね',            power: 75,  flavorType: 'dark' },
  darkholy:     { id: 'darkholy',     name: 'ダークホーリー',        power: 90,  flavorType: 'dark' },
  shadowclaw:   { id: 'shadowclaw',   name: 'シャドウクロー',        power: 70,  flavorType: 'dark' },
  darknote:     { id: 'darknote',     name: 'ダークノート',          power: 65,  flavorType: 'dark' },
  chalktoss:    { id: 'chalktoss',    name: 'チョークスロー',        power: 50,  flavorType: 'normal' },
  blackboardcrash: { id: 'blackboardcrash', name: 'せきばんクラッシュ', power: 95, flavorType: 'normal' },
  problembomb:  { id: 'problembomb',  name: 'もんだいばくだん',      power: 85,  flavorType: 'normal' },
  // やみ系
  yamikama:     { id: 'yamikama',     name: 'やみのかま',            power: 85,  flavorType: 'dark' },
  deathscythe:  { id: 'deathscythe',  name: 'デスサイス',            power: 100, flavorType: 'dark' },
  voidslash:    { id: 'voidslash',    name: 'ヴォイドスラッシュ',    power: 90,  flavorType: 'dark' },
  metsubou:     { id: 'metsubou',     name: 'めつぼうのひかり',      power: 130, flavorType: 'dark' },
  akumukiba:    { id: 'akumukiba',    name: 'あくむのきば',          power: 80,  flavorType: 'dark' },
  yamiikari:    { id: 'yamiikari',    name: 'やみのいかり',          power: 95,  flavorType: 'dark' },
  shadowcrush:  { id: 'shadowcrush',  name: 'シャドウクラッシュ',    power: 110, flavorType: 'dark' },
  horobi:       { id: 'horobi',       name: 'ほろびのこえ',          power: 120, flavorType: 'dark' },
  // レアモンスター専用
  kokuryuibuki: { id: 'kokuryuibuki', name: 'こくりゅうのいぶき',   power: 140, flavorType: 'dark' },
  yamiikaze:    { id: 'yamiikaze',    name: 'やみのかみなり',        power: 120, flavorType: 'thunder' },
  ryuuanger:    { id: 'ryuuanger',    name: 'りゅうのいかり',        power: 130, flavorType: 'fire' },
  zetsumetsu:   { id: 'zetsumetsu',   name: 'ぜつめつのほのお',      power: 150, flavorType: 'fire' },
  coinatk:      { id: 'coinatk',      name: 'コインアタック',        power: 45,  flavorType: 'normal' },
  goldsplash:   { id: 'goldsplash',   name: 'ゴールドスプラッシュ',  power: 40,  flavorType: 'water' },
  jishibari:    { id: 'jishibari',    name: 'じしばり',              power: 30,  flavorType: 'normal' },
  nigeruS:      { id: 'nigeruS',      name: 'にげる',                power: 0,   flavorType: 'normal' },
  // いにしえのドラゴン専用
  dragonbreath: { id: 'dragonbreath', name: 'ドラゴンブレス', power: 110, flavorType: 'fire' },
  // ラスボス第2形態専用
  yamiteiouikari:  { id: 'yamiteiouikari',  name: 'やみのていおうのいかり', power: 160, flavorType: 'dark' },
  sekaikowasu:     { id: 'sekaikowasu',     name: 'せかいをこわすちから',   power: 180, flavorType: 'dark' },
  zettaiankok:     { id: 'zettaiankok',     name: 'ぜったいあんこく',       power: 150, flavorType: 'dark' },
};
