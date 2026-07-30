import { describe, it, expect } from 'vitest'
import { MELODY_INSTRUMENTS, melodyInstrument, DEFAULT_MELODY_INSTRUMENT } from '../src/lib/instruments.js'
import { createSong } from '../src/lib/model.js'
import { buildMidi } from '../src/lib/midi.js'

describe('melody instruments', () => {
  it('피아노 포함 5종 이상, GM 번호는 0-127', () => {
    expect(MELODY_INSTRUMENTS.length).toBeGreaterThanOrEqual(5)
    expect(MELODY_INSTRUMENTS.map(i => i.id)).toContain('piano')
    for (const i of MELODY_INSTRUMENTS) {
      expect(i.gm, i.id).toBeGreaterThanOrEqual(0)
      expect(i.gm, i.id).toBeLessThanOrEqual(127)
      expect(i.name).toBeTruthy()
    }
  })
  it('id 중복 없음', () => {
    expect(new Set(MELODY_INSTRUMENTS.map(i => i.id)).size).toBe(MELODY_INSTRUMENTS.length)
  })
  it('새 곡 기본 음색은 피아노', () => {
    expect(createSong().melodyInstrument).toBe(DEFAULT_MELODY_INSTRUMENT)
    expect(melodyInstrument(createSong()).id).toBe('piano')
  })
  it('알 수 없는/없는 음색은 기본값으로', () => {
    expect(melodyInstrument({ melodyInstrument: 'theremin' }).id).toBe('piano')
    expect(melodyInstrument({}).id).toBe('piano')
  })
  it('MIDI 멜로디 트랙 프로그램이 선택한 음색을 따름', () => {
    const song = createSong()
    const sec = { id: 'x', name: 'A', color: '#000', bars: 1, chords: {}, guitar: [{ presetId: 'power8' }],
      bass: { mode: 'auto', style: 'root8', energy: 0.5, autoTransition: false, patterns: [], overrides: [] },
      drums: { style: 'rock8', energy: 0.5, autoFill: false, autoCrash: false, overrides: [] },
      melody: [{ pitch: 69, start: 0, len: 4 }] }
    song.sections = [sec]
    song.arrangement = [sec.id]

    song.melodyInstrument = 'flute'
    const flute = Array.from(buildMidi(song))
    // 0xC0 = 채널 0 프로그램 체인지, 플루트 GM 73
    expect(flute.some((b, i) => b === 0xc0 && flute[i + 1] === 73)).toBe(true)

    song.melodyInstrument = 'piano'
    const piano = Array.from(buildMidi(song))
    expect(piano.some((b, i) => b === 0xc0 && piano[i + 1] === 0)).toBe(true)
  })
})
