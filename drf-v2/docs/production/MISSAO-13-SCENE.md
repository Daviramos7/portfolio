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
