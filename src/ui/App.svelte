<script>
  import TopBar from './TopBar.svelte'
  import ArrangeLane from './ArrangeLane.svelte'
  import SectionEditor from './SectionEditor.svelte'
</script>

<main>
  <TopBar />
  <ArrangeLane />
  <SectionEditor />
</main>

<style>
  :global(body) { margin: 0; background: #1a1d24; color: #e8eaf0; font-family: -apple-system, sans-serif; }
  main { max-width: 1100px; margin: 0 auto; padding: 16px; display: flex; flex-direction: column; gap: 12px; }
</style>
