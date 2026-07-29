import { writable } from 'svelte/store'
import { createSong, loadSong, saveSong } from './model.js'
import { createPlayer } from './audio.js'

export const song = writable(loadSong() ?? createSong())
export const selectedSectionId = writable(null)
export const playing = writable(false)
export const player = createPlayer()

let saveTimer = null
song.subscribe(value => {
  clearTimeout(saveTimer)
  saveTimer = setTimeout(() => saveSong(value), 300)
})
