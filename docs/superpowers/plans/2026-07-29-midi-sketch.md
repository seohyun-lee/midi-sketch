# MIDI Sketch 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 곡 전체(멜로디+기타+베이스+드럼)를 섹션 블록으로 스케치하고 .mid로 내보내 Logic Pro에서 이어 작업하는 단일 HTML 로컬 웹앱.

**Architecture:** 순수 로직 모듈(theory/patterns/drums/bass/render/midi — 전부 단위 테스트)과 Svelte UI를 분리. 재생(Web Audio)과 MIDI 내보내기는 공통 렌더러(`render.js`)가 만든 노트 이벤트 타임라인을 공유한다.

**Tech Stack:** Vite 5 + Svelte 4 + vite-plugin-singlefile(단일 HTML 빌드) + Vitest. 외부 런타임 의존성 없음(Web Audio/MIDI 바이트 직접 생성).

**스펙:** `docs/superpowers/specs/2026-07-29-midi-sketch-design.md` — 실행 전 반드시 읽을 것.

## Global Constraints

- UI 언어: 한국어. MIDI 트랙 이름만 영문(Melody/Guitar/Bass/Drums)
- 박자 4/4 고정, PPQ=480, 16분음표=120틱
- 벨로시티 2단계: 세게=100, 약하게=70
- GM 드럼맵: 킥36, 스네어38, 하이햇42, 하이탐48, 플로어탐41, 크래시49 / 드럼은 채널 10(인덱스 9)
- 빌드 결과는 dist/index.html **단일 파일** (더블클릭 실행)
- localStorage 키: `midi-sketch-song`
- 대상 브라우저: Mac Safari + Chrome 최신
- 드럼·베이스는 "선택하면 자동 생성"이 기본, 직접 편집은 옵션

## 파일 구조

```
midi-sketch/
├── package.json, vite.config.js, index.html
├── src/
│   ├── main.js                  # 엔트리
│   ├── lib/
│   │   ├── theory.js            # 스케일/코드/분류/추천 (순수)
│   │   ├── patterns.js          # 기타 프리셋 + 패턴×코드→노트 (순수)
│   │   ├── drums.js             # 드럼 자동 생성 (순수)
│   │   ├── bass.js              # 베이스 자동 생성 (순수)
│   │   ├── model.js             # 곡 데이터 모델 + 저장/불러오기 (순수)
│   │   ├── render.js            # 곡 → 노트 이벤트 타임라인 (순수)
│   │   ├── midi.js              # SMF 바이트 생성 + 다운로드 (순수 + DOM 1함수)
│   │   ├── audio.js             # Web Audio 신스/재생
│   │   └── store.js             # Svelte 스토어 + 자동 저장
│   └── ui/
│       ├── App.svelte           # 레이아웃
│       ├── TopBar.svelte        # 제목/키/템포/재생/내보내기
│       ├── ArrangeLane.svelte   # 섹션 생성/복제/삭제/드래그 배치
│       ├── SectionEditor.svelte # 아래 레인들을 묶는 컨테이너
│       ├── ChordLane.svelte     # 코드 슬롯 (반마디)
│       ├── ChordBuilder.svelte  # 추천/직접 만들기 팝업
│       ├── StepEditor.svelte    # 16스텝 편집 공용 컴포넌트
│       ├── GuitarLane.svelte    # 기타 패턴 선택 + 커스텀
│       ├── BassLane.svelte      # 베이스 자동 설정 + 결과 그리드
│       ├── DrumLane.svelte      # 드럼 자동 설정 + 결과 그리드
│       └── MelodyGrid.svelte    # 화성 색상 가이드 멜로디 그리드
└── tests/                       # *.test.js (Vitest)
```

작업 디렉토리: `/Users/leeseohyun/Documents/GitHub/midi-sketch` (git 저장소 초기화됨)

---

### Task 1: 프로젝트 스캐폴딩 + 단일 파일 빌드

**Files:**
- Create: `package.json`, `vite.config.js`, `index.html`, `src/main.js`, `src/ui/App.svelte`, `tests/smoke.test.js`

**Interfaces:**
- Produces: `npm test`(Vitest), `npm run dev`, `npm run build`→`dist/index.html` 단일 파일

- [ ] **Step 1: 파일 작성**

`package.json`:
```json
{
  "name": "midi-sketch",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "test": "vitest run"
  },
  "devDependencies": {
    "@sveltejs/vite-plugin-svelte": "^3.1.0",
    "svelte": "^4.2.0",
    "vite": "^5.2.0",
    "vite-plugin-singlefile": "^2.0.0",
    "vitest": "^1.6.0"
  }
}
```

`vite.config.js`:
```js
import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { viteSingleFile } from 'vite-plugin-singlefile'

export default defineConfig({
  plugins: [svelte(), viteSingleFile()],
})
```

`index.html`:
```html
<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>MIDI Sketch</title>
</head>
<body>
  <div id="app"></div>
  <script type="module" src="/src/main.js"></script>
</body>
</html>
```

`src/main.js`:
```js
import App from './ui/App.svelte'
export default new App({ target: document.getElementById('app') })
```

`src/ui/App.svelte`:
```svelte
<h1>MIDI Sketch</h1>
```

`tests/smoke.test.js`:
```js
import { describe, it, expect } from 'vitest'
describe('smoke', () => {
  it('runs', () => { expect(1 + 1).toBe(2) })
})
```

- [ ] **Step 2: 설치 및 테스트 실행**

Run: `npm install && npm test`
Expected: smoke 테스트 1개 PASS

- [ ] **Step 3: 빌드 확인**

Run: `npm run build && ls dist/ && grep -c "<script" dist/index.html`
Expected: `dist/`에 `index.html` 하나만 존재(에셋 파일 없음), 스크립트가 인라인됨

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "chore: Vite+Svelte+singlefile 스캐폴딩"
```

---

### Task 2: 음악 이론 엔진 (theory.js)

**Files:**
- Create: `src/lib/theory.js`, `tests/theory.test.js`

**Interfaces:**
- Produces:
  - `NOTE_NAMES: string[12]`, `QUALITIES: {[q]: {name, iv: number[]}}` (q: `'maj'|'min'|'7'|'m7'|'maj7'|'sus4'|'add9'|'5'|'dim'`)
  - `scalePcs(key: {root:0-11, mode:'major'|'minor'}) → number[]` (피치클래스 7개)
  - `chordPcs(chord: {root, quality, bass?}) → number[]`
  - `chordLabel(chord) → string` (예: `Am`, `G/B`, `E7`)
  - `diatonicChords(key) → {root, quality, roman}[]` (7개)
  - `inKey(chord, key) → boolean`
  - `classify(midi: number, chord|null, key) → 'chord'|'scale'|'out'`
  - `ROCK_PROGRESSIONS: {id, name, mode, degrees: number[]}[]`, `progressionChords(key, prog) → chord[]`

- [ ] **Step 1: 실패하는 테스트 작성**

`tests/theory.test.js`:
```js
import { describe, it, expect } from 'vitest'
import {
  NOTE_NAMES, scalePcs, chordPcs, chordLabel, diatonicChords,
  inKey, classify, ROCK_PROGRESSIONS, progressionChords,
} from '../src/lib/theory.js'

const Am = { root: 9, quality: 'min' }        // A단조 키의 i
const keyAm = { root: 9, mode: 'minor' }
const keyC = { root: 0, mode: 'major' }

describe('theory', () => {
  it('스케일 피치클래스', () => {
    expect(scalePcs(keyC)).toEqual([0, 2, 4, 5, 7, 9, 11])
    expect(scalePcs(keyAm)).toEqual([9, 11, 0, 2, 4, 5, 7])
  })
  it('코드 구성음', () => {
    expect(chordPcs(Am)).toEqual([9, 0, 4])                       // A C E
    expect(chordPcs({ root: 4, quality: '7' })).toEqual([4, 8, 11, 2]) // E7
    expect(chordPcs({ root: 0, quality: '5' })).toEqual([0, 7])   // C5 파워
  })
  it('코드 이름', () => {
    expect(chordLabel(Am)).toBe('Am')
    expect(chordLabel({ root: 7, quality: 'maj', bass: 11 })).toBe('G/B')
    expect(chordLabel({ root: 4, quality: '7' })).toBe('E7')
  })
  it('다이어토닉 코드 (단조는 i ii° III iv v VI VII)', () => {
    const d = diatonicChords(keyAm)
    expect(d[0]).toEqual({ root: 9, quality: 'min', roman: 'i' })
    expect(d[5]).toEqual({ root: 5, quality: 'maj', roman: 'VI' })
  })
  it('키와 어울림 판정', () => {
    expect(inKey(Am, keyAm)).toBe(true)
    expect(inKey({ root: 1, quality: 'maj' }, keyAm)).toBe(false) // C#maj
  })
  it('음 분류: 코드톤/스케일/밖', () => {
    expect(classify(69, Am, keyAm)).toBe('chord')  // A4
    expect(classify(71, Am, keyAm)).toBe('scale')  // B4
    expect(classify(70, Am, keyAm)).toBe('out')    // A#4
    expect(classify(70, null, keyAm)).toBe('out')  // 코드 없어도 동작
  })
  it('록 상용 진행 → 코드 배열', () => {
    const prog = ROCK_PROGRESSIONS.find(p => p.id === 'm1') // i–VI–III–VII
    const chords = progressionChords(keyAm, prog)
    expect(chords.map(chordLabel)).toEqual(['Am', 'F', 'C', 'G'])
  })
})
```

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run tests/theory.test.js`
Expected: FAIL — 모듈 없음

- [ ] **Step 3: 구현**

