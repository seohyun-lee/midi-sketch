<script>
  import TopBar from './TopBar.svelte'
  import ArrangeLane from './ArrangeLane.svelte'
  import SectionEditor from './SectionEditor.svelte'
  import { undo, redo } from '../lib/store.js'

  function onKey(e) {
    const tag = e.target.tagName
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
    if (!(e.metaKey || e.ctrlKey)) return
    const k = e.key.toLowerCase()
    if (k === 'z' && !e.shiftKey) { e.preventDefault(); undo() }
    else if (k === 'y' || (k === 'z' && e.shiftKey)) { e.preventDefault(); redo() }
  }
</script>

<svelte:window on:keydown={onKey} />

<main>
  <TopBar />
  <ArrangeLane />
  <SectionEditor />
</main>

<style>
  :global(body) { margin: 0; background: #1a1d24; color: #e8eaf0; font-family: -apple-system, sans-serif; }
  main { max-width: 1100px; margin: 0 auto; padding: 16px; display: flex; flex-direction: column; gap: 12px; }
</style>
