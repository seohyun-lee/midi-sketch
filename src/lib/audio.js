import { renderSong, PPQ } from './render.js'
import { DRUM_MIDI } from './drums.js'
import { chordPcs } from './theory.js'

export function midiFreq(midi) {
  return 440 * Math.pow(2, (midi - 69) / 12)
}

function tone(ctx, dest, { freq, at, dur, type, gain = 0.2, filterHz }) {
  const osc = ctx.createOscillator()
  osc.type = type
  osc.frequency.value = freq
  const g = ctx.createGain()
  g.gain.setValueAtTime(gain, at)
  g.gain.exponentialRampToValueAtTime(0.001, at + dur)
  let node = osc
  if (filterHz) {
    const f = ctx.createBiquadFilter()
    f.type = 'lowpass'
    f.frequency.value = filterHz
    osc.connect(f)
    node = f
  }
  node.connect(g).connect(dest)
  osc.start(at)
  osc.stop(at + dur + 0.05)
}

function noise(ctx, dest, { at, dur, filterType, filterHz, gain }) {
  const len = Math.max(1, Math.floor(ctx.sampleRate * dur))
  const buf = ctx.createBuffer(1, len, ctx.sampleRate)
  const data = buf.getChannelData(0)
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1
  const src = ctx.createBufferSource()
  src.buffer = buf
  const f = ctx.createBiquadFilter()
  f.type = filterType
  f.frequency.value = filterHz
  const g = ctx.createGain()
  g.gain.setValueAtTime(gain, at)
  g.gain.exponentialRampToValueAtTime(0.001, at + dur)
  src.connect(f).connect(g).connect(dest)
  src.start(at)
}

// Karplus-Strong 현 합성 — 노이즈 버스트를 딜레이 루프로 감쇠시켜 뜯는 현 소리를 만든다
function pluck(ctx, dest, { freq, at, dur, gain }) {
  const sr = ctx.sampleRate
  const total = Math.min(dur + 0.4, 2)
  const len = Math.ceil(sr * total)
  const buf = ctx.createBuffer(1, len, sr)
  const data = buf.getChannelData(0)
  const N = Math.max(2, Math.round(sr / freq))
  const ring = new Float32Array(N)
  for (let i = 0; i < N; i++) ring[i] = Math.random() * 2 - 1
  for (let i = 1; i < N; i++) ring[i] = (ring[i] + ring[i - 1]) * 0.5 // 어택을 부드럽게
  let idx = 0
  for (let i = 0; i < len; i++) {
    const cur = ring[idx]
    data[i] = cur
    ring[idx] = (cur + ring[(idx + 1) % N]) * 0.5 * 0.996
    idx = (idx + 1) % N
  }
  const src = ctx.createBufferSource()
  src.buffer = buf
  const g = ctx.createGain()
  g.gain.setValueAtTime(gain, at)
  g.gain.setValueAtTime(gain, at + Math.max(0, dur - 0.05))
  g.gain.exponentialRampToValueAtTime(0.001, at + total)
  src.connect(g).connect(dest)
  src.start(at)
}

// 탐: 피치가 급강하하는 사인파 + 짧은 스틱 어택 노이즈
function tomSound(ctx, dest, freq, at, v) {
  const osc = ctx.createOscillator()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(freq * 1.7, at)
  osc.frequency.exponentialRampToValueAtTime(freq, at + 0.09)
  const g = ctx.createGain()
  g.gain.setValueAtTime(0.6 * v, at)
  g.gain.exponentialRampToValueAtTime(0.001, at + 0.35)
  osc.connect(g).connect(dest)
  osc.start(at); osc.stop(at + 0.4)
  noise(ctx, dest, { at, dur: 0.03, filterType: 'lowpass', filterHz: 3500, gain: 0.2 * v })
}

