<script>
  import { createEventDispatcher } from 'svelte'
  import { song, player } from '../lib/store.js'
  import { NOTE_NAMES, QUALITIES, chordLabel, diatonicChords, inKey, ROCK_PROGRESSIONS, progressionChords } from '../lib/theory.js'

  export let current = null
  const dispatch = createEventDispatcher()

  let tab = 'suggest'
  let root = current?.root ?? $song.key.root
  let quality = current?.quality ?? ($song.key.mode === 'minor' ? 'min' : 'maj')
  let bass = current?.bass ?? null

  $: diatonic = diatonicChords($song.key)
  $: progs = ROCK_PROGRESSIONS.filter(p => p.mode === $song.key.mode)
  $: built = { root, quality, ...(bass != null && bass !== root ? { bass } : {}) }
</script>

<div class="backdrop" on:click={() => dispatch('close')} role="button" tabindex="0" />
<div class="popup">
  <div class="tabs">
    <button class:active={tab === 'suggest'} on:click={() => (tab = 'suggest')}>추천</button>
    <button class:active={tab === 'build'} on:click={() => (tab = 'build')}>직접 만들기</button>
    <span class="spacer" />
    <button on:click={() => dispatch('close')}>✕</button>
  </div>

  {#if tab === 'suggest'}
    <div class="sub">지금 키에서 어울리는 코드</div>
    <div class="row">
      {#each diatonic as d}
        <button class="chord" on:click={() => dispatch('select', { root: d.root, quality: d.quality })}
          on:mouseenter={() => player.playChord(d)}>
          {chordLabel(d)} <small>{d.roman}</small>
        </button>
      {/each}
    </div>
    <div class="sub">록 인기 진행 한번에 넣기 (섹션 전체 마디에 반복 적용)</div>
    {#each progs as p}
      <button class="prog" on:click={() => dispatch('progression', progressionChords($song.key, p))}>
        {p.name} — {progressionChords($song.key, p).map(chordLabel).join(' → ')}
      </button>
    {/each}
  {:else}
    <div class="sub">루트</div>
    <div class="row">
      {#each NOTE_NAMES as n, i}
        <button class="opt" class:on={root === i} on:click={() => (root = i)}>{n}</button>
      {/each}
    </div>
    <div class="sub">종류</div>
    <div class="row">
      {#each Object.entries(QUALITIES) as [q, def]}
        <button class="opt" class:on={quality === q} on:click={() => (quality = q)}>{def.name}</button>
      {/each}
    </div>
    <div class="sub">베이스음 (분수코드, 선택)</div>
    <div class="row">
      <button class="opt" class:on={bass == null} on:click={() => (bass = null)}>기본</button>
      {#each NOTE_NAMES as n, i}
        <button class="opt" class:on={bass === i} on:click={() => (bass = i)}>{n}</button>
      {/each}
    </div>
    <div class="row confirm">
      <button class="listen" on:click={() => player.playChord(built)}>🔊 미리 듣기</button>
      <strong>{chordLabel(built)}</strong>
      {#if inKey(built, $song.key)}<span class="star">★ 키에 잘 어울림</span>{/if}
      <span class="spacer" />
      <button class="ok" on:click={() => dispatch('select', built)}>이 코드 사용</button>
    </div>
  {/if}
</div>

<style>
  .backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 10; }
  .popup { position: fixed; top: 50%; left: 50%; transform: translate(-50%,-50%); z-index: 11;
    background: #2c3140; border: 1px solid #454e63; border-radius: 10px; padding: 14px; width: min(560px, 92vw);
    max-height: 80vh; overflow-y: auto; display: flex; flex-direction: column; gap: 8px; }
  .tabs { display: flex; gap: 6px; }
  .tabs button { background: #333a4a; border: none; color: #8b93a7; padding: 6px 14px; border-radius: 6px; cursor: pointer; }
  .tabs button.active { background: #4a7dff; color: #fff; }
  .sub { font-size: 12px; color: #8b93a7; margin-top: 4px; }
  .row { display: flex; gap: 4px; flex-wrap: wrap; align-items: center; }
  .opt, .chord { background: #3a4258; border: none; color: #e8eaf0; padding: 5px 10px; border-radius: 5px; cursor: pointer; font-size: 13px; }
  .opt.on { background: #4a7dff; }
  .chord small { color: #8b93a7; }
  .prog { background: #3a4258; border: none; color: #e8eaf0; text-align: left; padding: 8px 10px; border-radius: 6px; cursor: pointer; font-size: 13px; }
  .confirm { margin-top: 6px; }
  .listen { background: #3a4258; border: none; color: #7ec8ff; padding: 6px 10px; border-radius: 6px; cursor: pointer; }
  .star { color: #ffd166; font-size: 12px; }
  .ok { background: #2ea86b; border: none; color: #fff; padding: 6px 14px; border-radius: 6px; cursor: pointer; }
  .spacer { flex: 1; }
</style>
