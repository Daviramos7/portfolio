# Missão 12 — cena / marcos separados

Base: `32788f606febb87b93eabdf94223feee626607e3`; branch `feat/drf-engineering-3d`.
Câmera, framing, percursos, contratos, conteúdo e UI preservados.

## Marco 1 — gravações reais opt-in

Substitui o stub silencioso por WebAudio com três gravações CC0 locais. Contexto,
resume e fetch só começam em `requestAudioFromGesture`; volume não concede consentimento.
Available/on exige três assets decodificados e contexto running, sem noop aprovado.
404/decode/resume/construção falhos retornam unavailable; mute aborta requests,
zera ganho imediatamente, desconecta fontes e fecha contexto. Dispose idempotente.

Camadas: ventilação gravada (16 s retidos, ganho .075), oficina/equipamentos
gravados (24 s, .06), passagem gravada (4,788 s reais, .42 × envelope do evento).
Ganho master segue volume da sessão, padrão .25. Bordas dos loops recebem fade .3 s;
volume usa rampa .06 s e retomada .2 s. Não há oscilador, ruído sintético ou música.
Oficina independe de movimento/reduced; áudio continua exigindo consentimento.
Hide/not-ready suspendem e Recruiter desmonta/fecha; painel cancela motor, preserva oficina.

Motor só começa em CAR_PASS novo após consentimento, nunca no meio de evento ativo.
Posição/listener/envelope derivam do relógio/pose da cena; sem timer adicional.
Pitch preservado (`playbackRate=1`): eventos curtos usam janela central do sample,
eventos maiores não esticam a gravação. Não representa gravação de monoposto de competição.

Procedência, URLs públicas, licença e hashes em `public/scene/ASSETS.md`.
Total transferido dos três MP3: 1.986.576 bytes (~1,90 MiB), somente após opt-in.
Retenção PCM em Chrome 48 kHz estéreo: 17.198.464 bytes (~16,4 MiB);
decode temporário dos arquivos inteiros custa mais e não foi medido como pico.
Previews públicos de baixa taxa de bits utilizados; originais grandes exigem login,
sem contorno de autenticação. Aprovação auditiva humana ainda pendente.

QA: lint/build/diff-check; 45/45 testes (core 37 + oito específicos de áudio). Chrome instalado headless,
WebGL real, PT 1440 / EN 390, media nativa reduzida sem alteração do sistema.
RMS real após opt-in >0, volume zero RMS=0, mute/context closed, nenhum fetch/context
antes de consentimento e reload mobile não restaura on. OfflineAudioContext decodifica
os três MP3 sem clipping digital (picos .073/.382/.696). Isso verifica sinal, não qualidade.
Dados e capturas: `C:/Users/davir/OneDrive/Documentos/GitHub/portfolio/.agent-grid/screenshots/mission-12/scene-audio/`.
Passagem DEV e antes do modelo: pasta irmã `trackside-before/`.
QA DEV confirmou engine real em `pass-2`, sources=2 + engine=1, opt-in/volume .25,
cancelamento imediato por mute e por movimento off; 1440/390/320 com áudio off
mantêm passagem visual. Treze verificações dirigidas, zero erros de console.
Chunk SceneRoot do build de produção: 617,68 kB / 161,42 kB gzip estimado;
warning >500 kB permanece. Áudio não acrescenta render targets/texturas/triângulos.
Nenhuma escuta em hardware ou performance de telefone físico alegada.
