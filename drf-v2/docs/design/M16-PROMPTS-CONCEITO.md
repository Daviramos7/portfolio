# Missão 16 · Fase 3 — Prompts de conceito (imagem de entrada da IA 3D)

Versão 1 · 23/10/2026 · destino: `drf-v2\docs\design\M16-PROMPTS-CONCEITO.md`.
Gerador: **FLUX.2 klein** (Apache 2.0), local na RTX 3060, depois do inventário aprovado (D8).
Regra D7: fotos da internet só para estudo; **nenhuma foto de terceiro entra como imagem**. Nada de logo/marca.

## Regras para a imagem servir de entrada de image-to-3D
- **Um objeto só**, inteiro no quadro, centralizado, ocupando ~70% da imagem.
- **Fundo liso** cinza-claro ou branco, **luz suave e uniforme** (estúdio), sombra mínima.
- Vista **3/4 frontal levemente de cima** (≈ 30°), lente longa (pouca distorção de perspectiva).
- Sem texto, sem logo, sem mão segurando, sem reflexo forte de ambiente.
- 1024×1024. Gerar **4 variações por prompt** (seeds registradas), o Davi escolhe 1.
- Registrar em `ASSETS.md`: modelo, versão, prompt, seed, data, hash da imagem escolhida.

Prompt negativo comum (se o modelo aceitar): `text, logo, brand, watermark, hands, people, cluttered background,
dramatic shadows, cropped object, multiple objects, motion blur, depth of field`

---

## P1 · Handgrip (teste da Fase 3)
```
Studio product photo of a single torsion-spring hand gripper exercise tool, two straight handles of
silver anodized aluminium with fine diamond knurling, one thick black steel coil spring at the top,
small engraved resistance number "45" on one handle, isolated on a plain light grey seamless background,
soft even studio lighting, three-quarter view from slightly above, entire object visible and centered,
sharp focus, realistic materials, no text other than the engraved number, no logo
```
Variante B (ajustável): `adjustable hand gripper with black foam-covered handles and a sliding resistance
dial, same framing and background`

## P2 · Controle "inspirado no 360", sem marca
```
Studio product photo of a single original wireless game controller, rounded ergonomic body with thick
grips, glossy white shell with light grey accents, left analog stick placed high and directional pad
placed low (asymmetric layout), right analog stick placed low, four round face buttons in a diamond in
red, white, graphite and silver, a circular central button with a simple red ring and no symbol, two
shoulder bumpers and two triggers visible, isolated on a plain light grey seamless background, soft even
studio lighting, three-quarter view from slightly above, entire object visible and centered, sharp focus,
no text, no logo, no brand
```
Conferir na escolha: não pode reproduzir as cores exatas verde/vermelho/azul/amarelo nem letras A/B/X/Y; o
monograma DRF entra **depois**, na textura, não na imagem.

## P3 · DRF-01 (Fase 5 — corpo para a IA; asas/halo/suspensão serão modelados no Blender)
Base comum (D5 "limpo/engenharia", D4 "tricolor de faixa"):
```
original open-wheel single-seater race car concept, compact modern 2026-era proportions, short wheelbase,
large exposed wheels with plain black tyres, low narrow nose, slim sidepods with a deep undercut and
vertical wake boards at the sidepod inlet, protective halo over the cockpit, simple three-element front
wing, clean three-element rear wing without a lower beam wing, matte black bodywork with a single
horizontal red and white stripe running from the nose to the rear wing, no sponsor logos, no team
branding, no text, isolated on a plain light grey seamless background, soft even studio lighting,
sharp focus, realistic carbon fibre and matte paint
```
Três vistas (mesma base + o final abaixo):
- **3/4 frontal (entrada principal da IA):** `, three-quarter front view from slightly above, entire car visible and centered`
- **Lateral (blueprint para conferir proporção):** `, exact side elevation view, orthographic look, entire car visible`
- **Topo (blueprint):** `, exact top-down plan view, orthographic look, entire car visible`
As vistas lateral e de topo **não** vão para a IA 3D: servem para o Blender conferir 3,40 m de entre-eixos,
1,90 m de largura e roda Ø 0,71 m (seção 1.1 do `M16-REFERENCIAS.md`).