`src/lib/theory.js`:
```js
export const NOTE_NAMES = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B']

export const QUALITIES = {
  maj:  { name: '메이저',  iv: [0, 4, 7] },
  min:  { name: '마이너',  iv: [0, 3, 7] },
  '7':  { name: '7',       iv: [0, 4, 7, 10] },
  m7:   { name: 'm7',      iv: [0, 3, 7, 10] },
  maj7: { name: 'maj7',    iv: [0, 4, 7, 11] },
  sus4: { name: 'sus4',    iv: [0, 5, 7] },
  add9: { name: 'add9',    iv: [0, 4, 7, 14] },
  '5':  { name: '파워(5)', iv: [0, 7] },
  dim:  { name: 'dim',     iv: [0, 3, 6] },
}

const MODE_IV = { major: [0, 2, 4, 5, 7, 9, 11], minor: [0, 2, 3, 5, 7, 8, 10] }

export function scalePcs(key) {
  return MODE_IV[key.mode].map(i => (key.root + i) % 12)
}

export function chordPcs(chord) {
  return QUALITIES[chord.quality].iv.map(i => (chord.root + i) % 12)
}

const LABEL_SUFFIX = { maj: '', min: 'm', '5': '5' }

export function chordLabel(chord) {
  const suffix = LABEL_SUFFIX[chord.quality] ?? chord.quality
  let label = NOTE_NAMES[chord.root] + suffix
  if (chord.bass != null && chord.bass !== chord.root) label += '/' + NOTE_NAMES[chord.bass]
  return label
}

const DEGREES = {
  major: [['I', 'maj'], ['ii', 'min'], ['iii', 'min'], ['IV', 'maj'], ['V', 'maj'], ['vi', 'min'], ['vii°', 'dim']],
  minor: [['i', 'min'], ['ii°', 'dim'], ['III', 'maj'], ['iv', 'min'], ['v', 'min'], ['VI', 'maj'], ['VII', 'maj']],
}

export function diatonicChords(key) {
  const scale = scalePcs(key)
  return DEGREES[key.mode].map(([roman, quality], i) => ({ root: scale[i], quality, roman }))
}

export function inKey(chord, key) {
  const scale = new Set(scalePcs(key))
  return chordPcs(chord).every(pc => scale.has(pc))
}

export function classify(midi, chord, key) {
  const pc = midi % 12
  if (chord && chordPcs(chord).includes(pc)) return 'chord'
  if (scalePcs(key).includes(pc)) return 'scale'
  return 'out'
}

export const ROCK_PROGRESSIONS = [
  { id: 'm1', name: 'i–VI–III–VII (록 발라드/J-Rock)', mode: 'minor', degrees: [0, 5, 2, 6] },
  { id: 'm2', name: 'i–VII–VI–VII (질주감)',           mode: 'minor', degrees: [0, 6, 5, 6] },
  { id: 'M1', name: 'I–V–vi–IV (팝 록)',               mode: 'major', degrees: [0, 4, 5, 3] },
  { id: 'M2', name: 'vi–IV–I–V (감성 록)',             mode: 'major', degrees: [5, 3, 0, 4] },
]

export function progressionChords(key, prog) {
  const d = diatonicChords(key)
  return prog.degrees.map(i => ({ root: d[i].root, quality: d[i].quality }))
}
```

- [ ] **Step 4: 통과 확인**

Run: `npx vitest run tests/theory.test.js`
Expected: 7개 테스트 PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/theory.js tests/theory.test.js
git commit -m "feat: 음악 이론 엔진 (스케일/코드/분류/추천 진행)"
```

---

### Task 3: 기타 패턴 엔진 (patterns.js)

**Files:**
- Create: `src/lib/patterns.js`, `tests/patterns.test.js`

**Interfaces:**
- Consumes: `QUALITIES` (theory.js)
- Produces:
  - `GUITAR_PRESETS: {id, name, steps: (0|1|2)[16], arp?: true}[]`
  - `guitarVoicing(chord) → number[]` (MIDI, 루트는 E2(40)~D#3(51) 범위)
  - `notesForGuitarBar(steps, chord, arp?) → {pitch, step, len, vel}[]` — step: 0-15, len: 다음 타격 전까지, vel: 2→100 / 1→70

- [ ] **Step 1: 실패하는 테스트 작성**

`tests/patterns.test.js`:
```js
import { describe, it, expect } from 'vitest'
import { GUITAR_PRESETS, guitarVoicing, notesForGuitarBar } from '../src/lib/patterns.js'

const A5 = { root: 9, quality: '5' }
const Am = { root: 9, quality: 'min' }

