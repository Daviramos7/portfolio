# Reprodução isolada

Use apenas lab próprio dentro de `portfolio/.agent-grid/labs/mission06/auditoria-despesas-pyspark/`. Original somente leitura. Os helpers recusam execução fora desse lab. Java17 instalado é requisito; ajuste caminho JAVA_HOME no wrapper apenas à instalação local conhecida.

1. Copie `README.md` e `analise.ipynb` usando `git show 27f0c933e83c2e426248bf397659c88b02fe072e:<arquivo>`; confira hashes do manifesto. Copie os quatro scripts desta pasta ao lab. Nunca copie env, dados privados ou dependências do original.
2. Crie venv Python3.13 no lab. Instale com `python -m pip install -r <evidencias/requirements-resolved.txt>` usando o Python do venv. Freeze registra versões resolvidas; não é lock com hashes dos pacotes. Primeira execução instalou constraint original `pyspark>=3.5,<4.1`, pandas/matplotlib/requests e psutil instrumental.
3. Obtenha normalmente o CSV da URL estável em `evidencias/public-download.json` e salve como `public-dataset.csv`. Uma coleta basta. Compare SHA256 `4445925692b24c33523e45bf02c52f01d0f2593a9fe1dcf93b8342986c80d36d`; fonte mutável pode retornar nova revisão. Nunca registre query de redirect assinado. Alternativamente reutilize arquivo público do lab existente.
4. No lab, com `PYTHON=.venv/Scripts/python.exe`, execute:

```text
PYTHON measure_process.py --label public-pipeline --evidence <pasta-evidencias-local> --timeout 180 -- PYTHON run_pipeline.py --input public-dataset.csv --output public-output
PYTHON measure_process.py --label checks-benchmark --evidence <pasta-evidencias-local> --timeout 180 -- PYTHON checks_benchmark.py
```

Wrapper substitui token PYTHON pelo executável do venv. O segundo filho termina1 por dois FAILs esperados/preservados; o wrapper0 indica apenas medição concluída. Veja exitcode do JSON. Fixtures pequenas são geradas deterministicamente no lab pelo script (ID6092026; sem RNG); não precisam versionar CSV100mil/public87MB.

Transformações originais preservadas; bootstrap adaptado explicitamente, download/upload desativados, Spark local[2]/2GiB/loopback/UI off. Checks após erro ANSI usam sessão ANSI=false; pipeline público usa padrão true. Benchmark extrai AST original linhas755–841, inclui IO+ações+Top10, exclui startup/charts/exportações. Warmup1/repetições3; amostras e hashes estão em evidencias. RSS são snapshots separados Python/JVM, não picos garantidos.

Não instalar winutils/global, não usar cluster/produção. Spark/gateway/descendentes próprios são encerrados pelo harness. Não encerrar servidores do usuário. Arquivos grandes e caches permanecem apenas no lab.
