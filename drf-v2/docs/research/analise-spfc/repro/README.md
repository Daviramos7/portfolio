# Reprodução isolada

Use pasta nova em `portfolio/.agent-grid/labs/performance-lab/lote02/analise-spfc/`, nunca original. Copie via Git SHA `ff13dc28a6872d4b53f6e203eb241f9b2a1e6f32` os arquivos Python/testes e requirements; preserve bytes e confira hashes do manifesto. Não copiar env/dados históricos/assets/.git/deps. Helpers recusam cwd fora do lab.

Python3.13: crie `.venv`; instale `requirements.txt` original + `psutil==7.2.2`; para repetir versões transitivas use `evidencias/requirements-resolved.txt`. Execute `pip check`. Não instalar/configurar globalmente. Copie três helpers desta pasta ao lab. Exemplos, Python=venv e E=pasta de evidências isolada:

```text
Python measure.py unittest E -m unittest discover -s tests -v
Python measure.py cli-demo E main.py --demo --no-open
Python measure.py legacy-demo E raspagem_spfc.py --demo --no-open
Python measure.py offline E offline_audit.py E
```

Execute demo antes de offline (check lê output/dados_spfc_demo.csv). CSV demo separado e evidência SINTETICO-demo.csv; não copiar para caminho real nem chamar datasetFBref. Extrator original recebe driver/HTMLfixture; source='real' só indica branch de código. Menu com inputs1/2/3/0 e gráfico Agg ficam sem GUI. Fixtures aritméticas são geradas no lab; demo seed42 original.

O harness **executado** está arquivado em `evidencias/harness-offline-original.py`, com dois FAILs. Esta versão de reprodução muda **somente** assist top rate de igualdade exata para `math.isclose(rel_tol=1e-12, abs_tol default0)`. Diagnóstico dirigido dos valores originais passou; o harness corrigido não foi rerodado, benchmarks não repetidos. Permanece expectativa comma-thousands em rawDataFrame; não representa comportamento garantido do caminho read_html/FBref.

Benchmark: warmup1/reps3, normalização+Top5+CSVreal, sem coleta/parserHTML/plot; input/SO aquecidos, serial1. Readback/asserts fora do timing. RSS snapshots100ms com Python/browser separados, não peak. Arquivos100mil ficam só lab.

Tentativa pública realizada uma vez: `Python measure.py public E public_once.py E`. Bootstrap usa Chrome instalado, driver-cache/perfil próprios, porta local5285, headless padrão sem flags de disfarce. Resultado foi403/timeout; **não repetir para contornar challenge**, sem bypass/retries/fallback e sem usar cookies/contas. Driver download foi normal na cache lab após inspeção. Preserve esse bloqueio como evidência atual, não substituir por histórico46registros. Wrapper limita90s e encerra somente seus descendentes conhecidos; preserve servidores do usuário.