## P4 · Contexto do box (opcional, peças baratas)
- Pilha de pneus em mantas: `stack of four racing tyres wrapped in red electric tyre warmers with white
  stitching, isolated on a plain light grey background, soft studio light, three-quarter view, no logo`
- Cavalete de câmbio: `racing car gearbox casing in raw machined aluminium mounted on a steel workshop
  stand on castor wheels, isolated on a plain light grey background, soft studio light, no logo`
- Quiosque de monitores: `mobile engineering monitor kiosk, black steel frame on castors with three
  stacked blank monitors and a keyboard tray, isolated on a plain light grey background, no text, no logo`

## P5 · Easter eggs (fila 12, 16/11/2026)
Lista "IA 3D" de `_fila\NOITE-11-11-DECISOES.md`. Só o volume vem da IA. **Nenhum texto na imagem**: o "7" do
calcanhar, "SIUUU" na fita, "DAVI" e o 16 do capacete, o ingresso do cinto, o `SELECT * FROM cafe` da caneca, o
adesivo do amplificador e o monograma da palheta entram depois, como textura (canvas) ou geometria simples. O prompt
descreve só a **área lisa** onde cada um vai entrar. Nada de marca, logo, personagem ou forma de franquia.

Todo prompt desta fila (P2, P4 e P5) recebe o mesmo final, no lugar do final escrito à mão dos anteriores:
```
, isolated on a plain light grey seamless background, soft even studio lighting, minimal shadow,
three-quarter view from slightly above, long lens, single object, entire object visible and centered,
sharp focus, no text, no letters, no numbers, no logo, no brand
```
O FLUX.2 klein roda com guidance 1,0 (sem prompt negativo): a negação vai no próprio texto.
Seeds das 4 variações, iguais para todos os objetos: **16, 45, 77, 2026**. 1024², 4 passos.
Fonte exata do que rodou: `C:\Users\davir\drf-ia3d\geracao\objetos.json` (prompts) e `imagens.json` (tempos, hashes).

- **Capacete** (pintura do DRF-01, desenho próprio):
  `Studio product photo of a single original full-face motor racing helmet of generic own design, matte black
  shell, one clean horizontal stripe in red and white running around the middle of the shell, dark tinted closed
  visor, plain smooth unmarked area on the side and at the back of the shell, no stickers, no sponsor decals, no
  crest, no pattern`
- **Caneca:**
  `Studio product photo of a single plain white ceramic coffee mug, straight cylindrical body, simple C-shaped
  handle on the right side, glossy glaze, completely blank smooth side with no print, empty`
- **Figure** (mascote DRF original):
  `Studio product photo of a single small collectible vinyl figure of an original chibi race mechanic mascot,
  oversized round head, simple friendly face with small dot eyes, short dark hair, plain matte black racing
  overalls with one horizontal red and white stripe across the chest, plain black gloves and boots, holding a
  plain black racing helmet under one arm, standing on a small round black base, original character design not
  based on any existing character`
- **Cobra coral** (sem escudo; vai enrolada no cavalete, gerada sozinha):
  `Studio product photo of a single coral snake coiled in a neat flat spiral with the head slightly raised,
  slender body with repeating bands of red, black and white, smooth glossy scales, calm pose`
- **Bola de pelada:**
  `Studio product photo of a single old worn street football, generic stitched leather panels in dirty off-white
  and faded black, scuffed and scratched surface, slightly deflated, plain panels with no print`
- **Chuteira em pé** (o 7 entra depois no calcanhar liso):
  `Studio product photo of a single generic football boot standing upright on its studs, plain black leather
  upper with no stripes and no side markings, white sole with moulded studs, black laces tied, plain smooth blank
  heel panel, slightly worn, seen from the rear three-quarter so the heel is visible`
- **Chuteira caída** (o "SIUUU" entra depois na fita lisa):
  `Studio product photo of a single generic football boot lying on its side with the sole facing the camera,
  plain black leather upper with no stripes and no side markings, white sole with moulded studs clearly visible,
  one blank strip of beige masking tape stuck across the sole, slightly worn`
- **Case de guitarra** (a palheta é geometria simples, fora da IA):
  `Studio product photo of a single closed hard electric guitar case standing upright, black textured vinyl
  covering, silver metal latches and corner protectors, black carry handle on the side, plain surface with no
  badge and no stickers`
