export const NOTE_NAMES = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B']

export const QUALITIES = {
  maj:  { name: '메이저',  iv: [0, 4, 7] },
  min:  { name: '마이너',  iv: [0, 3, 7] },
  '7':  { name: '7',       iv: [0, 4, 7, 10] },
  m7:   { name: 'm7',      iv: [0, 3, 7, 10] },
  maj7: { name: 'maj7',    iv: [0, 4, 7, 11] },
  sus4: { name: 'sus4',    iv: [0, 5, 7] },
  add9: { name: 'add9',    iv: [0, 4, 7, 14] },
  '5':  { name: '파워(5)', iv: [0, 7] },
  dim:  { name: 'dim',     iv: [0, 3, 6] },
}

const MODE_IV = { major: [0, 2, 4, 5, 7, 9, 11], minor: [0, 2, 3, 5, 7, 8, 10] }

export function scalePcs(key) {
  return MODE_IV[key.mode].map(i => (key.root + i) % 12)
}

export function chordPcs(chord) {
  return QUALITIES[chord.quality].iv.map(i => (chord.root + i) % 12)
}

const LABEL_SUFFIX = { maj: '', min: 'm', '5': '5' }

export function chordLabel(chord) {
  const suffix = LABEL_SUFFIX[chord.quality] ?? chord.quality
  let label = NOTE_NAMES[chord.root] + suffix
  if (chord.bass != null && chord.bass !== chord.root) label += '/' + NOTE_NAMES[chord.bass]
  return label
}

const DEGREES = {
  major: [['I', 'maj'], ['ii', 'min'], ['iii', 'min'], ['IV', 'maj'], ['V', 'maj'], ['vi', 'min'], ['vii°', 'dim']],
  minor: [['i', 'min'], ['ii°', 'dim'], ['III', 'maj'], ['iv', 'min'], ['v', 'min'], ['VI', 'maj'], ['VII', 'maj']],
}

export function diatonicChords(key) {
  const scale = scalePcs(key)
  return DEGREES[key.mode].map(([roman, quality], i) => ({ root: scale[i], quality, roman }))
}

export function inKey(chord, key) {
  const scale = new Set(scalePcs(key))
  return chordPcs(chord).every(pc => scale.has(pc))
}

export function classify(midi, chord, key) {
  const pc = midi % 12
  if (chord && chordPcs(chord).includes(pc)) return 'chord'
  if (scalePcs(key).includes(pc)) return 'scale'
  return 'out'
}

export const ROCK_PROGRESSIONS = [
  { id: 'm1', name: 'i–VI–III–VII (록 발라드/J-Rock)', mode: 'minor', degrees: [0, 5, 2, 6] },
  { id: 'm2', name: 'i–VII–VI–VII (질주감)',           mode: 'minor', degrees: [0, 6, 5, 6] },
  { id: 'M1', name: 'I–V–vi–IV (팝 록)',               mode: 'major', degrees: [0, 4, 5, 3] },
  { id: 'M2', name: 'vi–IV–I–V (감성 록)',             mode: 'major', degrees: [5, 3, 0, 4] },
]

export function progressionChords(key, prog) {
  const d = diatonicChords(key)
  return prog.degrees.map(i => ({ root: d[i].root, quality: d[i].quality }))
}
