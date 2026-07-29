<script>
  import { song, selectedSectionId } from '../lib/store.js'
  import { createSection } from '../lib/model.js'

  let dragIndex = null

  const byId = id => $song.sections.find(s => s.id === id)

  function addSection() {
    const name = prompt('섹션 이름 (예: 인트로, A멜, 사비)', '새 섹션')
    if (!name) return
    const sec = createSection(name)
    $song.sections = [...$song.sections, sec]
    $song.arrangement = [...$song.arrangement, sec.id]
    $selectedSectionId = sec.id
  }
  function duplicateSection(sec) {
    const copy = { ...structuredClone(sec), id: crypto.randomUUID(), name: sec.name + ' 복제' }
    $song.sections = [...$song.sections, copy]
    $song.arrangement = [...$song.arrangement, copy.id]
  }
  function deleteSection(sec) {
    if (!confirm(`"${sec.name}" 섹션을 삭제할까요? 배치에서도 모두 제거됩니다.`)) return
    $song.sections = $song.sections.filter(s => s.id !== sec.id)
    $song.arrangement = $song.arrangement.filter(id => id !== sec.id)
    if ($selectedSectionId === sec.id) $selectedSectionId = $song.sections[0]?.id ?? null
  }
  function appendToArrangement(sec) {
    $song.arrangement = [...$song.arrangement, sec.id]
  }
  function removeAt(i) {
    $song.arrangement = $song.arrangement.filter((_, idx) => idx !== i)
  }
  function drop(i) {
    if (dragIndex === null || dragIndex === i) return
    const arr = [...$song.arrangement]
    const [moved] = arr.splice(dragIndex, 1)
    arr.splice(i, 0, moved)
    $song.arrangement = arr
    dragIndex = null
  }
</script>

<section>
  <div class="label">섹션 라이브러리 — 클릭해서 편집, ＋로 배치에 추가</div>
  <div class="row">
    {#each $song.sections as sec (sec.id)}
      <span class="chip" class:selected={$selectedSectionId === sec.id}
        style="background:{sec.color}" on:click={() => ($selectedSectionId = sec.id)} role="button" tabindex="0"
        on:keydown={e => e.key === 'Enter' && ($selectedSectionId = sec.id)}>
        {sec.name} ({sec.bars}마디)
        <button class="mini" title="배치에 추가" on:click|stopPropagation={() => appendToArrangement(sec)}>＋</button>
        <button class="mini" title="복제" on:click|stopPropagation={() => duplicateSection(sec)}>⧉</button>
        <button class="mini" title="삭제" on:click|stopPropagation={() => deleteSection(sec)}>✕</button>
      </span>
    {/each}
    <button class="add" on:click={addSection}>＋ 새 섹션</button>
  </div>

  <div class="label">곡 배치 — 드래그로 순서 변경</div>
  <div class="row">
    {#each $song.arrangement as id, i (i)}
      <span class="chip" draggable="true" style="background:{byId(id)?.color}"
        on:dragstart={() => (dragIndex = i)} on:dragover|preventDefault on:drop={() => drop(i)}
        role="button" tabindex="0">
        {byId(id)?.name}
        <button class="mini" title="배치에서 제거" on:click={() => removeAt(i)}>✕</button>
      </span>
    {/each}
    {#if $song.arrangement.length === 0}
      <span class="hint">비어 있어요 — 섹션의 ＋ 버튼으로 추가하세요</span>
    {/if}
  </div>
</section>

<style>
  section { background: #242833; padding: 10px 14px; border-radius: 8px; display: flex; flex-direction: column; gap: 8px; }
  .label { font-size: 12px; color: #8b93a7; }
  .row { display: flex; gap: 6px; flex-wrap: wrap; align-items: center; }
  .chip { padding: 6px 10px; border-radius: 6px; font-size: 13px; cursor: pointer; display: inline-flex; gap: 4px; align-items: center; }
  .chip.selected { outline: 2px solid #ff7a9c; }
  .mini { background: rgba(0,0,0,0.25); border: none; color: #fff; border-radius: 4px; cursor: pointer; font-size: 11px; padding: 1px 5px; }
  .add { border: 1px dashed #555e70; background: transparent; color: #8b93a7; border-radius: 6px; padding: 6px 12px; cursor: pointer; }
  .hint { font-size: 12px; color: #666e80; }
</style>
