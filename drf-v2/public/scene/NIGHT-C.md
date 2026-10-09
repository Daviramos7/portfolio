# Marco C — garagem e programas

Rodada de 09/10/2026, sobre a base integrada
`0b46ca57f6416484fcfa104624191e58c18b2895`.

- Painel de ferramentas e gaveteiro reposicionados contra a parede; displays de
  programas ampliados e separados da oficina. Selecionar projeto em Garage usa
  enquadramento próprio desktop/mobile; título selecionado ocupa a primeira placa.
  Rótulos longos quebram em duas linhas, sem catálogo paralelo ou métricas novas.
- Percursos incluem poses canceladas no corredor e os enquadramentos próximos
  mobile. Última intenção vence a partir da pose atual; painel não causa snap,
  ocultação pausa/rebaseia o relógio e reduced motion permanece direto.
- DRF-01 recebe UVs na carroceria e normais contínuas na costura. Pintura tem
  clearcoat moderado; carbono é escuro e menos especular, pneus foscos, metais
  distintos. Piso epóxi/concreto tem metalness .02 e roughness .88 com mapa;
  não há espelho, reflection pass dinâmico ou nova geometria de decoração.

Autoria/proveniência: geometrias e seis mapas de superfície 256×256 são originais,
gerados por código/Canvas para DRF Engineering por Codex a pedido do proprietário.
Dois normal maps derivam dos campos de altura próprios de carbono/borracha;
ruído determinístico, sem downloads, imagens/modelos/áudio de terceiros ou licença
externa. Uso/edição concedidos ao projeto, conforme ASSETS.md. Texturas e materiais
compartilhados continuam no registro de dispose da cena.

Validação: lint, build, 14 testes da fundação e smoke integrado no Chrome instalado.
Smoke cobre teclado/toque, PT/EN, painel, cancelamento, visibilidade, reduced motion,
context loss/retry, WebGL desabilitado e fallback HTML; sem erros de console/rede.
Verificação geométrica avulsa: 1.154.736 amostras de percursos cancelados fora do
envelope do carro/limites da sala e 54 raios desobstruídos para as três placas nas
câmeras de programas. Isso não equivale a física ou análise contínua de colisão.
Capturas integradas antes/depois revisadas em desktop 1440×900 e mobile 390/320×844.

Medição: Chrome headless 155.0.8059.40, Windows, ANGLE/D3D11 RTX 3060; 30 s,
cinco câmeras repetidas duas vezes, 3.212 intervalos renderizados: mediana 6,9 ms,
p95 7,3 ms. Polling pode incluir ambiente no fim do trajeto; pausas excluídas;
não é tempo GPU. Hero: 62 draw calls, 45.392 triângulos, 39 geometrias/18 texturas
do passe principal; DPR balanced 1,5/MSAA. Programas: 29 calls/24.644 triângulos
desktop, 28/24.062 mobile. Low DPR 1. JS inicial gzip 89,68 kB; cena lazy 153,67 kB.

Limites: mobile físico, profiling de GPU/heap e teste prolongado de vazamento não
medidos. Permanecem avisos de chunk >500 kB e precisão X4122 do shader PMREM no
driver. CAR_PASS/reflexos/vibração/áudio não implementados neste marco; áudio
continua unavailable e desligado por padrão. A extensão de volume do Lead é
compatível; setter de gain e controles opt-in pertencem ao follow-up D.
