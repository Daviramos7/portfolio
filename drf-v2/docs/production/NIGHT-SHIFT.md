# Night Shift — 09/10/2026

Base: `2e3adb9`, branch `feat/drf-engineering`. Autorização: integração e commits locais; nenhum push, deploy ou publicação definitiva de currículo.

## Marcos e responsabilidades

- Lead: revisão das cinco auditorias, projeção editorial PT/EN e métricas contextualizadas, contratos preservados, integração e QA.
- DRF 3D Creative (worker existente, GPT-6.1-Sol / Medium): oclusão geométrica, câmera, materiais originais, iluminação; Trackside incremental após estabilização.
- Frontend/UX (worker existente, GPT-6.1-Sol / Medium): telemetria, fontes/contextos legíveis, controles opt-in, teclado/mobile.
- Portfolio Intelligence Analyst / Resume Specialist: reutilização sequencial após liberação de uma frente; no máximo dois workers pesados ativos.

## Conteúdo

Sete métricas derivadas de cinco relatórios preservados em `docs/research/`: registros/totais públicos Recife, testes existentes Atleta/BrasilScore/SPFC e medianas de operações locais Stock/SPFC. Cada número aponta para uma evidência de auditoria com data/revisão, e contém condições/limitações PT/EN. Relatórios não publicados remotamente têm URL nula deliberadamente. Não transformar inspeção de código em execução ou testes PASS em cobertura; não comparar operações diferentes.

Contribuição individual continua nula até confirmação. BrasilScore distingue endpoints de partidas da UI ausente. Horta permanece pendente. Nenhum dado pessoal de saúde, credencial ou conteúdo interno municipal integra o payload.

## Problemas encontrados nesta execução

- ESLint também percorreu snapshots TypeScript de projetos auditados e encontrou sete `any` históricos. Excluir somente `docs/research/**` do lint da V2 preserva as fontes de evidência sem modificar projetos ou relaxar regras de produção.
- Teste de navegação usava Atleta/Telemetry como alvo inválido; passou a ser válido com métricas do Atleta. Fixture negativa alterada para Horta/Telemetry, que permanece não relacionado.
- Smoke tinha quantidade fixa de duas métricas; expectativa agora vem do catálogo compartilhado.

## Evidências e gravação

Capturas incrementais: `.agent-grid/screenshots/night-shift/`; as versões anteriores e worktrees são preservados. Capturas não equivalem a gravações já realizadas. Sugestões futuras: hero DRF-01, viagem contínua Garage→Telemetry, abertura de leitura com contexto local, comparação de materialidade antes/depois e opt-in de áudio seguido de passagem externa.

O fluxo testado é intenção UI/hotspot → estado compartilhado → enquadramento 3D + conteúdo HTML; não existe API remota do portfólio nesta versão.

Resultados de integração e commits serão registrados após execução; não há aprovação visual do proprietário implícita.

## Checkpoint integrado

- `a6fa06a`: conteúdo sanitizado e sete métricas com condições explícitas; lint/build e 13 testes; smoke desktop/390/320 e fallback com console/rede sem erros.
- `0b46ca5`: extensão aditiva de volume, limitada e sem opt-in implícito; lint/build e 14 testes.
- `94401ec` / merge `f9d06b9`: UI de telemetria contextualizada e controles opt-in.
- `7504d5b` / merge `14a5292`: oclusão corrigida por geometria/enquadramentos; UVs, normais e materiais originais. Lint/build/14 testes e smoke integrado passaram. Hero: 62 draw calls, 45.392 triângulos, JS inicial gzip 90,60 kB e cena lazy 153,67 kB. Mobile emulado, sem conclusão sobre celular físico.
- Capturas de C preservadas em `.agent-grid/screenshots/night-shift/scene-c/`, além dos arquivos originais no Temp. QA integrada em `scene-integrated/`. Cópia intermediária preservada no arquivo privado `.agent-grid/artifacts/night-shift/lead-captures/`; nenhum registro excluído.

Revisão visual do Lead: C resolve leitura dos programas, mas o hero muda pouco; overhaul premium **parcial**, não aprovado como completo. Worker 3D recebeu C2 focado em acabamento perceptível, iluminação e composição antes de D. Não aumentar complexidade se a comparação visual não justificar.

- `1a8445d`: slider acessível e seleção/revisão de PDF somente em DEV + flag explícita; produção não inclui a entrada nem currículo. Fixture baixada byte a byte e URLs revogadas; nenhum currículo real enviado a servidor.
- `3c51b15`: fontes por junction — permissão restrita ao realpath do pacote Geist, mantendo workspace padrão. Referência: [Vite server.fs.allow](https://vite.dev/config/server-options.html#server-fs-allow). Checagem dirigida no worker e smoke DEV no principal confirmaram fonte HTTP200, console/rede sem erros.
- `759219d`: nota sanitizada de QA do currículo incorporada à V2. PDF privado re-renderizado/inspecionado; sete destinos de links estruturalmente conferidos, sem teste externo. DOCX permanece rascunho: LibreOffice ausente. Nenhuma publicação.
- `2b50cf1`: instrumentação de recurso/heap no smoke. Snapshot preview loopback: request do chunk de cena 27,5 ms, 152.823 B transferidos, 596.117 B decodificados, heap 9.423.586 B. Em DEV: heap 40.925.954 B; filtro de chunk compilado não aplicável. Amostras únicas, sem comparação de desempenho de produção, execução de import ou pico de memória.

Preview atual: `http://127.0.0.1:5173/`; DEV para revisão local: `http://127.0.0.1:5176/?mode=recruiter&lang=pt&cv-review=1#driver-profile`. Servidores exclusivos deste ciclo. Artefatos de currículo ficam fora de public e do Git.
