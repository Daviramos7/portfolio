# ASSETS — registro de origem dos assets gerados (Missão 16 em diante)

Um bloco por asset: origem, licença, prompt, seed, hashes, triângulos e tamanho. Assets autorais anteriores
(áudio, DRF Sprint 03, detalhes procedurais) continuam registrados em `drf-v2\public\scene\ASSETS.md`.

Como preencher: rodar `tools\blender\report_asset.py` no GLB final e copiar os números do JSON. Não arredondar.

## Handgrip — `public\models\props\handgrip.glb` (M16, fila 09, 12/11/2026)

Estado: integrado na estação "Perfil do Piloto" na branch `m16-09-handgrip`. Forma avaliada pelo Davi na malha bruta;
o resultado no site aguarda revisão.

### Cadeia de geração (local, sem serviço externo)

| Etapa | Ferramenta | Versão / revisão | Licença |
| --- | --- | --- | --- |
| Imagem de conceito | FLUX.2 klein 4B (`black-forest-labs/FLUX.2-klein-4B`, diffusers 0.42.0) | revisão `e7b7dc27f91deacad38e78976d1f2b499d76a294` | Apache 2.0 |
| Recorte do fundo | rembg 2.0.86 com BiRefNet-general (`BiRefNet-general-epoch_244.onnx`, release `v0.0.0` do rembg) | sha256 do modelo `58f621f00f5d756097615970a88a791584600dcf7c45b18a0a6267535a1ebd3c` | MIT |
| Imagem → malha | TripoSG (`VAST-AI/TripoSG`), sem `diso`, `use_flash_decoder=False` | pesos `2c1c516d22d58db486a058d98d31bb6177344e06`; código `fc5c40990181e2a756c4e0b1c2f4d6b5202faf8c` | MIT |
| Limpeza, decimação, UV, escala | Blender 5.2.0 LTS em modo headless, `tools\blender\clean_asset.py` | build `fbe6228777e7` | GPL (ferramenta; não se aplica ao arquivo exportado) |

Versões e revisões vêm do registro da fila 05 (`_fila\feito\05-m16-dpr-reta-downloads.resultado.md`) e de
`docs\production\M16-FASE3-DOWNLOADS.md`. Nenhuma foto, modelo, textura ou marca de terceiros entra na cadeia: a única
entrada é o texto do prompt.

### Prompt e parâmetros

Prompt (FLUX, de `C:\Users\davir\drf-ia3d\testes\p1-flux-rembg.json`):

> Studio product photo of a single torsion-spring hand gripper exercise tool, two straight handles of silver anodized
> aluminium with fine diamond knurling, one thick black steel coil spring at the top, small engraved resistance number
> "45" on one handle, isolated on a plain light grey seamless background, soft even studio lighting, three-quarter view
> from slightly above, entire object visible and centered, sharp focus, realistic materials, no text other than the
> engraved number, no logo

- FLUX: seed 45, 4 passos, guidance 1,0, 1024×1024.
- TripoSG: seed 45, 50 passos, guidance 7,0 (de `p1-triposg.json`).
- Blender: `--triangles 6000 --longest 0.17 --split-height 0.745`, materiais
  `handgrip-aluminium=#c3c8cd/1/.38,handgrip-spring=#141618/1/.5` (comando completo abaixo).

### Arquivos e hashes (SHA-256, conferidos em 12/11/2026)