- **Mini amplificador** (o adesivo entra depois):
  `Studio product photo of a single small generic practice guitar amplifier, boxy cabinet covered in black
  textured vinyl, plain dark grey grille cloth on the front with no badge, top control panel with a row of five
  plain black knobs and one small red indicator light, black carry handle on top, metal corner protectors`
- **Vaso com ESP32:**
  `Studio product photo of a single small terracotta flower pot with a small green leafy houseplant, a small
  generic dark microcontroller development board with two rows of pins standing upright stuck in the soil, one
  thin wire going from the board to a small fork-shaped two-prong soil moisture sensor probe pushed into the
  soil, unmarked circuit board`
- **Cinto de ferramentas** (o ingresso entra depois, no bolso vazio):
  `Studio product photo of a single brown leather mechanic's tool belt with three pouches hanging from one steel
  wall hook, the pouches hold a cross-shaped wheel wrench, a chrome torque wrench and a pair of pliers with red
  handles, one front pocket left empty and slightly open, plain leather with no stamp`

Versões de P4 que rodaram na fila 12 (mais explícitas que as de cima, mesmo final comum):
- Pneus: `Studio product photo of a single vertical stack of four wide racing slick tyres, each tyre wrapped in a
  red padded electric tyre warmer blanket with white stitching, plain black wheel rims visible in the centre, neat
  straight stack`
- Cavalete: `Studio product photo of a single racing car gearbox casing in raw machined aluminium, mounted on a
  sturdy black steel workshop stand with four castor wheels, compact assembly, plain surfaces`
- Quiosque: `Studio product photo of a single mobile engineering monitor kiosk, black steel frame on four castor
  wheels with three stacked flat monitors with blank dark screens switched off and a plain keyboard tray, compact
  upright trolley`

P2 rodou com o texto de cima, trocando só o final pelo final comum.

### Segunda versão (v2) dos prompts que falharam na primeira passada
Quatro prompts deram 4 imagens inúteis ou fora da regra e foram reescritos na mesma noite (mesmas seeds, mesmo final):
- **Controle (P2 v2).** No texto de cima, "left analog stick placed high" virou uma alavanca alta saindo do corpo nas
  4 seeds. Versão que rodou:
  `Studio product photo of a single original wireless gamepad, wide rounded ergonomic body with two thick grips,
  glossy white shell with light grey grip undersides, two short low-profile thumbsticks with flat round dark grey
  caps sitting flush in shallow sockets, the left thumbstick in the upper left of the face and a flat cross-shaped
  directional pad in the lower left, the right thumbstick in the lower right, four small round face buttons in a
  diamond in the upper right coloured red, white, graphite and silver, one small circular centre button with a thin
  red ring and no symbol, two shoulder bumpers on the top edge, nothing protruding above the body, seen from the
  front`
- **Chuteira em pé (v2).** "standing upright" virou botina de cano alto. Versão que rodou:
  `Studio product photo of a single classic low-cut leather soccer cleat resting on its studs on the ground, sleek
  low profile with the collar below the ankle, long narrow shape with a rounded toe, plain black leather upper with
  no stripes and no side markings, flat fold-over tongue, black laces tied, white sole plate with round moulded
  studs, plain smooth blank heel panel, slightly worn, seen from the side three-quarter with the heel nearer the
  camera`
- **Quiosque (P4 v2).** "monitors" trouxe pseudo-texto de marca na moldura nas 4 seeds. Versão que rodou:
  `Studio product photo of a single mobile engineering workstation trolley, black steel tube frame on four castor
  wheels, three identical plain flat black display panels mounted one above the other on the frame, each panel a
  featureless matte black rectangle with a thin completely blank bezel and no markings of any kind, a plain flat
  keyboard shelf at waist height, compact upright trolley, industrial pit lane equipment`
  (saiu sem marca em 3 das 4, mas sempre com 2 painéis, não 3.)
- **Case de guitarra (v2).** "hard electric guitar case" deu maleta retangular curta. Versão que rodou:
  `Studio product photo of a single closed contoured hardshell electric guitar case standing upright, guitar-shaped
  silhouette with a long narrow neck section at the top and a wider rounded body section at the bottom, black
  textured vinyl covering, small silver metal latches along one edge, black carry handle on the side, plain surface
  with no badge and no stickers`

