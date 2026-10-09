# Assets da cena DRF

Todos os modelos, sinais e materiais desta entrega são procedurais, escritos em
`src/scene/` para DRF Engineering por Codex, a pedido de Davi Ramos Ferreira.
Não há GLB, imagem, fonte remota, som, marca ou modelo de terceiros incorporado.
O DRF-01 e a equipe são fictícios; a geometria é original e provisória.
As texturas dos sinais são geradas localmente com Canvas 2D e fonte do sistema.
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

Medição local em 08/10/2026: Chrome headless 155.0.8059.39, Windows,
ANGLE/D3D11 NVIDIA RTX 3060; viewport 1440×900, DPR emulado 2 limitado a 1,5,
balanced. Percurso 30 s, cinco câmeras repetidas duas vezes: 1.500 intervalos
de RAF durante transições, mediana 6,9 ms e p95 7,0 ms; pausas ociosas excluídas.
Vista Garage: 33 draw calls, 6.292 triângulos (sem contabilizar o passe de sombra).
Sem CAR_PASS; não é medição de GPU mobile nem aceite de performance integrado.
Emulação 390×844/320×844: DPR low 1, sem overflow; sem aparelho físico testado.
Build local: JS inicial 77,38 kB gzip; cena lazy 139,45 kB gzip, nenhum asset 3D
externo transferido. Há aviso Vite pelo chunk 3D >500 kB minificado; a divisão
lazy já está presente. UI/painéis finais e scheduler/áudio Trackside dependem
da integração posterior. Os sinais da cena consomem somente rótulos do índice.
Limite do worktree: Vite dev retorna 403 para Geist via junction fora da allow
list; configuração é do Lead. No preview do build, Geist carregou e não houve
erros de console/rede. Nenhum arquivo de configuração foi alterado.
