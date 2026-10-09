# Fase D — corte funcional pequeno

Base e871c8ab759cdef0017a6dc3fe8730ae9fbad9fe; branch feat/drf-engineering-3d.

CAR_PASS interno usa o relógio monotônico acumulado do único RAF. Scheduler puro
aceita seed/config; padrão seed 4701, intervalo 25–45 s (também inicial), duração
3–5 s e um evento ativo. Gates: ready/immersive/ambient/visible/painel fechado/
câmera assentada. Leitura, transição, hide, recruiter e unmount cancelam/restauram;
retorno recebe intervalo novo, sem catch-up. Reduced motion cancela o visual e
permite apenas variante sonora quando houve opt-in; nenhuma câmera/texto vibra.

TrackPass é um veículo fictício procedural autoral simples, de materiais já
existentes, sem modelo/livery/sample externo ou dependência nova. Movimento,
realce translúcido barato no piso (aproximação, não reflexão física) e oscilação
analítica de um objeto leve vêm do mesmo progresso. Transformações/opacity são
restauradas, inclusive em cancelamento. Sem sombra móvel, render target novo,
física ou pós-processamento. Acabamento C2 permanece estilizado.

AudioContext só nasce no requestAudioFromGesture. Síntese original: seno baixo
de ventilação e motor triangular filtrado distante; PannerNode segue a rota e
listener segue a pose da câmera. Gain respeita audioVolume; default off e .25.
Opt-in durante passagem não acrescenta motor ao evento atual. Mute cancela
rampas, zera ganho, desconecta saída imediatamente e suspende contexto; nova
ativação reconecta somente após gesto/resume válido. Dispose para fontes/fecha
contexto; falhas de áudio retornam unavailable sem derrubar HTML/WebGL.
A qualidade é tonal/sintética, não gravação realista; não houve escuta física.

Verificação executada: npm run lint; npm run build; node --test com 14 testes da
fundação e 6 novos testes de clock/seed/gates: 20/20. git diff --check passou.
Verificação geométrica separada confirmou restauração de posição/quaternion,
veículo oculto/pose original, realce zerado e visual reduced-motion estático.
Build: cena lazy 604,69 kB minificado / 156,70 kB gzip; inicial 91,20 kB gzip.
Aviso existente de chunk >500 kB permanece; DPR balanced <=1,5 / low <=1.
Não foi executado novo profiling de FPS/heap/GPU ou ensaio físico mobile.

Chrome instalado headless, preview compilado 5174: primeira passagem real após
aproximadamente 26 s capturada em pass-desktop.png. Teste direcionado confirma
volume .25/off sem contexto, teclado para .26 sem opt-in, gesto on, motor mudo
no opt-in tardio, cancelamento por leitura/novo intervalo, mute e suspensão,
reativação e motor com ganho positivo na próxima passagem (pass-audio.png).
O ensaio direcionado concluiu reduced-motion/hide/recruiter/mobile e ambient
off com sucesso: targeted-results.json externo, nenhum erro crítico de console.
Passagem mobile emulada capturada em pass-mobile.png; na pose hero o veículo
secundário é parcialmente oculto pelo DRF-01. Desktop ativo: 74 draw calls /
48.618 triângulos; mobile ativo: 62 / 45.632 (passe principal, não tempo GPU).
Capturas/logs de QA ficam externos ao repositório; nenhum caminho privado/log
foi acrescentado em public. Falhas iniciais do ensaio não contam como aprovação:
helper DOM serializado foi corrigido; mute ganhou desconexão imediata.

Limites/Lead: smoke principal de D ainda não repetido; Lead revisa integração e
roda o smoke principal preservado. Escuta em hardware, amplitude percebida e
performance física mobile não verificadas. Aliasing low e limite de arte C2
continuam. Sem refinamento visual adicional ou pesquisa/download de assets.
