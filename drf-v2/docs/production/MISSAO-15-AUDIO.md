# Missão 15 — recuperação restrita de áudio

Base 8d93bbfe3a66eb498aa4e89f295a95d56a02dce6, branch feat/drf-engineering-ui, árvore inicialmente limpa. Área: audio.ts, testes específicos de áudio e este documento; garageRenderer.ts apenas acrescenta solo ao hook DEV existente. Câmera, trigger/direção/2400 ms, TrackPass, assets, UI, contratos e CV preservados.

## Diagnóstico antes do código

Chrome instalado headless/CDP, preview compilado 5175 e perfil isolado. Gesto pela UI, volume .25, Cinematic explícito, ambiente ON, garage. Captura breve: 12.032 s PCM, 11.971 s entre callbacks de parede, três requests 200, erros coletados zero. Contexto running e sinal master real; pico .03235/RMS .001960 neste trecho COM passagem, portanto não representa ventilação isolada. Os três hashes permanecem iguais aos da M14; seus WAVs de três minutos foram reutilizados, sem repetir baseline longa. Evidências: .agent-grid/screenshots/mission-15/audio-before/.

Duas causas coexistem: silêncio exato nas pausas projetadas de 3–7 s e ventilação ativa muito baixa. PCM com RMS ~.010–.011 × ganho .022 × fator .7–1 × master .25 resulta ~4–6e-5 RMS, consistente com -90..-84 dBFS apontados pelo Lead, frente a passagens ~.0037–.0054 RMS. Não aponta asset missing/contexto indisponível. Sinal digital não determina saída física, mixer/volume do Windows, fones ou audibilidade. Nenhuma escuta humana executada; Windows não modificado.

## Correção e orçamento

Ventilação retém primeiros 80 s da gravação original de 103.275 s, antes 16 s. Excertos de 40–56 s, offsets válidos variáveis, sucessor iniciando quatro segundos antes do fim do anterior. Crossfade equal-power sin/cos com 33 pontos no AudioParam, sem editar PCM ou gerar som. Máximo duas fontes de base, incluindo sucessor futuro; onended libera a anterior e agenda outra pelo AudioContext.currentTime. Startup tem fade de quatro segundos. Não se promete eliminar silêncio intrínseco do sample nem falha por thread bloqueada além da antecipação. Hidden/recruiter/volume zero/OFF/dispose cancelam fontes ativas e futuras; retorno cria uma nova agenda elegível, sem catch-up.

Calibração pelo RMS/pico de todo PCM retido, sem normalizar samples: gain=min(teto,targetRMS/RMS,peakCeiling/pico). Base: targetRMS .0024 antes de master, teto de gain .24, peakCeiling individual .025, fator .92–1. Oficina: targetRMS .0038, teto .07, peakCeiling .035, fator .8–1. São alvos digitais limitados, não dB acústicos. Crossfade limita cada curva ao pico calibrado; não garante fase perfeita ou percepção uniforme. Oficina mantém trechos 3–6 s, fade .65 s, pausas 22–42 s e prioridade do carro. Panner, pose/listener/progress, envelope e ganho de passagem preservados; sem relógio paralelo de carro.

PCM retido em 48 kHz estéreo Float32: 80+24+4.7877 s = 41.774.464 bytes (~39.84 MiB), contra 17.198.464 (~16.40 MiB) na M14. Fontes compartilham buffers; crossfade não duplica PCM. Decode temporário ainda processa os originais completos; pico de memória/GC não medido, além dos recursos WebGL. Sem novo download/dependência. Procedência CC0 existente em ASSETS.md preservada, sem alegar carro de competição.

## Hook DEV para escuta e diagnóstico

Somente no dev, após opt-in pela UI:

```js
const d = document.querySelector('canvas').drfDebugTrackside
d.audio() // contexto/consentimento, master/volume, RMS/pico/gain, layers, agenda, bytes
d.solo('ventilation') // também 'workshop' ou 'pass'
d.solo(null) // restaura mix completo
```

Solo modifica apenas buses, sem criar/resumir contexto, conceder consentimento ou alterar volume/gates/estado/URL. Antes de consentimento e depois de OFF retorna false, sem requests. Oficina continua esparsa: aguardar evento elegível. Solo de passagem não inventa evento; trigger DEV existente permanece com seus gates, direção e 2400 ms. Restaurar com null antes da comparação. Mute limpa solo e contexto. Produção não expõe drfDebugTrackside.

## Benchmark real depois

Chrome headless/CDP, preview próprio 5175, perfil isolado, desktop 1440×900, Cinematic pela UI, volume .25. Sem acelerar relógio ou forçar passagens: **181.691 s de parede / 181.691 s AudioContext / 180.053 s PCM**, WAV estéreo PCM16/48 kHz com 34.570.284 bytes. Três requests locais 200 e nenhum erro normal coletado. Recorder externo ScriptProcessor perdeu ~1.637 s frente ao clock; não é master de produção, prova sample-perfect ou benchmark de performance. A pequena extensão posterior de campos de diagnóstico não modifica o áudio gravado.

