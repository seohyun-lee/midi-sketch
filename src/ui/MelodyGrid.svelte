<script>
  import { song, player } from '../lib/store.js'
  import { NOTE_NAMES, classify } from '../lib/theory.js'
  import { resolveSectionChords } from '../lib/render.js'

  export let section
  const PITCHES = Array.from({ length: 24 }, (_, i) => 83 - i) // B5 → C4
  let dragging = null // {pitch, start}
  let selecting = null // 선택 드래그 시작 스텝
  let selection = null // {a, b} 스텝 범위
  let clipboard = null // {notes: [{pitch, rel, len}]}

  $: selLo = selection ? Math.min(selection.a, selection.b) : -1
  $: selHi = selection ? Math.max(selection.a, selection.b) : -1

  $: chords = resolveSectionChords(section, null)
  $: totalSteps = section.bars * 16

  const pitchName = m => NOTE_NAMES[m % 12].replace('♯', '#') + (Math.floor(m / 12) - 1)
  const chordAt = step => chords[Math.floor(step / 8)] ?? null

  function noteAt(pitch, step) {
    return section.melody.find(n => n.pitch === pitch && step >= n.start && step < n.start + n.len)
  }
  function cellDown(pitch, step, e) {
    if (e.shiftKey) {
      selecting = step
      selection = { a: step, b: step }
      return
    }
    const existing = noteAt(pitch, step)
    if (existing) {
      section.melody = section.melody.filter(n => n !== existing)
    } else {
      section.melody = [...section.melody, { pitch, start: step, len: 1 }]
      dragging = { pitch, start: step }
      player.playNote(pitch)
    }
    $song = $song
  }
  function cellEnter(pitch, step) {
    if (selecting !== null) { selection = { a: selecting, b: step }; return }
    if (!dragging || pitch !== dragging.pitch || step <= dragging.start) return
    const note = section.melody.find(n => n.pitch === dragging.pitch && n.start === dragging.start)
    if (note) { note.len = step - note.start + 1; $song = $song }
  }
  function copySel() {
    if (!selection) return
    const notes = section.melody.filter(n => n.start >= selLo && n.start <= selHi)
    clipboard = { notes: notes.map(n => ({ pitch: n.pitch, rel: n.start - selLo, len: n.len })) }
  }
  function pasteSel() {
    if (!clipboard || !selection) return
    const added = clipboard.notes
      .map(n => ({ pitch: n.pitch, start: selLo + n.rel, len: n.len }))
      .filter(n => n.start < totalSteps)
    section.melody = [
      ...section.melody.filter(n => !added.some(a => a.pitch === n.pitch && a.start === n.start)),
      ...added,
    ]
    $song = $song
  }
  function deleteSel() {
    if (!selection) return
    section.melody = section.melody.filter(n => !(n.start >= selLo && n.start <= selHi))
    $song = $song
  }
  function onKey(e) {
    const tag = e.target.tagName
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
    if (e.key === 'Escape') { selection = null; return }
    if (!selection) return
    const k = e.key.toLowerCase()
    if ((e.metaKey || e.ctrlKey) && k === 'c') { e.preventDefault(); copySel() }
    else if ((e.metaKey || e.ctrlKey) && k === 'v') { e.preventDefault(); pasteSel() }
    else if (e.key === 'Backspace' || e.key === 'Delete') { e.preventDefault(); deleteSel() }
  }
</script>

<svelte:window on:keydown={onKey} />

<div class="label">멜로디 — 클릭해서 찍기, 오른쪽 드래그로 길이 조절 · Shift+드래그로 영역 선택</div>
{#if selection}
  <div class="seltools">
    <span>{selLo + 1}~{selHi + 1} 스텝 선택</span>
    <button on:click={copySel}>복사 (⌘C)</button>
    <button disabled={!clipboard} on:click={pasteSel}>여기 붙여넣기 (⌘V)</button>
    <button on:click={deleteSel}>삭제 (⌫)</button>
    <button on:click={() => (selection = null)}>해제 (esc)</button>
    {#if clipboard}<span class="hint">붙여넣기: Shift+클릭으로 위치 잡고 ⌘V</span>{/if}
  </div>
{/if}
<div class="wrap" on:mouseup={() => { dragging = null; selecting = null }} on:mouseleave={() => { dragging = null; selecting = null }} role="grid" tabindex="0">
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
          class:sel={selection && step >= selLo && step <= selHi}
          on:mousedown={e => cellDown(pitch, step, e)}
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
  .name { width: 38px; font-size: 11px; color: #8b93a7; text-align: right; padding-right: 5px; flex-shrink: 0;
    position: sticky; left: 0; background: #242833; z-index: 1; }
  .cell { width: 10px; height: 17px; border: none; border-radius: 2px; cursor: pointer; padding: 0; flex-shrink: 0; }
  .cell.chord { background: #3d4b3a; }
  .cell.scale { background: #333a48; }
  .cell.out { background: #2a2530; }
  .cell.note { background: #ffd166 !important; }
  .cell.beat { outline: 1px solid #454e63; }
  .cell:hover { outline: 1px solid #ffd166; }
  .cell.sel { box-shadow: inset 0 0 0 100px rgba(126, 200, 255, 0.28); }
  .seltools { display: flex; gap: 6px; align-items: center; font-size: 11px; color: #8b93a7; margin-top: 6px; flex-wrap: wrap; }
  .seltools button { background: #3a4258; border: none; color: #e8eaf0; border-radius: 4px; padding: 3px 8px; cursor: pointer; font-size: 11px; }
  .seltools button:disabled { opacity: 0.4; cursor: not-allowed; }
  .seltools .hint { color: #666e80; }
  .legend { display: flex; gap: 14px; font-size: 11px; color: #8b93a7; margin-top: 6px; }
  .legend i { display: inline-block; width: 10px; height: 10px; border-radius: 2px; margin-right: 4px; }
</style>
