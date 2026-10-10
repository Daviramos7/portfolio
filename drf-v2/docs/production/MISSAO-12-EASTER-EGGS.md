# Missão 12 — cinco detalhes pessoais

Base 784e88d; branch feat/drf-engineering-3d. Exatamente cinco objetos estáticos,
um por estação, sem alteração da câmera aprovada, contratos, fontes, conteúdo,
áudio ou monoposto externo. Nenhum download/dependência/asset protegido.

| Detalhe | Onde encontrar na vista existente | Interpretação autoral |
|---|---|---|
| REC/PE | Garagem: coluna esquerda da abertura, acima da bancada | Recife/Pernambuco, ponte e ondas inventadas |
| Estojo tricolor | Pit Wall: canto esquerdo da bancada | Vermelho/branco/preto, alusão cromática sem escudo/logo |
| Cartão científico | Telemetria: canto esquerdo da bancada | Observar → testar → iterar; curva qualitativa/esboço DEMO, sem números |
| Controle 360 | Estratégia: direita do teclado | Dispositivo assimétrico original, sem marca, botões oficiais ou modelo copiado |
| Handgrip | Perfil: prateleira abaixo do monitor | Constância; não atribui frequência, horário ou rotina ao proprietário |

A placa e o cartão também aparecem no hero desktop, sem zoom. Estojo, controle
e handgrip são percebidos nas respectivas vistas. O cartão foi reduzido e
deslocado após a primeira captura revelar corte lateral em 390 px. Não cobre
os projetos ou a pista; monitores existentes continuam visíveis.

## Recursos e custos medidos

Um atlas original 512×512, quatro tiles 256×256. Upload inicial e troca PT/EN,
sem RAF, timer ou uploads por frame. Geometrias/materiais compartilhados e
registro Resources existente; teste confirma dispose único inclusive atlas.
Sem aumento de DPR, sombras ou resolução dos monitores.

Hero 1440, mesma pose: 86 → 89 draw calls; 66.060 → 66.780 triângulos;
57 → 62 geometrias ativas; 28 → 29 texturas. Hero mobile 390/320:
73 → 75 calls, 62.664 → 63.212 triângulos. Nas quinze poses comparáveis,
delta entre +1 e +4 calls, +548 e +946 triângulos. Contagens de renderer.info,
não FPS/custo GPU. Atlas RGBA base teoricamente 1 MiB, memória GPU não medida.
Chunk SceneRoot: 620,85 → 625,10 kB; gzip 162,57 → 164,12 kB.
Aviso Vite preexistente de chunk acima de 500 kB permanece.

## Validação e evidência

- Lint/build PASS. Core 52/52 PASS (48 existentes + quatro novos).
- Novos testes: exatamente cinco/zonas distintas; bounds fora de carro,
  projetos e pista; centros nos enquadramentos 1440/390/320; atlas/localização
  sem redraw repetido; normais/posições finitas, topologia limitada e dispose.
- Smoke integrado existente: 13 grupos PASS no preview 5174; PT/EN,
  teclado/histórico, cinco vistas, câmera/cancelamento, perda/retry WebGL,
  fallback e mobile; console/network errors vazios.
- A tentativa inicial `node --test tests/*.test.mjs` também executou três
  scripts de browser UI com URL padrão 5175, sem esse servidor: timeout.
  Core foi executado isoladamente; smoke browser foi executado explicitamente
  contra o preview correto 5174. Não foram alterados scripts UI.

Evidências duráveis na raiz do repositório:
`.agent-grid/screenshots/mission-12/easter-eggs/`.
`index.html` compara before/after, cinco poses em 1440×900, 390×844 e 320×844.
`before/qa.json`, `after/qa.json` e `costs.json` registram estado/medidas;
`after/telemetry-en-320.png` registra o cartão em EN;
`smoke/` preserva evidências do smoke existente.

Chrome instalado headless/CDP, WebGL realmente renderizado; capturas das cinco
vistas com reduced nativo true sem alterar preferência OS ou emular movimento.
Mesmas poses/DPR para comparação. Sem novo zoom. No mobile os objetos são
reconhecíveis, mas inscrições pequenas do cartão e handgrip não são leitura
confortável; em 320 o grafismo REC/PE no hero é discreto. Não há promessa de
legibilidade de todos os caracteres, realismo premium, escuta ou teste físico
de celular. Nenhuma integração contratual nova necessária.

## Correção pontual de montagem REC/PE

Após revisão do Lead: a faixa luminosa frontal do montante atravessava a placa.
Placa elevada e avançada sobre um pequeno suporte metálico ligado à face do
montante. Somente montagem; outros quatro detalhes, monitores/câmera/pista/UI
inalterados. Na Garagem 1440/320 o grafismo está inteiro e à frente do montante.
Na Telemetria o título da estação ainda cobre parte da placa vizinha: limitação
contextual registrada, aceita pelo Lead sem outra alteração de composição;
a placa pertence à Garagem. Mobile 320 continua com letras pequenas.

Capturas dirigidas: `easter-eggs/plaque-fix/garage-1440.png`, `garage-320.png`,
`telemetry-1440.png`, `telemetry-320.png` e `qa.json`, sob a mesma raiz acima.
Chrome instalado headless/WebGL real, reduced nativo preservado, sem erros
críticos. Teste adicional de bounds verifica backing à frente da faixa e
suporte conectado ao montante, sem acrescentar caso à contagem core 52.
Suporte reutiliza box/material existentes: +12 triângulos de geometria, sem
textura nova. Build SceneRoot 625,14 kB / gzip 164,15 kB; aviso anterior mantido.
