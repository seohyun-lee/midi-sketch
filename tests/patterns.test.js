import { describe, it, expect } from 'vitest'
import { GUITAR_PRESETS, guitarVoicing, notesForGuitarBar } from '../src/lib/patterns.js'

const A5 = { root: 9, quality: '5' }
const Am = { root: 9, quality: 'min' }

describe('patterns', () => {
  it('프리셋 4종, 스텝은 16칸', () => {
    expect(GUITAR_PRESETS.length).toBeGreaterThanOrEqual(4)
    for (const p of GUITAR_PRESETS) expect(p.steps).toHaveLength(16)
  })
  it('파워코드 보이싱: 루트+5도+옥타브', () => {
    expect(guitarVoicing(A5)).toEqual([45, 52, 57]) // A2 E3 A3
  })
  it('일반 코드 보이싱: 인터벌 스택', () => {
    expect(guitarVoicing(Am)).toEqual([45, 48, 52]) // A2 C3 E3
  })
  it('스트럼: 타격마다 보이싱 전체, 길이는 다음 타격까지', () => {
    const steps = [2, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    const notes = notesForGuitarBar(steps, A5)
    expect(notes.filter(n => n.step === 0)).toHaveLength(3)
    expect(notes.find(n => n.step === 0).len).toBe(4)
    expect(notes.find(n => n.step === 0).vel).toBe(100)
    expect(notes.find(n => n.step === 4).vel).toBe(70)
    expect(notes.find(n => n.step === 4).len).toBe(12) // 마디 끝까지
  })
  it('아르페지오: 타격마다 보이싱 음 하나씩 순환', () => {
    const steps = [1, 0, 1, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    const notes = notesForGuitarBar(steps, Am, true)
    expect(notes).toHaveLength(4)
    expect(notes.map(n => n.pitch)).toEqual([45, 48, 52, 45])
  })
})