| Arquivo | Onde fica | Bytes | SHA-256 |
| --- | --- | --- | --- |
| Imagem gerada `p1-handgrip-flux.png` | `C:\Users\davir\drf-ia3d\testes\` (fora do Git) | 720.030 | `004063371aadf3857a15eb2ecf7d9e8787b4675ce5888bef9c929eb447b408d8` |
| Imagem recortada `p1-handgrip-cut.png` | `C:\Users\davir\drf-ia3d\testes\` (fora do Git) | 426.361 | `4140097af20f31af9ff2c6493b03529d09628d2782ef5d1fb4b5532ad8b5a6de` |
| Malha bruta `p1-handgrip-triposg.glb` | `C:\Users\davir\drf-ia3d\testes\` (fora do Git) | 9.637.580 | `dc4f7905d2fe1817ba86f16189292f5d4530b1f9079b2c9d6d045aabd4335318` |
| GLB final `handgrip.glb` | `drf-v2\public\models\props\` (no Git) | 198.672 | `3ddbae133956c17e54a982254cd403737634d630abf5d3793bcaa65ba409c7a5` |

### Malha

| | Bruta | Final |
| --- | --- | --- |
| Triângulos | 535.388 | 5.840 (alumínio 2.275, mola 3.565) |
| Vértices | 267.672 | 5.046 no arquivo (2.898 no Blender, antes de o exportador separar por UV e aresta viva) |
| Dimensões X × Y × Z (Y para cima) | 1,03157 × 1,90396 × 0,41402 (sem unidade real) | 0,09212 × 0,17 × 0,03702 m |
| UV | não | sim (Smart UV Project) |
| Materiais | nenhum | 2 nomeados, sem textura embutida |
| Origem | centro da caixa | centro da base (y = 0) |

Orçamento usado: 6.000 triângulos (prop pequeno). A comparação das pranchas bruta × final não mostrou perda de cabos
nem de espiras da mola, então o orçamento não foi aumentado. O número "45" gravado virou um amassado sem leitura.

Limpeza medida pelo script: de 267.672 para 267.562 vértices e de 535.388 para 535.168 faces (duplicados e faces
degeneradas), 3 pedaços conexos (nenhum descartado), 0 arestas não manifold. Decimação em um passo, de 535.168 para
5.670 triângulos. A mola e os cabos saem fundidos do TripoSG (os pedaços não coincidem com as peças), por isso a troca
de material é um corte plano a 74,5% da altura, que acrescentou 170 triângulos (total 5.840).

### Comandos (reproduzem o arquivo)

```bash
/c/Users/davir/drf-ia3d/scripts/blender.sh --background --python C:/Users/davir/OneDrive/Documentos/GitHub/portfolio/drf-v2/tools/blender/clean_asset.py -- --input C:/Users/davir/drf-ia3d/testes/p1-handgrip-triposg.glb --output C:/Users/davir/drf-ia3d/saida/handgrip/handgrip-6000.glb --triangles 6000 --longest 0.17 --name handgrip --materials "handgrip-aluminium=#c3c8cd/1/.38,handgrip-spring=#141618/1/.5" --split-height 0.745 --report C:/Users/davir/drf-ia3d/saida/handgrip/handgrip-6000.clean.json
/c/Users/davir/drf-ia3d/scripts/blender.sh --background --python C:/Users/davir/OneDrive/Documentos/GitHub/portfolio/drf-v2/tools/blender/preview_asset.py -- --input C:/Users/davir/drf-ia3d/saida/handgrip/handgrip-6000.glb --output C:/Users/davir/drf-ia3d/saida/handgrip/preview-6000.png
/c/Users/davir/drf-ia3d/scripts/blender.sh --background --python C:/Users/davir/OneDrive/Documentos/GitHub/portfolio/drf-v2/tools/blender/report_asset.py -- --input C:/Users/davir/OneDrive/Documentos/GitHub/portfolio/drf-v2/public/models/props/handgrip.glb --output C:/Users/davir/drf-ia3d/saida/handgrip/handgrip.report.json
```

Intermediários e relatórios JSON: `C:\Users\davir\drf-ia3d\saida\handgrip\` (fora do Git).

### Uso na cena

`src\scene\garage\personalDetails.ts` carrega o GLB de forma assíncrona (`propModel.ts`) e troca os dois materiais do
arquivo, pelo nome, por materiais da cena: alumínio com recartilhado em losango (mapas de normal e rugosidade
desenhados em Canvas 128×128, sem imagem externa) e mola de aço escuro. O arquivo está em escala real (0,17 m); a cena
aplica escala 2,35, a mesma altura que o handgrip procedural ocupava, apoiado na placa "constância". Se o arquivo
faltar, vier inválido ou passar dos limites (maior dimensão entre 0,12 e 0,22 m, até 12.000 triângulos), o handgrip
procedural anterior continua na cena.

Licença de uso do arquivo final: saída de modelos Apache 2.0 e MIT, gerada localmente a partir de prompt próprio, sem
restrição de uso público conhecida; distribuído sob os termos do repositório.

## Easter eggs da sala elevada — `public\models\props\*.glb` (M16, fila 19, 17/11/2026)

Origem: gerados localmente na missão 12 (e na 18, case v4 e guitarra) pela cadeia FLUX.2 klein 4B → BiRefNet → TripoSG →
limpeza no Blender 5.2 (`lote_blender.py`), em `C:\Users\davir\drf-ia3d\geracao\<objeto>\` (fora do Git).
Licença: saída de modelos rodados localmente; sem asset de terceiros e sem texto ou marca na malha (conferido nas 4 seeds
de cada objeto; motivos em `geracao\escolhas.json`). Todo texto da cena (DAVI, 16, 7, SIUUU, caneca, ingresso, palheta,
adesivo, setlists, watchlist, quadro, post-it) é desenhado em canvas no código (`src\scene\garage\easterEggs.ts`).
Hashes da imagem recortada e da malha bruta: `geracao\TABELA.md`. Cor: pintura por vértice no carregamento (o GLB tem
um material único); nenhuma textura de imagem.

| Arquivo | Objeto gerado | Seed | Triângulos | Bytes | SHA-256 |
| --- | --- | --- | --- | --- | --- |
| `caneca.glb` | caneca | 16 | 5970 | 156.704 | `d7db4dbf66de90d148a7e443bf071f89bcbb2310ae3a4bbbc2b692beb575ad88` |
| `capacete.glb` | capacete | 2026 | 14924 | 540.872 | `3dcc7eea8483c4ff43e8c6a6ce90365bc35a2467c56f54f91082334e0a0f166a` |
| `figure.glb` | figure | 77 | 14924 | 454.216 | `c7b78cf0137819ccea0f9ec538129e1db3aeae16aec72b7b8ab91444f04d2a76` |
| `amplificador.glb` | amplificador | 45 | 14924 | 440.756 | `18a9dab28641bead747c47a077cade439b4f2d7d8eb6e929d687027b2b6c3cd8` |
| `case-guitarra.glb` | case-guitarra-v4 | 16 | 14924 | 432.596 | `7f3f6080663f720bfc90f440a776519a7e1551a78286dad0d2bbdfea43428e50` |
| `guitarra.glb` | guitarra-eletrica | 77 | 14924 | 511.056 | `3752b0d2832cab65b65280f3bed97292600f4e049a8f78280930b7464cfdd086` |
| `bola.glb` | bola | 45 | 5970 | 166.644 | `51c80f8c7d1f2727048de3a74285ec7691d95f80a380acf774d9f4af6d4c7880` |
| `chuteira-em-pe.glb` | chuteira-em-pe-v2 | 45 | 5970 | 210.580 | `0dd8a35267982f7a1b08aea036abcb792ad7aa36d39ef0f684a4c99f0e10b64e` |
| `chuteira-caida.glb` | chuteira-caida | 16 | 5970 | 197.840 | `2ab804d2609fadaabef96eeedd598a0dfd8afe5ecb8fedfd85976e53c28c124f` |
| `cobra-coral.glb` | cobra-coral | 45 | 5970 | 193.012 | `9977672476c6fd3da9f4517528f075444ead095a70617dee9541c3ee695369d9` |
| `vaso-esp32.glb` | vaso-esp32 | 16 | 11940 | 437.184 | `4f28cc1968a15f2f874790a7a34106451380943eb1fad13e695354d91f893efd` |
| `cinto-ferramentas.glb` | cinto-ferramentas | 77 | 14924 | 480.900 | `33854e2bf6d417f0f14f50a3ca75c1883e463885ea66ba6f77da6afb7bdf5625` |

Prompts (FLUX.2 klein; cópia de `geracao\objetos.json`):

- **caneca** (s16): Studio product photo of a single plain white ceramic coffee mug, straight cylindrical body, simple C-shaped handle on the right side, glossy glaze, completely blank smooth side with no print, empty
- **capacete** (s2026): Studio product photo of a single original full-face motor racing helmet of generic own design, matte black shell, one clean horizontal stripe in red and white running around the middle of the shell, dark tinted closed visor, plain smooth unmarked area on the side and at the back of the shell, no stickers, no sponsor decals, no crest, no pattern
- **figure** (s77): Studio product photo of a single small collectible vinyl figure of an original chibi race mechanic mascot, oversized round head, simple friendly face with small dot eyes, short dark hair, plain matte black racing overalls with one horizontal red and white stripe across the chest, plain black gloves and boots, holding a plain black racing helmet under one arm, standing on a small round black base, original character design not based on any existing character
- **amplificador** (s45): Studio product photo of a single small generic practice guitar amplifier, boxy cabinet covered in black textured vinyl, plain dark grey grille cloth on the front with no badge, top control panel with a row of five plain black knobs and one small red indicator light, black carry handle on top, metal corner protectors
- **case-guitarra-v4** (s16): Studio product photo of a single closed hardshell electric guitar case standing upright, long and narrow, about three times taller than it is wide, sized to hold one solid-body electric guitar, wide squared lower end for the guitar body tapering in a straight line to a narrow squared upper end for the neck, slim shallow depth, black textured tolex vinyl covering, polished chrome metal corner protectors on every corner, three small chrome latches along the long side edge, black carry handle on the long side, plain lid with no badge and no stickers
- **guitarra-eletrica** (s77): Studio product photo of a single solid-body electric guitar of an original custom design standing upright, front view, sharp asymmetric offset double-cutaway body with angular bevelled horns, gloss black finish with one thin red stripe and one thin white stripe running in parallel diagonally across the body, six metal strings, two black rectangular humbucker pickups clearly visible, black pickguard, fixed bridge, three plain black control knobs, dark fretboard with small dot inlays, plain pointed angular headstock with six chrome tuners and no logo
- **bola** (s45): Studio product photo of a single old worn street football, generic stitched leather panels in dirty off-white and faded black, scuffed and scratched surface, slightly deflated, plain panels with no print
- **chuteira-em-pe-v2** (s45): Studio product photo of a single classic low-cut leather soccer cleat resting on its studs on the ground, sleek low profile with the collar below the ankle, long narrow shape with a rounded toe, plain black leather upper with no stripes and no side markings, flat fold-over tongue, black laces tied, white sole plate with round moulded studs, plain smooth blank heel panel, slightly worn, seen from the side three-quarter with the heel nearer the camera
- **chuteira-caida** (s16): Studio product photo of a single generic football boot lying on its side with the sole facing the camera, plain black leather upper with no stripes and no side markings, white sole with moulded studs clearly visible, one blank strip of beige masking tape stuck across the sole, slightly worn
- **cobra-coral** (s45): Studio product photo of a single coral snake coiled in a neat flat spiral with the head slightly raised, slender body with repeating bands of red, black and white, smooth glossy scales, calm pose
- **vaso-esp32** (s16): Studio product photo of a single small terracotta flower pot with a small green leafy houseplant, a small generic dark microcontroller development board with two rows of pins standing upright stuck in the soil, one thin wire going from the board to a small fork-shaped two-prong soil moisture sensor probe pushed into the soil, unmarked circuit board
- **cinto-ferramentas** (s77): Studio product photo of a single brown leather mechanic's tool belt with three pouches hanging from one steel wall hook, the pouches hold a cross-shaped wheel wrench, a chrome torque wrench and a pair of pliers with red handles, one front pocket left empty and slightly open, plain leather with no stamp

Uso na cena: `createEasterEggs`, montado depois do primeiro quadro. `low` baixa só caneca, capacete e figure; os outros
9 só baixam em `balanced`. Limites por objeto (maior dimensão e triângulos) em `easterEggModels`; arquivo ausente ou fora
do limite deixa só os detalhes de papel e geometria simples. Pneus: textura de borracha e marcações (`DRF ENGINEERING`,
`RACE SLICK · 18`) desenhadas em canvas em `src\scene\car\wheels.ts`, sem nome de fornecedor real.

## Easter eggs com cor — fila 21 (17/11/2026)

**Método (opção A, sem download):** `C:\Users\davir\drf-ia3d\scripts\colorir_projecao.py` (Blender 5.2 headless + numpy,
fora do repo). Para cada GLB limpo da fila 19: procura a direção de vista ortográfica cuja silhueta casa com o alfa do
recorte BiRefNet da imagem FLUX escolhida (`<pasta>-s<seed>-cut.png`; IoU em grade 72×72, azimute 0–360°, elevação
≥ −5° para não cair na vista antípoda espelhada), projeta UV por essa vista, recorta a imagem num quadrado em volta do
objeto, estende as bordas para o fundo transparente (anel a anel, média dos vizinhos) e grava o GLB com a textura em
JPEG (qualidade 86). O lado oculto recebe a cor da frente, atravessada pela projeção (cor aproximada). Lado da textura:
512 px nos objetos do nível Leve (caneca, capacete, figure), 1024 no resto. Geometria, triângulos e escala iguais aos
da fila 19; só mudaram UV, material e imagem. Opção B (regiões com material próprio) não foi necessária.
Textos (DAVI, 16, 7, SIUUU, caneca, ingresso, palheta, adesivo) continuam no atlas de canvas próprio, por cima; o da
caneca passou a tinta escura porque a caneca gerada é branca. Prancha de conferência:
`C:\Users\davir\drf-ia3d\geracao\cor-prancha.png`; resumo por objeto em `geracao\cor.json`.
Na cena: o material usa o `map` do GLB; o amplificador leva um tom multiplicador `#6a6a6a` (o tolex da imagem é cinza
médio e a luz do Pit Wall clareava demais); a figure tem 22% de autoiluminação pela própria textura (destaque sem luz
nova, para não recompilar os programas da cena).

