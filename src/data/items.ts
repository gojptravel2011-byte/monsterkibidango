export type ItemType = 'food' | 'heal' | 'ball' | 'accessory';

export interface Item {
  id: string;
  name: string;
  type: ItemType;
  price: number;
  healAmount?: number;       // heal用
  catchBonus?: number;       // ball用（捕獲率補正 0.0〜1.0追加）
  affectionBonus?: number;   // food用（なつき度増加）
  expBonus?: number;         // accessory用（経験値倍率）
}

export const ITEMS: Record<string, Item> = {
  tabenoko: {
    id: 'tabenoko',
    name: 'たべのこ',
    type: 'food',
    price: 50,
    affectionBonus: 5,
    expBonus: 1.2,
  },
  honyakuki: {
    id: 'honyakuki',
    name: 'かいふくすい',
    type: 'heal',
    price: 100,
    healAmount: 30,
  },
  okyuball: {
    id: 'okyuball',
    name: 'かるいきびだんご',
    type: 'ball',
    price: 150,
    catchBonus: 0.3,
  },
  daikyuball: {
    id: 'daikyuball',
    name: 'きびだんご',
    type: 'ball',
    price: 300,
    catchBonus: 0.6,
  },
  kiracolla: {
    id: 'kiracolla',
    name: 'きらきらくびわ',
    type: 'accessory',
    price: 500,
    expBonus: 1.5,
  },
};
