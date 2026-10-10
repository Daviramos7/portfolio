# Missão 10 — Premium Experience & Art Direction

Base: b99a8aa, feat/drf-engineering, checkout limpo. Worktrees UI/3D reutilizados e preservados; Analyst ocioso. Capacidade inicial informada pela ferramenta: 25%, com reserva para integração e parada de tarefas grandes próxima de 10%. Sem V1/main, push/deploy, publicação do currículo novo ou alterações em projetos externos.

## Baseline e decisões executáveis

Build da base passou. Smoke principal no Chrome instalado passou os 13 grupos, PT/EN, cinco estações, teclado/histórico/rapid-click/retorno Recruiter, reduced e WebGL loss/retry/fallback; console/rede vazios. Capturas em .agent-grid/screenshots/mission-10/baseline-smoke. Story: navegação UI → estado compartilhado → câmera/estação/catálogo público → leitura acessível; não há API de negócio para este fluxo.

Inspeção visual: silhueta do carro e aros ainda simplificados; barreira alta preta mascara o veículo exterior; teto/arquitetura repetitivos; aliasing mobile forte. Atividade anterior restrita ao ventilador e marcador DEMO. Não considerar o resultado premium aprovado.

3D: um marco de remodelagem seletiva do DRF-01, abertura exterior e atividade diferenciada nas cinco telas, com materiais/iluminação coerentes; investigar MSAA mobile sem ampliar DPR. UI: apresentação contextual e microinterações de projetos, sem adicionar página tradicional sobre a cena. Arquivos de scene/public-scene pertencem exclusivamente ao worker3D; features/componentes próprios exclusivamente ao workerUI; contratos/conteúdo/integração pertencem ao Lead. Cada entrega exige comparação mesma pose e validação, sem repetir apenas texturas de ruído.

O cap existente limita ambientação ociosa a aproximadamente 30 renders/s; a câmera em viagem não usa esse limite. Contagem renderer.render não é FPS percebido, tempo GPU nem duração de frame. Quadro estático sem rendering periódico é economia, não falha de 0 FPS. Separar viagem, ambiente e idle; registrar condições/GPU/viewport e limites.

Áudio permanece desligado/indisponível até fonte licenciada convincente; não recriar ruído sintético. Estratégia consome interesses documentados: não inventar roadmap, datas, resultados ou contribuições. Currículo novo continua somente revisão DEV.

Baseline nativo registrado em mission-10/baseline-native: 45 frames 01→02→03→04→05→01, escolha Cinemático pela UI com matchMedia reduce=true, áudio off, console vazio. Smoke verificou poses intermediárias, latest-wins, history, hotspots e retorno sem remount/snap; nenhum teletransporte indevido reproduzido nesses caminhos. reduced continua intencionalmente direto. Primeira passagem disparada/renderizada, porém carro parcialmente encoberto por barreira/DRF-01 no frame inspecionado: visibilidade premium ainda não aprovada. 864 renders/30.000,2 ms, uploads15→15; medição em sessão de desenvolvimento com workers ativos, não benchmark isolado nem prova de FPS percebido. Smoke local: request lazy19ms e heap snapshot9.995.458bytes, sem assumir load total/tempoGPU/pico. Base lazy158,29kB gzip/inicial94,45kB gzip. Preservar estes limites na comparação.

## Marco UI integrado

81a1143 integra 6f85c08/750c033: identidade contextual do programa selecionado, posição no catálogo, qualificação e quantidade real de evidências; transições finitas de180ms e feedback hover/press/leitura. O HUD cresce cerca38px, sem galeria ou resumo adicional. Dossiê preserva proveniência sem badge duplicado, títulos completos e canvas montado. Dois padrões próprios observados em Skiper/Cult; toolbar Origin/coss preservada, sem nova adoção reivindicada. Licenças/fontes/antes-depois em component-adoption.md; sem códigoPro/pacotes novos.

No checkout principal passaram lint/build28testes existentes e35checagens de premium-ui.test.mjs: nove registros canônicos, foco/teclado/history/Escape, mesma instância canvas em seleção/leitura, nativeReduced/Cinematic explícito e320/390. Capturas do rerun inicialmente gravadas em TEMP/drf-premium-ui porque DRF_RESCUE_CAPTURE_DIR não é a variável deste script; arquivos PNG/JSON copiados para mission-10/ui-integrated, sem apagar o original. Reruns futuros usam DRF_PREMIUM_CAPTURE_DIR. Chrome instalado headless, mobile emulado; nenhum desempenho físico declarado. Revisão visual desktop feita no par baseline/final-garage-1440 do worker. NovoCV não publicado.
