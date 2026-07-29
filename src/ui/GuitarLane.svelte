<script>
  import { song } from '../lib/store.js'
  import { GUITAR_PRESETS } from '../lib/patterns.js'
  import StepEditor from './StepEditor.svelte'

  export let section
  let editingBar = null
  let draft = null

  $: customs = $song.customPatterns.filter(p => p.track === 'guitar')

  function slotValue(slot) {
    return slot.presetId ? `p:${slot.presetId}` : `c:${slot.customId}`
  }
  function currentSteps(slot) {
    if (slot.presetId) return [...GUITAR_PRESETS.find(p => p.id === slot.presetId).steps]
    return [...($song.customPatterns.find(p => p.id === slot.customId)?.steps ?? Array(16).fill(0))]
  }
  function onSelect(bar, e) {
    const v = e.target.value
    if (v === 'edit') {
      editingBar = bar
      draft = currentSteps(section.guitar[bar])
      e.target.value = slotValue(section.guitar[bar]) // 셀렉트 표시 복원
      return
    }
    const [kind, id] = v.split(':')
    section.guitar[bar] = kind === 'p' ? { presetId: id } : { customId: id }
    $song = $song
  }
  function saveCustom() {
    const name = prompt('커스텀 패턴 이름', '내 패턴')
    if (!name) return
    const pattern = { id: crypto.randomUUID(), name, track: 'guitar', steps: draft }
    $song.customPatterns = [...$song.customPatterns, pattern]
    section.guitar[editingBar] = { customId: pattern.id }
    $song = $song
    editingBar = null
  }
</script>

<div class="label">기타 — 마디마다 패턴 선택, 프리셋을 스텝 단위로 수정 가능</div>
<div class="grid" style="grid-template-columns: repeat({section.bars}, 1fr)">
  {#each section.guitar as slot, bar}
    <select value={slotValue(slot)} on:change={e => onSelect(bar, e)}>
      {#each GUITAR_PRESETS as p}<option value={'p:' + p.id}>{p.name}</option>{/each}
      {#each customs as c}<option value={'c:' + c.id}>{c.name}</option>{/each}
      <option value="edit">커스텀 편집...</option>
    </select>
  {/each}
</div>

{#if editingBar !== null}
  <div class="editor">
    <div class="label">마디 {editingBar + 1} 커스텀 패턴 (16분음표)</div>
    <StepEditor steps={draft} on:change={e => (draft = e.detail)} />
    <div class="row">
      <button class="ok" on:click={saveCustom}>이름 붙여 저장</button>
      <button class="cancel" on:click={() => (editingBar = null)}>취소</button>
    </div>
  </div>
{/if}

<style>
  .label { font-size: 12px; color: #8b93a7; }
  .grid { display: grid; gap: 4px; }
  select { background: #3a4258; color: #e8eaf0; border: none; border-radius: 5px; padding: 6px 4px; font-size: 12px; }
  .editor { background: #2c3140; border: 1px solid #454e63; border-radius: 8px; padding: 10px; margin-top: 6px; }
  .row { display: flex; gap: 6px; margin-top: 8px; }
  .ok { background: #2ea86b; border: none; color: #fff; border-radius: 6px; padding: 5px 12px; cursor: pointer; }
  .cancel { background: #3a4258; border: none; color: #8b93a7; border-radius: 6px; padding: 5px 12px; cursor: pointer; }
</style>
