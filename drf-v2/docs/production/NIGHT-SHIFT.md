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

## Marco de materialidade e iluminação

`78fda82` integrado em `35925fb`: C2 adiciona albedo/roughness/normal de piso originais 512×512, marcas na baia, contato radial, contraste quente/frio, carbono não metálico e equipamentos funcionais. Antes/depois com mesma câmera preservados em `.agent-grid/artifacts/night-shift/scene-c2/`. Hero 62→66 draw calls, 45.392→48.088 triângulos; cena lazy 153,67→154,57 kB gzip. Nenhum asset externo ou requisição adicional.

Revisão do Lead confirma melhoria perceptível, com acabamento ainda estilizado e aliasing low mobile. Não representa aceite visual do proprietário ou fotorrealismo. Relatórios completos movidos de public/scene para [SCENE-C.md](SCENE-C.md) e [SCENE-C2.md](SCENE-C2.md), fora do build público; nenhuma captura excluída. Lint/build/14 testes passaram após integração.

## Consolidação de conteúdo e ambientação

- `4d613d5`/`169bcf9`: auditorias Task Manager e Guess the Pokémon preservadas; somente relatórios, scripts e logs sanitizados, screenshots sintéticos pequenos. Sem bancos, credenciais, executáveis ou fontes pessoais. Índice ampliado para sete projetos em `7cde6bc`; PT/EN mantém contribuição individual pendente e diferencia API real de mock.
- Task: complemento 11 PASS/5 FAIL; cinco verificações não representam cinco defeitos independentes (PUT/DELETE são uma lacuna). GET/listagem 100k: mediana394,958ms, warmup+3, serial, API+SQLite+JSON+loopback+decode. RSS combinado amostrado163,79MiB. Harness inicial falhou instrumentalmente; recuperação e logs preservados, sem modificar original.
- Guess: complemento14 PASS/4 FAIL; HTML/CSS/JS executados com API/sprites sintéticos e CDN bloqueada. Sem benchmark remoto; RSS682,05MiB combina navegador+harness. Licenças/assets de franquia não reaproveitados. Relatórios completos no índice; Horta e demais projetos seguem pendentes.
- `9f743b6` / merge `3d1d77e`: Trackside D, evento CAR_PASS interno determinístico, veículo original, realce de piso e oscilação amortecida. Opt-in/mute/volume conectados à síntese WebAudio original. Intervalo25–45s/duração3–5s; gates cancelam/restauram e reduced motion desativa visual. Síntese tonal não representa gravação realista; escuta física não validada. Veículo de fundo parcialmente oculto no hero mobile; não é regressão de leitura dos projetos.
- Lint/build e 20/20 testes (14 fundação +6 scheduler) passaram no checkout principal. Cena lazy156,70kB gzip; inicial92,26kB gzip. Aviso>500kB minificado permanece. Hero66calls/48.088tri; passagem74calls/48.618tri. São contagens, não benchmark de GPU/FPS.

Workers reutilizados: 3D Creative, Frontend/UX e Analyst/Resume sequencial. Nenhum worker novo; no máximo dois pesados simultâneos. `main` permanece c1bb276; V1 intocada. Não houve push/deploy nem publicação definitiva de currículo. Interfaces e materiais representam avanço integrado, sem afirmar aprovação visual do proprietário.

## QA final integrado

Smoke de produção passou após merge de D e catálogo de sete projetos: desktop1440, mobile emulado390/320, PT/EN, navegação/histórico/teclado/foco, leitura contextual, Recruiter, reduced motion, perda de contexto/retry e fallback sem WebGL. Console/rede: nenhum erro nos cenários. Fontes HTTP200. Capturas e smoke-result.json em `.agent-grid/screenshots/night-shift/final-integrated/`; Estratégia320 e Telemetria desktop inspecionadas pelo Lead.
Snapshot único: request do chunk27,1ms,155.859B transferidos/604.693B decodificados, heap7.880.118B. Não é tempo de execução/importação, pico de memória, FPS sustentado ou desempenho de celular físico.

Última consulta de capacidade:5%. Novas implementações encerradas; somente fechamento dos testes já iniciados e preservação. Não iniciar próximos projetos, outro overhaul, downloads de assets ou publicação de CV nesta janela. Próximo ciclo recomendado: avaliação visual do proprietário, escuta real opt-in, mobile físico/performance e QA DOCX com renderer compatível; depois selecionar os projetos restantes do inventário.

Teste direcionado de D repetido no preview principal passou: passagens reais desktop/mobile após intervalo normal, volume sem criar AudioContext, opt-in nativo tardio sem motor no evento atual, próxima passagem sonora, mute ganhoprincipal0/suspended, cancelamento reading, reinício com intervalo novo, reduced motion, hide, Recruiter fecha contexto e ambient off. Erros/logs críticos vazios. Resultados/scripts/capturas preservados em `.agent-grid/artifacts/night-shift/trackside/`; nenhuma escuta física alegada. Worker D aguardado e encerrado, sem tarefas novas.
