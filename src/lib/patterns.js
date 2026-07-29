import { QUALITIES } from './theory.js'

export const GUITAR_PRESETS = [
  { id: 'power8', name: '파워코드 8비트',
    steps: [2, 0, 1, 0, 2, 0, 1, 0, 2, 0, 1, 0, 2, 0, 1, 0] },
  { id: 'mute16', name: '뮤트 스타카토',
    steps: [2, 1, 1, 1, 2, 1, 1, 1, 2, 1, 1, 1, 2, 1, 1, 1] },
  { id: 'strum', name: '스트로크',
    steps: [2, 0, 0, 1, 0, 0, 1, 0, 2, 0, 0, 1, 0, 1, 0, 1] },
  { id: 'arp8', name: '아르페지오', arp: true,
    steps: [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0] },
]

// 루트를 E2(40)~D♯3(51)에 배치하고 코드 인터벌을 그대로 쌓는다
export function guitarVoicing(chord) {
  const rootMidi = 40 + ((chord.root - 4 + 12) % 12)
  const iv = chord.quality === '5' ? [0, 7, 12] : QUALITIES[chord.quality].iv
  return iv.map(i => rootMidi + i)
}

const VEL = { 1: 70, 2: 100 }

export function notesForGuitarBar(steps, chord, arp = false) {
  const voicing = guitarVoicing(chord)
  const onsets = []
  for (let s = 0; s < 16; s++) if (steps[s] > 0) onsets.push(s)
  const notes = []
  onsets.forEach((step, i) => {
    const next = onsets[i + 1] ?? 16
    const len = next - step
    const vel = VEL[steps[step]]
    if (arp) {
      notes.push({ pitch: voicing[i % voicing.length], step, len, vel })
    } else {
      for (const pitch of voicing) notes.push({ pitch, step, len, vel })
    }
  })
  return notes
}
