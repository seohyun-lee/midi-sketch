<script>
  import { song, selectedSectionId } from '../lib/store.js'
  import ChordLane from './ChordLane.svelte'

  $: section = $song.sections.find(s => s.id === $selectedSectionId)

  function setBars(e) {
    const bars = Number(e.target.value)
    section.bars = bars
    section.guitar = Array.from({ length: bars }, (_, i) => section.guitar[i] ?? { presetId: 'power8' })
    // 범위 밖 코드/멜로디 정리
    for (const k of Object.keys(section.chords)) if (Number(k) >= bars * 2) delete section.chords[k]
    section.melody = section.melody.filter(n => n.start < bars * 16)
    $song = $song
  }
</script>

{#if section}
  <section>
    <div class="head">
      <strong style="color:{section.color}">■</strong>
      <input bind:value={section.name} on:input={() => ($song = $song)} />
      <label>마디
        <select value={section.bars} on:change={setBars}>
          {#each [2, 4, 8, 16] as b}<option value={b}>{b}</option>{/each}
        </select>
      </label>
    </div>
    <ChordLane {section} />
  </section>
{:else}
  <section class="empty">섹션을 선택하거나 새로 만들어 편집을 시작하세요</section>
{/if}

<style>
  section { background: #242833; padding: 10px 14px; border-radius: 8px; display: flex; flex-direction: column; gap: 10px; }
  .head { display: flex; gap: 8px; align-items: center; }
  .head input { background: #333a4a; border: none; color: #fff; border-radius: 6px; padding: 4px 8px; font-weight: 700; }
  label { font-size: 13px; color: #8b93a7; }
  select { background: #333a4a; color: #e8eaf0; border: none; border-radius: 6px; padding: 4px 8px; }
  .empty { color: #666e80; font-size: 13px; }
</style>
