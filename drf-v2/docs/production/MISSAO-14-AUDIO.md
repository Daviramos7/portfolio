# Missão 14 — diagnóstico e P0 do soundscape

O diagnóstico abaixo registra o baseline aprovado em 6a0a826. A implementação autorizada e suas provas estão na seção P0 ao final; as descrições dos loops abaixo são históricas.

Base 552f962c6687031d1b84535e2dd9f5ca2dd3adf1, branch feat/drf-engineering-ui, árvore inicialmente limpa. Só este documento é entregue. O julgamento humano do proprietário (“repetitivo/ruim”) permanece válido; RMS/opt-in não aprovam qualidade artística. Escuta humana **não executada** nesta análise.

## Baseline real e arquivos

Chrome instalado headless/CDP, preview próprio compilado 5175, 1440×900, Cinematic escolhido pela UI, áudio ativado por gesto, volume padrão 25%, garage sem painel, ambiente ON, documento visível. Sem acelerar relógio, disparar passagem artificial ou modificar app. Sessão de 181,04 s de parede/WebAudio, cinco passagens naturais, três requests locais de áudio, sem erros coletados. Captura privada do master pós-gain via tee ScriptProcessor; WAV PCM16 estéreo/48 kHz de 180,139 s, 34.586.668 bytes. Recorder externo tem diferença de ~0,90 s entre relógio e PCM: pode perder callbacks; não é master de produção nem prova de fase sample-perfect. Pico normalizado do WAV 0,03452, RMS 0,001558, zero samples clipados; isso não mede loudness percebida ou timbre. Correlação bruta a 48 s não confirmou fase exata no WAV e não é usada como aprovação/refutação da recorrência do grafo.

Os três MP3 locais têm hashes idênticos aos de public/scene/ASSETS.md; nenhuma mídia baixada/substituída. Procedência existente: morosopher / Hotel room ventilator, SoundDesigner0101 / Workshop ambience, Johnnyfarmer / Car Passing, previews Freesound sob CC0 1.0 registrados pelo Lead. Não são gravações verificadas de carro de competição; não reclassificar o sample de rua nem mudar pitch/mix por essa suposição.

| Camada | Duração realmente decodificada / retida | Reprodução atual |
| --- | --- | --- |
| ventilation | 103,275 s / primeiros 16 s | Stereo 48 kHz; loop contínuo desde offset zero; gain .075, efetivo .01875 com master .25. |
| workshop | 131,440 s / primeiros 24 s | Stereo 48 kHz; loop contínuo desde offset zero; gain .06, efetivo .015. O trecho retido tem RMS bruto ~.064–.067 contra ~.011 da ventilação: ganho menor não torna esta camada automaticamente discreta. |
| pass | 4,788 s / 4,788 s | O limite configurado 8 s não prolonga o arquivo. Cinco starts: 5,06 / 46,17 / 86,53 / 126,88 / 171,16 s de AudioContext; janelas 2,35–2,50 s, offsets centrais 1,14–1,22 s. playbackRate=1, sem loop. |

## Causas e sincronização

As duas bases iniciam juntas e repetem os mesmos trechos: 16/24 s, combinação de fases nominal a cada 48 s. Na sessão houve cerca de 11 voltas de ventilação e 7 de oficina, sem pausa/início variável/seleção de trechos. Fade linear de 300 ms nos dois extremos força endpoints próximos de zero e reduz salto de sample, mas cria uma depressão recorrente de amplitude e não uma emenda contínua por crossfade. Não se ouviu um “clique” para confirmá-lo; a causa comprovada é estrutura repetitiva, não uma qualidade auditiva inferida.

Passagem: o áudio reutiliza quase a mesma região central da única gravação; janela curta, envelope sin² com smoothing 35 ms, pico nominal .42 antes de master/panner. Primeiro evento, três momentos aproximadamente .1/.5/.9: ganho cresce/atinge máximo/decai; posição Panner segue a rota e listener segue câmera. HRTF/inverse, refDistance=6, rolloff=.7. JSON contém progress/gain/pose/listener e PNGs aproximação/meio/saída. Isso demonstra mesma progressão do evento, não espacialização perceptualmente convincente. Intervalos desta sessão entre starts foram ~41,11 / 40,36 / 40,35 / 44,28 s: a seed fixa e os recortes semelhantes reforçam previsibilidade. Scheduler existente usa primeira janela 5–8 s, depois 25–45 s mais duração; nenhum ajuste de scheduler/3D pertence a esta entrega.

