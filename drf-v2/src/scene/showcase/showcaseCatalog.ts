import type { Locale } from '../../contracts/index.ts'
// Type-only imports: the HUD bundle opens this catalogue without pulling three.js into the first chunk.
import type { Rect } from '../garage/easterEggs.ts'

// Fila 25: the inspection showcase ("inspect item"). One entry per collectible; every caption repeats only what is
// already drawn or modelled in the room (no new biography). Names of works stay in plain text (brand rule, 11/11).
// Fila 26: where Davi wrote his own line (_fila/TEXTOS-EASTER-EGGS.md) it replaces the PT caption, in his words
// (punctuation and capitals only); the EN line keeps his tone.
type Text = Readonly<Record<Locale, string>>
export type ShowcaseSource =
  | { kind: 'model'; modelId: string }
  | { kind: 'paper'; sheets: readonly { rect: Rect; size: readonly [number, number]; offset: number; tilt: number }[] }
  | { kind: 'scarf' }
export type ShowcaseItem = { id: string; name: Text; caption: Text; source: ShowcaseSource }

const t = (pt: string, en: string): Text => ({ pt, en })
const model = (modelId: string): ShowcaseSource => ({ kind: 'model', modelId })

export const showcaseItems: readonly ShowcaseItem[] = [
  { id: 'caneca', name: t('Caneca', 'Mug'), caption: t('Não sou muito fã de café, mas tem q tomar.', 'Not a big fan of coffee, but you gotta drink it.'), source: model('caneca') },
  { id: 'capacete', name: t('Capacete', 'Helmet'), caption: t('DAVI nas laterais e o número 16 atrás.', 'DAVI on the sides and number 16 at the back.'), source: model('capacete') },
  { id: 'setlists', name: t('Setlists', 'Setlists'), caption: t('NOITE 1 e NOITE 2 — a segunda com Pink Floyd fechando com Eclipse.', 'NIGHT 1 and NIGHT 2 — the second with Pink Floyd closing on Eclipse.'),
    source: { kind: 'paper', sheets: [{ rect: 'setlist1', size: [.28, .42], offset: -.155, tilt: .02 }, { rect: 'setlist2', size: [.28, .42], offset: .155, tilt: -.015 }] } },
  { id: 'watchlist', name: t('Watchlist', 'Watchlist'), caption: t('Seis animes vistos e três em andamento: Vinland Saga, Fullmetal Alchemist e Jujutsu Kaisen.', 'Six anime watched and three in progress: Vinland Saga, Fullmetal Alchemist and Jujutsu Kaisen.'),
    source: { kind: 'paper', sheets: [{ rect: 'watchlist', size: [.3, .45], offset: 0, tilt: -.03 }] } },
  { id: 'quadro-automato', name: t('Quadro do autômato', 'Automaton whiteboard'), caption: t('Um autômato finito à mão: q0, q1 e q2, com transições a e b.', 'A hand-drawn finite automaton: q0, q1 and q2, with a and b transitions.'),
    source: { kind: 'paper', sheets: [{ rect: 'board', size: [1.2, .76], offset: 0, tilt: 0 }] } },
  { id: 'figure', name: t('Figure do piloto', 'Driver figure'), caption: t('Esse era pra ser meu boneco kkkkkk', 'This was supposed to be me hahaha'), source: model('figure') },
  { id: 'cobra-coral', name: t('Cobra-coral', 'Coral snake'), caption: t('Apenas um time aí de Pernambuco.', 'Just some team from Pernambuco.'), source: model('cobra-coral') },
  { id: 'amplificador', name: t('Amplificador', 'Amplifier'), caption: t('Adesivo: volume 11, só depois das 18h.', 'Sticker: volume 11, only after 6 pm.'), source: model('amplificador') },
  { id: 'guitarra', name: t('Guitarra', 'Electric guitar'), caption: t('Rock é outra parada.', 'Rock is a whole other thing.'), source: model('guitarra') },
  { id: 'case-guitarra', name: t('Case da guitarra', 'Guitar case'), caption: t('Case com uma palheta DRF em cima.', 'Case with a DRF pick on top.'), source: model('case-guitarra') },
  { id: 'post-it', name: t('Post-it', 'Sticky note'), caption: t('“Não esquecer o ANALYZE.”', '“Don’t forget the ANALYZE.”'),
    source: { kind: 'paper', sheets: [{ rect: 'postit', size: [.13, .13], offset: 0, tilt: .07 }] } },
  { id: 'bola', name: t('Bola', 'Football'), caption: t('Uma bola velha de lembrança.', 'An old ball I kept as a keepsake.'), source: model('bola') },
  { id: 'chuteira-em-pe', name: t('Chuteira 7', 'Boot 7'), caption: t('Número específico de um jogador.', 'A very specific player’s number.'), source: model('chuteira-em-pe') },
  { id: 'chuteira-caida', name: t('Chuteira com fita', 'Taped boot'), caption: t('Acho que ficou claro quem é kkkkkk', 'I think it’s pretty clear who it is hahaha'), source: model('chuteira-caida') },
  { id: 'vaso-esp32', name: t('Vaso com ESP32', 'ESP32 planter'), caption: t('Um vaso com placa: a horta inteligente em miniatura.', 'A planter with a board: the smart garden in miniature.'), source: model('vaso-esp32') },
  { id: 'cinto-ferramentas', name: t('Cinto de ferramentas', 'Tool belt'), caption: t('Ingresso do melhor herói de todos. Mas eu também assisti o filme do herói alien 7 vezes no cinema.', 'A ticket for the best hero of all time. But I also watched the alien hero’s movie 7 times at the cinema.'), source: model('cinto-ferramentas') },
  { id: 'cachecol', name: t('Cachecol', 'Scarf'), caption: t('Tricolor, sem escudo nem nome, no guarda-corpo.', 'Three colours, no crest or name, on the guard rail.'), source: { kind: 'scarf' } },
]

/** Scene group id (`easter-egg-<id>`) → showcase entry. The helmet stand opens the helmet. */
export function showcaseIdForEgg(eggId: string): string | null {
  const id = eggId === 'suporte-capacete' ? 'capacete' : eggId
  return showcaseItems.some(item => item.id === id) ? id : null
}
export function showcaseItem(id: string) { return showcaseItems.find(item => item.id === id) ?? null }

// Opening is a window event: the scene (click on an egg) and the menu (Coleção) share one overlay without touching
// the navigation state machine.
export const showcaseEvent = 'drf:showcase'
export function openShowcase(id: string | null) { window.dispatchEvent(new CustomEvent(showcaseEvent, { detail: { id } })) }
