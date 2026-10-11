# Missão 13 — etapa 1: diagnóstico visual

Base real `f8f90a778d7435df13b339149411997c62fedc12`, branch
`feat/drf-engineering-3d`. Tree inicialmente limpa; merge `--ff-only` seguro
desde `9732c1c`. Nenhuma implementação nesta etapa. Câmera aprovada preservada.

## Evidência e método

48 PNGs em `.agent-grid/screenshots/mission-13/scene-before/`, na raiz do repo.
`index.html` organiza todas; `qa.json` contém estado/progresso efetivo e erros;
`costs.json` contém contagens; `blender-viability.txt` registra verificação local.
Chrome instalado headless/CDP, WebGL real, preview compilado 5174. Desktop
1440×900, mobile emulado 390×844 e 320×844, DPR 1 para comparação. Cinco poses
reais + três projetos selecionados pela UI em cada viewport. Reduced nativo
true preservado. Na passagem, Cinemático escolhido explicitamente pela UI,
ambiente ligado, áudio off; primeiro evento natural, sem trigger DEV.

Sequências `pass-{1440,390,320}-{0.1,0.3,0.5,0.6,0.75,0.9}.png` mais ready/end.
Nome indica limiar solicitado, não instante exato: screenshot/CDP adiciona
latência; qa.json registra o progresso real (ex.: 320/.6 = .6327). A aproximação
e o afastamento ficam predominantemente fora da abertura; não confundir ausência
nesses frames com gate falhando. Console errors vazio nesta captura dirigida.

## Causas concretas observadas nos pixels

| Área | Diagnóstico | Prova representativa |
|---|---|---|
| Carro externo | Corpo central estreito/baixo, rodas visualmente dominantes, nariz fino, cockpit pouco volumoso e asas/endplates em placas retangulares: aparência de kart. Materiais/velocidade sozinhos não corrigem a silhueta. | pass-1440-0.5.png |
| Passagem/composição | Entrada recortada à direita; leitura central breve; na saída o montante/estação esquerda esconde o veículo. Em mobile o carro ocupa poucas dezenas de pixels em altura e se mistura com asa/rodas do hero. Há veículo reconhecível, não uma passagem plenamente legível. | pass-320-0.5.png, pass-320-0.6.png, pass-390-0.6.png |
| REC/PE | Inteira na Garagem, mas miniatura em 320; título da Telemetria cobre parte na vista vizinha. O erro de montagem frontal foi corrigido antes; discovery/escala continuam fracos. | garage-320.png, telemetry-1440.png |
| Estojo tricolor | A caixa se lê no desktop, mas no mobile aparece como retângulo baixo tricolor; volume/tampa/alça quase desaparecem. | pit-wall-1440.png, pit-wall-320.png |
| Cartão científico | Três palavras e desenho se leem no desktop; no mobile é um pequeno cartão claro, com letras/detalhes mínimos. Baixa área projetada, não ausência do asset. | telemetry-1440.png, telemetry-320.png |
| Controle 360 | Extrusão de polígono plano com quinas/grips angulares, profundidade uniforme e bloco frontal dominante; parece placa recortada apoiada em bloco, sem pega/volume convincente. Pinos e cruz não resolvem esse corpo. | strategy-room-1440.png, strategy-room-390.png |
| Handgrip | Mola e duas pegas identificáveis, mas suporte/inscrição viram faixa borrada no mobile; descoberta depende de olhar abaixo do monitor. | driver-profile-390.png, driver-profile-320.png |
| Stacks/Canvas | PySpark e Atleta mostram technologies e productStatus no monitor desktop. Atleta quebra stack em duas linhas em 390. No projeto selecionado mobile, painel HTML cobre grande parte do monitor/placas: cobertura real, não prova de truncamento do bitmap. | project-public-expenditure-big-data-1440.png, project-atleta-hibrido-390.png, project-public-expenditure-big-data-320.png |

Código confirma limites separados: `screenLines` entrega technologies/status
reais; placas inferiores de projeto recebem apenas títulos. Canvas usa sans-serif
genérico 26–32 px no bitmap 1024×512, enquanto UI passou a Barlow/Geist. O layout
encerra linhas em y>474 e novos itens em y>452; há risco real de descarte para
strings longas, mas as três seleções capturadas não demonstram corte da stack
dentro do bitmap. Não inventar falta de campo nem atribuir cobertura UI à câmera.

