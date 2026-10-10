# Missão 12 — Identity, Immersion & Experience

Base real 32788f6, feat/drf-engineering limpa. Cota consultada: 100%. QA de currículo já integrado; não repetir cherry-pick. Worktree drf-portfolio-intelligence preservado com cinco diretórios de pesquisa não rastreados; sem merge, limpeza ou remoção. 3D e UI atualizados por fast-forward à base; Editorial preservado. V1/main, projetos externos e currículo público intocados.

## Baseline verificada

Lint/build e 37 testes passaram. Chrome instalado headless: 174 verificações de nove fichas PT/EN em 1440/390/320 (resumo, cada tecnologia, ações, foco, histórico, fallback e perfil/LinkedIn) e 13 grupos de smoke passaram; console/rede vazios. Câmera Cinemático aprovada mantida: poses intermediárias, interrupção/latest-wins, histórico, hotspots e retorno Recruiter sem regressão reproduzida. Fonte pessoal permanece confirmação do proprietário: 6º período UNINASSAU, dezembro2027 e LinkedIn daviramosferreira; documento acadêmico ainda distinto da declaração.

Capturas iniciais: .agent-grid/screenshots/mission-12/baseline-ui e baseline-smoke. Geometria mecânica é a integrada na Missão11, com comparativos conservados em mission-11-3d; não recriada. Hero do smoke: 86 draw calls / 66.046 triângulos, DPR 1,5; mobile low DPR1. Cena lazy 612,72 kB minificada /159,59 kB gzip; JS inicial94,93 kB gzip. Request local21,5ms e heap snapshot7.598.803B são observações sob dois testes concorrentes, não benchmark isolado, tempo de importação/execução, pico ou FPS/GPU.

Áudio atual: stub deliberado de silêncio retorna unavailable; sem AudioContext ou samples. Veículo exterior atual: cupê procedural em caixas, rota reta16m/3–5s. Melhorias novas devem comprovar escuta/licença/gesto e veículo visível, sem reescrever câmera/fundação.

## Responsabilidades e sequência

3D Creative: scene/**, public/scene/**, testes de áudio/modelo e relatório SCENE. Primeiro áudio opt-in com fonte original/licenciada e estados honestos; depois monoposto externo/rota/duração com prova visual. UI: features/**, components/drf/**, styles/tokens.css, styles/ui/**, public/fonts/drf/** e documentos/tests UI. Primeiro tokens/specimen tipográfico; depois três interações perceptíveis com referências reais e licenças documentadas. Sem edições dos mesmos arquivos. No máximo dois workers pesados; Analyst ocioso. Easter eggs só após estabilizar estes marcos.

Currículo revisável privado: .agent-grid/artifacts/resume/mission11/. PDF renderizado/texto/links corrigidos; DOCX layout ainda sem render por ausência LibreOffice. DEV cv-review=1 permite seleção local; não copiar novo arquivo para public/cv ou mudar cvUrl. Download público anterior preservado até revisão pessoal.

## Checkpoint de áudio

Entrega 3D `904ae19` revisada e integrada por `30de68c`. Fontes CC0 conferidas nas páginas dos autores; hashes e créditos em public/scene/ASSETS.md. Três gravações locais (ventilação, oficina e carro de rua passando), sem síntese de ruído ou alegação de motor de competição. Carregamento/contexto somente após gesto, volume/mute/cancelamento e erros tratados; gravação de passagem mantém pitch original. Validação no checkout integrado: lint/build e 45/45 testes aprovados. Cena lazy 161,45 kB gzip; JS inicial 94,93 kB gzip. Áudio transfere 1.986.576 B após opt-in e retém aproximadamente 16,4 MiB PCM; pico do decode completo não medido. QA Chrome/RMS do worker comprova sinal e silêncio, não aprovação auditiva humana. Evidências: .agent-grid/screenshots/mission-12/scene-audio. Carro externo e UI continuam nos worktrees; não representam entrega integrada neste checkpoint.

## Monoposto externo e interface integrados

Modelo autoral `ce5662f` integrado por `784e88d`: cupê substituído por monoposto aberto; pista suportada e rota de 26 m com aproximação/afastamento, duração 1,8–2,4 s. Câmera preservada. Lead inspecionou desktop e 320: frames 0.57/0.61 mostram silhueta completa, mas a janela é curta e persistem tamanho pequeno/oclusão em outros trechos mobile. Não declarar mobile plenamente resolvido. Comparação e sequência real: .agent-grid/screenshots/mission-12/index.html. Lint/build, 48 testes e 13 grupos de smoke passaram no checkout integrado; console/rede sem erros registrados.

UI `1a713f8`, `8d320b1`, `fc71999` integrada por `0c7f3d2`: Barlow Condensed 700 local/OFL (22.444 B), Geist na prosa, mono nos dados; tokens/specimen em docs/design/typography.md. Três interações próprias: abas do case, inspeção individual da fonte e recibo de medição por clipboard. Padrões e licenças em component-adoption.md: referências públicas Origin/coss e Cult; Skiper anterior preservado, nenhuma biblioteca/código Pro instalado ou copiado. Canvas mantém suas fontes anteriores: CSS não implica redraw de texturas. Lint/build e 48 testes novamente aprovados; 125 checks de identidade no integrado passaram, com glyphs Barlow reais, foco/teclado, clipboard, PT/EN, reduced/fallback e PDF público inalterado. Evidências .agent-grid/screenshots/mission-12/integrated-ui e mission-12-ui. QA DEV do worker: nove checks e download de fixture com bytes idênticos; não é revisão do currículo privado. Arquivos privados PDF/DOCX mission11 e docs/resume/NIGHT-SHIFT-QA.md existem, preservados. DOCX ainda sem QA visual por LibreOffice ausente.

Snapshot de capacidade após estes marcos: 29%. Última tarefa autorizada em curso: cinco easter eggs originais, responsabilidade 3D. Sem novas frentes grandes; margem reservada para integração/QA final.