| Arquivo | Imagem de origem | Textura (px) | IoU silhueta | Vista (az / el) | Bytes | SHA-256 do GLB | SHA-256 da textura PNG (`geracao\<pasta>\<id>-cor-<px>.png`) |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `bola.glb` | `bola` s45 | 1024 | 0.96 | 209.0° / 73.0° | 307832 | `93c6a6e110f5f73f9164f728a972970456f7d96f9e076d00b0d4e1b869af7e19` | `359a22995da9464cfd4757b15d0a337a8defafe48fd45d4d4720a476b5f3cdf1` |
| `capacete.glb` | `capacete` s2026 | 512 | 0.969 | 318.0° / 14.0° | 561636 | `d5121360f2de84ff7feb13f85506138d9d91f164efd1f5f49c73667edcfa87f4` | `ab7cb70e4b5141d0179d9fb0a1cd48cde452d6da9b09d89c5d3821bb23a31de8` |
| `caneca.glb` | `caneca` s16 | 512 | 0.922 | 355.0° / 6.0° | 164968 | `c381adeb0c00760c169d994a11cfcc6fe6b0fbc1eb0aa7f56f51750713f1a3b0` | `1e0731d095a7e9d4b34bfac8213ee5c3ed2f70f3e4db9622c539030b43981b3c` |
| `figure.glb` | `figure` s77 | 512 | 0.891 | 335.0° / 15.0° | 475448 | `5a1581c5fa670c12c32ce2be565622dc8be5a851b1c7997174ad94b76222d2a9` | `01743e676f5d7260150ee83584223615aa6d66b10c233761f482bfc9d5f1e286` |
| `amplificador.glb` | `amplificador` s45 | 1024 | 0.926 | 330.0° / 35.0° | 601264 | `8404dfde3c3a337056b00c862a10bce7d79ab0709484d229ede62a56349d3767` | `6b1041630b83c0a26648aa3035222d33cad2685aaf86953c2e3d8247f58b3b75` |
| `case-guitarra.glb` | `case-guitarra-v4` s16 | 1024 | 0.937 | 54.0° / 13.0° | 483776 | `0a46cc564d97cc7f3f871d9e81a30fca726eeaaded16f4a83d492c6f969aea97` | `46ea0122d53275feb70b6b7695164bdbf8c0ffc6f2f9be240ffa300536f733e0` |
| `guitarra.glb` | `guitarra-eletrica` s77 | 1024 | 0.878 | 329.0° / -1.0° | 579260 | `d35ae87fb07db4383304da62f5fd0f33937d0da3e1346de762c3c37afd52aa05` | `e3913e36dd6829659a4dc69c2bd1d8a0c69fb2db6100b8ca3b2a22f9366ba307` |
| `chuteira-em-pe.glb` | `chuteira-em-pe-v2` s45 | 1024 | 0.917 | 18.0° / 31.0° | 285744 | `9b7578ce82cc538f8ff3fdf27019380dd694b0b2adad6b03159f970a3a80feda` | `1b59c3edda6ab0db221310a0b1d921dd6bb1effc703cf690fc1c2f504c9a3216` |
| `chuteira-caida.glb` | `chuteira-caida` s16 | 1024 | 0.932 | 2.0° / 68.0° | 264696 | `07c6f4221aaf08d751b736cfc33a6d1433aecb24f8a6803cfbff8672eb291dbe` | `7b5ebdb1b89ac23b65525a5d6319c5daa54fb2c77ec18bdd96cb55cc8d16f2dd` |
| `cobra-coral.glb` | `cobra-coral` s45 | 1024 | 0.928 | 337.0° / 25.0° | 353624 | `e0045e95085e1ddcc1152bd72773f02dace030cd61b4285d5599f789625b2676` | `b4c120f11cf0db4441ce12c5738760d460b0d41b117f68afb4cfededbc868567` |
| `vaso-esp32.glb` | `vaso-esp32` s16 | 1024 | 0.833 | 351.0° / 16.0° | 504516 | `40f028bedf01e689cd67dec6e1ed516d53c3a27bc102c7a876dcf3b70f262c30` | `3449cc191899dd186638ea911dfc234093cb780fea0e02e429cef23fdf99ebe8` |
| `cinto-ferramentas.glb` | `cinto-ferramentas` s77 | 1024 | 0.93 | 12.0° / 7.0° | 579208 | `0a4584b0401a9fa0aecc9879f722e12ad58cde1a36d22a60abf439c16649a804` | `b4164dbb9d7cd8670888891281226c7f17ba2c1f1b015f85b1f06f32af95440c` |

