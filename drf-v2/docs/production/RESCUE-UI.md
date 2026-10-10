# Rescue UI — P0

Base integrada: a1b97c5. Diagnóstico antes de editar: Chrome instalado, sem emulação de preferência de movimento; 61 combinações (1440/390/320, PT/EN, imersivo/Recruiter, cinco zonas e projeto longo).

**Letras empilhadas não reproduzidas nos headers/painéis HTML. Hotspots hover/focus da cena não foram incluídos.** Nenhuma correção fictícia de layout foi aplicada. Em 320 px, estação 296 px e título 262 px; writing-mode horizontal-tb, transform none, zoom 1, quebras regulares. Evidências e computed styles: `C:/Users/davir/OneDrive/Documentos/GitHub/portfolio/.agent-grid/screenshots/drf-rescue-ui/before-computed.json`, capturas `before-*.png` no mesmo diretório. Lead identificou candidato separado em hotspot-label (absolute left:100%, pai 44 px, width:auto/max-width:190, overflow-wrap:anywhere herdado); reprodução/fix e QA desses labels pertencem ao 3D/Lead. Não há contradição com a matriz HTML.

Restrição ambiental reproduzida: matchMedia reduce=true nativo; ambiente inicialmente habilitado no estado, mas reduzido efetivo. UI agora diferencia restrição de desativação e oferece três escolhas explícitas da sessão, mantendo sistema como padrão; cinematic requer intenção e não liga áudio. Escape fecha o controle e restaura foco sem rolagem.

Currículo: link condicional ao cvUrl canônico integrado pelo Lead; versão pública atual, não o rascunho DEV. Nenhum PDF/asset ou catálogo alterado pela UI. Revisão local DEV permanece separada e ausente da produção.

## Validação do marco P0

Lint e build PASS; 21 testes de fundação/trackside PASS (15 + 6). Teste próprio rescue-ui.test.mjs: PASS, 22 verificações dirigidas em Chrome instalado headless, viewport emulado 1440×900/390×844/320×844, preferência nativa sem emulatedMedia. Inclui padrão system, cinematic/reduced efetivos, áudio permanece off, Escape/foco, larguras, rótulo inglês, PDF público e leitura HTML com WebGL bloqueado por fixture de navegador. Sem erros de console/rede observados. O primeiro teste dirigido precisou corrigir seu foco (DOM.click não foca um radio); nenhum defeito de Escape da UI foi mascarado.

Capturas finais: after-motion-system-1440/390/320.png, after-motion-en-320.png, after-recruiter-cv-1440/390/320.png, after-fallback-strategy-320.png no diretório externo já indicado. Inspeção visual da captura 320 confirmou opções legíveis, sem coluna de letras; controle fechado ocupa uma linha adicional compacta. Teste físico mobile, performance, filme cinematográfico e oclusão Canvas não medidos. Chunk 3D existente 604,69 kB conserva aviso de build, fora desta área. History geral não repetido neste lote. P1 visual adicional permanece separado.

Reexecutar smoke dirigido com preview compilado em 5175: node --test tests/rescue-ui.test.mjs; variáveis opcionais DRF_RESCUE_URL, CHROME_PATH, DRF_RESCUE_CAPTURE_DIR. Capturas padrão ficam no Temp, nunca em src.

## P1 — instrumento e estações

Três padrões originais incorporados com fontes/licenças em component-adoption.md: toolbar com grupos/foco direcional; dígitos finais reais com replay controlado/pausa; console analítico com seleção, unidade, estado, período, fonte e contexto. Recruiter permanece completo e estático; currículo canônico ganhou ícone Lucide Download. Não houve alteração de catálogo, contratos, cena, assets ou testes existentes.

Corrigidos na implementação e comprovados por teste: Escape do popover não deve fechar a estação ao fundo; popover acima da estação preserva aviso inteiro; escolha cinematográfica explícita pode animar os novos dígitos mesmo quando o sistema pede redução; pausa offscreen precisa prevalecer sobre a declaração CSS de animação. Captura mobile revelou sobreposição entre toolbar/legenda: tracks com largura de controles conhecida e coluna de texto minmax(0,1fr) corrigiram a composição.

Estado ambiental: renderStatus idle/loading/unavailable/error informa preparação/carregamento/indisponibilidade/falha, nunca Ativado. Ready comunica redução, pausa de leitura, ativado ou desligado conforme estado efetivo. Nenhuma ação de movimento/replay habilita áudio.

### Evidências de cena e limites do harness

As primeiras capturas P0 aguardavam somente montagem da UI: **evidências de HUD, cena não atestada**. A leitura pontual anterior ao guard registrou ready/canvas 320×844/opacidade 1/sem erros, mas isso não prova pixels visíveis (`p1-scene-diagnostic.json`). Não foi declarada uma correção 3D ou causa de câmera.

Harness próprio agora marca documento antigo antes de navegar, aguarda documento novo/readyState completo/locale/mode/fontes, força reload em navegação apenas por hash, aguarda cena ready/unavailable e dois RAF. Não usa sleep de 15 segundos. Novas capturas `p1-after-*` mostram UI e garagem visível na base atual; as antigas permanecem preservadas. Causa candidata do preto: sincronização insuficiente do harness; sem atribuir um fix à cena.

Gravação real de interação por CDP/pointer: `p1-explicit-cinematic-320.gif` (34 capturas sequenciais, cadência de apresentação 100 ms; não é benchmark de FPS), PNG homônimo e `p1-motion-recording/recording.json`. Sistema reduce=true, sem emulatedMedia, opção Cinematográfico escolhida pela UI, áudio off. Base de cena ainda é a integrada antes do próximo lote 3D; não atesta acabamento/oclusão/performance dessa frente.

Testes dirigidos consultam os sete valores/contextos canônicos, reduzido estático, cinematic efetivo, pausa offscreen, teclado/foco, larguras 1440/390/320, PT/EN, PDF, carga de bundle pausada por fixture e fallback com WebGL bloqueado. QA geral de history não repetido, nem mobile físico/performance. Smoke antigo de integração não foi modificado; eventual expectativa de sete readouts simultâneos no imersivo precisa acompanhar a seleção de resultado, enquanto Recruiter continua exibindo os sete.

Resultado final P1: npm run lint PASS; npm run build PASS; node --test tests/foundation.test.mjs tests/trackside.test.mjs 21/21 PASS; node --test tests/rescue-ui.test.mjs PASS (49 verificações). Console/rede sem erros no teste dirigido. Replay/foco/offscreen foram executados; fixture de rede pausou somente o bundle SceneRoot para observar loading e depois o liberou; fallback comprovou sceneStatus unavailable e aviso ambiental correspondente. Screenshot cinematográfica 1440 aguarda a animação finita dos dígitos terminar, sem sleep arbitrário. Preview compilado na porta 5175. Aviso de chunk de cena 604,69 kB permanece fora da área UI.
