import { describe, it, expect } from 'vitest'
import { midiFreq } from '../src/lib/audio.js'

describe('audio', () => {
  it('A4=440Hz, 옥타브=2배', () => {
    expect(midiFreq(69)).toBeCloseTo(440)
    expect(midiFreq(81)).toBeCloseTo(880)
    expect(midiFreq(57)).toBeCloseTo(220)
  })
})
