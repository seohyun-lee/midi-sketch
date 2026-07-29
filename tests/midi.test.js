import { describe, it, expect } from 'vitest'
import { buildMidi } from '../src/lib/midi.js'
import { createSong, createSection } from '../src/lib/model.js'

function makeSong() {
  const song = createSong()
  const sec = createSection('A멜', 1)
  sec.chords = { 0: { root: 9, quality: 'min' } }
  sec.melody = [{ pitch: 69, start: 0, len: 4 }]
  song.sections.push(sec)
  song.arrangement = [sec.id]
  return song
}

const str = (bytes, from, len) => String.fromCharCode(...bytes.slice(from, from + len))

describe('midi', () => {
  it('헤더: MThd, format 1, 5트랙, PPQ 480', () => {
    const b = buildMidi(makeSong())
    expect(str(b, 0, 4)).toBe('MThd')
    expect((b[8] << 8) | b[9]).toBe(1)     // format
    expect((b[10] << 8) | b[11]).toBe(5)   // ntrks
    expect((b[12] << 8) | b[13]).toBe(480) // division
  })
  it('트랙 청크 5개, 각 트랙은 End of Track으로 끝남', () => {
    const b = buildMidi(makeSong())
    let pos = 14, count = 0
    while (pos < b.length) {
      expect(str(b, pos, 4)).toBe('MTrk')
      const len = (b[pos + 4] << 24) | (b[pos + 5] << 16) | (b[pos + 6] << 8) | b[pos + 7]
      const end = pos + 8 + len
      expect([b[end - 3], b[end - 2], b[end - 1]]).toEqual([0xff, 0x2f, 0x00])
      pos = end
      count++
    }
    expect(count).toBe(5)
  })
  it('템포 메타: 140BPM → 428571µs', () => {
    const b = buildMidi(makeSong())
    const hex = Array.from(b).map(x => x.toString(16).padStart(2, '0')).join(' ')
    // ff 51 03 06 8a 1b = set tempo 428571
    expect(hex).toContain('ff 51 03 06 8a 1b')
  })
  it('드럼 노트는 채널 10(0x99)', () => {
    const b = buildMidi(makeSong())
    expect(Array.from(b)).toContain(0x99)
  })
})
