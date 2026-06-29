// Web Audio API によるBGM管理
// ブラウザのAutoplay制限のため、最初のユーザー操作後に BGM.init() を呼ぶこと

type TrackId = 'title' | 'field' | 'field_dark' | 'battle' | 'boss' | 'ending' | 'opening';

interface Note { freq: number; dur: number; }

function n(freq: number, dur: number): Note { return { freq, dur }; }
function rest(dur: number): Note { return { freq: 0, dur }; }

// 音価ヘルパー
const q  = (bpm: number) => 60 / bpm;
const h  = (bpm: number) => q(bpm) * 2;
const dh = (bpm: number) => q(bpm) * 3;  // 付点2分（3拍）
const e  = (bpm: number) => q(bpm) * 0.5;
const dq = (bpm: number) => q(bpm) * 1.5;

// ====================================================
// タイトル「モンスターきびだんごのうた」
// C長調・ワルツ風 72BPM・サイン波・癒し系
// ====================================================
const T = 72;
const TITLE_MELODY: Note[] = [
  // フレーズA（C-G-E/下りてくる優しいメロディ）
  n(784,q(T)), n(659,q(T)), n(523,q(T)),  // G E C
  n(659,dh(T)),                            // E(3拍)
  n(587,q(T)), n(698,q(T)), n(587,q(T)),  // D F D
  n(523,dh(T)),                            // C(3拍)

  // フレーズB（上がって気持ちよく）
  n(659,q(T)), n(784,q(T)), n(880,q(T)),  // E G A
  n(784,dh(T)),                            // G(3拍)
  n(659,q(T)), n(587,q(T)), n(523,q(T)),  // E D C
  n(523,dh(T)),                            // C(3拍)

  // フレーズC（クライマックスへ）
  n(784,q(T)), n(880,q(T)), n(784,q(T)),  // G A G
  n(659,q(T)), n(587,q(T)), n(523,q(T)),  // E D C
  n(587,q(T)), n(659,q(T)), n(784,q(T)),  // D E G
  n(659,dh(T)),                            // E(3拍)

  // フレーズD（しずかに締める）
  n(523,q(T)), n(659,q(T)), n(784,q(T)),  // C E G
  n(880,dh(T)),                            // A(3拍)
  n(784,q(T)), n(659,q(T)), n(587,q(T)),  // G E D
  n(523,dh(T)),                            // C(3拍)
  rest(dh(T)),
];

// 和音伴奏（低音・5度のハーモニー）
const TITLE_BASS: Note[] = [
  // フレーズA
  n(262,dh(T)), n(196,dh(T)), n(262,dh(T)), n(196,dh(T)),
  // フレーズB
  n(175,dh(T)), n(262,dh(T)), n(196,dh(T)), n(262,dh(T)),
  // フレーズC
  n(262,dh(T)), n(262,dh(T)), n(196,dh(T)), n(262,dh(T)),
  // フレーズD
  n(175,dh(T)), n(196,dh(T)), n(262,dh(T)), n(196,dh(T)),
  rest(dh(T)),
];

// ====================================================
// フィールド「たんけんのうた」
// G長調・明るい探検 96BPM・トライアングル波
// ====================================================
const F = 96;
const FIELD_MELODY: Note[] = [
  // フレーズA
  n(392,e(F)), n(440,e(F)), n(494,q(F)), n(587,q(F)),
  n(659,dq(F)), n(587,e(F)), n(494,h(F)),
  n(440,e(F)), n(494,e(F)), n(440,q(F)), n(392,q(F)),
  n(330,h(F)), rest(h(F)),

  // フレーズB
  n(494,e(F)), n(587,e(F)), n(659,q(F)), n(784,q(F)),
  n(880,dq(F)), n(784,e(F)), n(659,h(F)),
  n(587,q(F)), n(494,q(F)), n(440,q(F)), n(392,q(F)),
  n(440,h(F)), rest(h(F)),

  // フレーズC（軽やかな跳躍）
  n(392,e(F)), n(494,e(F)), n(587,e(F)), n(659,e(F)),
  n(784,q(F)), n(659,e(F)), n(587,e(F)),
  n(494,e(F)), n(440,e(F)), n(392,e(F)), n(330,e(F)),
  n(392,h(F)), rest(h(F)),

  // フレーズD（締め）
  n(659,q(F)), n(587,q(F)), n(494,q(F)), n(440,q(F)),
  n(392,dq(F)), n(330,e(F)), n(294,h(F)),
  n(330,e(F)), n(392,e(F)), n(440,e(F)), n(494,e(F)),
  n(392,h(F)), rest(h(F)),
];

