# Task Manager — auditoria experimental local

**Confirmado por execução** — revisão `b1b24099628eaaee5d7ab368ea38431c28ed3222`, original `main` limpo antes/depois. Cópia por `git show SHA:arquivo`, hashes em `evidencias/manifest.json`; excluídos banco original, executável SQLite e imagem. AGENTS no projeto não encontrado. Somente laboratório privado; nenhum serviço externo recebeu testes.

**Confirmado por documentação/código** — problema: gerenciar tarefas por CLI e API HTTP com persistência SQLite. Stack: Python stdlib (`HTTPServer`, `sqlite3`, JSON), cliente `requests`; schema `database_setup.sql`. Sem framework, autenticação ou fila. `backend_server.py:10–19,45–90,92–129`; `cli_client.py:15–119,130`. O startup original usa porta 8000 em todas as interfaces (`backend_server.py:139–143`); laboratório injeta somente caminho do banco e URL da CLI, instancia handler original em `127.0.0.1:5287`. Não há alteração das funções de negócio.

## Inventário e verificações

| Classificação | Funcionalidade / estado |
|---|---|
| Confirmado por execução | POST cria; GET lista/consulta; SQLite real persiste; status padrão `pendente`; CLI real cria e apresenta erros 501. |
| Confirmado por execução | JSON inválido, título ausente e ID inválido retornam 400; ID inexistente 404. |
| Confirmado por execução | PUT e DELETE retornam 501; operações não implementadas, apesar de CRUD no README (`backend_server.py:133–137`). |
| Confirmado por documentação/código | SQL parametrizado; schema NOT NULL no título; não há política explícita de idempotência/paginação/auth. |
| Confirmado por execução | POST repetido gera IDs distintos: caracterização, não defeito sem contrato idempotente. |
| Confirmado por documentação/código | Suites originais, scripts lint/build, requirements e lock ausentes: N/A, nenhum PASS atribuído. |
| Declarado pelo autor | Alta performance e números históricos do README; não reproduzidos no mesmo escopo. |
| Não verificado | Deploy, uso produtivo, segurança multiusuário, autoria exclusiva e responsabilidades pessoais. |

**Confirmado por execução** — 16 checks complementares do auditor: 11 PASS, 5 FAIL, sem equivalência a cobertura ou suite original. JSON bruto em `results.json`. Ambiente Windows, Python 3.13.9, SQLite 3.50.4, requests 2.34.2, psutil 7.2.2; máquina compartilhada, 8 threads lógicos / 31,9 GiB físicos. Dependências em venv próprio, freeze preservado, nenhum lifecycle de instalação no projeto.

| Comando (no LAB) | Exit | Wall | Condição |
|---|---:|---:|---|
| `.venv/Scripts/python.exe -m pip install requests==2.34.2 psutil==7.2.2 --disable-pip-version-check` | 0 | 4,782 s | CLI/instrumentação, não dependências de servidor. |
| `.venv/Scripts/python.exe audit.py <EVIDENCIAS>` — versão inicial | 1 | 10,858 s | FAIL original preservado; exceção posterior do harness. |
| `.venv/Scripts/python.exe audit.py <EVIDENCIAS>` — recuperação dirigida | 1 | 3,106 s | Execução concluída; exit 1 sinaliza checks FAIL. |

**Confirmado por execução** — primeiro run: `titulo:null` dispara `sqlite3.IntegrityError`, encerra a resposta sem status HTTP; conexão não alcança `close`, escrita posterior observou `database is locked`. Harness então assumiu campo `id` e lançou `KeyError`: essa última falha é **instrumental**, não sexto bug. Preservados `harness-first.py`, log, comando e wall. Única recuperação: caso tóxico movido ao fim, após fluxos válidos/benchmark; fonte inalterada. `recovery.json`. Logs com bytes mistos foram convertidos para UTF-8 escapando bytes inválidos; original binário fica no LAB, checksum em `log-encoding.json`. Caminhos privados substituídos, erros mantidos.