Aprendizados para a próxima rodada de prompts:
- Descrever posição com "upper left / lower right of the face", nunca "high/low" (o modelo lê como altura física).
- "monitor", "amplifier", "wrench" e "circuit board" puxam microtexto de marca/serigrafia. Trocar por
  "featureless panel", pedir "blank bezel", e conferir em 1024 (na folha de 512 passa despercebido).
- Objeto fino (fio, sonda, folha, cadarço) aparece na imagem mas não sobrevive na malha: gerar sem ele e modelar à mão.

Conferir na escolha de cada seed (olhando o PNG, não o nome): nenhum texto, número, logo, listra de marca de
chuteira, emblema de capacete ou rosto que lembre personagem existente. Seed com qualquer um desses é descartada.

### Seeds pré-escolhidas na fila 12 (o Davi pode trocar)
| Objeto | Prompt | Seed | Objeto | Prompt | Seed |
| --- | --- | --- | --- | --- | --- |
| controle | P2 v2 | 45 | bola | P5 | 45 |
| capacete | P5 | 2026 | chuteira em pé | P5 v2 | 45 |
| caneca | P5 | 16 | chuteira caída | P5 | 16 |
| figure | P5 | 77 | case de guitarra | P5 v2 | 45 |
| pneus em mantas | P4 | 77 | amplificador | P5 | 45 |
| cavalete de câmbio | P4 | 77 | vaso com ESP32 | P5 | 16 |
| quiosque | P4 v2 | 77 | cinto de ferramentas | P5 | 77 |
| cobra coral | P5 | 45 | | | |

Motivo de cada escolha, seeds descartadas pela regra de marcas, tempos e hashes:
`_fila\12-geracao-ia3d-props-eggs.resultado.md` e `C:\Users\davir\drf-ia3d\geracao\escolhas.json` (fora do Git).
Nada disso entrou no site. Aprovação do Davi: pendente.

### Fila 18 (17/11/2026): case de guitarra elétrica (v3, v4) e guitarra elétrica
Motivo: no gate de 16/11 o Davi viu a v2 do case como capa de violão. Mesmo final de prompt e mesmas seeds
(16, 45, 77, 2026) da P5.

- **case-guitarra-v3** (descartado, as 4 seeds viraram mala de viagem curta): `Studio product photo of a single
  closed rectangular hardshell electric guitar case standing upright on its short end, flat rectangular box shape
  with rounded edges, slightly narrower at the top end, slim and shallow depth, black textured tolex vinyl covering,
  polished chrome metal corner protectors on all eight corners, three chrome metal latches along the long side edge,
  black carry handle on the long side, plain lid surface with no badge and no stickers`
- **case-guitarra-v4** (usado, seed 16): `Studio product photo of a single closed hardshell electric guitar case
  standing upright, long and narrow, about three times taller than it is wide, sized to hold one solid-body electric
  guitar, wide squared lower end for the guitar body tapering in a straight line to a narrow squared upper end for
  the neck, slim shallow depth, black textured tolex vinyl covering, polished chrome metal corner protectors on every
  corner, three small chrome latches along the long side edge, black carry handle on the long side, plain lid with no
  badge and no stickers`
- **guitarra-eletrica** (seed 77): `Studio product photo of a single solid-body electric guitar of an original custom
  design standing upright, front view, sharp asymmetric offset double-cutaway body with angular bevelled horns, gloss
  black finish with one thin red stripe and one thin white stripe running in parallel diagonally across the body, six
  metal strings, two black rectangular humbucker pickups clearly visible, black pickguard, fixed bridge, three plain
  black control knobs, dark fretboard with small dot inlays, plain pointed angular headstock with six chrome tuners and
  no logo`

Aprendizado: para case de elétrica, dar a proporção ("three times taller than wide") e o afunilamento em linha reta;
"contoured" puxa violão e "rectangular" sem proporção puxa mala. A malha do TripoSG é só geometria: as faixas
vermelha e branca da guitarra não estão no GLB (precisam de material/decalque à mão, se ela entrar na cena).
Resultado: `_fila\18-guitarra-case.resultado.md`. Aprovação do Davi: pendente.

## Ordem
1. P1 (handgrip) → Hunyuan3D 2.1 (forma) × TripoSG → limpeza → integrar → **gate Davi**.
2. Se aprovado o pipeline: P2, P4, e só então P3 (carro).
