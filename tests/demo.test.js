import { describe, it, expect } from 'vitest'
import { createDemoSong } from '../src/lib/demo.js'
import { isValidSong } from '../src/lib/model.js'
import { renderSong } from '../src/lib/render.js'
import { classify } from '../src/lib/theory.js'
import { resolveSectionChords } from '../src/lib/render.js'

describe('demo song', () => {
  it('유효한 곡 데이터', () => {
    const song = createDemoSong()
    expect(isValidSong(song)).toBe(true)
    expect(song.sections).toHaveLength(3)
    expect(song.arrangement).toHaveLength(4)
  })
  it('4트랙 모두 렌더됨', () => {
    const out = renderSong(createDemoSong())
    for (const track of ['melody', 'guitar', 'bass', 'drums']) {
      expect(out[track].length, track).toBeGreaterThan(0)
    }
  })
  it('멜로디는 그리드 범위(C4~B5)와 섹션 길이 안', () => {
    const song = createDemoSong()
    for (const sec of song.sections) {
      for (const n of sec.melody) {
        expect(n.pitch).toBeGreaterThanOrEqual(60)
        expect(n.pitch).toBeLessThanOrEqual(83)
        expect(n.start + n.len).toBeLessThanOrEqual(sec.bars * 16)
      }
    }
  })
  it('멜로디에 불협(스케일 밖) 음 없음', () => {
    const song = createDemoSong()
    for (const sec of song.sections) {
      const chords = resolveSectionChords(sec, null)
      for (const n of sec.melody) {
        expect(classify(n.pitch, chords[Math.floor(n.start / 8)], song.key), `pitch ${n.pitch} @ ${n.start}`).not.toBe('out')
      }
    }
  })
})
