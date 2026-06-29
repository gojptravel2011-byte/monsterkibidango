import { T } from './theme';

// Phaser Text スタイルのプリセット集
// scene.add.text(x, y, str, TS.heading) のように使う

export const TS = {
  heading: {
    fontSize: '34px', color: T.textGold, fontFamily: T.font, fontStyle: 'bold',
    stroke: '#050b1a', strokeThickness: 4,
  },
  subheading: {
    fontSize: '28px', color: T.textGold, fontFamily: T.font,
    stroke: '#050b1a', strokeThickness: 3,
  },
  body: {
    fontSize: '26px', color: T.textLight, fontFamily: T.font,
    stroke: '#050b1a', strokeThickness: 2,
  },
  sub: {
    fontSize: '20px', color: T.textSub, fontFamily: T.font,
    stroke: '#050b1a', strokeThickness: 2,
  },
  label: {
    fontSize: '22px', color: T.textGold, fontFamily: T.font,
  },
  btn: {
    fontSize: '26px', color: T.textLight, fontFamily: T.font,
    stroke: '#050b1a', strokeThickness: 2,
  },
  coin: {
    fontSize: '24px', color: T.textYellow, fontFamily: T.font,
    stroke: '#050b1a', strokeThickness: 3,
  },
  hp: {
    fontSize: '24px', color: T.textGreen, fontFamily: T.font,
    stroke: '#050b1a', strokeThickness: 2,
  },
  damage: {
    fontSize: '28px', color: T.textRed, fontFamily: T.font,
    stroke: '#050b1a', strokeThickness: 3,
  },
  speaker: {
    fontSize: '22px', color: T.textGold, fontFamily: T.font, fontStyle: 'bold',
    stroke: '#050b1a', strokeThickness: 2,
  },
} as const;
