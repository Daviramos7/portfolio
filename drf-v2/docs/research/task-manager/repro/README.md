# Reprodução isolada

Use somente `.agent-grid/labs/night-shift-audit/task-manager/` no principal, porta5287 livre. Obtenha os quatro arquivos listados no manifest via `git show b1b24099628eaaee5d7ab368ea38431c28ed3222:arquivo` e confira SHA256. Não copie tarefas.db/sqlite3.exe. Inspecione fontes antes de executar.

Crie venv Python3.13 no LAB; instale `requests==2.34.2 psutil==7.2.2` (ou freeze preservado). Copie `audit.py` para LAB e, trabalhando ali, execute `.venv/Scripts/python.exe audit.py <diretorio-evidencias-lab>`. O harness cria/limpa somente `synthetic-tasks.db`, inicia HTTP original em loopback e encerra ao fim. Exit1 indica checks FAIL esperados nesta revisão.

`evidencias/harness-first.py` é a versão inicial arquivada, não o padrão a rodar. Primeiro erro SQL/bloqueio e KeyError instrumental mantidos nos logs; recuperação apenas moveu null-title ao fim. Não executar em banco real. Testes complementares e benchmark pertencem ao auditor, não ao projeto. Logs versionados sanitizam caminhos privados; bytes inválidos de stream misto são escapados e hash original preservado. Resultados históricos não são promessa de reprodução exata de tempo.
