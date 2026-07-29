import { describe, it, expect } from 'vitest'
import { BASS_STYLES, bassRootMidi, generateBassBars } from '../src/lib/bass.js'
import { generateDrumBars } from '../src/lib/drums.js'

const Am = { root: 9, quality: 'min' }
const F = { root: 5, quality: 'maj' }
const cfg = { mode: 'auto', style: 'root8', energy: 0.5, autoTransition: false, overrides: [] }

describe('bass', () => {
  it('스타일 5종', () => {
    expect(BASS_STYLES.map(s => s.id)).toEqual(['root8', 'octave', 'followKick', 'walking', 'arp'])
  })
  it('루트 MIDI: E1~D#2 범위, 분수코드 베이스 우선', () => {
    expect(bassRootMidi(Am)).toBe(33) // A1
    expect(bassRootMidi({ root: 7, quality: 'maj', bass: 11 })).toBe(35) // B1
  })
  it('root8: 8분음표, 박은 세게', () => {
    const notes = generateBassBars(cfg, [Am, Am], 1, null)
    expect(notes).toHaveLength(8)
    expect(notes[0]).toEqual({ pitch: 33, start: 0, len: 2, vel: 100 })
    expect(notes[1].vel).toBe(70)
  })
  it('코드 없는 반마디는 무음', () => {
    const notes = generateBassBars(cfg, [null, Am], 1, null)
    expect(notes.every(n => n.start >= 8)).toBe(true)
  })
  it('octave: 루트/옥타브 교대', () => {
    const notes = generateBassBars({ ...cfg, style: 'octave' }, [Am, Am], 1, null)
    expect(notes[0].pitch).toBe(33)
    expect(notes[1].pitch).toBe(45)
  })
  it('followKick: 킥 위치에만 노트', () => {
    const drums = generateDrumBars({ style: 'rock8', energy: 0.5, autoFill: false, autoCrash: false, overrides: [] }, 1)
    const notes = generateBassBars({ ...cfg, style: 'followKick' }, [Am, Am], 1, drums)
    const kickSteps = drums[0].kick.map((v, i) => (v > 0 ? i : -1)).filter(i => i >= 0)
    expect(notes.map(n => n.start)).toEqual(kickSteps)
  })
  it('autoTransition: 코드 바뀌기 전 스텝15에 경과음', () => {
    const notes = generateBassBars({ ...cfg, autoTransition: true }, [Am, Am, F, F], 2, null)
    const passing = notes.find(n => n.start === 15)
    expect(passing.pitch).toBe(bassRootMidi(F) - 1)
  })
})
