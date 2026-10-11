# Missão 14 — Trackside Experience Rescue

Execução em 11/10/2026, base `552f962`. A avaliação humana da Missão 13
prevalece; esta entrega depende de nova avaliação de velocidade, reconhecimento
dos objetos e escuta. Câmera, projetos/stacks, conteúdo, fontes e currículos
foram preservados. Nenhum push/deploy ou instalação.

## Diagnóstico → correção

- Passagem: percurso predominantemente lateral/distante e rodas imóveis
  produziam leitura de translação. O mesmo GLB foi preservado (166.608 bytes).
  A curva agora varia profundidade/orientação, com progressão espacial assimétrica,
  rolamento pela distância percorrida e referências fixas de pista. Duração
  natural continua 2,2–2,6 s; não foi apenas um multiplicador de velocidade.
- Projeção analítica central em 320 px: aproximadamente 168 → 270 px/s;
  AABB 129×34 → 188×46 px. AABB inclui espaços vazios; não prova silhueta
  visível ou percepção. Vídeos contínuos com HUD registram o resultado real.
- Áudio: loops de 16/24 s começavam juntos. Agora são trechos one-shot,
  offsets/envelopes variáveis, pausas e prioridade da passagem. Em ~181 s
  reais: 12 trechos de ventilação e três de oficina efetivamente iniciados;
  cinco passagens, sem sobreposição oficina×passagem. Mesmo material CC0;
  sample de carro de rua não é apresentado como motor de competição.
- Estojo: faces das faixas e do corpo eram coplanares, causando z-fighting,
  não um erro de UV. Faixas inteiramente à frente da superfície, sem offset
  artificial de material. Closes comparáveis demonstram a separação.
- Controle: geometria original com face abaulada, pegas, analógicos
  assimétricos côncavos, D-pad, quatro botões, bumpers e gatilhos. Sem logos
  ou modelo proprietário. Outros três detalhes pessoais preservados.

## Integração e validação

Workers existentes: 3D Creative (cena/objetos) e Frontend/UX (áudio, área
exclusiva neste ciclo). Ambos encerrados; pesquisa não mobilizada.

- Commits de implementação: `75521f0` (áudio), `90721df` (passagem),
  `88a9a00` (estojo/controle); documentação de áudio `174de47`.
- Integrações locais: `028189c`, `196b694`, `289682b`. Diagnósticos preservados
  em `f9fb109` e `4afe988`; detalhes nos relatórios SCENE/AUDIO desta missão.
- Lint/build PASS; 70 testes `node:test` PASS. Smoke final no checkout
  integrado: 13 grupos PASS; PT/EN, 1440×900, 390/320 emulados, navegação,
  histórico/foco, reduced motion, contexto/retry e fallback WebGL.
- QA de áudio no checkout com ambos P0 integrados: 12 checks PASS, opt-in,
  volume/mute, cancelamento, resize, ambiente OFF e fixture de asset 404.
  Console/rede sem erros nos cenários normais; 404 intencional separado.
- Cena final: 668,21 kB minificados / 176,39 kB gzip; aviso >500 kB permanece.
  Rolamento acrescenta seis calls durante passagem; gamepad acrescenta
  14 calls/1.912 triângulos em Estratégia, sem textura nova.
- Medição final separada, sem workers/QA Chrome concorrentes: zero renders
  adicionais em repouso com ambiente OFF e em reduced, ~29 renders/s de
  atividade ambiental (p95 entre renders 34,8 ms) e p95 7 ms durante viagem.
  São cadência/timestamps do renderer, não FPS apresentado ou tempo de GPU.
  Pedido local frio da cena: 17,2–19,2 ms; não é execução/importação.
  Snapshot único de heap JS: 10,7–11,8 MB; não é pico nem memória de GPU.
  Dados/metodologia: `final-performance.json` na galeria privada.

## Evidências e reprodução

Galeria privada: `.agent-grid/screenshots/mission-14/index.html`.
Vídeos completos antes/depois em `viewport-before/` e `viewport-after/`,
1440/390/320. Os vídeos P0 foram gravados no integrado `196b694`, antes
do lote dos objetos. Captura CDP → MediaRecorder em tempo real, sem retiming;
callback/frame perdido é registrado e não equivale a benchmark de FPS.
WAVs de ~180 s para comparação, closes e posições reais dos objetos estão
na galeria. Capturas/logs pesados permanecem fora do Git.

Preview: `http://127.0.0.1:5173/`. Escolher Movimento → Cinemático para
avaliar a passagem; áudio continua OFF até gesto voluntário.
Em DEV, com cena pronta/estável e ambiente ON:
`document.querySelector('canvas').drfDebugTrackside.trigger('left-to-right')`
ou `'right-to-left'`: evento determinístico de 2400 ms, false se inelegível
ou já ativo. Não exposto em produção; calendário natural preservado.

## Limites que permanecem

Entrada/saída podem cortar nas bordas; janela completa no mobile é breve.
Outras estações têm oclusões ou não apontam à pista; câmera aprovada intacta.
Gatilhos do controle pouco expostos e inscrições pequenas no mobile.
Gravações sonoras continuam reconhecíveis; não houve escuta humana.
Chrome instalado headless, WebGL real e mobile emulado: sem telefone físico,
tempo de GPU, consumo de energia ou aprovação perceptiva alegados.
Main/V1/CVs e arquivos de pesquisa não rastreados foram preservados.