Rota atual: 26 m, z≈−11.1, duração 1.8–2.4 s; abertura ≈8.8 m e carro ≈4.4 m
longitudinais. Pela geometria, janela ideal de carro inteiro é apenas ≈0.3–0.4 s
antes de considerar perspectiva/oclusão. Assim, apenas aumentar velocidade reduz
ainda mais discovery. Não há necessidade demonstrada de alterar câmera/controlador.

## Proposta após revisão — não implementada

**P0, primeiro marco:** modelagem autoral substancial do monoposto externo em
Blender: conjunto tub/sidepods contínuo, cockpit com profundidade e borda,
engine cover/roll structure, rodas de proporção equilibrada e asas com perfil,
suportes/endplates compactos. Comparar silhueta contra os mesmos frames antes de
detalhar. Reavaliar composição da faixa de pista e envelope de percurso para
mais de um frame de silhueta inteira em 320, sem mexer na câmera nem atravessar
parede; conservar scheduler/gates/áudio. Não prometer resolver por GLB ou velocidade.

**P0, segundo marco separado:** remodelar o controle em volume arredondado com
pegas próprias e suporte discreto; composição/discovery dos cinco detalhes,
mantendo exatamente cinco e sem marcas/personagens. REC/PE e cartão precisam de
área projetada útil; estojo precisa tampa/cantos/alça plausíveis; handgrip precisa
apoio e separação visual. Reusar materiais/atlas, não adicionar dezenas de stickers.

**P1:** hierarquia de monitor para título/stack/status, quebra de linha medida e
fit verificável sem descarte silencioso; fontes já locais após autorização para
Canvas. Separar teste do bitmap e teste da vista com HUD; cobertura do painel
mobile precisa coordenação Lead/UI, sem editar UI ou compensar pela câmera.

## Pipeline local viável e orçamento proposto

Executável local Blender 5.2.0 LTS verificado com `--version`; segunda execução
`--background --factory-startup --python-expr` confirmou exportador glTF disponível.
Nenhuma instalação, arquivo de modelo, configuração salva ou export produzido.
Three instalado já fornece GLTFLoader. Pipeline possível: script batch autoral,
malha com bevels/normais controladas, materiais nomeados, validar escala/eixos,
export GLB sem câmeras/luzes; registrar autoria/hash; loader com fallback e
dispose/cleanup pelo proprietário atual. Requer integração assíncrona cuidadosa,
não basta converter a geometria existente para GLB.

Metas propostas, não medições: GLB externo até ~1 MiB sem textura embutida grande,
8–15 mil triângulos, 4–6 materiais compartilháveis; limitar meshes/draw calls,
sem Draco/dependência nova/pós-processamento. Custo de download/parse e gestão de
recursos novos deve ser medido após asset; GLB não garante qualidade nem economia.

Baseline medido, idle → pico capturado na passagem:
1440: 89 → 106 calls, 66.792 → 72.970 triângulos, 29 texturas;
390/320: 75 → 92 calls, 63.224 → 69.402 triângulos, 24 texturas.
Contagens renderer.info, não FPS/performance física. Build baseline PASS;
SceneRoot 625,14 kB / gzip 164,15 kB, aviso preexistente >500 kB.
Não foi repetida suíte lint/core/smoke ampla: tarefa somente diagnóstico; teste
dirigido produziu pixels/estado sem erros. Headless não valida dispositivo físico,
percepção de velocidade humana, qualidade de áudio ou picos GPU/memória.

Encerrar preview próprio e aguardar revisão/follow-up. Commit desta etapa: só este doc.

## Etapa 2 — P0 implementado

Base f8f90a7 + diagnóstico a12c70e; branch feat/drf-engineering-3d.
Novo DRF Sprint 03 autoral Blender batch: tub contínuo, cockpit escavado escuro,
sidepods volumétricos, asas perfiladas, quatro rodas fechadas e suspensão.
Após revisão, raízes dianteiras recolocadas dentro do tub: raycasts em ambos os
sentidos confirmam conexão, e teste verifica folga do envelope dos pneus.
Asset166.608 bytes /13.710 triângulos /cinco materiais; autoria/hash em ASSETS.md.
Não é conversão do modelo anterior nem alegação de acabamento premium.

GLTFLoader lazy, cache somente de bytes CPU. Cada renderer possui seu grafo,
com disposal idempotente e cancelamento do resultado tardio. Materiais da garagem
compartilhados não são liberados pelo asset. HTTP/parse/bounds inválidos mantêm
fallback anterior, sem qualidade equivalente. Fallback continua alocado até
teardown. Retry recria grafo; erro de bytes é retirado do cache.

