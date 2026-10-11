# Missão 14 — diagnóstico de áudio, sem implementação

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
