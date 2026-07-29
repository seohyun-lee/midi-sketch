<script>
  import { song } from '../lib/store.js'
  import { chordLabel } from '../lib/theory.js'
  import { resolveSectionChords } from '../lib/render.js'
  import ChordBuilder from './ChordBuilder.svelte'

  export let section
  let editingSlot = null // halfBarIndex | null

  $: resolved = resolveSectionChords(section, null)

  function setChord(slot, chord) {
    if (chord) section.chords[slot] = chord
    else delete section.chords[slot]
    $song = $song
    editingSlot = null
  }
  function applyProgression(chords) {
    // 첫 4마디에 마디당 1개
    chords.forEach((ch, i) => { if (i < section.bars) section.chords[i * 2] = ch })
    $song = $song
    editingSlot = null
  }
</script>

<div class="label">코드 — 칸 클릭으로 선택 (반마디 단위)</div>
<div class="grid" style="grid-template-columns: repeat({section.bars * 2}, 1fr)">
  {#each resolved as chord, slot}
    <button class="slot" class:own={section.chords[slot]} class:carry={!section.chords[slot] && chord}
      on:click={() => (editingSlot = slot)}>
      {chord ? chordLabel(chord) : '＋'}
      {#if section.chords[slot]}
        <span class="x" on:click|stopPropagation={() => setChord(slot, null)} role="button" tabindex="0">✕</span>
      {/if}
    </button>
  {/each}
</div>

{#if editingSlot !== null}
  <ChordBuilder
    current={section.chords[editingSlot] ?? null}
    on:select={e => setChord(editingSlot, e.detail)}
    on:progression={e => applyProgression(e.detail)}
    on:close={() => (editingSlot = null)} />
{/if}

<style>
  .label { font-size: 12px; color: #8b93a7; }
  .grid { display: grid; gap: 4px; }
  .slot { background: #333a48; border: none; color: #8b93a7; border-radius: 5px; padding: 8px 2px; font-size: 13px; cursor: pointer; position: relative; }
  .slot.own { background: #4a5470; color: #fff; }
  .slot.carry { color: #666e80; font-style: italic; }
  .x { position: absolute; top: -6px; right: -4px; background: #555; border-radius: 50%; font-size: 9px; padding: 1px 4px; display: none; }
  .slot:hover .x { display: inline; }
</style>
