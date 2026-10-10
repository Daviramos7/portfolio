# Missão10 — marco seletivo de direção de arte

Base integrada `b99a8aaabff8c745dbd0ef68ab859c31fecc048b`, branch
`feat/drf-engineering-3d`. FF realizado somente com worktree limpo. Sem alterações
em contratos, conteúdo, UI, configuração, V1 ou dependências. Um único marco.

## Diagnóstico e decisões

Fase0 reutiliza smoke/45 frames nativos do Lead e acrescenta antes comparável
próprio em 1440×900 / 390×844, cinco poses e quatro closes. Native reduced=true,
Cinemático escolhido pela UI sem EmulatedMedia. Nenhum teleporte indevido
reproduzido; câmera/percursos preservados. O antes mostra placas traseiras altas,
raios planos e barras fragmentando a vista da pista. Low mobile solicitava
antialias=false. Reduced direto continua legítimo e a garagem estática aparece.

Asa traseira mais baixa/estreita, endplates compactos em carbono, engine cover
afunilado, inlet, borda contínua de cockpit, volante e assento mantido. Rodas
preservam quatro conjuntos/eixos/suspensões aprovados; braços agora curvos com
volume/chanfros e aro usinado nas duas faces. Bancada de componentes com pés
tubulares e bandejas ocupa o corredor de manutenção, abaixo dos monitores.

Abertura ampliada fisicamente, faixa rodável aproximada e separador baixo atrás
da rota. Removidos degraus/barras centrais; fence permanece nos flancos. O carro
externo original tem carroceria clara, pilares e teto contrastante. Primeira
passagem 5–8 s elegíveis, demais intervalos/gates intactos; áudio off independe
do visual. Os frames mostram um veículo reconhecível atravessando a abertura.
Em 320 ainda há oclusão parcial pelo DRF-01 e corte na borda durante parte do
trajeto: não se afirma visibilidade integral do veículo durante todo o evento.

MSAA nativo solicitado também em mobile, com powerPreference=low-power
independente de MSAA. DPR low≤1/balanced≤1.5 preservado; browser pode conceder
antialias diferente. Sem pós-processamento. Nesta máquina concedeu true.

Cinco atividades distintas, todas marcadas DEMO: inspeção de diagrama do carro,
cursor sobre curva demonstrativa, destaque suave no único nó público Pit Wall,
órbita do indicador de identidade e cursor nas conexões de interesses. Somente
geometria muda: CanvasTexture redesenha apenas quando texto/idioma/projeto muda.
Gate ambient/reduced/visible/painel é do renderer; cada tela também verifica
frustum. Fan permanece. Nenhuma métrica, experiência ou roadmap inventado.

Referências primárias consultadas para função de baia/montagem/manutenção:
[tour oficial de oficina](https://www.mclaren.com/racing/indycar/2026/tour-mclaren-racing-center/)
e [oficina de manutenção/restauração](https://careers.williamsf1.com/blog/2025-12/how-the-heritage-team-keeps-our-history-alive).
Nenhum carro, marca, imagem ou asset dessas fontes copiado. Blender 5.2 foi
encontrado localmente; não foi usado para exportar um GLB sem ganho de qualidade.
Modelagem permanece autoral em Three. Proveniência/hashes em public/scene/ASSETS.md.

## Verificações executadas

- Lint e build passaram; aviso do chunk 3D acima de 500 kB permanece.
- 28 testes existentes + 3 novos passaram. Após revisão dos asserts relativos,
  os três novos foram executados novamente e passaram.
- Smoke integrado inalterado: 13 grupos passaram, zero console/network errors.
  Inclui raycast/hotspots, menu, cliques rápidos/latest wins, histórico, leitura,
  Recruiter, PT/EN, teclado, reduced, mobile 390/320, context loss/retry e WebGL off.
- QA próprio: 70 frames de viagens 01→02→03→04→05→01 em desktop/390, 69 frames
  CAR_PASS desktop/390/320, áudio desligado; zero console errors. Chrome instalado
  headless com pixels reais. System nativo true nas três larguras; escolha
  Cinemático pela UI. Smoke usa emulação de media para regressões específicas,
  separada desta evidência nativa. Não há vídeo interpolado ou mock WebGL.
- git diff --check passou. Somente área autorizada alterada.

## Medições e limites

GPU reportada por Chrome: ANGLE / NVIDIA GeForce RTX 3060 / Direct3D11,
driver 32.0.15.9186. Cadência obtida de contador renderer.render + timestamps
RAF, amostrados pelo RAF do navegador; não é FPS percebido, tempo CPU/GPU ou
benchmark de telefone. Janelas de navegação incluem a cauda após assentamento:
mediana 6.9–7.0 ms, p95 7.1–34.7 ms (cauda limitada pelo ambiente).

| Preview após, ambiente 10 s | 1440 | 390 | 320 |
|---|---:|---:|---:|
| Renders efetivos | 288 | 288 | 288 |
| Mediana / p95 dos intervalos (ms) | 34.7 / 34.8 | 34.7 / 34.8 | 34.7 / 34.8 |
| Draw calls / triângulos | 84 / 65406 | 71 / 62010 | 71 / 62010 |
| Texturas residentes / geometrias | 31 / 61 | 29 / 61 | 23 / 48 |
| Heap V8 usado, snapshot MiB | 7.47 | 13.70 | 13.47 |

Uploads de telas 15→15 nas três janelas. Ambiente off: zero renders adicionais
em 1.2 s nas três larguras (economia em repouso, não “0 FPS”). Contagens do passe
principal, sem contabilização completa das sombras; heap não é memória GPU/pico.

Fixture externa de mesma pose, low/DPR1, 10 s antes/depois: mobile MSAA false→true,
279→280 amostras, p95 34.8→34.8 ms; desktop true→true, 243→238 amostras,
p95 34.8→34.8 ms. São amostras por RAF, não contagem total garantida. Geometria
também mudou, portanto a comparação não isola custo causal do MSAA. Não demonstra
ausência de custo GPU/energia; aliasing fino permanece e aparelho físico pendente.

Bundle 3D 610.87 kB / 159.04 kB gzip (antes 608.65 / 158.29); inicial
302.10 / 94.45 kB gzip. Assets binários novos 0 bytes, nenhum mapa/download novo.
O servidor estático envia JS sem gzip; smoke registrou 611173 bytes transferidos
para esse request. O valor gzip é estimativa do build, não transferência medida.

Acabamento permanece estilizado; não é overhaul premium completo, modelo
homologado, áudio realista ou validação física mobile. Silêncio/unavailable
preservado. Lead deve revisar integração/arte e custo em hardware alvo; nenhum
novo campo/integração contratual necessário neste marco.

## Evidência durável

Raiz absoluta:
`C:/Users/davir/OneDrive/Documentos/GitHub/portfolio/.agent-grid/screenshots/mission-10-3d/`

`index.html` compara mesmas poses 1440/390, quatro vistas/quatro rodas e reproduz
frames capturados. `before/zone-1-1440.png`, `after/zone-1-1440.png`, equivalentes
390; `before|after/wheel-{front|rear}-{left|right}.png`; cinco telas em
`zone-{1..5}-{1440|390}.png`; `after/screen-activity-*` compara outra fase.
Passagem: `after/pass-390-10.jpg`, `after/pass-320-11.jpg` e sequências completas.
Dados/método/GPU/heap: `after/native-validation.json`, `before|after/msaa-cost.json`.
Regressão: `smoke/smoke-result.json`, imagens PT/EN/mobile/fallback. Capturas
ficam fora do produto e do commit; nenhum log privado novo em public.