const FIELD_BASS: Note[] = [
  n(196,h(F)), n(196,h(F)), n(196,h(F)), rest(h(F)),
  n(165,h(F)), n(165,h(F)), n(196,h(F)), rest(h(F)),
  n(196,h(F)), n(196,h(F)), n(220,h(F)), rest(h(F)),
  n(247,h(F)), n(196,h(F)), n(165,h(F)), rest(h(F)),
];

// ====================================================
// 暗いフィールド「じんじゃのよる」
// Aマイナー・幻想的 78BPM・サイン波
// ====================================================
const FD = 78;
const FIELD_DARK_MELODY: Note[] = [
  n(440,q(FD)), n(494,e(FD)), n(440,e(FD)), n(392,q(FD)), rest(q(FD)),
  n(349,dq(FD)), n(330,e(FD)), n(294,h(FD)),
  n(330,q(FD)), n(392,e(FD)), n(330,e(FD)), n(294,q(FD)), rest(q(FD)),
  n(330,h(FD)), rest(h(FD)),

  n(494,q(FD)), n(523,e(FD)), n(494,e(FD)), n(440,q(FD)), rest(q(FD)),
  n(392,dq(FD)), n(349,e(FD)), n(330,h(FD)),
  n(294,q(FD)), n(330,e(FD)), n(294,e(FD)), n(262,q(FD)), rest(q(FD)),
  n(294,h(FD)), rest(h(FD)),
];

const FIELD_DARK_BASS: Note[] = [
  n(110,h(FD)), n(110,h(FD)), n(98,h(FD)), rest(h(FD)),
  n(87,h(FD)),  n(98,h(FD)),  n(110,h(FD)), rest(h(FD)),
];

// ====================================================
// バトル「きびだんごバトル！」
// Aマイナー・スクエア波 136BPM
// ====================================================
const B = 136;
const BATTLE_MELODY: Note[] = [
  n(440,e(B)), n(494,e(B)), n(523,e(B)), n(587,e(B)),
  n(659,q(B)), n(587,e(B)), n(523,e(B)),
  n(494,e(B)), n(523,e(B)), n(494,e(B)), n(440,e(B)),
  n(392,h(B)),

  n(523,e(B)), n(587,e(B)), n(659,e(B)), n(587,e(B)),
  n(523,q(B)), n(494,e(B)), n(440,e(B)),
  n(392,e(B)), n(440,e(B)), n(494,e(B)), n(523,e(B)),
  n(440,h(B)),

  n(440,e(B)), n(392,e(B)), n(349,e(B)), n(330,e(B)),
  n(349,q(B)), n(392,e(B)), n(440,e(B)),
  n(494,e(B)), n(523,e(B)), n(587,e(B)), n(659,e(B)),
  n(587,q(B)), rest(q(B)),

  n(659,e(B)), n(587,e(B)), n(523,e(B)), n(494,e(B)),
  n(523,q(B)), n(440,e(B)), n(392,e(B)),
  n(330,e(B)), n(349,e(B)), n(392,e(B)), n(440,e(B)),
  n(440,h(B)),
];

// ====================================================
// ラスボス「くらやみのあるじ」
// Aマイナー・重厚 68BPM・ノコギリ波
// ====================================================
const BS = 68;
const BOSS_MELODY: Note[] = [
  n(220,q(BS)), rest(e(BS)), n(233,e(BS)),
  n(220,q(BS)), rest(q(BS)),
  n(196,q(BS)), rest(e(BS)), n(208,e(BS)),
  n(196,h(BS)),

  n(175,q(BS)), rest(e(BS)), n(185,e(BS)),
  n(175,q(BS)), rest(q(BS)),
  n(165,e(BS)), n(175,e(BS)), n(165,e(BS)), n(156,e(BS)),
  n(165,h(BS)), rest(h(BS)),

  n(220,e(BS)), n(220,e(BS)), rest(e(BS)), n(233,e(BS)),
  n(220,q(BS)), n(196,q(BS)),
  n(185,e(BS)), n(196,e(BS)), n(175,e(BS)), n(165,e(BS)),
  n(175,h(BS)), rest(h(BS)),
];

