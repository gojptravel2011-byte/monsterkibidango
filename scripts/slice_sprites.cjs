const { Jimp } = require('jimp');
const path = require('path');

const PUBLIC = path.join(__dirname, '..', 'public');

// sheet1: labeled reference sheet, 7 cols x 4 rows, cell has number+art+name text
const SHEET1_ORDER = [
  'piyon', 'kazepon', 'denkon',
  'inferno_golem', 'flame_dragon', 'vulcan_phoenix', 'blizzard_wolf',
  'frost_giant', 'ice_specter', 'thunder_beast', 'storm_lord', 'volt_hydra',
  'abyss_kraken', 'tide_leviathan', 'coral_golem', 'heaven_knight', 'sky_titan',
  'wind_serpent', 'dark_angel', 'golem_teacher', 'shadow_student',
  'void_reaper', 'nightmare_wolf', 'shadow_colossus', 'coin_slime', 'exp_ghost',
];

const SHEET2_ORDER = ['riri', 'asa', 'kaho', 'haru', 'yuuki', 'takeru', 'yuzu'];

const SHEET3_ORDER = [
  'honoo_nushi', 'koori_nushi', 'kaminari_nushi', 'mizu_nushi', 'sora_nushi',
  'mori_seirei', 'maguroc', 'thunder_fairy', 'ice_phoenix', 'crystal_golem',
  'element_dragon', 'shine_unicorn', 'dark_chimera', 'seirei_ou', 'ultimate_dragon',
];

async function sliceGrid(file, names, cols, rows, gridBox, innerMargin) {
  const im = await Jimp.read(path.join(PUBLIC, file));
  const gx = gridBox ? gridBox.x : 0;
  const gy = gridBox ? gridBox.y : 0;
  const gw = gridBox ? gridBox.w : im.bitmap.width;
  const gh = gridBox ? gridBox.h : im.bitmap.height;
  const cw = gw / cols;
  const ch = gh / rows;

  for (let i = 0; i < names.length; i++) {
    const name = names[i];
    if (!name) continue;
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = Math.round(gx + col * cw);
    const y = Math.round(gy + row * ch);
    const inset = 10;
    let cell = im.clone().crop({
      x: x + inset,
      y: y + inset,
      w: Math.max(1, Math.round(cw) - inset * 2),
      h: Math.max(1, Math.round(ch) - inset * 2),
    });
    if (innerMargin) {
      const { top = 0, bottom = 0, left = 0, right = 0 } = innerMargin;
      cell = cell.crop({
        x: left,
        y: top,
        w: Math.max(1, cell.bitmap.width - left - right),
        h: Math.max(1, cell.bitmap.height - top - bottom),
      });
    }
    cell = cell.autocrop();
    const outPath = path.join(PUBLIC, `monster_${name}.png`);
    await cell.write(outPath);
    console.log('wrote', outPath, cell.bitmap.width, cell.bitmap.height);
  }
}

async function main() {
  await sliceGrid('sprites1.png', SHEET1_ORDER, 7, 4, null, { top: 35, bottom: 40, left: 10, right: 10 });
  await sliceGrid('sprites2.png', SHEET2_ORDER, 3, 3, { x: 250, y: 75, w: 970, h: 770 }, null);
  await sliceGrid('sprites3.png', SHEET3_ORDER, 5, 3, null, null);
}

main().catch((e) => { console.error(e); process.exit(1); });