function drumSound(ctx, dest, midi, at, vel) {
  const v = vel / 127
  if (midi === DRUM_MIDI.kick) {
    const osc = ctx.createOscillator()
    osc.frequency.setValueAtTime(120, at)
    osc.frequency.exponentialRampToValueAtTime(45, at + 0.12)
    const g = ctx.createGain()
    g.gain.setValueAtTime(0.8 * v, at)
    g.gain.exponentialRampToValueAtTime(0.001, at + 0.15)
    osc.connect(g).connect(dest)
    osc.start(at); osc.stop(at + 0.2)
  } else if (midi === DRUM_MIDI.snare) {
    noise(ctx, dest, { at, dur: 0.18, filterType: 'highpass', filterHz: 1200, gain: 0.45 * v })
    noise(ctx, dest, { at, dur: 0.07, filterType: 'highpass', filterHz: 4000, gain: 0.3 * v })
    const osc = ctx.createOscillator()
    osc.type = 'triangle'
    osc.frequency.setValueAtTime(220, at)
    osc.frequency.exponentialRampToValueAtTime(150, at + 0.08)
    const g = ctx.createGain()
    g.gain.setValueAtTime(0.3 * v, at)
    g.gain.exponentialRampToValueAtTime(0.001, at + 0.1)
    osc.connect(g).connect(dest)
    osc.start(at); osc.stop(at + 0.12)
  } else if (midi === DRUM_MIDI.hat) {
    noise(ctx, dest, { at, dur: 0.05, filterType: 'highpass', filterHz: 7000, gain: 0.25 * v })
  } else if (midi === DRUM_MIDI.crash) {
    noise(ctx, dest, { at, dur: 1.2, filterType: 'highpass', filterHz: 5500, gain: 0.2 * v })
  } else if (midi === DRUM_MIDI.hiTom) {
    tomSound(ctx, dest, 170, at, v)
  } else if (midi === DRUM_MIDI.floorTom) {
    tomSound(ctx, dest, 100, at, v)
  }
}

const TIMBRE = {
  melody: { type: 'square', gain: 0.12 },
  bass: { type: 'triangle', gain: 0.25 },
}

const DRUM_TAIL = { 36: 0.2, 38: 0.18, 42: 0.05, 49: 1.2, 48: 0.4, 41: 0.4 }

export function createPlayer() {
  let ctx = null
  let endTimer = null

  function ensureCtx() {
    if (!ctx || ctx.state === 'closed') ctx = new (window.AudioContext || window.webkitAudioContext)()
    if (ctx.state === 'suspended') ctx.resume()
    return ctx
  }

  function stop() {
    clearTimeout(endTimer)
    if (ctx && ctx.state !== 'closed') { ctx.close(); ctx = null }
  }

  function play(song, onEnd) {
    stop()
    const c = ensureCtx()
    const secPerTick = 60 / (song.bpm * PPQ)
    const t0 = c.currentTime + 0.1
    const tracks = renderSong(song)
    let lastEnd = 0
    for (const [name, events] of Object.entries(tracks)) {
      for (const e of events) {
        const at = t0 + e.tick * secPerTick
        if (name === 'drums') {
          drumSound(c, c.destination, e.midi, at, e.vel)
          lastEnd = Math.max(lastEnd, e.tick * secPerTick + (DRUM_TAIL[e.midi] ?? 0.3))
        } else if (name === 'guitar') {
          const dur = e.dur * secPerTick
          lastEnd = Math.max(lastEnd, e.tick * secPerTick + Math.min(dur + 0.4, 2))
          pluck(c, c.destination, { freq: midiFreq(e.midi), at, dur, gain: 0.3 * (e.vel / 100) })
        } else {
          const dur = e.dur * secPerTick
          lastEnd = Math.max(lastEnd, e.tick * secPerTick + dur)
          tone(c, c.destination, { freq: midiFreq(e.midi), at, dur, ...TIMBRE[name], gain: TIMBRE[name].gain * (e.vel / 100) })
        }
      }
    }
    endTimer = setTimeout(() => { stop(); onEnd?.() }, (lastEnd + 0.3) * 1000)
  }

  function playChord(chord) {
    const c = ensureCtx()
    const at = c.currentTime + 0.05
    const rootMidi = 48 + (chord.root % 12)
    for (const pc of chordPcs(chord)) {
      const m = rootMidi + ((pc - chord.root + 12) % 12)
      tone(c, c.destination, { freq: midiFreq(m), at, dur: 1, type: 'triangle', gain: 0.15 })
    }
  }

  return { play, stop, playChord }
}