// ====================================================
// エンディング「ありがとう、ともだち」
// C長調・晴れやか 100BPM・サイン波
// ====================================================
const EN = 100;
const ENDING_MELODY: Note[] = [
  n(523,q(EN)), n(659,q(EN)), n(784,h(EN)),
  n(880,q(EN)), n(784,q(EN)), n(659,h(EN)),
  n(784,q(EN)), n(698,q(EN)), n(659,h(EN)),
  n(587,q(EN)), n(523,q(EN)), n(494,h(EN)),
  n(523,h(EN)), rest(h(EN)),

  n(659,q(EN)), n(784,q(EN)), n(880,h(EN)),
  n(1047,dq(EN)), n(880,e(EN)), n(784,h(EN)),
  n(880,q(EN)), n(784,q(EN)), n(698,h(EN)),
  n(784,dq(EN)), n(659,e(EN)), n(523,q(EN)), n(587,q(EN)),
  n(523,h(EN)), rest(h(EN) + h(EN)),
];

const ENDING_BASS: Note[] = [
  n(131,h(EN)), n(131,h(EN)), n(175,h(EN)), n(196,h(EN)), n(131,h(EN)),
  n(131,h(EN)), n(131,h(EN)), n(175,h(EN)), n(196,h(EN)), n(131,h(EN)),
  rest(h(EN) + h(EN)),
];

// ====================================================
// オープニング「はじまりの予感」
// Dマイナー・ドラマチック 84BPM・サイン波・神秘＆壮大
// 静かな導入から盛り上がるビルドアップ構成
// ====================================================
const OP = 84;
const OPENING_MELODY: Note[] = [
  // フレーズA（静かな導入・Dm）
  rest(q(OP)),
  n(293, dq(OP)), n(262, e(OP)),            // D C（低め、静か）
  n(293, h(OP)),                             // D
  rest(q(OP)), n(349, q(OP)),               // F
  n(392, dq(OP)), n(349, e(OP)),            // G F
  n(330, h(OP)),                             // E
  rest(h(OP)),

  // フレーズB（緊張感が高まる）
  n(440, q(OP)), n(415, e(OP)), n(440, e(OP)),  // A G# A
  n(494, dq(OP)), n(440, e(OP)),            // B A
  n(523, q(OP)), n(494, q(OP)),             // C B
  n(440, h(OP)),                             // A
  n(392, q(OP)), n(349, q(OP)),             // G F
  n(330, h(OP)),                             // E

  // フレーズC（クライマックス・壮大に）
  n(587, q(OP)), n(659, e(OP)), n(587, e(OP)),  // D5 E5 D5
  n(523, dq(OP)), n(494, e(OP)),            // C5 B4
  n(587, q(OP)), n(523, q(OP)),             // D5 C5
  n(494, h(OP)),                             // B4
  n(440, e(OP)), n(494, e(OP)), n(440, e(OP)), n(392, e(OP)),  // A B A G
  n(349, h(OP)),                             // F

  // フレーズD（壮大な締め・英雄の旅立ち）
  n(440, q(OP)), n(523, q(OP)),             // A C
  n(587, dq(OP)), n(523, e(OP)),            // D C
  n(494, q(OP)), n(440, q(OP)),             // B A
  n(392, h(OP)),                             // G
  n(349, q(OP)), n(392, q(OP)), n(440, e(OP)), n(392, e(OP)),  // F G A G
  n(330, h(OP)), rest(q(OP)),               // E → 静寂
];

const OPENING_BASS: Note[] = [
  // フレーズA（Dm）
  rest(q(OP)),
  n(147, dh(OP)),                           // D2
  n(131, dh(OP)),                           // C2
  rest(h(OP)),

  // フレーズB（Am → F → C → G）
  n(110, h(OP)),                            // A2
  n(165, h(OP)),                            // E2（5度）
  n(131, h(OP)),                            // C2
  n(98, h(OP)),                             // G1

  // フレーズC（Dm → C → Bb → A）
  n(147, h(OP)),                            // D2
  n(131, h(OP)),                            // C2
  n(117, h(OP)),                            // Bb1
  n(110, h(OP)),                            // A2

  // フレーズD（Dm → F → C → Dm締め）
  n(147, h(OP)),                            // D2
  n(131, h(OP)),                            // C2
  n(98, h(OP)),                             // G1
  n(147, h(OP)), rest(q(OP)),              // D2 → 静寂
];

// ====================================================
// トラック定義
// ====================================================
interface TrackDef {
  melody: Note[];
  bass?: Note[];
  wave: OscillatorType;
  bassWave?: OscillatorType;
  vol: number;
  bassVol?: number;
  attack: number;
  release: number;
}

