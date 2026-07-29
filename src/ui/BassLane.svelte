<script>
  import { song } from '../lib/store.js'
  import { BASS_STYLES, generateBassBars } from '../lib/bass.js'
  import { generateDrumBars } from '../lib/drums.js'
  import { resolveSectionChords } from '../lib/render.js'

  export let section

  $: chords = resolveSectionChords(section, null)
  $: drumBars = generateDrumBars(section.drums, section.bars)
  $: notes = generateBassBars(section.bass, chords, section.bars, drumBars)
  $: totalSteps = section.bars * 16

  function set(key, value) {
    section.bass[key] = value
    $song = $song
  }
  // 표시용: 스텝별 세기 (0=없음)
  $: stepVels = (() => {
    const arr = Array(totalSteps).fill(0)
    for (const n of notes) arr[n.start] = n.vel
    return arr
  })()
</script>

<div class="label">베이스 — 코드 진행 따라 자동 생성</div>
<div class="controls">
  {#each BASS_STYLES as s}
    <button class="opt" class:on={section.bass.style === s.id} on:click={() => set('style', s.id)}>{s.name}</button>
  {/each}
</div>
<div class="controls">
  <label>에너지 <input type="range" min="0" max="1" step="0.1" value={section.bass.energy}
    on:input={e => set('energy', Number(e.target.value))} /></label>
  <label><input type="checkbox" checked={section.bass.autoTransition}
    on:change={e => set('autoTransition', e.target.checked)} /> 코드 넘어갈 때 연결음</label>
</div>
{#if chords.every(c => !c)}
  <div class="hint">코드를 먼저 넣으면 베이스가 생성돼요</div>
{:else}
  <div class="bar-grid" style="grid-template-columns: repeat({totalSteps}, 10px)">
    {#each stepVels as vel, s}
      <span class="cell" class:beat={s % 16 === 0}
        style:background={vel === 0 ? '#333a48' : '#7ec8ff'} style:opacity={vel === 70 ? 0.55 : 1} />
    {/each}
  </div>
{/if}

<style>
  .label { font-size: 12px; color: #8b93a7; }
  .controls { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; font-size: 12px; color: #8b93a7; margin-top: 4px; }
  .opt { background: #3a4258; border: none; color: #e8eaf0; padding: 5px 10px; border-radius: 5px; cursor: pointer; font-size: 12px; }
  .opt.on { background: #4a7dff; }
  .bar-grid { display: grid; gap: 1px; margin-top: 6px; margin-left: 71px; overflow-x: auto; }
  .cell { height: 14px; border-radius: 2px; }
  .cell.beat { box-shadow: -1px 0 0 #6b7694; }
  .hint { font-size: 11px; color: #666e80; margin-top: 4px; }
</style>
