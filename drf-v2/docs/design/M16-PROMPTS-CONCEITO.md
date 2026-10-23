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

## Ordem
1. P1 (handgrip) → Hunyuan3D 2.1 (forma) × TripoSG → limpeza → integrar → **gate Davi**.
2. Se aprovado o pipeline: P2, P4, e só então P3 (carro).