const TRACKS: Record<TrackId, TrackDef> = {
  title: {
    melody: TITLE_MELODY, bass: TITLE_BASS,
    wave: 'sine', bassWave: 'sine',
    vol: 0.13, bassVol: 0.06,
    attack: 0.12, release: 0.18,
  },
  field: {
    melody: FIELD_MELODY, bass: FIELD_BASS,
    wave: 'triangle', bassWave: 'sine',
    vol: 0.11, bassVol: 0.05,
    attack: 0.05, release: 0.10,
  },
  field_dark: {
    melody: FIELD_DARK_MELODY, bass: FIELD_DARK_BASS,
    wave: 'sine', bassWave: 'sine',
    vol: 0.10, bassVol: 0.05,
    attack: 0.15, release: 0.25,
  },
  battle: {
    melody: BATTLE_MELODY,
    wave: 'square',
    vol: 0.07,
    attack: 0.01, release: 0.05,
  },
  boss: {
    melody: BOSS_MELODY,
    wave: 'sawtooth',
    vol: 0.07,
    attack: 0.03, release: 0.08,
  },
  ending: {
    melody: ENDING_MELODY, bass: ENDING_BASS,
    wave: 'sine', bassWave: 'sine',
    vol: 0.13, bassVol: 0.05,
    attack: 0.10, release: 0.20,
  },
  opening: {
    melody: OPENING_MELODY, bass: OPENING_BASS,
    wave: 'sine', bassWave: 'sine',
    vol: 0.12, bassVol: 0.05,
    attack: 0.15, release: 0.25,
  },
};

class BgmManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private currentTrack: TrackId | null = null;
  private loopTimer: ReturnType<typeof setTimeout> | null = null;
  private oscs: OscillatorNode[] = [];
  private muted = false;

  init(): void {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return;
    }
    this.ctx = new AudioContext();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 1.0;
    this.masterGain.connect(this.ctx.destination);
  }

  play(track: TrackId): void {
    if (this.currentTrack === track) return;
    this.stopInternal();
    this.currentTrack = track;
    if (!this.muted) this.scheduleLoop();
  }

  stop(): void {
    this.stopInternal();
    this.currentTrack = null;
  }

  toggleMute(): boolean {
    this.muted = !this.muted;
    if (this.muted) {
      this.stopInternal();
    } else if (this.currentTrack) {
      this.scheduleLoop();
    }
    return this.muted;
  }

  get isMuted(): boolean { return this.muted; }

  private scheduleLayer(
    notes: Note[],
    wave: OscillatorType,
    vol: number,
    attack: number,
    release: number,
  ): number {
    if (!this.ctx || !this.masterGain) return 0;
    let t = this.ctx.currentTime + 0.05;
    const totalDur = notes.reduce((s, note) => s + note.dur, 0);

    for (const note of notes) {
      if (note.freq > 0) {
        const osc = this.ctx.createOscillator();
        osc.type = wave;
        osc.frequency.value = note.freq;

        const env = this.ctx.createGain();
        const atk = Math.min(attack, note.dur * 0.25);
        const rel = Math.min(release, note.dur * 0.4);
        env.gain.setValueAtTime(0, t);
        env.gain.linearRampToValueAtTime(vol, t + atk);
        env.gain.setValueAtTime(vol, t + note.dur - rel);
        env.gain.linearRampToValueAtTime(0, t + note.dur);

        osc.connect(env);
        env.connect(this.masterGain!);
        osc.start(t);
        osc.stop(t + note.dur + 0.01);
        this.oscs.push(osc);
      }
      t += note.dur;
    }
    return totalDur;
  }

  private scheduleLoop(): void {
    if (!this.ctx || !this.masterGain || !this.currentTrack) return;
    const track = TRACKS[this.currentTrack];

    const melodyDur = this.scheduleLayer(
      track.melody, track.wave, track.vol, track.attack, track.release,
    );
    if (track.bass) {
      this.scheduleLayer(
        track.bass, track.bassWave ?? 'sine',
        track.bassVol ?? 0.05, track.attack * 1.5, track.release * 1.5,
      );
    }

    this.loopTimer = setTimeout(() => {
      this.cleanupOscs();
      if (this.currentTrack && !this.muted) this.scheduleLoop();
    }, Math.max(0, (melodyDur - 0.2) * 1000));
  }

  private stopInternal(): void {
    if (this.loopTimer !== null) { clearTimeout(this.loopTimer); this.loopTimer = null; }
    this.cleanupOscs();
  }

  private cleanupOscs(): void {
    for (const o of this.oscs) {
      try { o.stop(); } catch { /* already stopped */ }
      try { o.disconnect(); } catch { /* already disconnected */ }
    }
    this.oscs = [];
  }
}

export const BGM = new BgmManager();
