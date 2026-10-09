# Assets da cena DRF

Marco C de 09/10/2026: ver [NIGHT-C.md](NIGHT-C.md) para a revisão de materiais,
correção de oclusão, enquadramentos de programas e medidas atuais. As medidas
de 08/10 abaixo pertencem à rodada visual anterior.

Todos os modelos, sinais e materiais desta entrega são procedurais, escritos em
`src/scene/` para DRF Engineering por Codex, a pedido de Davi Ramos Ferreira.
Não há GLB, imagem, fonte remota, som, marca ou modelo de terceiros incorporado.
O DRF-01 e a equipe são fictícios; a geometria é original e provisória.
As texturas dos sinais são geradas localmente com Canvas 2D e fonte do sistema.
Piso, carbono, metal e borracha usam mapas procedurais próprios de 256×256,
com ruído determinístico. O environment é um estúdio geométrico próprio,
capturado uma vez por PMREM; nenhum HDR de terceiros é utilizado.
A ponte é uma abstração geométrica própria da referência local de Recife.
Uso e edição concedidos ao projeto DRF Engineering, sem restrições adicionais
introduzidas por esta entrega; nenhuma licença externa de asset é necessária.

Funcional: garagem, carro, pista estática, cinco câmeras, navegação HTML e políticas
de WebGL/qualidade/movimento. Preparação Trackside: rota, vehicleId, progresso e
envelope puros, gate de estado, âncoras e restauração de transformações. Não há
scheduler CAR_PASS, carro em passagem, reflexo dinâmico, vibração ou áudio ativo.
O scheduler futuro deve compartilhar o timestamp do único RAF do renderer; ao
ativar eventos precisará solicitar quadros até o fim/cancelamento e restaurar as
âncoras. Não adicionar timers por efeito. `SceneHandle` retorna áudio unavailable
e mute é idempotente, sem criar AudioContext.

Rodada visual sobre a base integrada 756db51567ea3341bf1bd50c3624579bfc4334ae:
interior fechado, teto/treliças/dutos, oficina e apoio exterior estáticos;
DRF-01 com superfícies curvas, pneus arredondados, rodas, cockpit e asas próprias.
Ventilador e varredura decorativa funcionam no único relógio RAF, com ambiente
pausado por painel, movimento reduzido ou página oculta. Câmera continua durante
leitura; ocultação pausa/rebaseia o relógio; cancelamentos partem da pose atual.
O blockout técnico anterior permanece no histórico Git.

Medição desta rodada em 08/10/2026: Chrome headless 155.0.8059.39, Windows,
ANGLE/D3D11 NVIDIA RTX 3060; viewport 1440×900, DPR emulado 2 limitado a 1,5,
balanced, MSAA. Percurso 30 s, cinco câmeras repetidas duas vezes: 3.202 intervalos
entre frames renderizados, mediana 6,9 ms e p95 7,2 ms; pausas ociosas excluídas.
Polling pode incluir frames de ambiente ao fim de cada percurso. Não é tempo GPU.
Vista Garage: 61 draw calls, 45.392 triângulos, 39 geometrias e 17 texturas
(contadores do passe principal, sem contabilizar o passe de sombra).
Sem CAR_PASS; não é medição de GPU mobile nem aceite de performance integrado.
Emulação 390×844/320×844: DPR low 1, sem overflow; sem aparelho físico testado.
Build local: JS inicial 82,14 kB gzip; cena lazy 152,31 kB gzip, nenhum asset 3D
externo transferido. Há aviso Vite pelo chunk 3D >500 kB minificado; a divisão
lazy já está presente. Câmeras PT/EN, teclado/toque, painel, cancelamento,
ocultação, movimento reduzido, contexto perdido/retry e ausência de WebGL foram
verificados no preview. Três ciclos de montagem mantiveram contagens estáveis;
não foi feito profiling de heap/GPU nem teste prolongado de vazamento.
UI/HUD final e scheduler/áudio Trackside dependem da integração posterior.
As capturas full-viewport usam fixture CSS temporária externa ao repositório,
pois esta UI ainda é a primeira interface. O Lead deve compor SceneRoot no slot
.drf-immersive-stage/.drf-visual, sem margem, com menu principal no HUD e retry
no boundary. A cena possui somente pequenos hotspots ancorados aos objetos.
Os sinais consomem somente rótulos do índice; displays decorativos não são dados.
Limite do worktree: Vite dev retorna 403 para Geist via junction fora da allow
list; configuração é do Lead. No preview do build, Geist carregou e não houve
erros de console/rede. O driver emitiu aviso X4122 de precisão no shader PMREM
do Three. Nenhum arquivo de configuração foi alterado.


## C2 — superfícies e luz autorais, 09/10/2026

Piso epóxi gerado em `src/scene/garage/floorSurface.ts`: albedo, roughness e
altura 512×512, normal derivada 512×512. Noise determinístico em escala da sala,
marcas de pneus no acesso à baia e abrasão localizada de manutenção. Sombra de
contato radial original 128×128 em Garage.ts. Carbono/borracha/metal mantêm seus
mapas procedurais originais 256×256. Tudo é produzido em Canvas pelo código
DRF, sem fotografias, downloads, modelos externos ou licença CC0 atribuída.
Aplicam-se os termos do próprio repositório; nenhuma licença de terceiros nova.
SHA256 do gerador de piso desta entrega:
`fd80e00887ea1fd944d730b960c7b100f21f1192c6e60c8ed0912294dbd83d83`.
As texturas e materiais entram no registro existente de dispose. Não há
requisições de assets adicionais; QA desta rodada em docs/production/SCENE-C2.md
no repositório (fora dos assets distribuídos).
