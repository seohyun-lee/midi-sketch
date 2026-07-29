export const DRUM_MIDI = { kick: 36, snare: 38, hat: 42, hiTom: 48, floorTom: 41, crash: 49 }
export const DRUM_LANE_ORDER = ['crash', 'hat', 'snare', 'hiTom', 'floorTom', 'kick']

const Z = () => Array(16).fill(0)
const seq = pairs => { const a = Z(); for (const [i, v] of pairs) a[i] = v; return a }
const SNARE_24 = seq([[4, 2], [12, 2]])

const BASE = {
  rock8: {
    name: '록 8비트',
    lanes: {
      hat: seq([[0, 2], [2, 1], [4, 2], [6, 1], [8, 2], [10, 1], [12, 2], [14, 1]]),
      snare: SNARE_24,
      kick: seq([[0, 2], [6, 1], [8, 2]]),
    },
    hat16OnHighEnergy: true,
  },
  rock16: {
    name: '록 16비트',
    lanes: {
      hat: seq([[0, 2], [1, 1], [2, 1], [3, 1], [4, 2], [5, 1], [6, 1], [7, 1], [8, 2], [9, 1], [10, 1], [11, 1], [12, 2], [13, 1], [14, 1], [15, 1]]),
      snare: SNARE_24,
      kick: seq([[0, 2], [5, 1], [6, 2], [8, 2], [13, 1]]),
    },
  },
  halftime: {
    name: '하프타임 (잔잔한 부분용)',
    lanes: {
      hat: seq([[0, 2], [4, 1], [8, 2], [12, 1]]),
      snare: seq([[8, 2]]),
      kick: seq([[0, 2], [6, 1]]),
    },
  },
  punk: {
    name: '펑크 질주',
    lanes: {
      hat: seq([[0, 2], [2, 2], [4, 2], [6, 2], [8, 2], [10, 2], [12, 2], [14, 2]]),
      snare: SNARE_24,
      kick: seq([[0, 2], [2, 1], [4, 2], [6, 1], [8, 2], [10, 1], [12, 2], [14, 1]]),
    },
  },
  tomGroove: {
    name: '탐 그루브 (플로어탐 중심)',
    lanes: {
      floorTom: seq([[0, 2], [2, 1], [4, 2], [6, 1], [8, 2], [10, 1], [12, 2], [14, 1]]),
      snare: SNARE_24,
      kick: seq([[0, 2], [8, 2]]),
    },
  },
}

export const DRUM_STYLES = Object.entries(BASE).map(([id, s]) => ({ id, name: s.name }))

function emptyBar() {
  const bar = {}
  for (const lane of DRUM_LANE_ORDER) bar[lane] = Z()
  return bar
}

export function generateDrumBars(cfg, bars) {
  const style = BASE[cfg.style]
  const result = []
  for (let b = 0; b < bars; b++) {
    const bar = emptyBar()
    for (const [lane, steps] of Object.entries(style.lanes)) bar[lane] = [...steps]

    if (cfg.energy >= 0.7) {
      for (const lane of DRUM_LANE_ORDER) bar[lane] = bar[lane].map(v => (v === 1 ? 2 : v))
      if (style.hat16OnHighEnergy) {
        for (let s = 1; s < 16; s += 2) if (bar.hat[s] === 0) bar.hat[s] = 1
      }
    } else if (cfg.energy <= 0.3) {
      for (const lane of DRUM_LANE_ORDER) bar[lane] = bar[lane].map(v => (v === 2 ? 1 : v))
    }

    if (cfg.autoCrash && b === 0) bar.crash[0] = 2
    if (cfg.autoFill && b === bars - 1) {
      for (const lane of DRUM_LANE_ORDER) for (let s = 12; s < 16; s++) bar[lane][s] = 0
      bar.snare[12] = 2; bar.hiTom[13] = 2; bar.floorTom[14] = 2; bar.floorTom[15] = 2
    }
    result.push(bar)
  }
  for (const o of cfg.overrides ?? []) {
    if (result[o.bar]) result[o.bar][o.lane][o.step] = o.value
  }
  return result
}
