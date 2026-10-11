# Missão 13 — Visual Rescue

Base `f8f90a7`, `feat/drf-engineering` inicialmente limpa; capacidade live 85%.
A avaliação do proprietário prevalece: áudio/tipografia/stacks parciais,
passagem externa/easter eggs ruins, câmera Cinemático boa e preservada.

## Diagnóstico antes da implementação

Workers existentes 3D/UI reutilizados, árvores limpas atualizadas por FF;
Analyst não ativado. Pesquisa untracked preservada integralmente. Main
`c1bb276a7a8d354e19e39a19ed1f5166a645f19e`, V1 e currículo público intocados.
Baseline integrado: lint/build e 52 testes core PASS; aviso de chunk mantido.

Diagnósticos `a12c70e`/`647e0aa` revisados com PNGs atuais em
`.agent-grid/screenshots/mission-13/{scene-before,ui-before}/`.
Lead inspecionou passagem desktop, projeto Atleta em 320, cinco elementos
nas poses reais e leitura/Recruiter mobile. Carro com corpo estreito/rodas
dominantes/asas retangulares; janela inteira breve. Controle com corpo plano
e suporte frontal invasivo; inscrições pequenas. Stack existe, mas case a
coloca abaixo da primeira dobra e HUD compete com a cena. Não é bug de câmera.

Blender 5.2/exportador GLB já instalados, verificados sem instalar/configurar
o sistema. Autorizada modelagem original nova com orçamento limitado; UI
antecipa stack e reduz chrome redundante, mantendo Barlow/Geist e conteúdo.
Detalhes de causa/metodologia nas notas SCENE/UI, sem substituir evidências.

Áudio existente opt-in/volume/mute preservado; gravação de carro de rua,
não motor de competição. Sinal RMS anterior não equivale a escuta humana.
Não substituir por outra gravação sem procedência e melhoria demonstrável.
Capturas Chrome headless com WebGL real; mobile emulado, não telefone físico.
Sem push/deploy/publicação de currículo ou alteração de projetos auditados.

## Integração e resultado verificável

3D Creative e Frontend/UX existentes utilizados; Analyst não mobilizado.
Commits de implementação: UI `28cb427`/`3254937`; GLB/rota `3f316e8`;
Canvas/detalhes `9122b85`; descoberta da Garagem `d6130ff`.
Áudio recebeu QA documental `4e4d6c8`, sem troca de gravações/mixagem.
Integrações locais: `60346c8`, `a43a35a`, `3effad0`, `8860213`, `67d770d`.
Diffs revisados antes dos merges; nenhuma resolução automática por sobrescrita.

- Monoposto externo original modelado/exportado no Blender 5.2 já instalado:
  GLB de 166.608 bytes, 13.710 triângulos e cinco materiais. Script autoral,
  hash/procedência em ASSETS.md, loader lazy com fallback/cache/cleanup testados.
  Faixa apoiada/rampa e abertura reorganizadas; rota de 18 m, 2,2–2,6 s.
  Isso não é velocidade de competição medida nem simulação física.
- HUD agora apresenta contexto completo também no estado inicial: nome, resumo,
  tecnologias e links reais. Case antecipa stack para a primeira dobra. Tags/links
  ganham escala de leitura; controles secundários mobile ficam em disclosure.
  Nenhum conteúdo profissional foi truncado para reduzir a ficha.
- Barlow/Geist preservadas. Canvas espera fontes e redesenha uma vez; quebra por
  largura real, sem compressão horizontal e sem descarte silencioso de linhas.
  Auditoria de 54 layouts PT/EN registrou títulos/corpos completos nas fichas atuais.
- Cinco detalhes mantidos: REC/PE na abertura, estojo tricolor no Pit Wall,
  cartão científico na Telemetria, controle 360 na Estratégia, handgrip no Perfil.
  Volume/montagem/contraste revistos; dicas próprias nos hotspots por hover/foco,
  descrições acessíveis PT/EN. Objetos são passivos: interação seleciona a estação,
  não aciona um novo segredo. Número/dica da Garagem foram projetados perto da placa
  e limitados pela área livre real, com hit-test em desktop e mobile.
- Opt-in/volume/mute e independência do movimento preservados. QA integrado:
  12 assertivas finais, três assets HTTP200, sinal RMS, volume zero, cancelamento,
  dois eventos naturais, mute/cleanup e falha404 contida. Não houve escuta humana;
  gravação de carro de rua continua identificada como tal, não motor de competição.

