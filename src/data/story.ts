export interface DialogLine {
  speaker: string;
  text: string;
}

export interface StoryEvent {
  id: string;
  trigger: string;
  dialogs: DialogLine[];
}

export const STORY_EVENTS: Record<string, StoryEvent> = {
  opening: {
    id: 'opening',
    trigger: 'game_start',
    dialogs: [
      { speaker: 'ナレーション', text: 'ある　ゆうがた…' },
      { speaker: 'ナレーション', text: 'そらから　ひかりが　おちてきた。' },
      { speaker: 'ナレーション', text: 'おとなたちは　なんにも　きづかない。' },
      { speaker: 'ナレーション', text: 'でも　きみには　みえていた…' },
      { speaker: 'クロスケ', text: 'やあ！　きみは　こどもだね！' },
      { speaker: 'クロスケ', text: 'ぼくは　クロスケ。　このせかいが　あぶないんだ！' },
      { speaker: 'クロスケ', text: 'いっしょに　たすけてくれないかな？' },
      { speaker: 'あなた', text: 'う、うん！　わかった！' },
      { speaker: 'クロスケ', text: 'よかった！　いっしょに　いろんな　ばしょを　さぐろう！' },
    ],
  },
  metKurosuke: {
    id: 'metKurosuke',
    trigger: 'enter_kouen_first_time',
    dialogs: [
      { speaker: 'クロスケ', text: 'ここが　こうえんだよ。　よく　あそびにきたね！' },
      { speaker: 'クロスケ', text: 'このへんには　いろんな　モンスターが　いるはずだよ。' },
      { speaker: 'クロスケ', text: 'なかよくなれたら　いっしょに　あそべるよ！' },
    ],
  },
  shopIntro: {
    id: 'shopIntro',
    trigger: 'enter_shop_first_time',
    dialogs: [
      { speaker: 'おみせのひと', text: 'いらっしゃい！　なんでも　そろってるよ！' },
      { speaker: 'おみせのひと', text: 'モンスターを　つかまえたいなら　ボールを　かってね！' },
    ],
  },
  preRasuboss: {
    id: 'preRasuboss',
    trigger: 'enter_rasubossArea',
    dialogs: [
      { speaker: 'クロスケ', text: 'ここが　しょうがっこうだ…\nなんか　へんな　くらいきが　するよ。' },
      { speaker: 'クロスケ', text: 'きをつけて。　でも　きみなら　できるよ！' },
      { speaker: 'やみのぬし', text: 'こどもごときが　ここまで　くるとは…\nこのがっこうは　わしの　しろじゃ！' },
      { speaker: 'あなた', text: 'そんなこと　させない！　クロスケ、いこう！' },
    ],
  },
  ending: {
    id: 'ending',
    trigger: 'defeat_rasuboss',
    dialogs: [
      { speaker: 'やみのぬし', text: 'ば、　ばかな…　こどもに　まけるとは…' },
      { speaker: 'クロスケ', text: 'やったー！！　せかいが　すくわれたよ！' },
      { speaker: 'クロスケ', text: 'ぜんぶ　きみの　おかげだよ！　ありがとう！' },
      { speaker: 'ナレーション', text: 'いんせきのちからは　きえ、モンスターたちは　おだやかになった。' },
      { speaker: 'ナレーション', text: 'そして　きみとモンスターたちの　ともだちは　ずっとつづいた。' },
      { speaker: 'ナレーション', text: 'おわり' },
    ],
  },
};
