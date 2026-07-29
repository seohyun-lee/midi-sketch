import { QUALITIES } from './theory.js'

export const BASS_STYLES = [
  { id: 'root8', name: '루트 8비트 드라이브' },
  { id: 'octave', name: '옥타브 펌핑' },
  { id: 'followKick', name: '킥 따라가기' },
  { id: 'walking', name: '워킹' },
  { id: 'arp', name: '코드 아르페지오' },
]

export function bassRootMidi(chord) {
  const pc = chord.bass ?? chord.root
  return 28 + ((pc - 4 + 12) % 12)
}

const VEL = { 1: 70, 2: 100 }
// 마디 내 스텝 → [pitch오프셋 선택자, 세기] 를 스타일별로 정의
function stepsForStyle(style, chord, energy, kickSteps) {
  const root = bassRootMidi(chord)
  const iv = QUALITIES[chord.quality].iv
  const third = root + (iv[1] ?? 7)
  const fifth = root + (iv[2] ?? 7)
  switch (style) {
    case 'root8': {
      const every = energy >= 0.7 ? 1 : 2
      const out = []
      for (let s = 0; s < 16; s += every) out.push({ pitch: root, step: s, len: every, vel: s % 4 === 0 ? 2 : 1 })
      if (energy <= 0.3) return out.filter(n => n.step % 4 === 0).map(n => ({ ...n, len: 4 }))
      return out
    }
    case 'octave': {
      const out = []
      for (let s = 0; s < 16; s += 2) out.push({ pitch: s % 4 === 0 ? root : root + 12, step: s, len: 2, vel: s % 4 === 0 ? 2 : 1 })
      return out
    }
    case 'followKick':
      return (kickSteps ?? [0, 8]).map(s => ({ pitch: root, step: s, len: 2, vel: 2 }))
    case 'walking':
      return [root, third, fifth, third].map((pitch, i) => ({ pitch, step: i * 4, len: 4, vel: i === 0 ? 2 : 1 }))
    case 'arp': {
      const cycle = [root, fifth, root + 12, third]
      const out = []
      for (let s = 0; s < 16; s += 2) out.push({ pitch: cycle[(s / 2) % 4], step: s, len: 2, vel: s % 4 === 0 ? 2 : 1 })
      return out
    }
  }
}

export function generateBassBars(cfg, chords, bars, drumBars) {
  const notes = []
  for (let b = 0; b < bars; b++) {
    const kickSteps = drumBars?.[b]
      ? drumBars[b].kick.map((v, i) => (v > 0 ? i : -1)).filter(i => i >= 0)
      : null
    for (let half = 0; half < 2; half++) {
      const chord = chords[b * 2 + half]
      if (!chord) continue
      const barNotes = stepsForStyle(cfg.style, chord, cfg.energy, kickSteps)
        .filter(n => (half === 0 ? n.step < 8 : n.step >= 8))
      for (const n of barNotes) notes.push({ pitch: n.pitch, start: b * 16 + n.step, len: n.len, vel: VEL[n.vel] })
    }
    // 경과음: 이 마디의 마지막 코드와 다음 반마디 코드가 다르면 스텝 15를 교체
    if (cfg.autoTransition) {
      const cur = chords[b * 2 + 1] ?? chords[b * 2]
      const next = chords[(b + 1) * 2]
      if (cur && next && (next.root !== cur.root || next.quality !== cur.quality)) {
        const passStart = b * 16 + 15
        const idx = notes.findIndex(n => n.start === passStart)
        if (idx >= 0) notes.splice(idx, 1)
        notes.push({ pitch: bassRootMidi(next) - 1, start: passStart, len: 1, vel: 70 })
      }
    }
  }
  return notes.sort((a, b2) => a.start - b2.start)
}
