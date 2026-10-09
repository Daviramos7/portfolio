# Reprodução local — Missão06

Use um novo diretório em `.agent-grid/labs/mission06/atleta-hibrido/`. Os scripts não corrigem o projeto. Fixtures são sintéticas, geradas em `mission06.test.ts`; a seed registrada identifica o lote, mas a geração é uma sequência determinística, sem RNG.

1. Execute `python copy-isolated.py --source <AtletaHib> --lab <NOVO-LAB>` a partir deste diretório. Confira `package.json`, `pnpm-workspace.yaml`, `vite.config.js` e `scripts/smoke-polish.mjs` antes da execução. Não copie `.env`, dados do usuário ou `node_modules`.
2. No NOVO-LAB: `pnpm install --frozen-lockfile --ignore-scripts --store-dir ./pnpm-store --reporter append-only`. Não há package-lock; por isso foi usado pnpm, sem habilitar o lifecycle esbuild permitido pelo workspace. O binário disponível funcionou com scripts suprimidos.
3. Antes de criar qualquer env local, remova somente do ambiente do processo as variáveis herdadas `VITE_*`/`SUPABASE_*`; use `TZ=America/Sao_Paulo`, `CI=true`. Execute `pnpm test`, `pnpm run lint`, `pnpm run build`. Registre stdout/stderr, exitcode e relógio monotônico. Build inclui `tsc -b`.
4. Copie `mission06.test.ts` para a raiz do NOVO-LAB. Execute `node node_modules/vitest/vitest.mjs run mission06.test.ts --maxWorkers=1 --testTimeout=30000`. O exitcode esperado nesta revisão é **1**, com **4 PASS / 3 FAIL**: os FAILs mantêm as três regressões de integridade visíveis. Resultado completo: `mission06-results.json`. O mock somente devolve as fixtures prefiltradas; não implementa SQL, RLS, filtros ou auth.
5. Instale ferramenta de navegador exclusivamente em `browser-tools`: `npm install --prefix ./browser-tools --ignore-scripts --no-audit --no-fund playwright@1.58.2`. Nenhum browser é baixado; use Chrome local. O package-lock gerado nessa ferramenta fica no laboratório.
6. Execute `python browser-local.py --lab <NOVO-LAB> --output <SAIDA-MISSAO> --chrome "C:/Program Files/Google/Chrome/Application/chrome.exe"`. Repita com `--water-only` para o incremento de água. Esse helper cria env com destino sintético loopback 5289, inicia Vite loopback 5280, espera HTTP 200 e encerra apenas os PIDs que criou. Falha se a porta já estiver ocupada. É um processo de duração limitada, sem servidor persistente; nenhum terminal AgentGrid foi criado.

Inspecione as interceptações do smoke antes de rodar: somente o origin do Vite passa pela rede; Supabase sintético recebe `route.fulfill`, demais origins recebem `route.abort`. A fixture usa datas relativas ao dia de execução; o teste complementar congela apenas Date em 09/10/2026 nos cenários semanais. Nenhuma conta, senha ou env do autor é necessária.

Para repetir os benchmarks, encerre primeiro o smoke próprio. A máquina permanece compartilhada, sem controle sobre carga de outros processos. O p95 é dos tempos médios de lotes de 10 chamadas, não p95 por chamada, request HTTP ou usuário. RSS é snapshot do worker Vitest, não pico de RAM nem RAM do produto. Não use esses números como promessa de produção.

`--console` instrumenta console.error no smoke existente. Nesta auditoria essa rodada terminou FAIL por 11 recursos ERR_FAILED; logs preservados, URLs não instrumentadas. Não substituir esse FAIL por alegação de console limpo.

