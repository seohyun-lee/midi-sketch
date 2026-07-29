import { createSong, createSection } from './model.js'

// A단조 i–VI–III–VII (Am–F–C–G) 기반 J-Rock 예시 곡
const Am = { root: 9, quality: 'min' }
const F = { root: 5, quality: 'maj' }
const C = { root: 0, quality: 'maj' }
const G = { root: 7, quality: 'maj' }

function applyProg(section) {
  const seq = [Am, F, C, G]
  for (let b = 0; b < section.bars; b++) section.chords[b * 2] = { ...seq[b % 4] }
}

const notes = arr => arr.map(([pitch, start, len]) => ({ pitch, start, len }))

export function createDemoSong() {
  const song = createSong()
  song.title = '예시 곡 — 별빛 질주'
  song.bpm = 165

  const intro = createSection('인트로', 4)
  applyProg(intro)
  intro.guitar = [
    { presetId: 'arp8' }, { presetId: 'arp8' },
    { presetId: 'power8' }, { presetId: 'power8' },
  ]
  intro.drums.energy = 0.4

  const verse = createSection('A멜', 8)
  applyProg(verse)
  verse.guitar = Array.from({ length: 8 }, () => ({ presetId: 'mute16' }))
  verse.drums.style = 'halftime'
  verse.drums.energy = 0.4
  // 잔잔하게 오르내리는 벌스 멜로디
  verse.melody = notes([
    [69, 0, 4], [72, 4, 4], [76, 8, 8],
    [76, 16, 2], [74, 18, 2], [72, 20, 4], [69, 24, 8],
    [67, 32, 4], [72, 36, 4], [76, 40, 4], [74, 44, 4],
    [71, 48, 4], [74, 52, 4], [67, 56, 8],
    [69, 64, 4], [72, 68, 4], [76, 72, 4], [79, 76, 4],
    [81, 80, 4], [79, 84, 2], [77, 86, 2], [76, 88, 8],
    [76, 96, 4], [74, 100, 4], [72, 104, 8],
    [74, 112, 4], [71, 116, 4], [67, 120, 8],
  ])

  const chorus = createSection('사비', 8)
  applyProg(chorus)
  chorus.drums.energy = 0.9
  chorus.bass.style = 'octave'
  // 높은 음역에서 내달리는 사비 멜로디
  chorus.melody = notes([
    [76, 0, 6], [74, 6, 2], [76, 8, 4], [81, 12, 4],
    [81, 16, 4], [79, 20, 4], [77, 24, 8],
    [79, 32, 6], [76, 38, 2], [72, 40, 8],
    [74, 48, 4], [76, 52, 4], [79, 56, 8],
    [81, 64, 6], [79, 70, 2], [76, 72, 8],
    [77, 80, 4], [76, 84, 4], [74, 88, 4], [72, 92, 4],
    [76, 96, 8], [74, 104, 4], [72, 108, 4],
    [71, 112, 4], [74, 116, 4], [79, 120, 8],
  ])

  song.sections = [intro, verse, chorus]
  song.arrangement = [intro.id, verse.id, chorus.id, chorus.id]
  return song
}