Total dos 12: 5161972 bytes (fila 19: 4,22 MB). Origem e licença: as mesmas da fila 19 (imagens FLUX.2 klein 4B e
malhas TripoSG geradas localmente; sem marca, logo ou texto de terceiros).

## Fila 22 — figure com cabelo e barba, texturas 512 no celular (17/11/2026)
**Figure novo (`figure.glb`).** Mesmo estilo chibi do mascote (macacão preto com faixa vermelha e branca, capacete sob o
braço, base redonda), agora com cabelo penteado para trás, ondulado, volume no topo e laterais curtas, e barba cheia,
curta e escura. Personagem original, sem marca nem texto.
- Prompt (FLUX.2 klein 4B, revisão `e7b7dc27…`, 4 passos, guidance 1.0, 1024 px, sufixo padrão do lote em
  `drf-ia3d\geracao\objetos.json`, id `figure-v2`): "Studio product photo of a single small collectible vinyl figure of
  an original chibi race mechanic mascot, oversized round head, simple friendly face with small dot eyes, dark brown hair
  swept back with soft waves and volume on top, short sides, full short dark beard covering the jaw and chin, plain matte
  black racing overalls with one horizontal red and white stripe across the chest, plain black gloves and boots, holding
  a plain black racing helmet under one arm, standing on a small round black base, original character design not based
  on any existing character".
