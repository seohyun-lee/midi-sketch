import { describe, it, expect } from 'vitest'
import { createSong, createSection, saveSong, loadSong, SECTION_COLORS } from '../src/lib/model.js'

function memStorage() {
  const m = new Map()
  return { getItem: k => m.get(k) ?? null, setItem: (k, v) => m.set(k, String(v)) }
}

describe('model', () => {
  it('기본 곡: A단조 140BPM, 빈 배치', () => {
    const song = createSong()
    expect(song.key).toEqual({ root: 9, mode: 'minor' })
    expect(song.bpm).toBe(140)
    expect(song.arrangement).toEqual([])
  })
  it('섹션 생성: 마디수만큼 기타 슬롯, 자동 드럼/베이스 기본값', () => {
    const s = createSection('사비', 8)
    expect(s.bars).toBe(8)
    expect(s.guitar).toHaveLength(8)
    expect(s.guitar[0]).toEqual({ presetId: 'power8' })
    expect(s.drums.style).toBe('rock8')
    expect(s.bass.mode).toBe('auto')
    expect(SECTION_COLORS).toContain(s.color)
    expect(s.id).toBeTruthy()
  })
  it('저장/불러오기 라운드트립', () => {
    const storage = memStorage()
    const song = createSong()
    const sec = createSection('A멜', 4)
    song.sections.push(sec)
    song.arrangement.push(sec.id)
    saveSong(song, storage)
    expect(loadSong(storage)).toEqual(song)
  })
  it('손상된 데이터는 null', () => {
    const storage = memStorage()
    storage.setItem('midi-sketch-song', '{broken')
    expect(loadSong(storage)).toBeNull()
  })
  it('key/bpm 없는 곡 데이터는 거부', () => {
    const storage = memStorage()
    const song = createSong()
    delete song.key
    storage.setItem('midi-sketch-song', JSON.stringify(song))
    expect(loadSong(storage)).toBeNull()

    const song2 = createSong()
    song2.bpm = 'fast'
    storage.setItem('midi-sketch-song', JSON.stringify(song2))
    expect(loadSong(storage)).toBeNull()
  })
})
