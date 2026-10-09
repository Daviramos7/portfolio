# Reprodução BrasilScore — Missão06

Somente em um novo diretório de `portfolio/.agent-grid/labs/mission06/brasilscore/`. Nunca copie `.env`, dados de usuário ou dependências do original. Use `copy-isolated.py --source <BrasilScore> --lab <NOVO-LAB>`; confira package/scripts/lock e os três arquivos `.mjs` antes de rodar. Não há lifecycle na raiz; scripts de dependências permanecem suprimidos.

Instalação original tentou `npm ci --ignore-scripts --no-audit --no-fund` com npm 11.6.2 (FAIL nan). Tentativa legacy-peer-deps também FAIL (canvas ausente do lock). Uma única versão anterior isolada foi suficiente:

```powershell
New-Item -ItemType Directory -Force tooling
npm pack npm@10.9.4 --ignore-scripts --pack-destination ./tooling --silent
```

Extraia o tarball em `tooling/` (o conteúdo fica em `tooling/package/`), confira `package.json` desse npm e use:

```powershell
node tooling/package/bin/npm-cli.js ci --ignore-scripts --no-audit --no-fund
node tooling/package/bin/npm-cli.js test
node tooling/package/bin/npm-cli.js run lint
node tooling/package/bin/npm-cli.js run build
```

Esse npm ci preservou o hash do lock original. Não houve reconciliação. Em outro ambiente, não assumir compatibilidade sem registrar a tentativa. Os tempos de instalação incluem arquivos/caches locais e não medem performance de produto. O webhint retorna 0 nesta revisão mesmo com erro canvas/jsdom; não interpretar como validação completa de JS ou acessibilidade. Build não é typecheck.

Copie `local-api.mjs`, `benchmark.mjs` e `browser.mjs` para a raiz do NOVO-LAB. Remova variáveis herdadas de chaves do fornecedor apenas do ambiente desses processos; nenhum env do autor é necessário. Portas 5280–5282 precisam estar livres. Execute `node benchmark.mjs`: gera `benchmark-results.json`. O exitcode esperado é **1** porque o caso complementar founded=null → 0 fica FAIL; os seis benchmarks e demais checks podem completar. Confira todos os checks antes de citar números.

Para UI, altere **apenas na cópia** o target Vite `http://127.0.0.1:3001` para `http://127.0.0.1:5281`. Configure no processo:

```powershell
$env:PLAYWRIGHT_MODULE_PATH='<lab anterior>/browser-tools/node_modules/playwright/index.mjs'
$env:CHROME_PATH='C:/Program Files/Google/Chrome/Application/chrome.exe'
$env:LAB_OUTPUT='<saída de evidências desta missão>'
node browser.mjs
```

As ferramentas Playwright anteriores são somente leitura. O smoke registra URLs externas abortadas, requests falhados, status HTTP >=400, console.error, pageerror, imagens quebradas e largura. Espera-se exitcode **1** nesta revisão porque 429 do mock aparece como “nenhum clube encontrado”. Não esconder FAIL. Focus probe verifica que nenhum controle interativo de fundo recebe Tab; BODY/foco do browser não comprova fuga ou trap completa.

`local-api.mjs` utiliza o código real de createApp, cache e FootballDataClient; a injeção nativa fetchImpl redireciona somente o origin esperado do fornecedor para mock HTTP em 127.0.0.1:5282. API 127.0.0.1:5281, upstream sintético com delay agendado de 5 ms, 20 clubes, 20 linhas e uma partida agendada. Não é a velocidade do fornecedor real. Fixtures são sequências determinísticas (id 6092026), sem RNG. Benchmark termina servidores em finally. Browser encerra Chrome, árvore Vite própria e API/mock; executar dentro de helper limitado a 180 s e encerrar apenas o PID próprio se travar. Nenhum servidor persistente de usuário deve ser fechado.

Mediana/p95 são de latências **individuais** fetch→body JSON, nearest-rank no p95. São 30 batches por cenário, concorrência 1/4/8, 5 batches de warmup. Cold limpa o cache antes de cada batch; não esfria conexões/OS. Warm é previamente preenchido. Throughput usa walltime da janela (inclui coordenação/verificações do harness). RSS amostrado a 5 ms e por batch pertence ao processo combinado API+mock+gerador; máximo observado não é pico absoluto nem RAM exclusiva da API. Máquina compartilhada e condições de host não controladas.
