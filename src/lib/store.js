import { writable, get } from 'svelte/store'
import { createSong, loadSong, saveSong, isValidSong } from './model.js'
import { createPlayer } from './audio.js'

export const song = writable(loadSong() ?? createSong())
export const selectedSectionId = writable(null)
export const playing = writable(false)
export const player = createPlayer()

// 실행 취소/다시 실행 — 변경을 400ms 묶음 단위로 스냅샷 (JSON 문자열로 보관)
const MAX_HISTORY = 100
let undoStack = []
let redoStack = []
let current = JSON.stringify(get(song))
let applying = false
let histTimer = null
export const historyState = writable({ undo: 0, redo: 0 })

const updateHist = () => historyState.set({ undo: undoStack.length, redo: redoStack.length })

function commitHistory() {
  histTimer = null
  const now = JSON.stringify(get(song))
  if (now === current) return
  undoStack.push(current)
  if (undoStack.length > MAX_HISTORY) undoStack.shift()
  redoStack = []
  current = now
  updateHist()
}

let saveTimer = null
let first = true
song.subscribe(value => {
  clearTimeout(saveTimer)
  saveTimer = setTimeout(() => saveSong(value), 300)
  if (first) { first = false; return }
  if (applying) { current = JSON.stringify(value); return }
  clearTimeout(histTimer)
  histTimer = setTimeout(commitHistory, 400)
})

function applySnapshot(json) {
  applying = true
  song.set(JSON.parse(json))
  applying = false
}

export function undo() {
  if (histTimer) { clearTimeout(histTimer); commitHistory() }
  if (!undoStack.length) return
  redoStack.push(current)
  current = undoStack.pop()
  applySnapshot(current)
  updateHist()
}

export function redo() {
  if (!redoStack.length) return
  undoStack.push(current)
  current = redoStack.pop()
  applySnapshot(current)
  updateHist()
}

// 다른 탭이 저장하면 이 탭도 따라감 — 옛 탭이 최신 작업을 덮어쓰는 사고 방지
if (typeof window !== 'undefined') {
  window.addEventListener('storage', e => {
    if (e.key !== 'midi-sketch-song' || !e.newValue || e.newValue === JSON.stringify(get(song))) return
    try {
      const incoming = JSON.parse(e.newValue)
      if (isValidSong(incoming)) applySnapshot(e.newValue)
    } catch { /* 다른 탭이 쓴 값이 깨져 있으면 무시 */ }
  })
}
