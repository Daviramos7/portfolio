# Missão 12 — cena / marcos separados

Base: `32788f606febb87b93eabdf94223feee626607e3`; branch `feat/drf-engineering-3d`.
Câmera, framing, percursos, contratos, conteúdo e UI preservados.

## Marco 1 — gravações reais opt-in

Commit local `904ae19e38c15af5767b3abfd3de09295ea26a31` (Lead integrou em `30de68c`).

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

## Marco 2 — monoposto externo original

Modelo dedicado `TrackCar.ts`: tub branco afunilado, cockpit aberto, sidepods
vermelhos, piso/aero de carbono, dois elementos de asa, quatro pneus/aros fechados
com duas faces de seis raios, uprights/spindles e braços ligados à carroceria.
Capacete abstrato sem rosto, marca ou identidade. Geometria procedural autoral,
sem GLB/download/modelo protegido e sem novas texturas. Rods compartilhados de oito
segmentos reduzem custo; modelo abaixo de 10 mil triângulos, sem sombra dinâmica.

Rota lateral de 26 m, duração 1,8–2,4 s, curva rasa aproximando e afastando da
abertura. Primeiro intervalo 5–8 s, seguintes 25–45 s e exclusão de um ativo
preservados. Bounds amostrados em 101 poses ficam fora da garagem e à frente da
barreira, com orientação tangente contínua. Audio usa a mesma pose, mantendo pitch.
Scheduler private test usa os novos bounds de duração; nenhum contrato alterado.

Inspeção inicial mostrou o hero ocultando o monoposto baixo em mobile. Pista
reposicionada para z≈−11,1, com piso elevado real de 0,42 m e rampa de 2,75 m até
o acesso. Carro acompanha a superfície, sem levitação ou atravessar paredes.
Material/texturas existentes, duas caixas compartilhadas e um plano de rampa.

Pixels reais em Chrome instalado headless: 1440/390/320, áudio off, Cinemático
escolhido na UI sobre reduced nativo true. Antes/depois na mesma câmera/resolução:
`C:/Users/davir/OneDrive/Documentos/GitHub/portfolio/.agent-grid/screenshots/mission-12/trackside-before/`
e `trackside-after/`; JSON contém timestamps/clock/transforms e contagens.
Primeira passagem natural observada em desktop, sem trigger; DEV externo somente
para capturas repetíveis. Produção não deve expor `canvas.drfDebugTrackside`.

Sequência mais densa 320: pasta `trackside-320-detail/`, seis PNGs.
`pass-320-0.57.png` e `pass-320-0.61.png` mostram silhueta inteira dentro da abertura.
Nomes de arquivo identificam limiar solicitado, não progresso exato do pixel:
JSON registra os snapshots anteriores às capturas (~.655/.702 nesses dois arquivos).
Limites persistentes: carro pequeno em 320, corte na entrada/saída e oclusão parcial
pelo hero em outros trechos. Não declarar mobile plenamente resolvido nem visível
em todas as zonas. Sem alterar a câmera aprovada para mascarar esses limites.

Maiores contagens dos cinco snapshots dirigidos (não pico GPU nem FPS):

| Viewport | Calls antes→depois | Triângulos antes→depois | Geometrias depois | Texturas |
|---|---:|---:|---:|---:|
| 1440 | 96→103 | 66944→72238 | 70 | 28 |
| 390 | 83→90 | 63548→68842 | 63 | 23 |
| 320 | 83→90 | 63548→68842 | 63 | 23 |

DPR 1 e MSAA ativo nos três snapshots; política de qualidade preservada.
Chunk SceneRoot produção: 620,85 kB / 162,57 kB gzip estimado; warning permanece.
Assets transferidos do Marco 2: zero. Sem novas dependências ou refinamentos extras.
Lint/build/diff-check e core + áudio + modelo: 48/48 testes.
QA de áudio usa estado on/decoded, não apenas aria-pressed (que inclui requested).
Fontes Canvas, UI, conteúdo e câmera não alterados. Sem easter eggs nesta entrega.

Smoke de produção existente: 13 grupos PASS, zero erros console/network; PT/EN,
menu/hotspot/cancelamento/histórico/Recruiter, mobile, fallback e context-loss/retry.
Pasta `scene-smoke/`. GPU reportada pelo Chrome:
ANGLE / NVIDIA GeForce RTX 3060 / Direct3D11. Snapshot de heap 8.619.420 bytes,
sem inferir memória de áudio/GPU ou pico; resource SceneRoot 161.694 transferBytes,
620.858 decodedBytes. Nenhuma medição nova de FPS ou garantia de performance física.

QA dirigido de produção adicional, `scene-cancel/`: reduced nativo true produz
garagem estática; Cinemático escolhido pela UI permite passagem natural; escolher
Reduzido durante passagem cancela/restaura. Trigger DEV ausente em produção.
Não houve mock WebGL nem emulação de media nesse QA. O smoke amplo contém suas
emulações próprias, distinguido dos frames nativos acima.

Marco 2 independente sobre o commit local do Marco 1, sem merge de branch do Lead.
Próximo passo depende de revisão de pixels/escuta do proprietário e integração do
Lead. Nenhum easter egg ou harmonização de fonte Canvas iniciado.