- Seeds 16, 45, 77, 2026; escolhida **s45** (motivo em `geracao\escolhas.json`; s16 descartada por emblema na manga).
  Imagem `figure-v2-s45-flux.png` `2414f722fa6792d4c23481ee782e566a101482b85186b0c1d2dd80097e3e57b3`; recorte, malha
  bruta (1.393.592 faces) e GLB limpo (14.924 triângulos, maior lado 0,18 m) com hashes em `geracao\TABELA.md`.
- Cor: `colorir_projecao.py` (fila 21), vista 321° / 15°, IoU 0,883, textura 512. Retoque só na textura
  (`drf-ia3d\scripts\retocar_testa.py <glb> 129 170 370`): 4.546 pixels cor de pele acima da linha das sobrancelhas
  viram o castanho mediano do cabelo (73, 54, 51), porque o topete da malha é mais alto que o da foto e puxava a testa.
  Textura final `figure-cor-retocado-textura.png` `0e263a2ed52897758737b3e000deaf8e561d14bbe13b78fe7ea0496a371f7f57`.
- `figure.glb`: 507.032 bytes, `f2db8ccb3f2a6f5410373394964893eede60f85f47eac022c7b00e0d7e56adbf`. O GLB da fila 21
  ficou guardado em `drf-ia3d\geracao\figure\figure-site-fila21.glb`.

