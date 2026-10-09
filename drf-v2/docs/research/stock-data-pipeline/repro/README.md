# Reprodução em laboratório

1. Crie pasta nova sob `portfolio/.agent-grid/labs/performance-lab/lote02/stock-data-pipeline/`. Copie por `git show f9feca6fba241479c9fcb113132c601b4d44d54d:dashboard.py` (bytes, sem conversão PowerShell de encoding); confira SHA256 `c496192d6fa009ed50b76ff75e1c0d4040e482e1e474695868d6de2509b0e44a`. Original somente leitura. Copie `audit.py` ao lab.
2. Python3.13: `python -m venv .venv`; instale com `.venv/Scripts/python.exe -m pip install -r <evidencias/requirements-resolved.txt>`. Freeze fixa versões resolvidas, não hashes de pacotes; primeira instalação usou requirements original sem pins e psutil instrumental. Nenhuma instalação/configuração global.
3. No lab: `.venv/Scripts/python.exe audit.py <pasta-evidencias-isolada>`. Processo é bounded pelo executor original a120s; use limite equivalente e não inicie servidor persistente. Não usar env/chaves/contas ou Yahoo real. Harness permite apenas lab autorizado, injeta yf.download e aplica guard de socket Python externo; nenhuma rota remota é exercitada.
4. Exitcode1 é esperado na revisão auditada pelos seis FAILs, não instalação inválida. `results.json`, `audit.log` e fixture hashes documentam resultado atual. Não modificar fonte para fazer testes passar.

Funções originais extraídas por AST sem mudança; AppTest executa módulo original com patch temporário do fornecedor. Fixtures determinísticas sem RNG; arquivos1k/10k/100k são gerados no lab. Benchmark calcula somente indicadores em memória: warmup1+reps5, outputasserts; p95=n5máximo observado. CSV IO/extrator/gráfico/UI ficam fora do timing. Cache probe é apenas uma chamada fria/quente, não benchmark remoto.

Não há BD nem suite/lint/build original. AppTest não valida browser, desktop/mobile/foco nem integração Yahoo end-to-end. Artigos/metodologia financeira adicionais exigem outro escopo. Preserve resultados negativos e os relatórios anteriores; não publicar/commitar neste worker.
