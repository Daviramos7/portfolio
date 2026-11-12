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
