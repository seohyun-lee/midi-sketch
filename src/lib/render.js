import { GUITAR_PRESETS, notesForGuitarBar } from './patterns.js'
import { generateDrumBars, DRUM_MIDI } from './drums.js'
import { generateBassBars } from './bass.js'

export const PPQ = 480
export const STEP = 120 // 16분음표

export function resolveSectionChords(section, carryIn) {
  const out = []
  let cur = carryIn ?? null
  for (let i = 0; i < section.bars * 2; i++) {
    if (section.chords[i]) cur = section.chords[i]
    out.push(cur)
  }
  return out
}

function guitarSteps(slot, song) {
  if (slot.presetId) return GUITAR_PRESETS.find(p => p.id === slot.presetId)
  const custom = song.customPatterns.find(p => p.id === slot.customId)
  return custom ? { steps: custom.steps, arp: false } : null
}

const VEL_STEP = { 1: 70, 2: 100 }

export function renderSong(song) {
  const out = { melody: [], guitar: [], bass: [], drums: [] }
  let tickOffset = 0
  let carry = null

  for (const sectionId of song.arrangement) {
    const section = song.sections.find(s => s.id === sectionId)
    if (!section) continue
    const chords = resolveSectionChords(section, carry)

    // 멜로디
    for (const n of section.melody) {
      out.melody.push({ midi: n.pitch, tick: tickOffset + n.start * STEP, dur: n.len * STEP, vel: 90 })
    }

    // 드럼
    const drumBars = generateDrumBars(section.drums, section.bars)
    drumBars.forEach((bar, b) => {
      for (const [lane, steps] of Object.entries(bar)) {
        steps.forEach((v, s) => {
          if (v > 0) out.drums.push({
            midi: DRUM_MIDI[lane],
            tick: tickOffset + (b * 16 + s) * STEP,
            dur: STEP,
            vel: VEL_STEP[v],
          })
        })
      }
    })

    // 기타: 마디별 슬롯, 반마디 코드가 다르면 반씩 렌더
    for (let b = 0; b < section.bars; b++) {
      const preset = guitarSteps(section.guitar[b] ?? { presetId: 'power8' }, song)
      if (!preset) continue
      for (let half = 0; half < 2; half++) {
        const chord = chords[b * 2 + half]
        if (!chord) continue
        const notes = notesForGuitarBar(preset.steps, chord, preset.arp ?? false)
          .filter(n => (half === 0 ? n.step < 8 : n.step >= 8))
        for (const n of notes) out.guitar.push({
          midi: n.pitch, tick: tickOffset + (b * 16 + n.step) * STEP, dur: n.len * STEP, vel: n.vel,
        })
      }
    }

    // 베이스
    for (const n of generateBassBars(section.bass, chords, section.bars, drumBars)) {
      out.bass.push({ midi: n.pitch, tick: tickOffset + n.start * STEP, dur: n.len * STEP, vel: n.vel })
    }

    carry = chords[chords.length - 1] ?? carry
    tickOffset += section.bars * 16 * STEP
  }
  for (const track of Object.values(out)) track.sort((a, b) => a.tick - b.tick)
  return out
}
