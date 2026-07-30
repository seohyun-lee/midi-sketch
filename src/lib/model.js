import { DEFAULT_MELODY_INSTRUMENT } from './instruments.js'

export const SECTION_COLORS = ['#5b4a8a', '#3d6b5c', '#6b5c3d', '#8a4a5b', '#3d5c6b', '#6b3d5c']
const STORAGE_KEY = 'midi-sketch-song'
let colorIndex = 0

export function createSection(name, bars = 4) {
  return {
    id: crypto.randomUUID(),
    name,
    color: SECTION_COLORS[colorIndex++ % SECTION_COLORS.length],
    bars,
    chords: {},
    guitar: Array.from({ length: bars }, () => ({ presetId: 'power8' })),
    bass: { mode: 'auto', style: 'root8', energy: 0.5, autoTransition: true, patterns: [], overrides: [] },
    drums: { style: 'rock8', energy: 0.5, autoFill: true, autoCrash: true, overrides: [] },
    melody: [],
  }
}

export function createSong() {
  return {
    title: '새 곡',
    key: { root: 9, mode: 'minor' },
    bpm: 140,
    melodyInstrument: DEFAULT_MELODY_INSTRUMENT,
    sections: [],
    arrangement: [],
    customPatterns: [],
  }
}

export function saveSong(song, storage = globalThis.localStorage) {
  storage.setItem(STORAGE_KEY, JSON.stringify(song))
}

export function isValidSong(data) {
  return !!data
    && Array.isArray(data.sections)
    && Array.isArray(data.arrangement)
    && typeof data.bpm === 'number' && Number.isFinite(data.bpm)
    && !!data.key && typeof data.key.root === 'number'
    && (data.key.mode === 'major' || data.key.mode === 'minor')
}

export function loadSong(storage = globalThis.localStorage) {
  try {
    const raw = storage.getItem(STORAGE_KEY)
    if (!raw) return null
    const song = JSON.parse(raw)
    if (!isValidSong(song)) return null
    return song
  } catch {
    return null
  }
}
