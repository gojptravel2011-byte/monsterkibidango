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
};