Faixa em z=-12,7, plataforma apoiada de1,14 m, rampa4,1 m (~15,5 graus) e
abertura ampliada à esquerda. REC/PE conserva posição com suporte no cabeçalho;
separador atrás da rota, apoiado na plataforma. Câmera/controlador/framing/UI/
áudio/contratos intactos. Rota18 m, duração2,2–2,6 s, média paramétrica6,92–8,18
m/s, sem física. Primeiro intervalo5–8 s e seguintes25–45 s preservados.
Tentativa20 m/3–3,4 s substituída após revisão; mais frames não bastavam.

Provas em `.agent-grid/screenshots/mission-13/` na raiz do repositório:
- `scene-before/`: baseline preservado.
- `model-review/{three-quarter,front,side}.png`: três vistas Blender.
- `scene-candidate-01/`: tentativa com oclusão, preservada.
- `scene-after/pass-{1440,390,320}-{0.1,0.3,0.42,0.48,0.54,0.6,0.7,0.9}.png`:
  passagem natural de produção, mesmos enquadramentos.
- `scene-dev-sequence/`, `scene-dev-reverse/`: screencast JPEG real CDP, timestamps,
  progresso/transforms em qa.json. Fixture temporária compilada DEV usa seam
  existente; produção não expõe trigger. Native reduced=true, Cinemático escolhido
  na UI, áudio desligado, sem contexto/autoplay. Em320, R→L: pass-320-0-045.jpg e
  049.jpg; L→R: pass-320-3-032.jpg até035.jpg em scene-dev-reverse mostram silhueta
  inteira. Entrada/saída têm corte nas bordas; monitor esquerdo oculta o carro
  ao deixar a janela. Não se declara visibilidade integral do percurso.
- `asset-fallback/{404-readable-390,retry-loaded-390}.png`: HTTP404 contido,
  cena/HTML disponíveis; retry real de contexto carrega GLB após falha do cache.
  404 de rede esperado registrado; nenhuma exceção de console.
- `smoke/`: regressões integradas desktop/mobile/PT/EN/câmera/fallback.

Custos máximos capturados nos screencasts (renderer.info, não FPS):1440:97 calls/
80.584 triângulos/29 texturas;390 e320:83 calls/77.016 triângulos/24 texturas.
Baseline106/72.970 desktop e92/69.402 mobile: menos calls, mais triângulos.
Sombras/frustum variam; não são garantia de picos globais. DPR/MSAA/sombras
preservados. SceneRoot658,17 kB/gzip172,50; GLTFLoader lazy45,18/gzip13,46 kB;
baseline625,14/gzip164,15. Aviso preexistente chunk>500 kB permanece.

QA: lint/build,57 core (52 existentes+5 novos), diff-check e smoke integrado sem
erros críticos. Novos testes: GLB real/topologia/raízes/envelope, janela geométrica
nas duas direções, cache/404 e cleanup tardio/exatamente uma vez. Dois testes
antigos agora comparam posição real do separador. Teste geométrico não substitui
pixels. Chrome instalado headless com WebGL real/mobile emulado; telefone físico,
GPU/performance física, escuta de áudio e percepção humana de velocidade não
medidos. Nenhuma alteração de áudio/Easter/Canvas além do suporte estrutural.
Encerrar preview e aguardar Lead, sem iniciar outras frentes.

## P1 — cinco detalhes e legibilidade Canvas

Base integrada a43a35a, FF seguro de tree limpa, branch feat/drf-engineering-3d.
Exatamente cinco famílias continuam passivas; não há clique/ação nova nos objetos:
- Garagem: REC/PE no suporte da abertura, agora em x=-3,92/y=3,05/z=-6,09,
  placa à frente da estrutura e suspensão ligada ao cabeçalho. Ponte/ondas autorais.
- Pit wall: estojo tricolor em4,46/1,17/-4,12; tampa, cantos arredondados,
  alça semicircular, dobradiças e fechos. Nenhum escudo/logotipo.
- Telemetria: cartão observar/testar/iterar em-7,22/1,39/-4,18; apoio coerente,
  área gráfica maior, sem fatos/métricas novos. Diagrama científico DEMO.