Eligibility do áudio de sala: consentimento, modo immersive, documento visível e scene ready. PanelOpen/ambientEnabled/reducedMotion não param os loops de sala. PanelOpen ou Ambiente OFF cancelam só a fonte de passagem; saída do modo/ocultação/falha suspendem contexto e zeram master. Retorno elegível retoma sala; mute/OFF aborta loading, para fontes, desconecta master e fecha contexto. Pass precisa ainda audio=on, ambiente ON e leitura fechada; mesmo evento bloqueado não é iniciado tardiamente. Gates/volume/opt-in corretos não resolvem a repetição.

## Ajuste proposto — depende de aprovação/escuta

Dentro de audio.ts, manter os três assets/procedência e todos os gates, volume clamp/OFF imediato e cancelamento. Usar ventilação como base muito discreta, com trecho e emenda escolhidos após escuta humana; reduzir sua presença e evitar depressão periódica óbvia. Tirar oficina do loop permanente: eventos curtos esparsos, não sobrepostos, com pausas de silêncio e fades, elegíveis apenas quando apropriado; congelar/cancelar agenda em leitura/visibilidade/mode conforme política aprovada, sem timers órfãos nem replay tardio. Não acelerar ou randomizar pitch para simular novo equipamento.

Passageiro existente: conservar evento/progress/panner recebido, sem segunda agenda de carro. Reavaliar recorte central e envelope ouvindo a gravação em aproximação/meio/saída; evitar os mesmos ataques mecânicos em cada passagem. Não prometer que esse único sample de rua poderá soar como competição. Preservar cancelamento, silêncio de OFF, retomada somente em novo evento e ausência de requests/contexto antes do gesto. Nenhum código implementado agora.

## Evidências / limites

Raiz privada absoluta: C:/Users/davir/OneDrive/Documentos/GitHub/portfolio/.agent-grid/screenshots/mission-14/audio-baseline/

baseline-master-180s-stereo.wav para escuta posterior; long-baseline.json (durations/voices/offsets/gains/panner/clock), wav-measurements.json, baseline-harness.mjs, measure-wav.py e PNGs after-pass-approach/middle/departure + início/fim. Gravação contém mix atual real, não demo synth. Instrumentação externa tem overhead/callbacks e não valida performance. Build e diff-check executados; sem suíte geral repetida por alteração documental. Sem fones/alto-falantes físicos, escuta humana, avaliação de loudness, mobile/performance ou aprovação auditiva. Aguardar revisão do diagnóstico e autorização antes de alterar audio.ts; sem UI, TrackPass, renderer, câmera, contratos, conteúdo, CV ou samples modificados.

## P0 implementado — 75521f0

Área exclusiva: src/scene/trackside/audio.ts e tests/experience-audio.test.mjs. API pública, opt-in síncrono pelo gesto, audioRoomEligible, origem dos samples, playbackRate=1, pose/listener/progress recebidos do 3D e limites de PCM retido preservados. Nenhum TrackPass, renderer, UI, contrato ou ASSETS.md alterado. Não há segunda agenda de carro, oscilador, noise generator, novo asset ou dependência.

Ventilação: excertos originais de 8–12 s dentro dos 16 s retidos, offset variável, fades de até 2 s, gain .022 × fator .7–1, pausas 3–7 s. Oficina: excertos de 3–6 s dentro dos 24 s retidos, fades até .65 s, gain .018 × .7–1 e pausas 22–42 s. Não há source.loop nem emenda periódica de loops. O PCM original não recebe fade destrutivo na cópia; os envelopes são agendados nos AudioParams. Isto reduz a base e torna oficina esparsa, sem prometer resultado perceptualmente aprovado.

Agenda nativa: BufferSource.start(AudioContext.currentTime + pausa, offset, duração); onended libera a voz e agenda o próximo trecho. Seed local fixa reproduzível com random opcional injetável nos testes. No máximo uma voz por camada, incluindo fontes futuras. O início de passagem cancela oficina ativa/futura e reprograma sua elegibilidade para depois do evento mais uma pausa. Passagem continua usando exclusivamente evento/progress/pose do 3D: offset central varia até ±.18 s dentro do arquivo real de 4.788 s; ganho .42 × .75–.95, envelope sin² limitado a 0..1 e smoothing .035 s; HRTF/inverse/refDistance6/rolloff.7 permanece ligado à posição real, sem deslocamento espacial aleatório. Não representa gravação confirmada de competição.

Hidden/recruiter/not-ready cancelam fontes futuras/ativas, zeram master e suspendem contexto; retorno agenda trechos novos, sem catch-up. Volume zero cancela sala/passagem e fixa master em zero; aumentar volume preserva consentimento e recompõe sala. OFF/mute/dispose abortam requests, anulam callbacks, desconectam fontes e fecham contexto. Ambiente OFF cancela apenas passagem: sala independente do movimento. Leitura cancela passagem mantendo sala. Falha de asset não concede consentimento e retorna unavailable.