Cinco fontes base agendadas, quatro chegaram a tocar; três transições com **crossfade de 4 s, zero gaps internos da base**. Soma das durações sobrepostas ~193.27 s, com 12 s de sobreposição intencional, portanto não deve ser lida como duração da sessão. Oficina: sete fontes agendadas, duas chegaram a tocar (~7.303 s), pausa observada 41.797 s entre elas; fontes futuras canceladas não contam como tocadas. Cinco passagens naturais (~12.081 s), sem sobreposição entre passagens ou oficina×passagem. Intervalos podem aumentar por prioridade/cancelamento, sem replay tardio.

Todo segundo inteiro capturado teve RMS maior que zero (M14 tinha segundos exatamente zero). Depois dos cinco segundos iniciais, RMS por segundo do MIX: mínimo .0004096, mediana .0005752, máximo .0053645; não são medidas de camada isolada ou loudness acústica. WAV global: RMS .0012006, pico .0327759, samples clipados zero. Calibração real: base RMS PCM .0103411, pico .055653, gain .232083 (teto .24); oficina RMS .0657975, pico .381970, gain .057753 (teto .07). Base nominal no master .25: .0006 RMS antes de fator/variação; aproximadamente uma ordem de grandeza acima da ventilação baixa M14, com passagem ainda protagonista. Não equivale a qualidade ou audibilidade aprovada.

Posição Panner/listener e progress próximos de .1/.5/.9 constam em coverage-measurements.json e nas capturas de aproximação/meio/saída. Sem inferir espacialização percebida ou som de competição. Os três hashes CC0 originais foram novamente conferidos, sem alteração:

- ventilation.mp3: 3704B5C38F8EA94B5BA209AE8039DDED71E73A24A92B197380E09A4A8C83ACBC
- workshop.mp3: 90E490033AAB4DEC6D0D775A02EE7761DD66FF7BB233124DE67A21A7092F2DE9
- car-pass.mp3: 5A8B2B35D4BDC5840CC7548DDAE217B8C9765A138F3CC1546290C7F3FE00B4CA

Raiz privada absoluta: C:/Users/davir/OneDrive/Documentos/GitHub/portfolio/.agent-grid/screenshots/mission-15/audio-after/. WAV after-master-180s-stereo.wav, long-after.json, wav/schedule/coverage-measurements.json, scripts externos e after-pass-approach/middle/departure.png. Baselines M14 permanecem preservados. PCM pesado não versionado; sem contatos/CV privados nessas evidências.

## Validação e limites

Lint/build PASS (aviso existente de chunk >500 kB); arquivos node:test descobertos explicitamente com `rg -l "from 'node:test'" tests -g '*.mjs'`, executados via `node --test`: **73 PASS**, incluindo 14 de áudio. Novas provas fake-clock: calibração limitada/silêncio, crossfade sucessor/recovery e solo sem consentimento. São testes de política, não audição. Diff-check PASS.

Smoke externo no preview 5175: **12 verificações PASS**, erros normais zero. OFF inicial sem contexto/request; volume sozinho não ativa; opt-in decodifica três assets e agenda base/sucessor/oficina; volume zero medido silencioso; resize conserva contexto sem fetch repetido; ambiente OFF mantém sala e cancela passagem; GLB/passagem visual com áudio; leitura cancela carro; fechar permite novo evento; mute fecha/para; fixture 404 termina unavailable sem fontes; console normal sem erros. PT 390, EN 320 e desktop 1440. Predicado antigo de dois loops foi substituído por duas fontes de base (uma futura) e uma oficina agendada, sem alegar que todas estão tocando ao mesmo tempo. Resultado: control-qa/audio-ui-results.json. 404 e aborts apenas na fixture esperada.

DEV 5175: **13 verificações PASS**, erros coletados zero; diagnostics antes de consentimento/requests, retenção real 41.774.464 bytes, solo das três camadas, restauração de mix/volume e OFF sem fontes. Harness espera atualização nativa dos AudioParams antes de ler buses; tentativas com leitura imediata falharam, não foram contadas como aprovação. Fontes em solo conservam sua agenda: oficina/sem passagem não representam testes de escuta desses sons. Snapshot de ventilação solo apresentou RMS .0008002 em um bloco; isso é sinal técnico, não qualidade percebida. Hook ausente no bundle de produção compilado (`rg` sem ocorrência), presente somente no DEV. Evidências: dev-solo-results.json e dev-solo-harness.mjs.

Escuta humana, hardware físico, volume do sistema, loudness percebida, seam audível e desempenho mobile **não avaliados**. Proprietário deve ouvir WAV antes/depois e usar solo/mix DEV após consentir. Não declarar recuperação auditiva aprovada apenas por RMS. Servidor próprio encerrado; aguardando integração e avaliação humana do Lead/proprietário.
