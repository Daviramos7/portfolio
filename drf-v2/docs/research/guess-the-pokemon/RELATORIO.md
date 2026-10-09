# Guess the Pokémon — auditoria experimental offline

**Confirmado por execução** — repositório público obtido uma vez em laboratório, revisão `14d501c2a87fa0eaad5030614a04c0cc4bcaaed4`: [fonte](https://github.com/Daviramos7/Guess-the-Pokemon/tree/14d501c2a87fa0eaad5030614a04c0cc4bcaaed4). `git clone --depth 1 --no-checkout`, materialização somente de README, HTML, CSS, JS e .hintrc por `git show SHA:arquivo`; manifest/hash preservados. Nenhum checkout original local editado; imagens oficiais não copiadas ao portfólio. AGENTS ausente entre arquivos rastreados.

**Confirmado por documentação/código** — problema/solução: jogo de adivinhar silhuetas com três chances, dicas, pontuação e sugestões; frontend estático HTML/CSS/JS, `fetch` para PokéAPI, estado em memória e recorde em localStorage (`script.js:1–37,116–126,390–449,508–593,679–771`). Sem backend próprio/auth. README:11–27,58–65 descreve regras; não comprova experiência pessoal/exclusividade.

## Inventário e execução

| Classificação | Funcionalidade / condição |
|---|---|
| Confirmado por execução | Startup, palpite normalizado, repetição sem consumir chance, nome inválido sem consumir chance, três dicas limitadas, pontuação e recorde após reload. |
| Confirmado por execução | Três erros esgotam rodada; reinício por aba; sugestões com teclado/Enter e Escape. |
| Confirmado por documentação/código | Sorteio 1..151 e máscara probabilística; auditoria fixa Math.random=0, não valida distribuição aleatória. |
| Confirmado por execução | Desktop 1440×1000 e viewport 390×844; width sem overflow horizontal na amostra, foco inicial no input e amostra de Tab registrada. |
| Confirmado por documentação/código | Sem package.json/suite/lint/build original: N/A. .hintrc presente, não equivale a webhint executado. |
| Declarado pelo autor | Compatibilidade com todos os navegadores, design para qualquer dispositivo e licença MIT (README:27,34,91). LICENSE não rastreado. |
| Não verificado | Acessibilidade completa, dispositivo físico, Firefox/Safari, deploy atual e integração real PokéAPI. |
| Bloqueado | Aparência completa com ícones/fontes externos deliberadamente bloqueados pelo isolamento; não é falha do provedor. |

**Confirmado por execução** — harness complementar, não suite do autor: 18 checks, 14 PASS / 4 FAIL. Chrome headless 155.0.8059.40 existente, Node v22.21.0, playwright-core 1.64.0 instalado em tooling isolado com `--ignore-scripts`, lock do harness preservado. Nenhuma instalação global/browser novo. Máquina compartilhada, 8 threads / 31,9 GiB físicos. Comando `node browser.mjs <EVIDENCIAS>` no LAB, exit 1 por checks FAIL, wall 5,911 s, timeout 70 s não atingido. Instalação tooling exit 0, duração não instrumentada; comandos/logs em JSON.

**Confirmado por execução** — aplicação original sem edição de URLs: interceptor do navegador encaminha somente PokéAPI para mock HTTP `127.0.0.1:5286/api/v2/pokemon`; demais recursos externos abortados. Fixtures alpha/beta/gamma/delta com tipos e sprites SVG sintéticos; moldura SVG sintética substitui imagem da Pokédex no servidor. Serviço local usa arquivos reais HTML/CSS/JS. Sem requisição/carga externa de gameplay. `fixtures.json`, `browser-results.json`, `repro/browser.mjs`. Public clone é aquisição de fonte, não carga de API.

**Confirmado por execução** — `pageErrors=[]`. Erros de console/recurso preservados: CDN Font Awesome e Google Fonts bloqueados instrumentalmente, favicon local 404 (referência `index.html:6`, arquivo não rastreado), quatro HTTP503 intencionais do mock. Não apresentar esses 503 como disponibilidade real PokéAPI. URLs sanitizadas sem tokens em `blockedExternal`, `failedResources`, `mockedPokeUrls`, `serverRequests`.

## Achados reproduzidos

| Classificação | Severidade / reprodução / fonte |
|---|---|
| Confirmado por execução | Média: após enviar palpite, feedback é substituído por “Adivinhe o Pokémon!”. Submit chama updateAttemptsBubble depois de checkGuess; reconstrução fixa texto. `script.js:217–225,495–505`. Screenshot de vitória mostra 20 pontos e mensagem genérica. |
| Confirmado por execução | Média: acertar alpha com duas chances e depois enviar gamma reduz chances de 2 para 1; rodada vencedora continua aceitando palpites. Guard só cobre attemptsLeft<=0 (`:390–406`), apesar de comentário incluir vitória. Não foi observado prêmio duplicado; não alegar isso. |
| Confirmado por execução | Média: um clique no botão reiniciar gera duas aquisições locais; listeners duplicados `:595–597,796` além da lógica restartGame `:33–37`. O reinício por aba é outro caminho. |
| Confirmado por execução | Média: quatro respostas503 locais consecutivas fazem renderPokemon buscar cinco vezes até sucesso permitido pelo fixture; código recursivo sem teto/backoff `:381–386`. Expectativa do harness “uma aquisição” testa ausência de limite, não contrato documentado de exatamente um retry. Corrigir com orçamento finito/estado de erro; não concluir número infinito executado ou falha remota. |

**Confirmado por documentação/código** — sugestões baixam lista 151 e detalhes em eventos input (`:741–771`), sem cache/debounce visível; otimização candidata, sem benchmark externo ou defeito de latência mensurado. Priorizar estado terminal, manutenção de mensagem, listener único e recuperação finita.

## Evidência visual, recursos e limites

**Confirmado por execução** — três PNGs inspecionados: startup desktop, vitória desktop, startup mobile. Sintéticos claramente identificados, sem assets oficiais reutilizados. Mobile mostra abas sem texto/ícones: CSS esconde `.tab-text` abaixo de 768px (`style.css:808–809,1044–1048`) e Font Awesome foi bloqueado; aparência mobile completa **Bloqueado** por condição instrumental, não novo bug atribuído sem validar dependências. Não há certificação de layout original nem de navegação acessível completa.

**Confirmado por execução** — RSS nominalmente a cada 100 ms, intervalos/samples brutos em `browser-run.json`: máximo observado combinado 682,05 MiB para Node/mock/harness, Chrome e helper de console próprios; wrapper Python excluído. Não pico, RSS exclusivo do jogo ou comparação com Task Manager. Wall inclui browser startup, checks, waits e PNGs; não é benchmark de throughput. Benchmark de velocidade N/A: interação funcional offline é mais informativa neste escopo; não há número artificial de req/s/produção. Latência da PokéAPI real **Não verificado**.

## Candidatos DRF e texto profissional

**Confirmado por documentação/código** — candidato não publicado: frontend JavaScript com consumo de API, lógica de tentativas/dicas, sugestões e recorde local; assets/licença exigem revisão antes de reutilização. [Demo declarada no README](https://guess-the-pokemon-coral.vercel.app/) **Declarado pelo autor**, sem visitar/validar produção.

**Confirmado por documentação/código** — PT: “Jogo web em HTML, CSS e JavaScript com consumo da PokéAPI, dicas progressivas, sugestões de nomes e recorde persistido localmente.” EN: “HTML, CSS and JavaScript guessing game consuming PokéAPI, with progressive hints, name suggestions and a locally persisted high score.” Não anunciar operação remota comprovada, autenticação ou exclusividade de autoria.

**Não verificado** — perguntas: contribuição individual e datas? Rodada deve encerrar no acerto? Política de retries/erro offline? Qual licença cobre código e assets da franquia? Há intenção de acessibilidade sem CDN, e quais navegadores foram validados pelo autor?

**Confirmado por execução** — encerramento: hashes copiados inalterados; navegador e servidor próprios fechados, porta5286 sem listener; nenhum original editado. Aproximadamente 7,74 min desde cópia ao fechamento técnico, sobreposto à inspeção de Task Manager; não somar como CPU. `closure.json`. Nenhum outro projeto iniciado; fontes/relatórios anteriores preservados. Reprodução: `repro/README.md`.
