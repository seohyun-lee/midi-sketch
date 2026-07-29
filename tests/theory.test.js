import { describe, it, expect } from 'vitest'
import {
  NOTE_NAMES, scalePcs, chordPcs, chordLabel, diatonicChords,
  inKey, classify, ROCK_PROGRESSIONS, progressionChords,
} from '../src/lib/theory.js'

const Am = { root: 9, quality: 'min' }        // A단조 키의 i
const keyAm = { root: 9, mode: 'minor' }
const keyC = { root: 0, mode: 'major' }

describe('theory', () => {
  it('스케일 피치클래스', () => {
    expect(scalePcs(keyC)).toEqual([0, 2, 4, 5, 7, 9, 11])
    expect(scalePcs(keyAm)).toEqual([9, 11, 0, 2, 4, 5, 7])
  })
  it('코드 구성음', () => {
    expect(chordPcs(Am)).toEqual([9, 0, 4])                       // A C E
    expect(chordPcs({ root: 4, quality: '7' })).toEqual([4, 8, 11, 2]) // E7
    expect(chordPcs({ root: 0, quality: '5' })).toEqual([0, 7])   // C5 파워
  })
  it('코드 이름', () => {
    expect(chordLabel(Am)).toBe('Am')
    expect(chordLabel({ root: 7, quality: 'maj', bass: 11 })).toBe('G/B')
    expect(chordLabel({ root: 4, quality: '7' })).toBe('E7')
  })
  it('다이어토닉 코드 (단조는 i ii° III iv v VI VII)', () => {
    const d = diatonicChords(keyAm)
    expect(d[0]).toEqual({ root: 9, quality: 'min', roman: 'i' })
    expect(d[5]).toEqual({ root: 5, quality: 'maj', roman: 'VI' })
  })
  it('키와 어울림 판정', () => {
    expect(inKey(Am, keyAm)).toBe(true)
    expect(inKey({ root: 1, quality: 'maj' }, keyAm)).toBe(false) // C#maj
  })
  it('음 분류: 코드톤/스케일/밖', () => {
    expect(classify(69, Am, keyAm)).toBe('chord')  // A4
    expect(classify(71, Am, keyAm)).toBe('scale')  // B4
    expect(classify(70, Am, keyAm)).toBe('out')    // A#4
    expect(classify(70, null, keyAm)).toBe('out')  // 코드 없어도 동작
  })
  it('록 상용 진행 → 코드 배열', () => {
    const prog = ROCK_PROGRESSIONS.find(p => p.id === 'm1') // i–VI–III–VII
    const chords = progressionChords(keyAm, prog)
    expect(chords.map(chordLabel)).toEqual(['Am', 'F', 'C', 'G'])
  })
})
