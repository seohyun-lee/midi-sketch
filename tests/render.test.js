import { describe, it, expect } from 'vitest'
import { resolveSectionChords, renderSong, PPQ, STEP } from '../src/lib/render.js'
import { createSong, createSection } from '../src/lib/model.js'

const Am = { root: 9, quality: 'min' }
const F = { root: 5, quality: 'maj' }

function makeSong() {
  const song = createSong()
  const sec = createSection('A멜', 2)
  sec.chords = { 0: Am, 2: F }  // 마디1: Am, 마디2: F
  sec.melody = [{ pitch: 69, start: 0, len: 4 }]
  song.sections.push(sec)
  song.arrangement = [sec.id, sec.id]
  return { song, sec }
}

describe('render', () => {
  it('틱 상수', () => {
    expect(PPQ).toBe(480)
    expect(STEP).toBe(120)
  })
  it('코드 캐리: 빈 반마디는 직전 코드 유지', () => {
    const { sec } = makeSong()
    expect(resolveSectionChords(sec, null)).toEqual([Am, Am, F, F])
    expect(resolveSectionChords(createSection('빈', 1), Am)).toEqual([Am, Am])
  })
  it('renderSong: 4트랙, 섹션 반복 시 틱 오프셋 적용', () => {
    const { song } = makeSong()
    const out = renderSong(song)
    expect(Object.keys(out)).toEqual(['melody', 'guitar', 'bass', 'drums'])
    const melodyTicks = out.melody.map(e => e.tick)
    expect(melodyTicks).toEqual([0, 2 * 16 * STEP]) // 두 번째 배치는 2마디 뒤
    expect(out.melody[0].dur).toBe(4 * STEP)
    expect(out.guitar.length).toBeGreaterThan(0)
    expect(out.bass.length).toBeGreaterThan(0)
    expect(out.drums.length).toBeGreaterThan(0)
  })
  it('코드가 전혀 없으면 기타/베이스는 무음, 드럼은 나옴', () => {
    const song = createSong()
    const sec = createSection('빈', 1)
    song.sections.push(sec)
    song.arrangement = [sec.id]
    const out = renderSong(song)
    expect(out.guitar).toEqual([])
    expect(out.bass).toEqual([])
    expect(out.drums.length).toBeGreaterThan(0)
  })
})