describe('patterns', () => {
  it('프리셋 4종, 스텝은 16칸', () => {
    expect(GUITAR_PRESETS.length).toBeGreaterThanOrEqual(4)
    for (const p of GUITAR_PRESETS) expect(p.steps).toHaveLength(16)
  })
  it('파워코드 보이싱: 루트+5도+옥타브', () => {
    expect(guitarVoicing(A5)).toEqual([45, 52, 57]) // A2 E3 A3
  })
  it('일반 코드 보이싱: 인터벌 스택', () => {
    expect(guitarVoicing(Am)).toEqual([45, 48, 52]) // A2 C3 E3
  })
  it('스트럼: 타격마다 보이싱 전체, 길이는 다음 타격까지', () => {
    const steps = [2, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    const notes = notesForGuitarBar(steps, A5)
    expect(notes.filter(n => n.step === 0)).toHaveLength(3)
    expect(notes.find(n => n.step === 0).len).toBe(4)
    expect(notes.find(n => n.step === 0).vel).toBe(100)
    expect(notes.find(n => n.step === 4).vel).toBe(70)
    expect(notes.find(n => n.step === 4).len).toBe(12) // 마디 끝까지
  })
  it('아르페지오: 타격마다 보이싱 음 하나씩 순환', () => {
    const steps = [1, 0, 1, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    const notes = notesForGuitarBar(steps, Am, true)
    expect(notes).toHaveLength(4)
    expect(notes.map(n => n.pitch)).toEqual([45, 48, 52, 45])
  })
})
```

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run tests/patterns.test.js`
Expected: FAIL — 모듈 없음

- [ ] **Step 3: 구현**

`src/lib/patterns.js`:
```js
import { QUALITIES } from './theory.js'

export const GUITAR_PRESETS = [
  { id: 'power8', name: '파워코드 8비트',
    steps: [2, 0, 1, 0, 2, 0, 1, 0, 2, 0, 1, 0, 2, 0, 1, 0] },
  { id: 'mute16', name: '뮤트 스타카토',
    steps: [2, 1, 1, 1, 2, 1, 1, 1, 2, 1, 1, 1, 2, 1, 1, 1] },
  { id: 'strum', name: '스트로크',
    steps: [2, 0, 0, 1, 0, 0, 1, 0, 2, 0, 0, 1, 0, 1, 0, 1] },
  { id: 'arp8', name: '아르페지오', arp: true,
    steps: [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0] },
]

// 루트를 E2(40)~D♯3(51)에 배치하고 코드 인터벌을 그대로 쌓는다
export function guitarVoicing(chord) {
  const rootMidi = 40 + ((chord.root - 4 + 12) % 12)
  const iv = chord.quality === '5' ? [0, 7, 12] : QUALITIES[chord.quality].iv
  return iv.map(i => rootMidi + i)
}

const VEL = { 1: 70, 2: 100 }

export function notesForGuitarBar(steps, chord, arp = false) {
  const voicing = guitarVoicing(chord)
  const onsets = []
  for (let s = 0; s < 16; s++) if (steps[s] > 0) onsets.push(s)
  const notes = []
  onsets.forEach((step, i) => {
    const next = onsets[i + 1] ?? 16
    const len = next - step
    const vel = VEL[steps[step]]
    if (arp) {
      notes.push({ pitch: voicing[i % voicing.length], step, len, vel })
    } else {
      for (const pitch of voicing) notes.push({ pitch, step, len, vel })
    }
  })
  return notes
}
```

- [ ] **Step 4: 통과 확인**

Run: `npx vitest run tests/patterns.test.js`
Expected: 5개 테스트 PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/patterns.js tests/patterns.test.js
git commit -m "feat: 기타 패턴 프리셋 + 패턴×코드→노트 변환"
```

---

### Task 4: 드럼 자동 생성 (drums.js)

**Files:**
- Create: `src/lib/drums.js`, `tests/drums.test.js`

**Interfaces:**
- Produces:
  - `DRUM_MIDI: {kick:36, snare:38, hat:42, hiTom:48, floorTom:41, crash:49}`
  - `DRUM_LANE_ORDER: ['crash','hat','snare','hiTom','floorTom','kick']` (UI 표시 순서)
  - `DRUM_STYLES: {id, name}[]` — `rock8`, `rock16`, `halftime`, `punk`, `tomGroove`
  - `generateDrumBars(cfg: DrumConfig, bars: number) → Bar[]` — Bar = `{[laneId]: (0|1|2)[16]}`
  - DrumConfig = `{style, energy: 0..1, autoFill: bool, autoCrash: bool, overrides: {bar, lane, step, value}[]}`
  - 규칙: autoCrash→첫 마디 스텝0 crash=2, autoFill→마지막 마디 스텝 12-15가 스네어→하이탐→플로어탐 필인으로 교체, energy≥0.7→약(1)이 세게(2)로+hat 16분 추가, energy≤0.3→세게(2)가 약(1)로. overrides는 마지막에 적용

- [ ] **Step 1: 실패하는 테스트 작성**

`tests/drums.test.js`:
```js
import { describe, it, expect } from 'vitest'
import { DRUM_MIDI, DRUM_STYLES, generateDrumBars } from '../src/lib/drums.js'

const base = { style: 'rock8', energy: 0.5, autoFill: true, autoCrash: true, overrides: [] }

describe('drums', () => {
  it('GM 드럼맵', () => {
    expect(DRUM_MIDI).toEqual({ kick: 36, snare: 38, hat: 42, hiTom: 48, floorTom: 41, crash: 49 })
  })
  it('스타일 5종', () => {
    expect(DRUM_STYLES.map(s => s.id)).toEqual(['rock8', 'rock16', 'halftime', 'punk', 'tomGroove'])
  })
  it('rock8: 스네어 2·4박, 마디 수만큼 생성', () => {
    const bars = generateDrumBars({ ...base, autoFill: false, autoCrash: false }, 2)
    expect(bars).toHaveLength(2)
    expect(bars[0].snare[4]).toBe(2)
    expect(bars[0].snare[12]).toBe(2)
    expect(bars[0].kick[0]).toBe(2)
  })
  it('autoCrash: 첫 마디 스텝0에 크래시', () => {
    const bars = generateDrumBars(base, 2)
    expect(bars[0].crash[0]).toBe(2)
    expect(bars[1].crash[0]).toBe(0)
  })
  it('autoFill: 마지막 마디 끝 4스텝이 탐 필인', () => {
    const bars = generateDrumBars(base, 2)
    const last = bars[1]
    expect(last.snare[12]).toBe(2)
    expect(last.hiTom[13]).toBe(2)
    expect(last.floorTom[14]).toBe(2)
    expect(last.floorTom[15]).toBe(2)
    expect(last.hat[13]).toBe(0) // 필인 구간 하이햇 제거
  })
  it('energy 낮으면 세게→약하게', () => {
    const bars = generateDrumBars({ ...base, energy: 0.2, autoFill: false, autoCrash: false }, 1)
    expect(bars[0].snare[4]).toBe(1)
  })
  it('energy 높으면 rock8 하이햇이 16분으로', () => {
    const bars = generateDrumBars({ ...base, energy: 0.9, autoFill: false, autoCrash: false }, 1)
    expect(bars[0].hat[1]).toBeGreaterThan(0)
  })
  it('overrides가 최종 적용', () => {
    const bars = generateDrumBars({ ...base, overrides: [{ bar: 0, lane: 'kick', step: 2, value: 2 }] }, 1)
    expect(bars[0].kick[2]).toBe(2)
  })
})
```

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run tests/drums.test.js`
Expected: FAIL — 모듈 없음

- [ ] **Step 3: 구현**

`src/lib/drums.js`:
```js
export const DRUM_MIDI = { kick: 36, snare: 38, hat: 42, hiTom: 48, floorTom: 41, crash: 49 }
export const DRUM_LANE_ORDER = ['crash', 'hat', 'snare', 'hiTom', 'floorTom', 'kick']

const Z = () => Array(16).fill(0)
const seq = pairs => { const a = Z(); for (const [i, v] of pairs) a[i] = v; return a }
const SNARE_24 = seq([[4, 2], [12, 2]])

const BASE = {
  rock8: {
    name: '록 8비트',
    lanes: {
      hat: seq([[0, 2], [2, 1], [4, 2], [6, 1], [8, 2], [10, 1], [12, 2], [14, 1]]),
      snare: SNARE_24,
      kick: seq([[0, 2], [6, 1], [8, 2]]),
    },
    hat16OnHighEnergy: true,
  },
  rock16: {
    name: '록 16비트',
    lanes: {
      hat: seq([[0, 2], [1, 1], [2, 1], [3, 1], [4, 2], [5, 1], [6, 1], [7, 1], [8, 2], [9, 1], [10, 1], [11, 1], [12, 2], [13, 1], [14, 1], [15, 1]]),
      snare: SNARE_24,
      kick: seq([[0, 2], [5, 1], [6, 2], [8, 2], [13, 1]]),
    },
  },
  halftime: {
    name: '하프타임 (잔잔한 부분용)',
    lanes: {
      hat: seq([[0, 2], [4, 1], [8, 2], [12, 1]]),
      snare: seq([[8, 2]]),
      kick: seq([[0, 2], [6, 1]]),
    },
  },
  punk: {
    name: '펑크 질주',
    lanes: {
      hat: seq([[0, 2], [2, 2], [4, 2], [6, 2], [8, 2], [10, 2], [12, 2], [14, 2]]),
      snare: SNARE_24,
      kick: seq([[0, 2], [2, 1], [4, 2], [6, 1], [8, 2], [10, 1], [12, 2], [14, 1]]),
    },
  },
  tomGroove: {
    name: '탐 그루브 (플로어탐 중심)',
    lanes: {
      floorTom: seq([[0, 2], [2, 1], [4, 2], [6, 1], [8, 2], [10, 1], [12, 2], [14, 1]]),
      snare: SNARE_24,
      kick: seq([[0, 2], [8, 2]]),
    },
  },
}

export const DRUM_STYLES = Object.entries(BASE).map(([id, s]) => ({ id, name: s.name }))

function emptyBar() {
  const bar = {}
  for (const lane of DRUM_LANE_ORDER) bar[lane] = Z()
  return bar
}

export function generateDrumBars(cfg, bars) {
  const style = BASE[cfg.style]
  const result = []
  for (let b = 0; b < bars; b++) {
    const bar = emptyBar()
    for (const [lane, steps] of Object.entries(style.lanes)) bar[lane] = [...steps]

    if (cfg.energy >= 0.7) {
      if (style.hat16OnHighEnergy) {
        for (let s = 1; s < 16; s += 2) if (bar.hat[s] === 0) bar.hat[s] = 1
      }
      for (const lane of DRUM_LANE_ORDER) bar[lane] = bar[lane].map(v => (v === 1 ? 2 : v))
    } else if (cfg.energy <= 0.3) {
      for (const lane of DRUM_LANE_ORDER) bar[lane] = bar[lane].map(v => (v === 2 ? 1 : v))
    }

    if (cfg.autoCrash && b === 0) bar.crash[0] = 2
    if (cfg.autoFill && b === bars - 1) {
      for (const lane of DRUM_LANE_ORDER) for (let s = 12; s < 16; s++) bar[lane][s] = 0
      bar.snare[12] = 2; bar.hiTom[13] = 2; bar.floorTom[14] = 2; bar.floorTom[15] = 2
    }
    result.push(bar)
  }
  for (const o of cfg.overrides ?? []) {
    if (result[o.bar]) result[o.bar][o.lane][o.step] = o.value
  }
  return result
}
```

- [ ] **Step 4: 통과 확인**

Run: `npx vitest run tests/drums.test.js`
Expected: 8개 테스트 PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/drums.js tests/drums.test.js
git commit -m "feat: 드럼 자동 생성 (스타일/에너지/필인/크래시/오버라이드)"
```

---

### Task 5: 베이스 자동 생성 (bass.js)

**Files:**
- Create: `src/lib/bass.js`, `tests/bass.test.js`

**Interfaces:**
- Consumes: `QUALITIES` (theory.js)
- Produces:
  - `BASS_STYLES: {id, name}[]` — `root8`, `octave`, `followKick`, `walking`, `arp`
  - `bassRootMidi(chord) → number` (E1(28)~D#2(39), `chord.bass` 우선)
  - `generateBassBars(cfg: BassConfig, chords: (chord|null)[], bars, drumBars) → {pitch, start, len, vel}[]`
    - `chords`: 반마디 단위 해석 결과(길이 `bars*2`, 캐리 적용됨). null이면 그 반마디는 무음
    - `start`: 섹션 내 절대 16분 스텝. `drumBars`: followKick용(Task 4 출력, null 허용)
    - autoTransition: 다음 반마디 코드가 다르면 스텝 15(마디 마지막)에 다음 루트의 반음 아래 경과음

- [ ] **Step 1: 실패하는 테스트 작성**

`tests/bass.test.js`:
```js
import { describe, it, expect } from 'vitest'
import { BASS_STYLES, bassRootMidi, generateBassBars } from '../src/lib/bass.js'
import { generateDrumBars } from '../src/lib/drums.js'

const Am = { root: 9, quality: 'min' }
const F = { root: 5, quality: 'maj' }
const cfg = { mode: 'auto', style: 'root8', energy: 0.5, autoTransition: false, overrides: [] }

describe('bass', () => {
  it('스타일 5종', () => {
    expect(BASS_STYLES.map(s => s.id)).toEqual(['root8', 'octave', 'followKick', 'walking', 'arp'])
  })
  it('루트 MIDI: E1~D#2 범위, 분수코드 베이스 우선', () => {
    expect(bassRootMidi(Am)).toBe(33) // A1
    expect(bassRootMidi({ root: 7, quality: 'maj', bass: 11 })).toBe(35) // B1
  })
  it('root8: 8분음표, 박은 세게', () => {
    const notes = generateBassBars(cfg, [Am, Am], 1, null)
    expect(notes).toHaveLength(8)
    expect(notes[0]).toEqual({ pitch: 33, start: 0, len: 2, vel: 100 })
    expect(notes[1].vel).toBe(70)
  })
  it('코드 없는 반마디는 무음', () => {
    const notes = generateBassBars(cfg, [null, Am], 1, null)
    expect(notes.every(n => n.start >= 8)).toBe(true)
  })
  it('octave: 루트/옥타브 교대', () => {
    const notes = generateBassBars({ ...cfg, style: 'octave' }, [Am, Am], 1, null)
    expect(notes[0].pitch).toBe(33)
    expect(notes[1].pitch).toBe(45)
  })
  it('followKick: 킥 위치에만 노트', () => {
    const drums = generateDrumBars({ style: 'rock8', energy: 0.5, autoFill: false, autoCrash: false, overrides: [] }, 1)
    const notes = generateBassBars({ ...cfg, style: 'followKick' }, [Am, Am], 1, drums)
    const kickSteps = drums[0].kick.map((v, i) => (v > 0 ? i : -1)).filter(i => i >= 0)
    expect(notes.map(n => n.start)).toEqual(kickSteps)
  })
  it('autoTransition: 코드 바뀌기 전 스텝15에 경과음', () => {
    const notes = generateBassBars({ ...cfg, autoTransition: true }, [Am, Am, F, F], 2, null)
    const passing = notes.find(n => n.start === 15)
    expect(passing.pitch).toBe(bassRootMidi(F) - 1)
  })
})
```

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run tests/bass.test.js`
Expected: FAIL — 모듈 없음

- [ ] **Step 3: 구현**

`src/lib/bass.js`:
```js
import { QUALITIES } from './theory.js'

export const BASS_STYLES = [
  { id: 'root8', name: '루트 8비트 드라이브' },
  { id: 'octave', name: '옥타브 펌핑' },
  { id: 'followKick', name: '킥 따라가기' },
  { id: 'walking', name: '워킹' },
  { id: 'arp', name: '코드 아르페지오' },
]

export function bassRootMidi(chord) {
  const pc = chord.bass ?? chord.root
  return 28 + ((pc - 4 + 12) % 12)
}

const VEL = { 1: 70, 2: 100 }
// 마디 내 스텝 → [pitch오프셋 선택자, 세기] 를 스타일별로 정의
function stepsForStyle(style, chord, energy, kickSteps) {
  const root = bassRootMidi(chord)
  const iv = QUALITIES[chord.quality].iv
  const third = root + (iv[1] ?? 7)
  const fifth = root + (iv[2] ?? 7)
  switch (style) {
    case 'root8': {
      const every = energy >= 0.7 ? 1 : 2
      const out = []
      for (let s = 0; s < 16; s += every) out.push({ pitch: root, step: s, len: every, vel: s % 4 === 0 ? 2 : 1 })
      if (energy <= 0.3) return out.filter(n => n.step % 4 === 0).map(n => ({ ...n, len: 4 }))
      return out
    }
    case 'octave': {
      const out = []
      for (let s = 0; s < 16; s += 2) out.push({ pitch: s % 4 === 0 ? root : root + 12, step: s, len: 2, vel: s % 4 === 0 ? 2 : 1 })
      return out
    }
    case 'followKick':
      return (kickSteps ?? [0, 8]).map(s => ({ pitch: root, step: s, len: 2, vel: 2 }))
    case 'walking':
      return [root, third, fifth, third].map((pitch, i) => ({ pitch, step: i * 4, len: 4, vel: i === 0 ? 2 : 1 }))
    case 'arp': {
      const cycle = [root, fifth, root + 12, third]
      const out = []
      for (let s = 0; s < 16; s += 2) out.push({ pitch: cycle[(s / 2) % 4], step: s, len: 2, vel: s % 4 === 0 ? 2 : 1 })
      return out
    }
  }
}

export function generateBassBars(cfg, chords, bars, drumBars) {
  const notes = []
  for (let b = 0; b < bars; b++) {
    const kickSteps = drumBars?.[b]
      ? drumBars[b].kick.map((v, i) => (v > 0 ? i : -1)).filter(i => i >= 0)
      : null
    for (let half = 0; half < 2; half++) {
      const chord = chords[b * 2 + half]
      if (!chord) continue
      const barNotes = stepsForStyle(cfg.style, chord, cfg.energy, kickSteps)
        .filter(n => (half === 0 ? n.step < 8 : n.step >= 8))
      for (const n of barNotes) notes.push({ pitch: n.pitch, start: b * 16 + n.step, len: n.len, vel: VEL[n.vel] })
    }
    // 경과음: 이 마디의 마지막 코드와 다음 반마디 코드가 다르면 스텝 15를 교체
    if (cfg.autoTransition) {
      const cur = chords[b * 2 + 1] ?? chords[b * 2]
      const next = chords[(b + 1) * 2]
      if (cur && next && (next.root !== cur.root || next.quality !== cur.quality)) {
        const passStart = b * 16 + 15
        const idx = notes.findIndex(n => n.start === passStart)
        if (idx >= 0) notes.splice(idx, 1)
        notes.push({ pitch: bassRootMidi(next) - 1, start: passStart, len: 1, vel: 70 })
      }
    }
  }
  return notes.sort((a, b2) => a.start - b2.start)
}
```

- [ ] **Step 4: 통과 확인**

Run: `npx vitest run tests/bass.test.js`
Expected: 7개 테스트 PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/bass.js tests/bass.test.js
git commit -m "feat: 베이스 자동 생성 (5스타일/에너지/경과음/킥 동기화)"
```

---

### Task 6: 곡 모델 + 저장 (model.js)

**Files:**
- Create: `src/lib/model.js`, `tests/model.test.js`

**Interfaces:**
- Produces:
  - `SECTION_COLORS: string[]` (hex 6개 이상)
  - `createSection(name, bars=4) → Section` — `{id, name, color, bars, chords: {}, guitar: [{presetId:'power8'}×bars], bass: BassConfig, drums: DrumConfig, melody: []}`
    - `chords`: `{[halfBarIndex]: {root, quality, bass?}}` 객체(희소)
    - bass 기본: `{mode:'auto', style:'root8', energy:0.5, autoTransition:true, patterns:[], overrides:[]}`
    - drums 기본: `{style:'rock8', energy:0.5, autoFill:true, autoCrash:true, overrides:[]}`
    - melody: `{pitch, start, len}[]` (start: 섹션 내 16분 스텝)
  - `createSong() → Song` — `{title:'새 곡', key:{root:9, mode:'minor'}, bpm:140, sections:[], arrangement:[], customPatterns:[]}`
  - `saveSong(song, storage)`, `loadSong(storage) → Song|null` (파싱 실패 시 null)

- [ ] **Step 1: 실패하는 테스트 작성**

`tests/model.test.js`:
```js
import { describe, it, expect } from 'vitest'
import { createSong, createSection, saveSong, loadSong, SECTION_COLORS } from '../src/lib/model.js'

function memStorage() {
  const m = new Map()
  return { getItem: k => m.get(k) ?? null, setItem: (k, v) => m.set(k, String(v)) }
}

describe('model', () => {
  it('기본 곡: A단조 140BPM, 빈 배치', () => {
    const song = createSong()
    expect(song.key).toEqual({ root: 9, mode: 'minor' })
    expect(song.bpm).toBe(140)
    expect(song.arrangement).toEqual([])
  })
  it('섹션 생성: 마디수만큼 기타 슬롯, 자동 드럼/베이스 기본값', () => {
    const s = createSection('사비', 8)
    expect(s.bars).toBe(8)
    expect(s.guitar).toHaveLength(8)
    expect(s.guitar[0]).toEqual({ presetId: 'power8' })
    expect(s.drums.style).toBe('rock8')
    expect(s.bass.mode).toBe('auto')
    expect(SECTION_COLORS).toContain(s.color)
    expect(s.id).toBeTruthy()
  })
  it('저장/불러오기 라운드트립', () => {
    const storage = memStorage()
    const song = createSong()
    const sec = createSection('A멜', 4)
    song.sections.push(sec)
    song.arrangement.push(sec.id)
    saveSong(song, storage)
    expect(loadSong(storage)).toEqual(song)
  })
  it('손상된 데이터는 null', () => {
    const storage = memStorage()
    storage.setItem('midi-sketch-song', '{broken')
    expect(loadSong(storage)).toBeNull()
  })
})
```

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run tests/model.test.js`
Expected: FAIL — 모듈 없음

- [ ] **Step 3: 구현**

`src/lib/model.js`:
```js
export const SECTION_COLORS = ['#5b4a8a', '#3d6b5c', '#6b5c3d', '#8a4a5b', '#3d5c6b', '#6b3d5c']
const STORAGE_KEY = 'midi-sketch-song'
let colorIndex = 0

export function createSection(name, bars = 4) {
  return {
    id: crypto.randomUUID(),
    name,
    color: SECTION_COLORS[colorIndex++ % SECTION_COLORS.length],
    bars,
    chords: {},
    guitar: Array.from({ length: bars }, () => ({ presetId: 'power8' })),
    bass: { mode: 'auto', style: 'root8', energy: 0.5, autoTransition: true, patterns: [], overrides: [] },
    drums: { style: 'rock8', energy: 0.5, autoFill: true, autoCrash: true, overrides: [] },
    melody: [],
  }
}

export function createSong() {
  return {
    title: '새 곡',
    key: { root: 9, mode: 'minor' },
    bpm: 140,
    sections: [],
    arrangement: [],
    customPatterns: [],
  }
}

export function saveSong(song, storage = globalThis.localStorage) {
  storage.setItem(STORAGE_KEY, JSON.stringify(song))
}

export function loadSong(storage = globalThis.localStorage) {
  try {
    const raw = storage.getItem(STORAGE_KEY)
    if (!raw) return null
    const song = JSON.parse(raw)
    if (!song || !Array.isArray(song.sections)) return null
    return song
  } catch {
    return null
  }
}
```

- [ ] **Step 4: 통과 확인**

Run: `npx vitest run tests/model.test.js`
Expected: 4개 테스트 PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/model.js tests/model.test.js
git commit -m "feat: 곡 데이터 모델 + localStorage 저장/불러오기"
```

---

### Task 7: 공통 렌더러 (render.js)

**Files:**
- Create: `src/lib/render.js`, `tests/render.test.js`

**Interfaces:**
- Consumes: `GUITAR_PRESETS`/`notesForGuitarBar`, `generateDrumBars`/`DRUM_MIDI`, `generateBassBars`
- Produces:
  - `PPQ = 480`, `STEP = 120` (16분음표 틱)
  - `resolveSectionChords(section, carryIn) → (chord|null)[bars*2]` — 반마디 캐리, `carryIn`은 직전 섹션에서 넘어온 코드
  - `renderSong(song) → {melody: Ev[], guitar: Ev[], bass: Ev[], drums: Ev[]}` — Ev = `{midi, tick, dur, vel}`
  - 배치 전체를 순회하며 캐리를 이어가고, 멜로디는 섹션 오프셋에 더해 배치. 커스텀 기타 슬롯 `{customId}`는 `song.customPatterns`에서 스텝을 찾음

- [ ] **Step 1: 실패하는 테스트 작성**

`tests/render.test.js`:
```js
import { describe, it, expect } from 'vitest'
import { resolveSectionChords, renderSong, PPQ, STEP } from '../src/lib/render.js'
import { createSong, createSection } from '../src/lib/model.js'

const Am = { root: 9, quality: 'min' }
const F = { root: 5, quality: 'maj' }

function makeSong() {
  const song = createSong()
  const sec = createSection('A멜', 2)
  sec.chords = { 0: Am, 2: F }  // 마디1: Am, 마디2: F
  sec.melody = [{ pitch: 69, start: 0, len: 4 }]
  song.sections.push(sec)
  song.arrangement = [sec.id, sec.id]
  return { song, sec }
}

describe('render', () => {
  it('틱 상수', () => {
    expect(PPQ).toBe(480)
    expect(STEP).toBe(120)
  })
  it('코드 캐리: 빈 반마디는 직전 코드 유지', () => {
    const { sec } = makeSong()
    expect(resolveSectionChords(sec, null)).toEqual([Am, Am, F, F])
    expect(resolveSectionChords(createSection('빈', 1), Am)).toEqual([Am, Am])
  })
  it('renderSong: 4트랙, 섹션 반복 시 틱 오프셋 적용', () => {
    const { song } = makeSong()
    const out = renderSong(song)
    expect(Object.keys(out)).toEqual(['melody', 'guitar', 'bass', 'drums'])
    const melodyTicks = out.melody.map(e => e.tick)
    expect(melodyTicks).toEqual([0, 2 * 16 * STEP]) // 두 번째 배치는 2마디 뒤
    expect(out.melody[0].dur).toBe(4 * STEP)
    expect(out.guitar.length).toBeGreaterThan(0)
    expect(out.bass.length).toBeGreaterThan(0)
    expect(out.drums.length).toBeGreaterThan(0)
  })
  it('코드가 전혀 없으면 기타/베이스는 무음, 드럼은 나옴', () => {
    const song = createSong()
    const sec = createSection('빈', 1)
    song.sections.push(sec)
    song.arrangement = [sec.id]
    const out = renderSong(song)
    expect(out.guitar).toEqual([])
    expect(out.bass).toEqual([])
    expect(out.drums.length).toBeGreaterThan(0)
  })
})
```

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run tests/render.test.js`
Expected: FAIL — 모듈 없음

- [ ] **Step 3: 구현**

`src/lib/render.js`:
```js
import { GUITAR_PRESETS, notesForGuitarBar } from './patterns.js'
import { generateDrumBars, DRUM_MIDI } from './drums.js'
import { generateBassBars } from './bass.js'

export const PPQ = 480
export const STEP = 120 // 16분음표

export function resolveSectionChords(section, carryIn) {
  const out = []
  let cur = carryIn ?? null
  for (let i = 0; i < section.bars * 2; i++) {
    if (section.chords[i]) cur = section.chords[i]
    out.push(cur)
  }
  return out
}

function guitarSteps(slot, song) {
  if (slot.presetId) return GUITAR_PRESETS.find(p => p.id === slot.presetId)
  const custom = song.customPatterns.find(p => p.id === slot.customId)
  return custom ? { steps: custom.steps, arp: false } : null
}

const VEL_STEP = { 1: 70, 2: 100 }

export function renderSong(song) {
  const out = { melody: [], guitar: [], bass: [], drums: [] }
  let tickOffset = 0
  let carry = null

  for (const sectionId of song.arrangement) {
    const section = song.sections.find(s => s.id === sectionId)
    if (!section) continue
    const chords = resolveSectionChords(section, carry)

    // 멜로디
    for (const n of section.melody) {
      out.melody.push({ midi: n.pitch, tick: tickOffset + n.start * STEP, dur: n.len * STEP, vel: 90 })
    }

    // 드럼
    const drumBars = generateDrumBars(section.drums, section.bars)
    drumBars.forEach((bar, b) => {
      for (const [lane, steps] of Object.entries(bar)) {
        steps.forEach((v, s) => {
          if (v > 0) out.drums.push({
            midi: DRUM_MIDI[lane],
            tick: tickOffset + (b * 16 + s) * STEP,
            dur: STEP,
            vel: VEL_STEP[v],
          })
        })
      }
    })

    // 기타: 마디별 슬롯, 반마디 코드가 다르면 반씩 렌더
    for (let b = 0; b < section.bars; b++) {
      const preset = guitarSteps(section.guitar[b] ?? { presetId: 'power8' }, song)
      if (!preset) continue
      for (let half = 0; half < 2; half++) {
        const chord = chords[b * 2 + half]
        if (!chord) continue
        const notes = notesForGuitarBar(preset.steps, chord, preset.arp ?? false)
          .filter(n => (half === 0 ? n.step < 8 : n.step >= 8))
        for (const n of notes) out.guitar.push({
          midi: n.pitch, tick: tickOffset + (b * 16 + n.step) * STEP, dur: n.len * STEP, vel: n.vel,
        })
      }
    }

    // 베이스
    for (const n of generateBassBars(section.bass, chords, section.bars, drumBars)) {
      out.bass.push({ midi: n.pitch, tick: tickOffset + n.start * STEP, dur: n.len * STEP, vel: n.vel })
    }

    carry = chords[chords.length - 1] ?? carry
    tickOffset += section.bars * 16 * STEP
  }
  for (const track of Object.values(out)) track.sort((a, b) => a.tick - b.tick)
  return out
}
```

- [ ] **Step 4: 통과 확인**

Run: `npx vitest run tests/render.test.js`
Expected: 4개 테스트 PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/render.js tests/render.test.js
git commit -m "feat: 곡→노트 이벤트 공통 렌더러 (코드 캐리, 섹션 배치)"
```

---

### Task 8: MIDI 파일 생성 (midi.js)

**Files:**
- Create: `src/lib/midi.js`, `tests/midi.test.js`

**Interfaces:**
- Consumes: `renderSong`, `PPQ`
- Produces:
  - `buildMidi(song) → Uint8Array` — SMF Format 1, 트랙 5개: [0]메타(템포/박자), [1]Melody ch0, [2]Guitar ch1, [3]Bass ch2, [4]Drums ch9. 프로그램: Melody=81, Guitar=30, Bass=34 (0-base)
  - `downloadMidi(song)` — 브라우저에서 `곡제목.mid` 다운로드 (테스트 제외)

- [ ] **Step 1: 실패하는 테스트 작성**

`tests/midi.test.js`:
```js
import { describe, it, expect } from 'vitest'
import { buildMidi } from '../src/lib/midi.js'
import { createSong, createSection } from '../src/lib/model.js'

function makeSong() {
  const song = createSong()
  const sec = createSection('A멜', 1)
  sec.chords = { 0: { root: 9, quality: 'min' } }
  sec.melody = [{ pitch: 69, start: 0, len: 4 }]
  song.sections.push(sec)
  song.arrangement = [sec.id]
  return song
}

const str = (bytes, from, len) => String.fromCharCode(...bytes.slice(from, from + len))

describe('midi', () => {
  it('헤더: MThd, format 1, 5트랙, PPQ 480', () => {
    const b = buildMidi(makeSong())
    expect(str(b, 0, 4)).toBe('MThd')
    expect((b[8] << 8) | b[9]).toBe(1)     // format
    expect((b[10] << 8) | b[11]).toBe(5)   // ntrks
    expect((b[12] << 8) | b[13]).toBe(480) // division
  })
  it('트랙 청크 5개, 각 트랙은 End of Track으로 끝남', () => {
    const b = buildMidi(makeSong())
    let pos = 14, count = 0
    while (pos < b.length) {
      expect(str(b, pos, 4)).toBe('MTrk')
      const len = (b[pos + 4] << 24) | (b[pos + 5] << 16) | (b[pos + 6] << 8) | b[pos + 7]
      const end = pos + 8 + len
      expect([b[end - 3], b[end - 2], b[end - 1]]).toEqual([0xff, 0x2f, 0x00])
      pos = end
      count++
    }
    expect(count).toBe(5)
  })
  it('템포 메타: 140BPM → 428571µs', () => {
    const b = buildMidi(makeSong())
    const hex = Array.from(b).map(x => x.toString(16).padStart(2, '0')).join(' ')
    // ff 51 03 06 8a 1b = set tempo 428571
    expect(hex).toContain('ff 51 03 06 8a 1b')
  })
  it('드럼 노트는 채널 10(0x99)', () => {
    const b = buildMidi(makeSong())
    expect(Array.from(b)).toContain(0x99)
  })
})
```

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run tests/midi.test.js`
Expected: FAIL — 모듈 없음

- [ ] **Step 3: 구현**

`src/lib/midi.js`:
```js
import { renderSong, PPQ } from './render.js'

function vlq(n) {
  const bytes = [n & 0x7f]
  while ((n >>= 7) > 0) bytes.unshift((n & 0x7f) | 0x80)
  return bytes
}
const str = s => [...s].map(c => c.charCodeAt(0))
const u16 = n => [(n >> 8) & 0xff, n & 0xff]
const u32 = n => [(n >>> 24) & 0xff, (n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff]

function trackChunk(events) {
  // events: {tick, bytes[]} — 정렬 후 델타 인코딩, EOT 추가
  events.sort((a, b) => a.tick - b.tick)
  const data = []
  let last = 0
  for (const e of events) {
    data.push(...vlq(e.tick - last), ...e.bytes)
    last = e.tick
  }
  data.push(...vlq(0), 0xff, 0x2f, 0x00)
  return [...str('MTrk'), ...u32(data.length), ...data]
}

function noteTrack(name, notes, channel, program) {
  const ev = [{ tick: 0, bytes: [0xff, 0x03, name.length, ...str(name)] }]
  if (program != null) ev.push({ tick: 0, bytes: [0xc0 | channel, program] })
  for (const n of notes) {
    ev.push({ tick: n.tick, bytes: [0x90 | channel, n.midi, n.vel] })
    ev.push({ tick: n.tick + n.dur, bytes: [0x80 | channel, n.midi, 0] })
  }
  return trackChunk(ev)
}

export function buildMidi(song) {
  const { melody, guitar, bass, drums } = renderSong(song)
  const tempo = Math.round(60_000_000 / song.bpm)
  const meta = trackChunk([
    { tick: 0, bytes: [0xff, 0x58, 0x04, 4, 2, 24, 8] }, // 4/4
    { tick: 0, bytes: [0xff, 0x51, 0x03, (tempo >> 16) & 0xff, (tempo >> 8) & 0xff, tempo & 0xff] },
  ])
  const bytes = [
    ...str('MThd'), ...u32(6), ...u16(1), ...u16(5), ...u16(PPQ),
    ...meta,
    ...noteTrack('Melody', melody, 0, 81),
    ...noteTrack('Guitar', guitar, 1, 30),
    ...noteTrack('Bass', bass, 2, 34),
    ...noteTrack('Drums', drums, 9, null),
  ]
  return new Uint8Array(bytes)
}

export function downloadMidi(song) {
  const blob = new Blob([buildMidi(song)], { type: 'audio/midi' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `${song.title || 'sketch'}.mid`
  a.click()
  URL.revokeObjectURL(a.href)
}
```

- [ ] **Step 4: 통과 확인**

Run: `npx vitest run tests/midi.test.js`
Expected: 4개 테스트 PASS. 이어서 `npm test`로 전체 회귀 확인

- [ ] **Step 5: Commit**

```bash
git add src/lib/midi.js tests/midi.test.js
git commit -m "feat: SMF Format 1 MIDI 파일 생성 + 다운로드"
```

---

### Task 9: Web Audio 재생 (audio.js)

**Files:**
- Create: `src/lib/audio.js`, `tests/audio.test.js`

**Interfaces:**
- Consumes: `renderSong`, `PPQ`
- Produces:
  - `midiFreq(midi) → Hz` (테스트 대상)
  - `createPlayer() → {play(song, onEnd?), stop(), playChord(chord)}` — play는 곡 전체 스케줄, playChord는 코드 미리 듣기(1초). AudioContext는 play 시점에 생성(Safari 자동재생 정책)
  - 음색: 멜로디=square, 기타=sawtooth+lowpass, 베이스=triangle, 드럼=합성(킥 sine드롭/스네어·햇·크래시 noise/탐 sine)

- [ ] **Step 1: 순수 부분 테스트 작성**

`tests/audio.test.js`:
```js
import { describe, it, expect } from 'vitest'
import { midiFreq } from '../src/lib/audio.js'

describe('audio', () => {
  it('A4=440Hz, 옥타브=2배', () => {
    expect(midiFreq(69)).toBeCloseTo(440)
    expect(midiFreq(81)).toBeCloseTo(880)
    expect(midiFreq(57)).toBeCloseTo(220)
  })
})
```

Run: `npx vitest run tests/audio.test.js` → FAIL 확인

- [ ] **Step 2: 구현**

`src/lib/audio.js`:
```js
import { renderSong, PPQ } from './render.js'
import { DRUM_MIDI } from './drums.js'
import { chordPcs } from './theory.js'

export function midiFreq(midi) {
  return 440 * Math.pow(2, (midi - 69) / 12)
}

function tone(ctx, dest, { freq, at, dur, type, gain = 0.2, filterHz }) {
  const osc = ctx.createOscillator()
  osc.type = type
  osc.frequency.value = freq
  const g = ctx.createGain()
  g.gain.setValueAtTime(gain, at)
  g.gain.exponentialRampToValueAtTime(0.001, at + dur)
  let node = osc
  if (filterHz) {
    const f = ctx.createBiquadFilter()
    f.type = 'lowpass'
    f.frequency.value = filterHz
    osc.connect(f)
    node = f
  }
  node.connect(g).connect(dest)
  osc.start(at)
  osc.stop(at + dur + 0.05)
}

function noise(ctx, dest, { at, dur, filterType, filterHz, gain }) {
  const len = Math.max(1, Math.floor(ctx.sampleRate * dur))
  const buf = ctx.createBuffer(1, len, ctx.sampleRate)
  const data = buf.getChannelData(0)
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1
  const src = ctx.createBufferSource()
  src.buffer = buf
  const f = ctx.createBiquadFilter()
  f.type = filterType
  f.frequency.value = filterHz
  const g = ctx.createGain()
  g.gain.setValueAtTime(gain, at)
  g.gain.exponentialRampToValueAtTime(0.001, at + dur)
  src.connect(f).connect(g).connect(dest)
  src.start(at)
}

function drumSound(ctx, dest, midi, at, vel) {
  const v = vel / 127
  if (midi === DRUM_MIDI.kick) {
    const osc = ctx.createOscillator()
    osc.frequency.setValueAtTime(120, at)
    osc.frequency.exponentialRampToValueAtTime(45, at + 0.12)
    const g = ctx.createGain()
    g.gain.setValueAtTime(0.8 * v, at)
    g.gain.exponentialRampToValueAtTime(0.001, at + 0.15)
    osc.connect(g).connect(dest)
    osc.start(at); osc.stop(at + 0.2)
  } else if (midi === DRUM_MIDI.snare) {
    noise(ctx, dest, { at, dur: 0.15, filterType: 'highpass', filterHz: 1500, gain: 0.5 * v })
    tone(ctx, dest, { freq: 180, at, dur: 0.1, type: 'triangle', gain: 0.3 * v })
  } else if (midi === DRUM_MIDI.hat) {
    noise(ctx, dest, { at, dur: 0.05, filterType: 'highpass', filterHz: 7000, gain: 0.25 * v })
  } else if (midi === DRUM_MIDI.crash) {
    noise(ctx, dest, { at, dur: 0.8, filterType: 'highpass', filterHz: 4000, gain: 0.3 * v })
  } else if (midi === DRUM_MIDI.hiTom || midi === DRUM_MIDI.floorTom) {
    const freq = midi === DRUM_MIDI.hiTom ? 180 : 110
    tone(ctx, dest, { freq, at, dur: 0.25, type: 'sine', gain: 0.5 * v })
  }
}

const TIMBRE = {
  melody: { type: 'square', gain: 0.12 },
  guitar: { type: 'sawtooth', gain: 0.08, filterHz: 2500 },
  bass: { type: 'triangle', gain: 0.25 },
}

export function createPlayer() {
  let ctx = null
  let endTimer = null

  function ensureCtx() {
    if (!ctx || ctx.state === 'closed') ctx = new (window.AudioContext || window.webkitAudioContext)()
    return ctx
  }

  return {
    play(song, onEnd) {
      this.stop()
      const c = ensureCtx()
      const secPerTick = 60 / (song.bpm * PPQ)
      const t0 = c.currentTime + 0.1
      const tracks = renderSong(song)
      let lastEnd = 0
      for (const [name, events] of Object.entries(tracks)) {
        for (const e of events) {
          const at = t0 + e.tick * secPerTick
          const dur = e.dur * secPerTick
          lastEnd = Math.max(lastEnd, e.tick * secPerTick + dur)
          if (name === 'drums') drumSound(c, c.destination, e.midi, at, e.vel)
          else tone(c, c.destination, { freq: midiFreq(e.midi), at, dur, ...TIMBRE[name], gain: TIMBRE[name].gain * (e.vel / 100) })
        }
      }
      endTimer = setTimeout(() => { this.stop(); onEnd?.() }, (lastEnd + 0.3) * 1000)
    },
    playChord(chord) {
      const c = ensureCtx()
      const at = c.currentTime + 0.05
      const rootMidi = 48 + ((chord.root) % 12)
      for (const pc of chordPcs(chord)) {
        const m = rootMidi + ((pc - chord.root + 12) % 12)
        tone(c, c.destination, { freq: midiFreq(m), at, dur: 1, type: 'triangle', gain: 0.15 })
      }
    },
    stop() {
      clearTimeout(endTimer)
      if (ctx && ctx.state !== 'closed') { ctx.close(); ctx = null }
    },
  }
}
```

- [ ] **Step 3: 테스트 통과 + 전체 회귀 확인**

Run: `npm test`
Expected: 전체 PASS

- [ ] **Step 4: Commit**

```bash
git add src/lib/audio.js tests/audio.test.js
git commit -m "feat: Web Audio 신스 재생기 (곡 재생/코드 미리듣기)"
```

---

### Task 10: 스토어 + 앱 셸 + 상단 바

**Files:**
- Create: `src/lib/store.js`, `src/ui/TopBar.svelte`
- Modify: `src/ui/App.svelte`

**Interfaces:**
- Produces:
  - `store.js`: `song` (writable, loadSong() ?? createSong(), 변경 시 300ms 디바운스 자동 저장), `selectedSectionId` (writable), `player` (createPlayer() 싱글턴), `playing` (writable bool)
  - TopBar에서 제목/키/BPM 편집, 재생/정지, MIDI 내보내기. 배치가 비면 재생·내보내기 버튼 disabled + title 툴팁 "곡 배치에 섹션을 추가하세요"

- [ ] **Step 1: 구현**

`src/lib/store.js`:
```js
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
```

`src/ui/TopBar.svelte`:
```svelte
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
```

`src/ui/App.svelte` (전체 교체):
```svelte
<script>
  import TopBar from './TopBar.svelte'
</script>

<main>
  <TopBar />
  <!-- ArrangeLane, SectionEditor는 이후 태스크에서 추가 -->
</main>

<style>
  :global(body) { margin: 0; background: #1a1d24; color: #e8eaf0; font-family: -apple-system, sans-serif; }
  main { max-width: 1100px; margin: 0 auto; padding: 16px; display: flex; flex-direction: column; gap: 12px; }
</style>
```

- [ ] **Step 2: 수동 확인**

Run: `npm run dev` 후 브라우저에서 열기
확인: 다크 UI 표시, 제목/키/BPM 편집 후 새로고침해도 유지(localStorage), 재생·내보내기 버튼은 비활성(배치 없음) + 툴팁

- [ ] **Step 3: 전체 테스트 회귀**

Run: `npm test`
Expected: 전체 PASS

- [ ] **Step 4: Commit**

```bash
git add src/lib/store.js src/ui/
git commit -m "feat: 스토어(자동저장) + 앱 셸 + 상단 바"
```

---

### Task 11: 곡 배치 레인 (ArrangeLane)

**Files:**
- Create: `src/ui/ArrangeLane.svelte`
- Modify: `src/ui/App.svelte` (ArrangeLane 추가)

**Interfaces:**
- Consumes: `song`, `selectedSectionId` (store.js), `createSection` (model.js)
- Produces: 섹션 추가(이름 프롬프트, 기본 4마디)/복제/삭제, 배치 칩 드래그 재정렬, 칩 클릭 → `selectedSectionId` 설정. 배치에서 칩 우클릭(또는 ✕)으로 해당 배치 항목만 제거. "라이브러리"(sections)와 "배치"(arrangement) 두 줄 표시

- [ ] **Step 1: 구현**

`src/ui/ArrangeLane.svelte`:
```svelte
<script>
  import { song, selectedSectionId } from '../lib/store.js'
  import { createSection } from '../lib/model.js'

  let dragIndex = null

  const byId = id => $song.sections.find(s => s.id === id)

  function addSection() {
    const name = prompt('섹션 이름 (예: 인트로, A멜, 사비)', '새 섹션')
    if (!name) return
    const sec = createSection(name)
    $song.sections = [...$song.sections, sec]
    $song.arrangement = [...$song.arrangement, sec.id]
    $selectedSectionId = sec.id
  }
  function duplicateSection(sec) {
    const copy = { ...structuredClone(sec), id: crypto.randomUUID(), name: sec.name + ' 복제' }
    $song.sections = [...$song.sections, copy]
    $song.arrangement = [...$song.arrangement, copy.id]
  }
  function deleteSection(sec) {
    if (!confirm(`"${sec.name}" 섹션을 삭제할까요? 배치에서도 모두 제거됩니다.`)) return
    $song.sections = $song.sections.filter(s => s.id !== sec.id)
    $song.arrangement = $song.arrangement.filter(id => id !== sec.id)
    if ($selectedSectionId === sec.id) $selectedSectionId = $song.sections[0]?.id ?? null
  }
  function appendToArrangement(sec) {
    $song.arrangement = [...$song.arrangement, sec.id]
  }
  function removeAt(i) {
    $song.arrangement = $song.arrangement.filter((_, idx) => idx !== i)
  }
  function drop(i) {
    if (dragIndex === null || dragIndex === i) return
    const arr = [...$song.arrangement]
    const [moved] = arr.splice(dragIndex, 1)
    arr.splice(i, 0, moved)
    $song.arrangement = arr
    dragIndex = null
  }
</script>

<section>
  <div class="label">섹션 라이브러리 — 클릭해서 편집, ＋로 배치에 추가</div>
  <div class="row">
    {#each $song.sections as sec (sec.id)}
      <span class="chip" class:selected={$selectedSectionId === sec.id}
        style="background:{sec.color}" on:click={() => ($selectedSectionId = sec.id)} role="button" tabindex="0"
        on:keydown={e => e.key === 'Enter' && ($selectedSectionId = sec.id)}>
        {sec.name} ({sec.bars}마디)
        <button class="mini" title="배치에 추가" on:click|stopPropagation={() => appendToArrangement(sec)}>＋</button>
        <button class="mini" title="복제" on:click|stopPropagation={() => duplicateSection(sec)}>⧉</button>
        <button class="mini" title="삭제" on:click|stopPropagation={() => deleteSection(sec)}>✕</button>
      </span>
    {/each}
    <button class="add" on:click={addSection}>＋ 새 섹션</button>
  </div>

  <div class="label">곡 배치 — 드래그로 순서 변경</div>
  <div class="row">
    {#each $song.arrangement as id, i (i)}
      <span class="chip" draggable="true" style="background:{byId(id)?.color}"
        on:dragstart={() => (dragIndex = i)} on:dragover|preventDefault on:drop={() => drop(i)}
        role="button" tabindex="0">
        {byId(id)?.name}
        <button class="mini" title="배치에서 제거" on:click={() => removeAt(i)}>✕</button>
      </span>
    {/each}
    {#if $song.arrangement.length === 0}
      <span class="hint">비어 있어요 — 섹션의 ＋ 버튼으로 추가하세요</span>
    {/if}
  </div>
</section>

<style>
  section { background: #242833; padding: 10px 14px; border-radius: 8px; display: flex; flex-direction: column; gap: 8px; }
  .label { font-size: 12px; color: #8b93a7; }
  .row { display: flex; gap: 6px; flex-wrap: wrap; align-items: center; }
  .chip { padding: 6px 10px; border-radius: 6px; font-size: 13px; cursor: pointer; display: inline-flex; gap: 4px; align-items: center; }
  .chip.selected { outline: 2px solid #ff7a9c; }
  .mini { background: rgba(0,0,0,0.25); border: none; color: #fff; border-radius: 4px; cursor: pointer; font-size: 11px; padding: 1px 5px; }
  .add { border: 1px dashed #555e70; background: transparent; color: #8b93a7; border-radius: 6px; padding: 6px 12px; cursor: pointer; }
  .hint { font-size: 12px; color: #666e80; }
</style>
```

`src/ui/App.svelte`의 `<main>`에 `<TopBar />` 다음 줄 추가:
```svelte
<script>
  import TopBar from './TopBar.svelte'
  import ArrangeLane from './ArrangeLane.svelte'
</script>

<main>
  <TopBar />
  <ArrangeLane />
</main>
```
(style 블록은 기존 유지)

- [ ] **Step 2: 수동 확인**

Run: `npm run dev`
확인: 섹션 생성→배치 추가→드래그 재정렬→복제/삭제→새로고침 후 유지. 배치가 생기면 상단 바 재생/내보내기 활성화

- [ ] **Step 3: Commit**

```bash
git add src/ui/ && git commit -m "feat: 섹션 라이브러리 + 곡 배치 레인 (드래그 재정렬)"
```

---

### Task 12: 코드 레인 + 코드 빌더

**Files:**
- Create: `src/ui/ChordLane.svelte`, `src/ui/ChordBuilder.svelte`, `src/ui/SectionEditor.svelte`
- Modify: `src/ui/App.svelte`

**Interfaces:**
- Consumes: theory.js 전부, `player.playChord`, store
- Produces:
  - SectionEditor: `selectedSectionId`의 섹션을 찾아 레인들 배치(이번 태스크는 ChordLane만, 이후 태스크가 레인 추가). 마디 수 변경 UI(guitar 슬롯 길이 동기화)
  - ChordLane: 반마디 슬롯 그리드(`bars*2`칸). 채워진 슬롯은 chordLabel 표시, 캐리 구간은 흐리게. 클릭 → ChordBuilder 팝업. 슬롯의 ✕로 코드 제거
  - ChordBuilder: [추천] 탭 — 다이어토닉 7코드(★) + ROCK_PROGRESSIONS 원클릭(첫 4마디에 마디당 1개 적용), [직접 만들기] 탭 — 루트 12 × 종류 9 × 베이스음 선택, 🔊 미리 듣기, 키에 어울리면 ★ 표시. 선택 시 해당 슬롯에 저장

- [ ] **Step 1: 구현**

`src/ui/SectionEditor.svelte`:
```svelte
<script>
  import { song, selectedSectionId } from '../lib/store.js'
  import ChordLane from './ChordLane.svelte'

  $: section = $song.sections.find(s => s.id === $selectedSectionId)

  function setBars(e) {
    const bars = Number(e.target.value)
    section.bars = bars
    section.guitar = Array.from({ length: bars }, (_, i) => section.guitar[i] ?? { presetId: 'power8' })
    // 범위 밖 코드/멜로디 정리
    for (const k of Object.keys(section.chords)) if (Number(k) >= bars * 2) delete section.chords[k]
    section.melody = section.melody.filter(n => n.start < bars * 16)
    $song = $song
  }
</script>

{#if section}
  <section>
    <div class="head">
      <strong style="color:{section.color}">■</strong>
      <input bind:value={section.name} on:input={() => ($song = $song)} />
      <label>마디
        <select value={section.bars} on:change={setBars}>
          {#each [2, 4, 8, 16] as b}<option value={b}>{b}</option>{/each}
        </select>
      </label>
    </div>
    <ChordLane {section} />
  </section>
{:else}
  <section class="empty">섹션을 선택하거나 새로 만들어 편집을 시작하세요</section>
{/if}

<style>
  section { background: #242833; padding: 10px 14px; border-radius: 8px; display: flex; flex-direction: column; gap: 10px; }
  .head { display: flex; gap: 8px; align-items: center; }
  .head input { background: #333a4a; border: none; color: #fff; border-radius: 6px; padding: 4px 8px; font-weight: 700; }
  label { font-size: 13px; color: #8b93a7; }
  select { background: #333a4a; color: #e8eaf0; border: none; border-radius: 6px; padding: 4px 8px; }
  .empty { color: #666e80; font-size: 13px; }
</style>
```

`src/ui/ChordLane.svelte`:
```svelte
<script>
  import { song } from '../lib/store.js'
  import { chordLabel } from '../lib/theory.js'
  import { resolveSectionChords } from '../lib/render.js'
  import ChordBuilder from './ChordBuilder.svelte'

  export let section
  let editingSlot = null // halfBarIndex | null

  $: resolved = resolveSectionChords(section, null)

  function setChord(slot, chord) {
    if (chord) section.chords[slot] = chord
    else delete section.chords[slot]
    $song = $song
    editingSlot = null
  }
  function applyProgression(chords) {
    // 첫 4마디에 마디당 1개
    chords.forEach((ch, i) => { if (i < section.bars) section.chords[i * 2] = ch })
    $song = $song
    editingSlot = null
  }
</script>

<div class="label">코드 — 칸 클릭으로 선택 (반마디 단위)</div>
<div class="grid" style="grid-template-columns: repeat({section.bars * 2}, 1fr)">
  {#each resolved as chord, slot}
    <button class="slot" class:own={section.chords[slot]} class:carry={!section.chords[slot] && chord}
      on:click={() => (editingSlot = slot)}>
      {chord ? chordLabel(chord) : '＋'}
      {#if section.chords[slot]}
        <span class="x" on:click|stopPropagation={() => setChord(slot, null)} role="button" tabindex="0">✕</span>
      {/if}
    </button>
  {/each}
</div>

{#if editingSlot !== null}
  <ChordBuilder
    current={section.chords[editingSlot] ?? null}
    on:select={e => setChord(editingSlot, e.detail)}
    on:progression={e => applyProgression(e.detail)}
    on:close={() => (editingSlot = null)} />
{/if}

<style>
  .label { font-size: 12px; color: #8b93a7; }
  .grid { display: grid; gap: 4px; }
  .slot { background: #333a48; border: none; color: #8b93a7; border-radius: 5px; padding: 8px 2px; font-size: 13px; cursor: pointer; position: relative; }
  .slot.own { background: #4a5470; color: #fff; }
  .slot.carry { color: #666e80; font-style: italic; }
  .x { position: absolute; top: -6px; right: -4px; background: #555; border-radius: 50%; font-size: 9px; padding: 1px 4px; display: none; }
  .slot:hover .x { display: inline; }
</style>
```

`src/ui/ChordBuilder.svelte`:
```svelte
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
    <div class="sub">록 인기 진행 한번에 넣기 (첫 4마디)</div>
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
```

`src/ui/App.svelte`에 SectionEditor 추가:
```svelte
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
```

- [ ] **Step 2: 수동 확인**

Run: `npm run dev`
확인: 섹션 선택→코드 칸 클릭→추천 탭에서 다이어토닉 호버 시 소리, 진행 원클릭 적용, 직접 만들기 탭에서 E7 등 생성·미리듣기·★ 표시, 캐리 구간 흐리게 표시, ✕로 제거

- [ ] **Step 3: Commit**

```bash
git add src/ui/ && git commit -m "feat: 코드 레인 + 코드 빌더 (추천/직접 만들기/미리듣기)"
```

---

### Task 13: 기타 레인 + 스텝 편집기

**Files:**
- Create: `src/ui/StepEditor.svelte`, `src/ui/GuitarLane.svelte`
- Modify: `src/ui/SectionEditor.svelte` (GuitarLane 추가)

**Interfaces:**
- Consumes: `GUITAR_PRESETS`, store, `song.customPatterns`
- Produces:
  - StepEditor: `export let steps` (16칸 0|1|2), 클릭 시 0→2→1→0 순환, `on:change`로 새 배열 dispatch. 색: 2=진한 주황(#ff9d5c), 1=연한 주황(#ffb98a), 0=#333a48
  - GuitarLane: 마디별 셀렉트(프리셋 4종 + 저장된 커스텀 + "커스텀 편집..."). "커스텀 편집..." 선택 시 현재 스텝을 StepEditor로 열고, 저장 시 이름 프롬프트 → `song.customPatterns`에 `{id, name, track:'guitar', steps}` 추가 후 해당 마디에 `{customId}` 참조

- [ ] **Step 1: 구현**

`src/ui/StepEditor.svelte`:
```svelte
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
```

`src/ui/GuitarLane.svelte`:
```svelte
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
```

`src/ui/SectionEditor.svelte`의 `<ChordLane {section} />` 아래에 추가:
```svelte
<GuitarLane {section} />
```
(script에 `import GuitarLane from './GuitarLane.svelte'` 추가)

- [ ] **Step 2: 수동 확인**

Run: `npm run dev`
확인: 마디별 프리셋 변경, 커스텀 편집→스텝 순환 클릭→저장→다른 마디 셀렉트에 커스텀 항목 등장, 재생 시 반영

- [ ] **Step 3: Commit**

```bash
git add src/ui/ && git commit -m "feat: 기타 레인 + 16스텝 커스텀 편집기 (저장/재사용)"
```

---

### Task 14: 드럼 레인 + 베이스 레인

**Files:**
- Create: `src/ui/DrumLane.svelte`, `src/ui/BassLane.svelte`
- Modify: `src/ui/SectionEditor.svelte`

**Interfaces:**
- Consumes: drums.js, bass.js, render.js(`resolveSectionChords`), store
- Produces:
  - DrumLane: 스타일 버튼(5종), 에너지 슬라이더(0-1, step 0.1), 필인/크래시 체크박스, 생성 결과 그리드(6레인×bars×16, 읽기전용 표시+클릭 시 override 토글 0→2→1→0). 레인 한글명: 크래시/하이햇/스네어/하이탐/플로어탐/킥
  - BassLane: 모드 토글(자동|수동). 자동: 스타일 버튼(5종)+에너지+연결음 체크박스+결과 그리드(생성된 노트를 스텝 표시, 읽기전용). 수동: 마디별 GuitarLane과 동일한 패턴 선택(간단화: 이번엔 자동 모드만 완성하고 수동 토글은 "준비 중" 뱃지 — YAGNI, 스펙의 '전환 가능'은 자동 우선)

- [ ] **Step 1: 구현**

`src/ui/DrumLane.svelte`:
```svelte
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
  .lane { display: flex; gap: 6px; align-items: center; }
  .name { width: 56px; font-size: 11px; color: #8b93a7; text-align: right; flex-shrink: 0; }
  .bar { display: grid; grid-template-columns: repeat(16, 12px); gap: 1px; }
  .cell { height: 14px; border: none; border-radius: 2px; cursor: pointer; padding: 0; }
  .hint { font-size: 11px; color: #666e80; margin-top: 4px; }
</style>
```

`src/ui/BassLane.svelte`:
```svelte
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
  <div class="bar-grid" style="grid-template-columns: repeat({totalSteps}, 12px)">
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
  .bar-grid { display: grid; gap: 1px; margin-top: 6px; overflow-x: auto; }
  .cell { height: 14px; border-radius: 2px; }
  .cell.beat { outline: 1px solid #454e63; }
  .hint { font-size: 11px; color: #666e80; margin-top: 4px; }
</style>
```

`src/ui/SectionEditor.svelte`의 `<GuitarLane {section} />` 아래에 추가:
```svelte
<BassLane {section} />
<DrumLane {section} />
```
(script에 import 2줄 추가)

- [ ] **Step 2: 수동 확인**

Run: `npm run dev`
확인: 드럼 스타일 바꾸면 그리드 즉시 변경, 에너지 슬라이더 반영, 마지막 마디 탐 필인 표시(초록), 칸 클릭 오버라이드, 베이스는 코드 넣기 전 안내문→코드 넣으면 그리드 표시, 재생하면 드럼+베이스 들림

- [ ] **Step 3: Commit**

```bash
git add src/ui/ && git commit -m "feat: 드럼/베이스 자동 생성 레인 (스타일·에너지·오버라이드)"
```

---

### Task 15: 멜로디 그리드 (화성 색상 가이드)

**Files:**
- Create: `src/ui/MelodyGrid.svelte`
- Modify: `src/ui/SectionEditor.svelte`

**Interfaces:**
- Consumes: `classify`(theory.js), `resolveSectionChords`(render.js), store
- Produces: C4(60)~B5(83) 세로 24행(위가 높은 음), 가로 `bars*16` 스텝. 배경색 = classify 결과: chord=#3d4b3a / scale=#333a48 / out=#2a2530. 노트=#ffd166. 클릭: 빈 칸→길이1 노트 추가, 노트 칸→삭제. 노트에서 mousedown 후 오른쪽으로 드래그→길이 연장. 행 머리글은 코드톤 여부와 무관하게 음이름(C4 등), 옥타브 구분선

- [ ] **Step 1: 구현**

`src/ui/MelodyGrid.svelte`:
```svelte
<script>
  import { song } from '../lib/store.js'
  import { NOTE_NAMES, classify } from '../lib/theory.js'
  import { resolveSectionChords } from '../lib/render.js'

  export let section
  const PITCHES = Array.from({ length: 24 }, (_, i) => 83 - i) // B5 → C4
  let dragging = null // {pitch, start}

  $: chords = resolveSectionChords(section, null)
  $: totalSteps = section.bars * 16

  const pitchName = m => NOTE_NAMES[m % 12].replace('♯', '#') + (Math.floor(m / 12) - 1)
  const chordAt = step => chords[Math.floor(step / 8)] ?? null

  function noteAt(pitch, step) {
    return section.melody.find(n => n.pitch === pitch && step >= n.start && step < n.start + n.len)
  }
  function cellDown(pitch, step) {
    const existing = noteAt(pitch, step)
    if (existing) {
      section.melody = section.melody.filter(n => n !== existing)
    } else {
      section.melody = [...section.melody, { pitch, start: step, len: 1 }]
      dragging = { pitch, start: step }
    }
    $song = $song
  }
  function cellEnter(pitch, step) {
    if (!dragging || pitch !== dragging.pitch || step <= dragging.start) return
    const note = section.melody.find(n => n.pitch === dragging.pitch && n.start === dragging.start)
    if (note) { note.len = step - note.start + 1; $song = $song }
  }
</script>

<div class="label">멜로디 — 클릭해서 찍기, 오른쪽 드래그로 길이 조절</div>
<div class="wrap" on:mouseup={() => (dragging = null)} on:mouseleave={() => (dragging = null)} role="grid" tabindex="0">
  {#each PITCHES as pitch}
    <div class="row" class:octave={pitch % 12 === 0}>
      <span class="name">{pitchName(pitch)}</span>
      {#each Array(totalSteps) as _, step}
        {@const note = noteAt(pitch, step)}
        {@const cls = classify(pitch, chordAt(step), $song.key)}
        <button
          class="cell {cls}"
          class:note={!!note}
          class:beat={step % 16 === 0}
          on:mousedown={() => cellDown(pitch, step)}
          on:mouseenter={() => cellEnter(pitch, step)}
          aria-label="{pitchName(pitch)} 스텝 {step + 1}" />
      {/each}
    </div>
  {/each}
</div>
<div class="legend">
  <span><i style="background:#ffd166" /> 찍은 음</span>
  <span><i style="background:#3d4b3a" /> 코드에 잘 어울림</span>
  <span><i style="background:#333a48" /> 무난 (스케일 음)</span>
  <span><i style="background:#2a2530" /> 불협 주의</span>
</div>

<style>
  .label { font-size: 12px; color: #8b93a7; }
  .wrap { overflow-x: auto; margin-top: 6px; user-select: none; }
  .row { display: flex; gap: 1px; margin-bottom: 1px; align-items: center; }
  .row.octave { border-bottom: 1px solid #454e63; }
  .name { width: 34px; font-size: 10px; color: #8b93a7; text-align: right; padding-right: 4px; flex-shrink: 0; }
  .cell { width: 13px; height: 13px; border: none; border-radius: 2px; cursor: pointer; padding: 0; flex-shrink: 0; }
  .cell.chord { background: #3d4b3a; }
  .cell.scale { background: #333a48; }
  .cell.out { background: #2a2530; }
  .cell.note { background: #ffd166 !important; }
  .cell.beat { outline: 1px solid #454e63; }
  .legend { display: flex; gap: 14px; font-size: 11px; color: #8b93a7; margin-top: 6px; }
  .legend i { display: inline-block; width: 10px; height: 10px; border-radius: 2px; margin-right: 4px; }
</style>
```

`src/ui/SectionEditor.svelte`의 `<ChordLane {section} />` 바로 아래(기타 위)에 추가:
```svelte
<MelodyGrid {section} />
```
(script에 `import MelodyGrid from './MelodyGrid.svelte'` 추가)

- [ ] **Step 2: 수동 확인**

Run: `npm run dev`
확인: 코드가 있는 마디는 코드톤 칸이 밝은 초록, 코드 바뀌면 색도 바뀜, 클릭으로 노트 추가/삭제, 드래그로 길이 연장, 재생 시 멜로디 들림, A단조에서 A#행이 어둡게 표시

- [ ] **Step 3: Commit**

```bash
git add src/ui/ && git commit -m "feat: 화성 색상 가이드 멜로디 그리드"
```

---

### Task 16: 프로젝트 파일 내보내기/가져오기 + 최종 빌드 검증

**Files:**
- Modify: `src/ui/TopBar.svelte` (JSON 내보내기/가져오기 버튼)

**Interfaces:**
- Consumes: store, model.js
- Produces: "프로젝트 저장"(JSON 다운로드 `곡제목.json`), "프로젝트 열기"(파일 선택→검증 후 song 교체, 실패 시 alert)

- [ ] **Step 1: TopBar에 추가**

`src/ui/TopBar.svelte` script에 추가:
```js
function exportProject() {
  const blob = new Blob([JSON.stringify($song, null, 2)], { type: 'application/json' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `${$song.title || 'sketch'}.json`
  a.click()
  URL.revokeObjectURL(a.href)
}
async function importProject(e) {
  const file = e.target.files[0]
  if (!file) return
  try {
    const data = JSON.parse(await file.text())
    if (!data || !Array.isArray(data.sections) || !Array.isArray(data.arrangement)) throw new Error()
    $song = data
  } catch {
    alert('프로젝트 파일을 읽을 수 없어요')
  }
  e.target.value = ''
}
```

`<span class="spacer" />` 앞에 마크업 추가:
```svelte
<button class="ghost" on:click={exportProject}>저장</button>
<label class="ghost file">열기<input type="file" accept=".json" on:change={importProject} /></label>
```

style에 추가:
```css
.ghost { background: #333a4a; color: #8b93a7; font-size: 12px; }
.file { cursor: pointer; padding: 6px 14px; border-radius: 6px; }
.file input { display: none; }
```

- [ ] **Step 2: 전체 테스트 + 빌드**

Run: `npm test && npm run build && ls dist/`
Expected: 전체 테스트 PASS, `dist/index.html` 단일 파일

- [ ] **Step 3: 최종 수동 검증 (사용자와 함께)**

1. `open dist/index.html` — 더블클릭 실행 확인 (file:// 에서 동작)
2. 곡 만들기: 섹션 2개(A멜, 사비), 코드 진행 원클릭, 멜로디 몇 개, 드럼/베이스 스타일 선택
3. 재생 → 4트랙 모두 들리는지
4. MIDI 내보내기 → **Logic Pro에 드래그** → 트랙 4개(Melody/Guitar/Bass/Drums), 템포 반영, 드럼이 드럼 트랙으로 인식되는지 사용자 확인
5. 프로젝트 저장/열기 라운드트립

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat: 프로젝트 JSON 저장/열기 + 최종 빌드"
```

---

## 셀프 리뷰 결과

- 스펙 커버리지: 섹션 배치(T11), 코드 빌더+추천 진행(T12), 기타 커스텀 패턴(T13), 드럼 자동+탐 필인(T4/T14), 베이스 자동 5스타일(T5/T14), 화성 색상 멜로디(T15), 재생(T9/T10), MIDI 내보내기(T8/T10), 저장/불러오기(T6/T10/T16), 빈 상태 처리(T10/T14) — 전부 태스크에 매핑됨
- 스펙의 "수동 베이스 모드 전환"은 자동 모드 우선으로 축소(T14에 명시, YAGNI) — 사용자가 원하면 후속 작업
- 타입 일관성: `{pitch, start, len, vel}`(섹션 로컬) vs `{midi, tick, dur, vel}`(렌더 이후)로 통일, followKick은 drums 출력 재사용
