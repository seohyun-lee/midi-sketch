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
    noise(ctx, dest, { at, dur: 0.15, filterType: 'highpass', filterHz: 1500, gain: 0.5 * v })
    tone(ctx, dest, { freq: 180, at, dur: 0.1, type: 'triangle', gain: 0.3 * v })
  } else if (midi === DRUM_MIDI.hat) {
    noise(ctx, dest, { at, dur: 0.05, filterType: 'highpass', filterHz: 7000, gain: 0.25 * v })
  } else if (midi === DRUM_MIDI.crash) {
    noise(ctx, dest, { at, dur: 0.8, filterType: 'highpass', filterHz: 4000, gain: 0.3 * v })
  } else if (midi === DRUM_MIDI.hiTom || midi === DRUM_MIDI.floorTom) {
    const freq = midi === DRUM_MIDI.hiTom ? 180 : 110
    tone(ctx, dest, { freq, at, dur: 0.25, type: 'sine', gain: 0.5 * v })
  }
}

const TIMBRE = {
  melody: { type: 'square', gain: 0.12 },
  guitar: { type: 'sawtooth', gain: 0.08, filterHz: 2500 },
  bass: { type: 'triangle', gain: 0.25 },
}

export function createPlayer() {
  let ctx = null
  let endTimer = null

  function ensureCtx() {
    if (!ctx || ctx.state === 'closed') ctx = new (window.AudioContext || window.webkitAudioContext)()
    return ctx
  }

  return {
    play(song, onEnd) {
      this.stop()
      const c = ensureCtx()
      const secPerTick = 60 / (song.bpm * PPQ)
      const t0 = c.currentTime + 0.1
      const tracks = renderSong(song)
      let lastEnd = 0
      for (const [name, events] of Object.entries(tracks)) {
        for (const e of events) {
          const at = t0 + e.tick * secPerTick
          const dur = e.dur * secPerTick
          lastEnd = Math.max(lastEnd, e.tick * secPerTick + dur)
          if (name === 'drums') drumSound(c, c.destination, e.midi, at, e.vel)
          else tone(c, c.destination, { freq: midiFreq(e.midi), at, dur, ...TIMBRE[name], gain: TIMBRE[name].gain * (e.vel / 100) })
        }
      }
      endTimer = setTimeout(() => { this.stop(); onEnd?.() }, (lastEnd + 0.3) * 1000)
    },
    playChord(chord) {
      const c = ensureCtx()
      const at = c.currentTime + 0.05
      const rootMidi = 48 + ((chord.root) % 12)
      for (const pc of chordPcs(chord)) {
        const m = rootMidi + ((pc - chord.root + 12) % 12)
        tone(c, c.destination, { freq: midiFreq(m), at, dur: 1, type: 'triangle', gain: 0.15 })
      }
    },
    stop() {
      clearTimeout(endTimer)
      if (ctx && ctx.state !== 'closed') { ctx.close(); ctx = null }
    },
  }
}
