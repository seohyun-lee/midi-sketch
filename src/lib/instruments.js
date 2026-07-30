// 멜로디 음색 목록 — gm은 General MIDI 프로그램 번호(0-base)로 Logic 임포트 시 악기가 맞춰진다
export const MELODY_INSTRUMENTS = [
  { id: 'piano', name: '피아노', gm: 0 },
  { id: 'ep', name: '일렉 피아노', gm: 4 },
  { id: 'lead', name: '신스 리드', gm: 81 },
  { id: 'soft', name: '부드러운 신스', gm: 89 },
  { id: 'organ', name: '오르간', gm: 16 },
  { id: 'flute', name: '플루트', gm: 73 },
  { id: 'guitar', name: '통기타', gm: 24 },
]

export const DEFAULT_MELODY_INSTRUMENT = 'piano'

export function melodyInstrument(song) {
  return MELODY_INSTRUMENTS.find(i => i.id === song.melodyInstrument) ??
    MELODY_INSTRUMENTS.find(i => i.id === DEFAULT_MELODY_INSTRUMENT)
}