### Benchmark real, sem acelerar tempo

Chrome instalado headless/CDP; preview próprio 5175, desktop1440×900, Cinematic escolhido por UI, native reduced=true, garage, leitura fechada, ambiente ON, volume .25. Master externo gravado por tee ScriptProcessor: **181.122 s de parede / 181.120 s de AudioContext**, WAV **180.053 s**, PCM16 estéreo48kHz, 34.570.284 bytes. Três requests locais200, erros coletados0, cinco passagens naturais; captures aproximação/meio/saída. O build da gravação já contém todos os novos trechos/envelopes; a correção posterior da guarda de volume zero não é exercitada nesta gravação de volume fixo e foi validada na checagem dirigida final.

Grafo medido: ventilação13 fontes agendadas,12 chegaram a tocar (~123.60 s), pausas observadas3.10–6.84 s; oficina7 agendadas, **3 chegaram a tocar (~11.29 s, cerca de6.2% do intervalo)**, duas pausas entre eventos36.35/74.01 s devido também à prioridade das passagens. Fontes canceladas antes do start não são contadas como audíveis. Cinco fontes de carro (~12.09 s). **Zero sobreposição na mesma camada e zero oficina×passagem**. Offset/duração/start de cada voz estão no JSON. Recorrência estrutural anterior de loops16/24 e fase conjunta48 s foi removida: todas as25 fontes são one-shots, com pausas, offsets e envelopes registrados. Os mesmos samples podem continuar reconhecíveis; isso não demonstra aprovação de timbre ou ausência perceptiva de repetição.

WAV depois: pico .03000, RMS .0009486, samples clipados0; baseline: pico .03452, RMS .0015582. São medidas técnicas do sinal, não loudness percebida, qualidade ou escuta. Recorder perde ~1.07 s de callbacks frente ao clock; correlação bruta de PCM não prova fase/percepção. Não foi feita escuta humana nem teste em dispositivo físico. Proprietário precisa comparar os dois WAVs e decidir ganhos/recortes; nenhuma alteração de mix baseada em audição foi alegada.

Evidências privadas fora do Git: C:/Users/davir/OneDrive/Documentos/GitHub/portfolio/.agent-grid/screenshots/mission-14/audio-after/ — after-master-180s-stereo.wav, long-after.json, schedule-measurements.json, wav-measurements.json, scripts externos e after-pass-approach/middle/departure.png. Baseline preservado em ../audio-baseline/. Uma primeira checagem de controles herdou5173 e está preservada em control-qa-lead-old-invalid-for-after/: NÃO é evidência do novo soundscape. A checagem final aponta explicitamente5175.

Hashes SHA256 originais, conferidos novamente; arquivos imutáveis:
- ventilation.mp3: 3704B5C38F8EA94B5BA209AE8039DDED71E73A24A92B197380E09A4A8C83ACBC
- workshop.mp3: 90E490033AAB4DEC6D0D775A02EE7761DD66FF7BB233124DE67A21A7092F2DE9
- car-pass.mp3: 5A8B2B35D4BDC5840CC7548DDAE217B8C9765A138F3CC1546290C7F3FE00B4CA

### Verificação

Lint e build PASS (aviso existente de chunk >500kB); núcleo/áudio60 testes PASS, incluindo11 áudio. Três novas regressões de política usam fake AudioContext/currentTime explicitamente: pausas determinísticas sem sobreposição, cancelamento de futuras/callbacks antigos e prioridade da passagem mantendo pose. São provas de política, não experiência auditiva. git diff --check PASS. Smoke dirigido externo usa duração/buffer para distinguir sala de passagem: o predicado antigo 'duas fontes loop=true' é incompatível com a nova política e não deve continuar sendo exigido. Nenhuma suíte geral foi remodelada para fabricar aprovação.

Smoke final no5175:12 verificações PASS, erros normais0. DefaultOFF não cria contexto/request; gesto de volume não concede consentimento; opt-in mobile cria um contexto e decodifica3assets; volume0 mantém consentimento mas RMS final=0; resize conserva contexto e não repete fetch; AmbienteOFF mantém sala e cancela passagem; GLB carregado/passagem visual usa fonte de áudio real; abertura de leitura cancela passagem; fechamento permite somente novo evento; mute fecha contexto e para fontes; fixture404 termina unavailable/sem fontes; logs de erro404/aborts são esperados somente na fixture. PT390 e EN320, desktop1440; UI não foi modificada. Resultado/dados e capturas em audio-after/control-qa/audio-ui-results.json. Não equivale a escuta ou aprovação artística. O volume-zero test foi repetido após corrigir a guarda imediata; sua tentativa anterior e a execução no Lead5173 não são usadas como aprovação do código entregue.
