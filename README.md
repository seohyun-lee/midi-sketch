# 🎸 MIDI Sketch

**코드(화성)를 몰라도 곡 전체를 스케치하고, Logic Pro로 가져가는 로컬 웹앱.**

Logic Pro의 복잡한 인터페이스 없이 브라우저에서 멜로디·기타·베이스·드럼을 빠르게 찍고, 표준 MIDI 파일(.mid)로 내보내 Logic에 드래그하면 트랙별로 들어갑니다. Rock / Alternative / J-Rock 스케치에 맞춰져 있어요.

## 주요 기능

- **섹션 블록 배치** — 인트로/A멜/B멜/사비를 만들어 드래그로 곡 구성. 섹션 하나를 고치면 배치된 모든 위치에 반영
- **코드 빌더** — 현재 키의 다이어토닉 코드 추천 ★, 록 상용 진행(i–VI–III–VII 등) 원클릭, 루트×종류×분수코드 직접 조합, 🔊 미리 듣기
- **화성 색상 가이드 멜로디 그리드** — 코드에 잘 어울리는 음은 밝게, 스케일 음은 중간, 불협 주의 음은 어둡게. 색만 보고 찍으면 불협 걱정 없음
- **드럼 자동 생성** — 스타일(록 8/16비트, 하프타임, 펑크, 탐 그루브) + 에너지만 고르면 끝. 섹션 끝 탐 필인, 시작 크래시 자동. 직접 못 찍어도 OK
- **베이스 자동 생성** — 루트 8비트, 옥타브 펌핑, 킥 따라가기, 워킹, 아르페지오. 코드 진행 따라 음이 자동 결정, 코드 전환 시 경과음 삽입
- **기타 패턴** — 파워코드 8비트, 뮤트 스타카토, 스트로크, 아르페지오 + 16분음표 스텝 단위 커스텀(저장/재사용)
- **Web Audio 재생** — 설치 없이 브라우저에서 바로 들으며 작업
- **MIDI 내보내기** — SMF Format 1, 트랙 4개(Melody/Guitar/Bass/Drums), 템포·박자 포함, GM 드럼맵

## 빠른 시작

```bash
npm install
npm run build
open dist/index.html   # 단일 HTML 파일 — 더블클릭으로도 실행됩니다
```

개발 모드:

```bash
npm run dev
```

## Logic Pro 워크플로우

1. 앱에서 키·템포 설정 → 섹션 만들기 → 코드 넣기 → 멜로디 찍기 → 드럼/베이스 스타일 고르기
2. ▶ 재생으로 확인
3. **⬇ MIDI 내보내기** → `곡제목.mid` 다운로드
4. Logic Pro에 드래그 → Melody / Guitar / Bass / Drums 4트랙으로 임포트
5. Logic에서 악기 지정하고 이어서 작업

작업 중인 곡은 localStorage에 자동 저장되고, "저장/열기" 버튼으로 JSON 파일 백업도 가능합니다.

## 기술 스택

- Svelte 4 + Vite 5 + [vite-plugin-singlefile](https://github.com/richardtallent/vite-plugin-singlefile) — 빌드 결과가 `dist/index.html` 단일 파일
- 외부 런타임 의존성 없음 — MIDI 바이트 생성과 신디사이저(Web Audio) 모두 직접 구현
- Vitest 단위 테스트 43개 (`npm test`)

## 프로젝트 구조

```
src/
├── lib/          # 순수 로직 (전부 단위 테스트)
│   ├── theory.js     # 스케일·코드·불협 판정·추천 진행
│   ├── patterns.js   # 기타 패턴 → 노트 변환
│   ├── drums.js      # 드럼 자동 생성
│   ├── bass.js       # 베이스 자동 생성
│   ├── render.js     # 곡 → 노트 타임라인 (재생·내보내기 공유)
│   ├── midi.js       # SMF 파일 생성
│   ├── audio.js      # Web Audio 신스
│   └── model.js      # 곡 데이터 모델 + 저장
└── ui/           # Svelte 컴포넌트 (한국어 UI)
```

---

🤖 Built with [Claude Code](https://claude.com/claude-code)