## Benchmark

**Confirmado por execução** — GET `/tasks` com HTTPServer e SQLite reais: conexão nova, fetchall, serialização JSON, transferência loopback e decode cliente incluídos; preparação/escrita do banco excluídas. Uma requisição warmup + 3 medidas por cardinalidade, concorrência 1, cache de SO aquecido; nenhum cache da aplicação. Fixture determinística IDs 1..n/títulos indexados/data fixa, sem RNG; hash por cardinalidade em JSON. Assertions conferem quantidade, extremos e soma dos IDs em cada medida. Sem carga remota.

| Linhas | Mediana requisição | p95 nearest-rank | Linhas/s derivadas da mediana |
|---:|---:|---:|---:|
| 1.000 | 4,022 ms | 4,539 ms | 248.633 |
| 10.000 | 50,220 ms | 61,879 ms | 199.123 |
| 100.000 | 394,958 ms | 418,769 ms | 253.192 |

**Confirmado por execução** — n=3 torna p95 o máximo e estatisticamente fraco; valores são requisições completas, não latência SQL/linha. `perf_counter`, resolução efetiva não calibrada; logs do handler incluídos, cliente/servidor no mesmo processo. Respostas de ~127 kB / 1,29 MB / 13,08 MB, não versionadas. RSS amostrado nominalmente a cada 100 ms (intervalos reais no JSON): máximo observado 163,79 MiB do processo combinado Python/servidor/cliente, não pico nem RSS exclusivo do backend. Nenhuma CPU medida. Não constitui promessa de produção nem reprodução dos 4,7 ms/136 bytes históricos.

## Achados e recomendações

**Confirmado por execução** — alta: título null causa exceção SQL/resposta interrompida; primeira execução também observou bloqueio subsequente. Reproduzir POST `{ "titulo": null }` no banco descartável; validar tipos/nulos e fechar conexão em finally/contexto.

**Confirmado por execução** — média: atualização e exclusão indisponíveis (dois checks, uma lacuna CRUD); implementar ou alinhar README/CLI. Média: GET `/tasks/1?probe=1` retorna 400 pois ID é extraído de `self.path` bruto (`:39–43`), usar path parseado. Baixa/política a confirmar: título vazio aceito 201; o harness exige 400, mas contrato explícito de vazio não existe. Não contar cinco FAILs como cinco bugs independentes sem essas distinções.

**Confirmado por documentação/código** — listagem fetchall sem paginação e servidor simples serial limitam escala; bind original amplo e ausência de auth exigem revisão antes de exposição. Sem avaliação de concorrência/ataques/produto aprovado.

## Candidatos DRF e texto profissional

**Confirmado por documentação/código** — candidato não publicado: API/CLI Python com SQLite, SQL parametrizado e instrumentação local; apresentar criação/consulta, sem anunciar CRUD completo ou ganho profissional.

**Confirmado por documentação/código** — PT: “Projeto de gerenciamento de tarefas com API HTTP em Python, cliente CLI e persistência SQLite; criação e consulta implementadas, com instrumentação de duração e tamanho de respostas.” EN: “Task management project with a Python HTTP API, CLI client and SQLite persistence; implemented creation and retrieval with response timing and size instrumentation.” Autoria e contribuição pessoal precisam de confirmação; código não prova exclusividade.

**Não verificado** — perguntas ao proprietário: CRUD é protótipo deliberado? Qual política para títulos vazios/nulos e acesso multiusuário? Qual contribuição individual e contexto dos números históricos? Há release/deploy ou apenas demonstração local?

**Confirmado por execução** — encerramento: fonte copiada manteve hashes; SHA/status original inalterados, servidor encerrado e porta 5287 sem listener. Aproximadamente 8,35 min desde cópia até fechamento técnico (inclui inspeção, não CPU/execução contínua); `closure.json`. V1, demais auditorias e servidores do usuário preservados. Reprodução: `repro/README.md`.
