import { describe, it, expect } from 'vitest'
import { DRUM_MIDI, DRUM_STYLES, generateDrumBars } from '../src/lib/drums.js'

const base = { style: 'rock8', energy: 0.5, autoFill: true, autoCrash: true, overrides: [] }

describe('drums', () => {
  it('GM 드럼맵', () => {
    expect(DRUM_MIDI).toEqual({ kick: 36, snare: 38, hat: 42, hiTom: 48, floorTom: 41, crash: 49 })
  })
  it('스타일 5종', () => {
    expect(DRUM_STYLES.map(s => s.id)).toEqual(['rock8', 'rock16', 'halftime', 'punk', 'tomGroove'])
  })
  it('rock8: 스네어 2·4박, 마디 수만큼 생성', () => {
    const bars = generateDrumBars({ ...base, autoFill: false, autoCrash: false }, 2)
    expect(bars).toHaveLength(2)
    expect(bars[0].snare[4]).toBe(2)
    expect(bars[0].snare[12]).toBe(2)
    expect(bars[0].kick[0]).toBe(2)
  })
  it('autoCrash: 첫 마디 스텝0에 크래시', () => {
    const bars = generateDrumBars(base, 2)
    expect(bars[0].crash[0]).toBe(2)
    expect(bars[1].crash[0]).toBe(0)
  })
  it('autoFill: 마지막 마디 끝 4스텝이 탐 필인', () => {
    const bars = generateDrumBars(base, 2)
    const last = bars[1]
    expect(last.snare[12]).toBe(2)
    expect(last.hiTom[13]).toBe(2)
    expect(last.floorTom[14]).toBe(2)
    expect(last.floorTom[15]).toBe(2)
    expect(last.hat[13]).toBe(0) // 필인 구간 하이햇 제거
  })
  it('energy 낮으면 세게→약하게', () => {
    const bars = generateDrumBars({ ...base, energy: 0.2, autoFill: false, autoCrash: false }, 1)
    expect(bars[0].snare[4]).toBe(1)
  })
  it('energy 높으면 rock8 하이햇이 16분으로 (추가된 음은 약하게 유지)', () => {
    const bars = generateDrumBars({ ...base, energy: 0.9, autoFill: false, autoCrash: false }, 1)
    expect(bars[0].hat[1]).toBe(1)  // 새로 추가된 16분음은 약하게
    expect(bars[0].hat[0]).toBe(2)  // 기존 강세는 세게
    expect(bars[0].hat[2]).toBe(2)  // 기존 약박(1)은 세게로 승격
  })
  it('overrides가 최종 적용', () => {
    const bars = generateDrumBars({ ...base, overrides: [{ bar: 0, lane: 'kick', step: 2, value: 2 }] }, 1)
    expect(bars[0].kick[2]).toBe(2)
  })
})
