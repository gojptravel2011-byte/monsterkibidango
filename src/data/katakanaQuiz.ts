// ひらがな→カタカナ対応クイズの出題データ

export interface KatakanaQuizItem {
  hiragana: string;            // 出題するひらがな
  katakana: string;            // 正解のカタカナ
  relatedReadings?: string[];  // 関連する読み方（拗音・濁音バリエーションなどの解説用）
  tier: 1 | 2 | 3;             // 1:清音 2:濁音・半濁音 3:拗音（レベルに応じた出題範囲の絞り込みに使用）
}

export const KATAKANA_QUIZ_SET: KatakanaQuizItem[] = [
  // 清音
  { hiragana: 'あ', katakana: 'ア', tier: 1 },
  { hiragana: 'い', katakana: 'イ', tier: 1 },
  { hiragana: 'う', katakana: 'ウ', tier: 1 },
  { hiragana: 'え', katakana: 'エ', tier: 1 },
  { hiragana: 'お', katakana: 'オ', tier: 1 },
  { hiragana: 'か', katakana: 'カ', tier: 1 },
  { hiragana: 'き', katakana: 'キ', tier: 1 },
  { hiragana: 'く', katakana: 'ク', tier: 1 },
  { hiragana: 'け', katakana: 'ケ', tier: 1 },
  { hiragana: 'こ', katakana: 'コ', tier: 1 },
  { hiragana: 'さ', katakana: 'サ', tier: 1 },
  { hiragana: 'し', katakana: 'シ', tier: 1 },
  { hiragana: 'す', katakana: 'ス', tier: 1 },
  { hiragana: 'せ', katakana: 'セ', tier: 1 },
  { hiragana: 'そ', katakana: 'ソ', tier: 1 },
  { hiragana: 'た', katakana: 'タ', tier: 1 },
  { hiragana: 'ち', katakana: 'チ', tier: 1 },
  { hiragana: 'つ', katakana: 'ツ', tier: 1 },
  { hiragana: 'て', katakana: 'テ', tier: 1 },
  { hiragana: 'と', katakana: 'ト', tier: 1 },
  { hiragana: 'な', katakana: 'ナ', tier: 1 },
  { hiragana: 'に', katakana: 'ニ', tier: 1 },
  { hiragana: 'ぬ', katakana: 'ヌ', tier: 1 },
  { hiragana: 'ね', katakana: 'ネ', tier: 1 },
  { hiragana: 'の', katakana: 'ノ', tier: 1 },
  { hiragana: 'は', katakana: 'ハ', tier: 1 },
  { hiragana: 'ひ', katakana: 'ヒ', tier: 1 },
  { hiragana: 'ふ', katakana: 'フ', tier: 1 },
  { hiragana: 'へ', katakana: 'ヘ', tier: 1 },
  { hiragana: 'ほ', katakana: 'ホ', tier: 1 },
  { hiragana: 'ま', katakana: 'マ', tier: 1 },
  { hiragana: 'み', katakana: 'ミ', tier: 1 },
  { hiragana: 'む', katakana: 'ム', tier: 1 },
  { hiragana: 'め', katakana: 'メ', tier: 1 },
  { hiragana: 'も', katakana: 'モ', tier: 1 },
  { hiragana: 'や', katakana: 'ヤ', tier: 1 },
  { hiragana: 'ゆ', katakana: 'ユ', tier: 1 },
  { hiragana: 'よ', katakana: 'ヨ', tier: 1 },
  { hiragana: 'ら', katakana: 'ラ', tier: 1 },
  { hiragana: 'り', katakana: 'リ', tier: 1 },
  { hiragana: 'る', katakana: 'ル', tier: 1 },
  { hiragana: 'れ', katakana: 'レ', tier: 1 },
  { hiragana: 'ろ', katakana: 'ロ', tier: 1 },
  { hiragana: 'わ', katakana: 'ワ', tier: 1 },
  { hiragana: 'を', katakana: 'ヲ', tier: 1 },
  { hiragana: 'ん', katakana: 'ン', tier: 1 },

  // 濁音・半濁音
  { hiragana: 'が', katakana: 'ガ', tier: 2 },
  { hiragana: 'ざ', katakana: 'ザ', tier: 2 },
  { hiragana: 'だ', katakana: 'ダ', tier: 2 },
  { hiragana: 'ば', katakana: 'バ', tier: 2 },
  { hiragana: 'ぱ', katakana: 'パ', tier: 2 },

  // 拗音（関連読みの解説例つき）
  { hiragana: 'しゃ', katakana: 'シャ', relatedReadings: ['じゃ（ジャ）', 'ちゃ（チャ）'], tier: 3 },
  { hiragana: 'しゅ', katakana: 'シュ', relatedReadings: ['じゅ（ジュ）', 'ちゅ（チュ）'], tier: 3 },
  { hiragana: 'しょ', katakana: 'ショ', relatedReadings: ['じょ（ジョ）', 'ちょ（チョ）'], tier: 3 },
];

// ダミー選択肢を作る際、見た目が似ているカタカナ同士を優先的に混ぜる
export const SIMILAR_KATAKANA_GROUPS: string[][] = [
  ['ア', 'マ', 'ヤ'],
  ['カ', 'ケ'],
  ['ク', 'ワ'],
  ['シ', 'ツ', 'ン'],
  ['ソ', 'ン'],
  ['ナ', 'メ', 'ヌ'],
  ['ニ', 'ミ'],
  ['ハ', 'ホ'],
  ['フ', 'プ', 'ラ'],
  ['ヨ', 'コ'],
];
