<script>
  import { song } from '../lib/store.js'
  import { NOTE_NAMES, classify } from '../lib/theory.js'
  import { resolveSectionChords } from '../lib/render.js'

  export let section
  const PITCHES = Array.from({ length: 24 }, (_, i) => 83 - i) // B5 → C4
  let dragging = null // {pitch, start}

  $: chords = resolveSectionChords(section, null)
  $: totalSteps = section.bars * 16

  const pitchName = m => NOTE_NAMES[m % 12].replace('♯', '#') + (Math.floor(m / 12) - 1)
  const chordAt = step => chords[Math.floor(step / 8)] ?? null

  function noteAt(pitch, step) {
    return section.melody.find(n => n.pitch === pitch && step >= n.start && step < n.start + n.len)
  }
  function cellDown(pitch, step) {
    const existing = noteAt(pitch, step)
    if (existing) {
      section.melody = section.melody.filter(n => n !== existing)
    } else {
      section.melody = [...section.melody, { pitch, start: step, len: 1 }]
      dragging = { pitch, start: step }
    }
    $song = $song
  }
  function cellEnter(pitch, step) {
    if (!dragging || pitch !== dragging.pitch || step <= dragging.start) return
    const note = section.melody.find(n => n.pitch === dragging.pitch && n.start === dragging.start)
    if (note) { note.len = step - note.start + 1; $song = $song }
  }
</script>

<div class="label">멜로디 — 클릭해서 찍기, 오른쪽 드래그로 길이 조절</div>
<div class="wrap" on:mouseup={() => (dragging = null)} on:mouseleave={() => (dragging = null)} role="grid" tabindex="0">
  {#each PITCHES as pitch}
    <div class="row" class:octave={pitch % 12 === 0}>
      <span class="name">{pitchName(pitch)}</span>
      {#each Array(totalSteps) as _, step}
        {@const note = noteAt(pitch, step)}
        {@const cls = classify(pitch, chordAt(step), $song.key)}
        <button
          class="cell {cls}"
          class:note={!!note}
          class:beat={step % 16 === 0}
          on:mousedown={() => cellDown(pitch, step)}
          on:mouseenter={() => cellEnter(pitch, step)}
          aria-label="{pitchName(pitch)} 스텝 {step + 1}" />
      {/each}
    </div>
  {/each}
</div>
<div class="legend">
  <span><i style="background:#ffd166" /> 찍은 음</span>
  <span><i style="background:#3d4b3a" /> 코드에 잘 어울림</span>
  <span><i style="background:#333a48" /> 무난 (스케일 음)</span>
  <span><i style="background:#2a2530" /> 불협 주의</span>
</div>

<style>
  .label { font-size: 12px; color: #8b93a7; }
  .wrap { overflow-x: auto; margin-top: 6px; user-select: none; }
  .row { display: flex; gap: 1px; margin-bottom: 1px; align-items: center; }
  .row.octave { border-bottom: 1px solid #454e63; }
  .name { width: 34px; font-size: 10px; color: #8b93a7; text-align: right; padding-right: 4px; flex-shrink: 0; }
  .cell { width: 13px; height: 13px; border: none; border-radius: 2px; cursor: pointer; padding: 0; flex-shrink: 0; }
  .cell.chord { background: #3d4b3a; }
  .cell.scale { background: #333a48; }
  .cell.out { background: #2a2530; }
  .cell.note { background: #ffd166 !important; }
  .cell.beat { outline: 1px solid #454e63; }
  .legend { display: flex; gap: 14px; font-size: 11px; color: #8b93a7; margin-top: 6px; }
  .legend i { display: inline-block; width: 10px; height: 10px; border-radius: 2px; margin-right: 4px; }
</style>