**Variantes 512 (`<id>-512.glb`).** Para os 9 objetos de textura 1024, o perfil leve (celular) baixa uma cópia com a
mesma malha, os mesmos UV e a textura reduzida para 512 (Lanczos, JPEG 86). Só os bytes da imagem mudam
(`drf-ia3d\scripts\textura_lado.py 512 <ids>`); o desktop segue com os arquivos de 1024.

| Arquivo | Bytes (1024 → 512) | SHA-256 da variante |
|---|---|---|
| `amplificador-512.glb` | 601264 → 508204 | `c501dbb66888fd81eb0e6c5843f23e506c9dd009efc9201a916201ba4cd62e88` |
| `case-guitarra-512.glb` | 483776 → 457364 | `108523ad3aaaae5be518a97adb61344421a0328a8a3b32fd54a03a5cc0e3edab` |
| `guitarra-512.glb` | 579260 → 546952 | `9b770234273dd6015613d3b08b2e4a8108f61153b16d414fef240b85b54a66ca` |
| `bola-512.glb` | 307832 → 226732 | `1572915126106bbad757a1e4413e00a6883bcbf17c82901fc92fb7e5845cd7b5` |
| `chuteira-em-pe-512.glb` | 285744 → 244760 | `ad6a8646ffaa34df250055bae0c4cf1a24f10f0e9119359affc01eb1fdfa5360` |
| `chuteira-caida-512.glb` | 264696 → 230252 | `89e15297e071e1886ba2783fc2fac89760f6590f6abccf761a01a0aa9af281c3` |
| `cobra-coral-512.glb` | 353624 → 270612 | `659d9f48f107bfb38b542124880e55afe85946e31c5c07548d9eff247e58077c` |
| `vaso-esp32-512.glb` | 504516 → 470912 | `365dbc023b3e61b4f6254d818db1cd408d980fc95ff91a39c60efd5148765b8f` |
| `cinto-ferramentas-512.glb` | 579208 → 524084 | `6195ab617c6f7b47ba1ad57d601ee07081b2c2ecdfe93cb5da7b177f88594406` |

Origem e licença: as mesmas da fila 19 (geração local, sem marca, logo ou texto de terceiros).