## QA final no checkout principal

Após a última integração: `npm run lint`, `npm run build`, `git diff --check`
e 61 testes core PASS. Lista explícita: foundation, trackside, rescue-3d,
art-direction, editorial-content, mechanical-polish, experience-audio,
trackside-model, personal-details, trackside-glb, scene-canvas, garage-hotspot.
`node tests/browser-smoke.mjs http://127.0.0.1:5173/`: 13 grupos PASS,
console/rede sem erros. `tests/mission13-ui.test.mjs`: 596 checagens PASS,
PT/EN, nove programas, primeira dobra, foco, histórico, reduced e fallback.
O smoke antigo limitava a ficha default a25% do viewport desktop; `069feec`
substituiu essa premissa por limite45% e verificação de cada campo/hit-test.
Não se trata de aprovação visual automática por aumentar um limite.

18 frames integrados de eventos naturais, áudio desligado, GLB carregado,
1440×900/390×844/320×844 PT/EN, preservados em integrated-pass. Sequências
reais nos dois sentidos, baseline e testes404/retry preservados separadamente.
Capturas finais: final-smoke, final-ui e garage-anchor-fix. Lead inspecionou
imagens da passagem, ficha mobile, cinco detalhes, Canvas e dicas visíveis.

## Custo e limites de aceite

Build final: JS inicial96,43 kB gzip; cena174,78 kB gzip; loaderGLTF13,46 kB
gzip lazy. Aviso de chunk >500 kB permanece. P0 capturado na passagem:
97 calls/80.584 triângulos desktop,83/77.016 mobile, contra106/72.970 e92/69.402
na base: menos calls, mais triângulos. P1 poses estáticas:91/67.348 desktop,
75/63.564 mobile. São contagens observadas em cenários diferentes, não picos
globais/FPS nem comparação de GPU física. Texturas máximas29/24; budgets de
DPR/sombras preservados. Cinco detalhes somam2.344 triângulos e um atlas512.

Lead mediu o build final, workers idle, perfil Chrome privado/cache limpo por
viewport, RTX3060/ANGLE, sem alterar preferência nativa: samples de1,5s repouso,
3s viagem,3s ambiente,1,5s reduced. Repouso sem ambiente/reduced:0 renders novos.
Ambiente:28,96 renders/s e intervalo p95 de34,8ms nos três viewports; viagem:
115,18–115,66 renders/s observados e intervalo p95 de7ms. Isso é cadência do
contador do renderer amostrada por RAF, não FPS apresentado/tempo GPU/frame CPU.
Requisição local da cena21,6/34,8/37,6ms; heapJS observado8,25/10,98/22,75MiB
em1440/390/320, não pico ou memória GPU. Evidência/método/scripts privados:
`final-performance.json` e `.agent-grid/artifacts/mission13/native-performance.mjs`.
Console sem erros. Sem benchmark prolongado nem extrapolação para dispositivos.

Limites: acabamento ainda estilizado; início/fim da passagem cortam nas bordas
e podem ter oclusão local. Silhueta inteira é visível no miolo em320, sem garantir
percurso inteiro desobstruído. Ficha mobile ainda ocupa37–53% da altura e cobre
parte do hero; em320 o ganho de leitura não reduziu sua altura. Inscrições de
objetos pequenos, especialmente handgrip, continuam pouco legíveis no mobile.
Áudio funcional não equivale a atmosfera auditivamente aprovada. Chrome headless,
WebGL real/mobile emulado; sem telefone físico, profiling GPU ou escuta humana.
O proprietário mantém o aceite visual. Câmera aprovada/contratos/conteúdo/V1/main
e currículo público não foram alterados; cinco pesquisas untracked preservadas.

Galeria privada: `.agent-grid/screenshots/mission-13/index.html` (antes/depois,
frames, dicas e links de evidência). Logs/capturas não entram no Git. Relatórios
SCENE/UI contêm comandos, condições e tentativas rejeitadas. Preview de produção
local: `npm run preview -- --host 127.0.0.1 --port 5173 --strictPort`, em drf-v2.
No dispositivo atual reduced é nativo; escolher Movimento → Cinemático para
revisar viagens e passagens, sem alterar acessibilidade do sistema. Áudio off
por padrão; ativação voluntária para revisão auditiva. Nenhuma nova fase aberta.
