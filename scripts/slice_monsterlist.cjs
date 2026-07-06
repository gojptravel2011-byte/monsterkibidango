const { Jimp } = require('jimp');
const path = require('path');
const fs = require('fs');

const SRC_DIR = path.join(__dirname, '..', 'public', 'monsterlist');
const OUT_DIR = path.join(__dirname, '..', 'public', 'monsters');

// [filename, startNumber] — endNumber is inferred as start+8 (9 cells/sheet),
// overriding the filename-declared end when it disagrees with the actual 3x3 content.
const SHEETS = [
  ['sprites1-9.png', 1],
  ['sprites10-18.png', 10],
  ['sprites19-27.png', 19],
  ['sprites28-36.png', 28],
  ['sprites37-45.png', 37],
  ['sprites46-54.png', 46],
  ['sprites55-64.png', 55], // filename says 55-64, content is 9 cells -> 55-63
];

const MONSTERS = [
  ['kurosuke', 'クロスケ'],
  ['piyon', 'ぴよん'],
  ['mizubon', 'みずぼん'],
  ['honon', 'ほのん'],
  ['kusagumi', 'くさぐみ'],
  ['iwagon', 'いわごん'],
  ['kazepon', 'かぜぽん'],
  ['denkon', 'でんこん'],
  ['dragon', 'ドラゴン'],
  ['rasuboss', 'やみのぬし'],
  ['inferno_golem', 'インフェルノゴーレム'],
  ['flame_dragon', 'フレイムドラゴン'],
  ['vulcan_phoenix', 'バルカンフェニックス'],
  ['blizzard_wolf', 'ブリザードウルフ'],
  ['frost_giant', 'フロストジャイアント'],
  ['ice_specter', 'アイススペクター'],
  ['thunder_beast', 'サンダービースト'],
  ['storm_lord', 'ストームロード'],
  ['volt_hydra', 'ボルトヒドラ'],
  ['abyss_kraken', 'アビスクラーケン'],
  ['tide_leviathan', 'タイドレヴィアタン'],
  ['coral_golem', 'コーラルゴーレム'],
  ['heaven_knight', 'ヘブンナイト'],
  ['sky_titan', 'スカイタイタン'],
  ['wind_serpent', 'ウィンドサーペント'],
  ['dark_angel', 'ダークエンジェル'],
  ['golem_teacher', 'ゴーレムせんせい'],
  ['shadow_student', 'シャドウせいと'],
  ['void_reaper', 'ヴォイドリーパー'],
  ['nightmare_wolf', 'ナイトメアウルフ'],
  ['shadow_colossus', 'シャドウコロッサス'],
  ['black_dragon', 'ぶらっくドラゴン'],
  ['coin_slime', 'ゴールドスライム'],
  ['exp_ghost', 'けいけんちのゆうれい'],
  ['yami_no_teiou', 'やみのていおう'],
  ['riri', 'りり'],
  ['asa', 'あさ'],
  ['kaho', 'かほ'],
  ['haru', 'はる'],
  ['yuuki', 'ゆうき'],
  ['takeru', 'たける'],
  ['yuzu', 'ゆず'],
  ['honoo_nushi', 'ほのおのぬし'],
  ['koori_nushi', 'こおりのぬし'],
  ['kaminari_nushi', 'かみなりのぬし'],
  ['mizu_nushi', 'みずのぬし'],
  ['sora_nushi', 'そらのぬし'],
  ['mori_seirei', 'もりのせいれい'],
  ['maguroc', 'マグロック'],
  ['thunder_fairy', 'サンダーフェアリー'],
  ['ice_phoenix', 'アイスフェニックス'],
  ['crystal_golem', 'クリスタルゴーレム'],
  ['element_dragon', 'エレメントドラゴン'],
  ['shine_unicorn', 'シャインユニコーン'],
  ['dark_chimera', 'ダークキメラ'],
  ['seirei_ou', 'せいれいおう'],
  ['ultimate_dragon', 'きゅうきょくのドラゴン'],
  ['coin_slime_king', 'ゴールドスライムキング'],
  ['exp_ghost_giant', 'けいけんちの大ゆうれい'],
  ['betsusekai_kamisama', 'べつせかいのかみさま'],
  ['enchou', 'えんちょう'],
  ['sensei', 'せんせい'],
  ['hen_na_ojisan', 'へんなおじさん'],
];

async function main() {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

  const manifest = [];
  const warnings = [];

  for (const [file, start] of SHEETS) {
    const filePath = path.join(SRC_DIR, file);
    const im = await Jimp.read(filePath);
    const w = im.bitmap.width;
    const h = im.bitmap.height;
    if (w % 3 !== 0 || h % 3 !== 0) {
      warnings.push(`${file}: size ${w}x${h} not evenly divisible by 3 (cell=${(w/3).toFixed(2)}x${(h/3).toFixed(2)}), rounded.`);
    }
    const cw = w / 3;
    const ch = h / 3;

    for (let i = 0; i < 9; i++) {
      const num = start + i;
      if (num > 63) continue; // sprites55-64.png declares 10, actual content is 9 (55-63)
      const col = i % 3;
      const row = Math.floor(i / 3);
      const x = Math.round(col * cw);
      const y = Math.round(row * ch);
      const cellW = Math.round((col + 1) * cw) - x;
      const cellH = Math.round((row + 1) * ch) - y;

      const cell = im.clone().crop({ x, y, w: cellW, h: cellH });
      const outName = `monster_${String(num).padStart(3, '0')}.png`;
      await cell.write(path.join(OUT_DIR, outName));

      const [id, name] = MONSTERS[num - 1];
      manifest.push({
        number: num,
        id,
        name,
        file: `monsters/${outName}`,
        sourceSheet: file,
        cell: { row, col },
      });
    }
  }

  manifest.sort((a, b) => a.number - b.number);
  const manifestPath = path.join(__dirname, '..', 'public', 'monsters', 'manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

  console.log('TOTAL_GENERATED', manifest.length);
  console.log('MANIFEST_PATH', manifestPath);
  console.log('WARNINGS', JSON.stringify(warnings, null, 2));
}

main().catch((e) => { console.error(e); process.exit(1); });
