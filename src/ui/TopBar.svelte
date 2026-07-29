<script>
  import { song, player, playing } from '../lib/store.js'
  import { NOTE_NAMES } from '../lib/theory.js'
  import { downloadMidi } from '../lib/midi.js'

  $: empty = $song.arrangement.length === 0
  $: keyOptions = NOTE_NAMES.flatMap((n, root) => [
    { root, mode: 'major', label: `${n} 장조` },
    { root, mode: 'minor', label: `${n} 단조` },
  ])
  $: keyValue = `${$song.key.root}-${$song.key.mode}`

  function setKey(e) {
    const [root, mode] = e.target.value.split('-')
    $song.key = { root: Number(root), mode }
  }
  function togglePlay() {
    if ($playing) { player.stop(); $playing = false }
    else { $playing = true; player.play($song, () => playing.set(false)) }
  }
</script>

<header>
  <input class="title" bind:value={$song.title} placeholder="곡 제목" />
  <label>키
    <select value={keyValue} on:change={setKey}>
      {#each keyOptions as k}
        <option value={`${k.root}-${k.mode}`}>{k.label}</option>
      {/each}
    </select>
  </label>
  <label>템포 <input type="number" min="40" max="240" bind:value={$song.bpm} /> BPM</label>
  <span class="spacer" />
  <button disabled={empty} title={empty ? '곡 배치에 섹션을 추가하세요' : ''} on:click={togglePlay}>
    {$playing ? '■ 정지' : '▶ 재생'}
  </button>
  <button class="export" disabled={empty} title={empty ? '곡 배치에 섹션을 추가하세요' : ''}
    on:click={() => downloadMidi($song)}>⬇ MIDI 내보내기</button>
</header>

<style>
  header { display: flex; gap: 12px; align-items: center; background: #242833; padding: 10px 14px; border-radius: 8px; }
  .title { font-size: 16px; font-weight: 700; background: transparent; border: none; color: #fff; width: 180px; }
  label { font-size: 13px; color: #8b93a7; display: flex; gap: 6px; align-items: center; }
  select, input[type='number'] { background: #333a4a; color: #e8eaf0; border: none; border-radius: 6px; padding: 4px 8px; }
  input[type='number'] { width: 60px; }
  .spacer { flex: 1; }
  button { background: #4a7dff; color: #fff; border: none; border-radius: 6px; padding: 6px 14px; cursor: pointer; }
  button:disabled { opacity: 0.4; cursor: not-allowed; }
  .export { background: #2ea86b; }
</style>
