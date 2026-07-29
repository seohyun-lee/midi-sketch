<script>
  import { createEventDispatcher } from 'svelte'
  export let steps
  const dispatch = createEventDispatcher()
  const NEXT = { 0: 2, 2: 1, 1: 0 }
  function cycle(i) {
    const copy = [...steps]
    copy[i] = NEXT[copy[i]]
    dispatch('change', copy)
  }
</script>

<div class="steps">
  {#each steps as v, i}
    <button class="cell" class:beat={i % 4 === 0} data-v={v} on:click={() => cycle(i)} aria-label="스텝 {i + 1}" />
  {/each}
</div>
<div class="legend">클릭: 끔→세게→약하게 순환 · <span class="s2">■</span> 세게 <span class="s1">■</span> 약하게</div>

<style>
  .steps { display: grid; grid-template-columns: repeat(16, 1fr); gap: 2px; }
  .cell { height: 22px; border: none; border-radius: 3px; cursor: pointer; background: #333a48; }
  .cell.beat { outline: 1px solid #454e63; }
  .cell[data-v='2'] { background: #ff9d5c; }
  .cell[data-v='1'] { background: #ffb98a; }
  .legend { font-size: 11px; color: #8b93a7; margin-top: 4px; }
  .s2 { color: #ff9d5c; } .s1 { color: #ffb98a; }
</style>
