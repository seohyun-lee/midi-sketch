<script>
  import { song } from '../lib/store.js'
  import { DRUM_STYLES, DRUM_LANE_ORDER, generateDrumBars } from '../lib/drums.js'

  export let section
  const LANE_KO = { crash: '크래시', hat: '하이햇', snare: '스네어', hiTom: '하이탐', floorTom: '플로어탐', kick: '킥' }
  const LANE_COLOR = { crash: '#e8c15c', hat: '#5cc8e8', snare: '#ff7a9c', hiTom: '#4ade80', floorTom: '#4ade80', kick: '#9d7aff' }

  $: bars = generateDrumBars(section.drums, section.bars)

  function set(key, value) {
    section.drums[key] = value
    $song = $song
  }
  function toggleCell(bar, lane, step) {
    const cur = bars[bar][lane][step]
    const next = { 0: 2, 2: 1, 1: 0 }[cur]
    section.drums.overrides = [
      ...section.drums.overrides.filter(o => !(o.bar === bar && o.lane === lane && o.step === step)),
      { bar, lane, step, value: next },
    ]
    $song = $song
  }
</script>

<div class="label">드럼 — 고르기만 하면 자동 생성 (탐 필인 포함)</div>
<div class="controls">
  {#each DRUM_STYLES as s}
    <button class="opt" class:on={section.drums.style === s.id} on:click={() => set('style', s.id)}>{s.name}</button>
  {/each}
</div>
<div class="controls">
  <label>에너지 <input type="range" min="0" max="1" step="0.1" value={section.drums.energy}
    on:input={e => set('energy', Number(e.target.value))} /></label>
  <label><input type="checkbox" checked={section.drums.autoFill}
    on:change={e => set('autoFill', e.target.checked)} /> 필인 자동 (섹션 끝 탐 굴리기)</label>
  <label><input type="checkbox" checked={section.drums.autoCrash}
    on:change={e => set('autoCrash', e.target.checked)} /> 크래시 자동 (섹션 시작)</label>
</div>
<div class="result">
  {#each DRUM_LANE_ORDER as lane}
    <div class="lane">
      <span class="name">{LANE_KO[lane]}</span>
      {#each bars as bar, b}
        <span class="bar">
          {#each bar[lane] as v, s}
            <button class="cell" style:background={v > 0 ? LANE_COLOR[lane] : '#333a48'} style:opacity={v === 1 ? 0.55 : 1}
              on:click={() => toggleCell(b, lane, s)} aria-label="{LANE_KO[lane]} 마디{b + 1} 스텝{s + 1}" />
          {/each}
        </span>
      {/each}
    </div>
  {/each}
</div>
<div class="hint">칸 클릭으로 미세 수정 가능 (안 해도 됨)</div>

<style>
  .label { font-size: 12px; color: #8b93a7; }
  .controls { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; font-size: 12px; color: #8b93a7; margin-top: 4px; }
  .opt { background: #3a4258; border: none; color: #e8eaf0; padding: 5px 10px; border-radius: 5px; cursor: pointer; font-size: 12px; }
  .opt.on { background: #4a7dff; }
  .result { display: flex; flex-direction: column; gap: 2px; margin-top: 6px; overflow-x: auto; }
  .lane { display: flex; gap: 1px; align-items: center; }
  .name { width: 65px; font-size: 11px; color: #8b93a7; text-align: right; padding-right: 5px; flex-shrink: 0; }
  .bar { display: grid; grid-template-columns: repeat(16, 10px); gap: 1px; }
  .cell { height: 14px; border: none; border-radius: 2px; cursor: pointer; padding: 0; }
  .hint { font-size: 11px; color: #666e80; margin-top: 4px; }
</style>