- Estratégia: controle360 em7,09/1,50/3,08, pegas curvas e espessura real;
  sem marca/silhueta oficial. Pegas acima da bancada, suporte atrás da carcaça.
  O bloco invasivo era o anchor leve trackside, não o controle: foi recuado para
  7,55/1,23/0,9 na mesma bancada; relógio/efeito/restauração continuam iguais.
- Perfil: handgrip em-6,96/0,998/2,90; mola e pegas desobstruídas, legenda
  abaixo do equipamento, base apoiada no banco. Não se inventa rotina pessoal.

Pista visual curta PT/EN no tooltip já existente de hover/foco dos hotspots,
com descrição equivalente por aria-describedby. Clique permanece SELECT_TARGET
para zona; descoberta dos objetos é observação, não interação com eles. Não se
considera frustum nem aria-describedby prova de descoberta visual. Em320 as formas
são reconhecíveis, mas REC/PE e constância/360 são inscrições pequenas; texto do
handgrip não é legível nessa captura. Tooltip das estações laterais oferece
contexto legível. Texto completo no bitmap não garante leitura confortável dos monitores pequenos em320; HTML segue equivalente. Na Garagem mobile a Ficha Completa recobre parte do tooltip e
boa parte do hero; dependência de composição da UI, não corrigida nesta frente.
Placa vizinha REC continua contextual à Garagem e pode cortar na vista Telemetria.

Canvas usa Barlow Condensed700/Geist Variable existentes, sem alterar arquivos
fontes. document.fonts.load carrega ambas; completion provoca um redesenho por
surface + um invalidate demand. Dispose cancela callbacks tardios; sem polling,
RAF/timer novo ou upload por frame. Falha preserva texto fallback legível.
Quebra por measureText, sem fillText(maxWidth) para títulos/stack/status e sem
interromper linhas por y. Fit inclui todos os blocos com corpo mínimo18px;
overflow explícito indica leitura HTML, nunca diz que coube ao ocultar dados.
Todos os9 projetos/status disponíveis em PT/EN e1440/390/320:54 auditorias,
fator final1, título38px/corpo27px, fits=true. Metadados sceneScreenLayouts
atualizam em mudança de conteúdo/locale ou fontes, não por frame. Fonte do
conteúdo segue exclusivamente screenLines; nenhum catálogo paralelo/API.
Identificação/título das placas ganhou folga vertical para evitar colisão.

Evidência sob .agent-grid/screenshots/mission-13, raiz do repositório:
p1-before/ e p1-after/: mesmas cinco poses PT/EN1440/390/320; projetos mais
longos capturados PT/EN no after (before de seleção somente PT). qa.json contém
54 auditorias reais do Canvas com fontes carregadas. p1-title-final/ confirma o título de Estratégia com folga após ajuste final. p1-final-hints/ contém
foco real das cinco zonas320 e Estratégia1440 após limpeza do texto público e
folga final de título. p1-hints/ é inspeção preliminar anterior à limpeza, não
prova do texto final. p1-smoke/: smoke integrado. Prova natural de passagem
reutilizada do Lead em integrated-pass/results.json:18 frames PT/EN três
viewports, nova UI default, áudioOFF eGLBloaded. Externa íntegra no miolo,
entrada/saída cortam; não reivindicar visibilidade integral do percurso.

Cinco detalhes somam2.344 triângulos (<2.500), um atlas512×512 compartilhado,
sem arquivo asset/textura adicional. Máximos nas poses estáticas: desktop89→91
calls/66.872→67.348tri; mobile75→75calls/63.304→63.564tri. Texturas máximas29
/24. Contagens renderer.info, não FPS nem garantia de picos. SceneRoot662,81kB/
gzip174,48; base658,17/gzip172,50. DPR/MSAA/shadow budgets preservados.
Áudio, GLB, rota e câmera intactos; única mudança trackside é posição do anchor.

Lint/build e60core PASS. Testes novos cobrem Unicode/quebra/fonte mínima/overflow,
callback de fontes exactly-once e dispose antes da conclusão, cinco descrições
curtas e pegas fora da bancada. Testes existentes mantêm cinco zonas, bounds,
framing, atlas locale-only, topologia e dispose. Smoke13 grupos PASS em build
estável; primeiro run teve404 de fonte durante rebuild concorrente, preservado
como falha de harness, não usado como aprovação. Chrome instalado headless,
mobile emulado: sem teste físico, escuta humana ou performance/GPU física.
Sem refinamentos/fase adicional; encerrar preview próprio, commit exclusivo.
