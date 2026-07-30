import { renderSong, PPQ } from './render.js'
import { melodyInstrument } from './instruments.js'

function vlq(n) {
  const bytes = [n & 0x7f]
  while ((n >>= 7) > 0) bytes.unshift((n & 0x7f) | 0x80)
  return bytes
}
const str = s => [...s].map(c => c.charCodeAt(0))
const u16 = n => [(n >> 8) & 0xff, n & 0xff]
const u32 = n => [(n >>> 24) & 0xff, (n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff]

function trackChunk(events) {
  // events: {tick, bytes[]} — 정렬 후 델타 인코딩, EOT 추가
  events.sort((a, b) => a.tick - b.tick)
  const data = []
  let last = 0
  for (const e of events) {
    data.push(...vlq(e.tick - last), ...e.bytes)
    last = e.tick
  }
  data.push(...vlq(0), 0xff, 0x2f, 0x00)
  return [...str('MTrk'), ...u32(data.length), ...data]
}

function noteTrack(name, notes, channel, program) {
  const ev = [{ tick: 0, bytes: [0xff, 0x03, name.length, ...str(name)] }]
  if (program != null) ev.push({ tick: 0, bytes: [0xc0 | channel, program] })
  for (const n of notes) {
    ev.push({ tick: n.tick, bytes: [0x90 | channel, n.midi, n.vel] })
    ev.push({ tick: n.tick + n.dur, bytes: [0x80 | channel, n.midi, 0] })
  }
  return trackChunk(ev)
}

export function buildMidi(song) {
  const { melody, guitar, bass, drums } = renderSong(song)
  const tempo = Math.round(60_000_000 / song.bpm)
  const meta = trackChunk([
    { tick: 0, bytes: [0xff, 0x58, 0x04, 4, 2, 24, 8] }, // 4/4
    { tick: 0, bytes: [0xff, 0x51, 0x03, (tempo >> 16) & 0xff, (tempo >> 8) & 0xff, tempo & 0xff] },
  ])
  const bytes = [
    ...str('MThd'), ...u32(6), ...u16(1), ...u16(5), ...u16(PPQ),
    ...meta,
    ...noteTrack('Melody', melody, 0, melodyInstrument(song).gm),
    ...noteTrack('Guitar', guitar, 1, 30),
    ...noteTrack('Bass', bass, 2, 34),
    ...noteTrack('Drums', drums, 9, null),
  ]
  return new Uint8Array(bytes)
}

export function downloadMidi(song) {
  const blob = new Blob([buildMidi(song)], { type: 'audio/midi' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `${song.title || 'sketch'}.mid`
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(a.href), 10_000)
}
