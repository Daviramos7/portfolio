# Missão 13 — etapa 1: diagnóstico visual

Branch feat/drf-engineering-ui, árvore inicialmente limpa; fast-forward seguro fc71999 → f8f90a778d7435df13b339149411997c62fedc12. Sem reset/clean. Esta etapa altera somente este documento: nenhuma implementação, cena/câmera, conteúdo, contrato, CV ou configuração foi modificada.

Baseline em Chrome instalado, headless/CDP, preview compilado 5175. Desktop 1440×900; mobile emulado 390×844 e 320×844; PT/EN. Cinematic escolhido pela UI com preferência nativa reduced verdadeira, sem emulatedMedia. Scripts existentes esperam documento novo, fonts.ready, cena ready/unavailable e RAF; animações finitas concluídas. Áudio permanece off. Capturas da cena normal usam WebGL real; fallback está separado. Build PASS com aviso existente de chunk SceneRoot >500 kB. Sem console/rede errors nos coletores.

## Avaliação: composição e tipografia ainda parciais

Os nove programas têm nome/resumo/stack completa/ação case e apenas links reais na ficha fechada: 174 checks de bounds/conteúdo passaram. Isso **não aprova legibilidade ou composição**. Inspeção visual dos nove programas, títulos longos, HUD/Recruiter e cinco estações aponta:

| Prioridade / causa reproduzida | Correção específica proposta para etapa futura, ainda não implementada |
| --- | --- |
| **P0 — ficha mobile compete com a garagem.** Atleta/PT em 320: bloco de 445 px, y≈317–762, cerca de 53% da altura; em 390: 382 px. Cabeçalho/ambiente ocupam outra faixa superior. Tags e links usam 11,2 px; resumo 12,8 px. Tudo cabe graças a texto pequeno e à ficha alta, não a uma composição confortável. | Recuperar espaço reduzindo bordas/faixas/metadata repetidas e agrupando preferências secundárias por intenção, mantendo idioma, retorno, fechar e feedback disponíveis. Reequilibrar ficha com resumo→stack completa→ações, sem clamp, esconder tags, editar resumo canônico ou reduzir mais a fonte. Subir tags/links para escala de leitura de ~12,5–13 px e validar visualmente todos os nove casos antes de aceitar. Não aprovar só por bounds. |
| **P0 — abrir o case esconde a stack abaixo da primeira dobra.** Atleta: stackInFrame=false nas seis combinações. Corpo da estação tem ~484 px no desktop e ~314 px no mobile; conteúdo 724 px e 757–868 px. Badge, resumo, problema e estado precedem tecnologias, além do cabeçalho/abas fixos. Não é perda de dados, mas acesso inicial parcial e scroll obrigatório. | Colocar tecnologias logo após o resumo na visão Caso; deixar problema/estado completos na sequência e recuperar altura do chrome mobile. Manter decisões/evidências acessíveis, scroll interno e close/foco. Comparar primeira dobra e versão após scroll; não alegar stack inicialmente visível por estar no DOM. |
| **P1 — redundância editorial no Recruiter.** O cartão Atleta mostra “Conteúdo revisado” duas vezes antes do resumo; fatos empurram Tecnologias para o fim da tela de 390. Hero 320 usa quase a primeira tela antes dos projetos. Corpo é legível, CTA PDF existe, retorno permanece disponível. | Uma única qualificação por cartão; reduzir espaçamento redundante do hero e antecipar stack após resumo também na leitura linear. Preservar texto/fatos/evidências, PDF público e retorno contextual; não transformar Recruiter em outra experiência imersiva. |
| **P1 — hierarquia desigual.** Barlow 20–23 px destaca nomes; labels de ~10,4 px, tags/links 11,2 px e várias linhas uppercase/bordas criam ruído. Select trunca título, embora o título completo acima exista. | Ajustar escala e espaçamento de metadata/stack/ações sem condensar prosa, trocar família novamente ou cortar nomes. Simplificar duplicação título/posição/qualificação, conservando teclado e seleção. |
| **P1 — leitura após scroll.** Abas sticky cobrem o conteúdo que passa atrás; no enquadramento automático da stack o título Tecnologias encosta sob a barra. | Verificar superfície opaca, espaçamento/scroll-margin dos destinos e visibilidade de títulos ao navegar, sem scroll de página no imersivo ou mudanças de câmera. |

## Canvas e limite de ownership

Garagem fechada mostra o monitor do programa com stack compacta em Canvas, enquanto o HTML repete informações em fonte pequena. Em mobile, o HUD cobre grande parte da composição inferior; CSS pode reorganizar o HTML, mas não tornar o texto rasterizado do monitor maior ou resolver geometria. Telemetria/Pit Wall/Perfil/Estratégia têm painel desktop de ~518 px à direita e garagem ainda visível à esquerda; o painel cobre parte do carro, por intenção de leitura. Não há declaração de falha de câmera nem proposta de alterar a câmera aprovada. Textos Canvas permanecem visualmente mais estreitos/menores que a leitura HTML; harmonização de fontes/redraw e placas pertence ao 3D. Nenhuma letra empilhada reproduzida nos headers/painéis inspecionados; este lote não ensaia hover/foco de todos os hotspots.

## Evidências e reprodução

Raiz absoluta: `C:/Users/davir/OneDrive/Documentos/GitHub/portfolio/.agent-grid/screenshots/mission-13/ui-before/`.

- `programs/baseline-catalog-{1440,390,320}-{pt,en}-{projectId}.png`: nove programas × seis combinações, sem alterar catálogo. `results.json`: 174 checks, fontes canônicas/links e bounds. Inclui reduced/fallback separados.
- `hud-reading/before-{garage,case,recruiter}-{largura}-{idioma}.png` e `before-station-{zona}-1440-pt.png`: tipografia, primeira dobra e Canvas das cinco estações. Script identity em fase before: 30 checks, sem erros; resultado não é aprovação estética.
- `composition/diagnostic-case-stack-scroll-{largura}-{idioma}.png`, `diagnostic-recruiter-atleta-detail-{largura}-{idioma}.png`, `composition-diagnostic.json`: seis leituras adicionais com rects, computed fonts/overflow e stackInFrame. Harness temporário reaproveita CDP do identity, fora do código versionado.

Pares principais para revisão Lead: `programs/baseline-catalog-320-pt-atleta-hibrido.png`, `320-en-municipal-revenue-platform.png` (prefixo baseline-catalog), `hud-reading/before-case-320-en.png`, `composition/diagnostic-recruiter-atleta-detail-390-pt.png`, `hud-reading/before-recruiter-320-pt.png` e `before-station-telemetry-1440-pt.png`.

Sem teste físico mobile, medição de performance ou auditoria AA completa. Não se repetiu suíte core/lint sem mudança de código; scripts foram reaproveitados para capturar o baseline. Capturas externas preservadas, nenhuma screenshot em src. Aguardar revisão das imagens e autorização da etapa 2; somente diagnóstico neste commit.

## Etapa 2 — P0/P1 autorizados após revisão Lead

Base desta etapa: 647e0aa. Sem alteração de câmera, cena, dados, contratos, App, dependências ou currículo. Barlow/Geist preservadas. Arquivos:

- ContentBlocks.tsx: resumo → stack completa → fatos; stack agrupada semanticamente. Qualification opcional para evitar repetir o badge já presente no cartão Recruiter. Estados de métricas/evidências não foram retirados.
- ImmersiveHud.tsx: ProgramContext também existe com projectId=null, usando o programa já exibido; não gera seleção nem muda URL por efeito.
- EnvironmentControls.tsx: em mobile, preferências secundárias em details nativo, com áudio e estado real do ambiente visíveis no summary (ativado/restrito/pausado/loading/falha conforme estado existente). Movimento permanece exposto; Escape fecha disclosure e devolve foco. matchMedia via useSyncExternalStore é apenas responsividade, sem estado de negócio. Controles têm 44 px e popup fica acima da estação quando aberto.
- PortfolioShell.tsx: remove linha “Dossiê de engenharia” redundante e importa readingRefinement.css.
- ZoneContent.tsx: Recruiter conserva uma qualificação por case, dados lineares completos e CTA público existente.
- readingRefinement.css: tags/links da ficha em 13 px; espaçamentos/metadata menores; corpo do case recupera altura; hero Recruiter menor, sem troca de famílias ou fonte estreita em prosa. Nenhum clamp de conteúdo.
- tests/mission13-ui.test.mjs: Chrome/CDP reaproveitado, nove programas/default/primeira dobra nos seis cenários, foco/Escape, disclosure, estados honestos, reduced e fallback. Câmera aguardada pela sequência de conclusão antes de capturar seleção; não alterada para servir à UI.

### Comparação visual e tradeoffs reais

Atleta/PT: ficha fechada 390 diminui de ~382 para ~355 px; desktop ~391 → ~380 px. Em 320, permanece ~446 px contra ~445 antes: tags maiores exigem três linhas e links podem ocupar duas linhas de 44 px. Portanto **a ficha 320 ainda cobre grande parte inferior da garagem e a composição imersiva não está completamente resolvida**. Default agora ganha contexto completo, com o mesmo custo visual; não se esconde resumo/tag/link para melhorar a captura. Cabeçalho mobile é mais compacto, mas o estado ambiente honesto exige espaço adicional. Nenhuma promessa de “tudo menor” em 320.

Primeira dobra do case muda materialmente: antes stackInFrame=false nos seis cenários Atleta; depois resumo e todas as tecnologias estão visíveis, sem scroll, nos nove programas × seis cenários. O corpo mobile recupera altura pela redução de chrome e antecipação da stack; fatos/decisões completos continuam abaixo ou em suas abas. Recruiter deixa uma única qualificação, antecipa stack e reduz hero; não elimina texto profissional.

Desktop initial/default: ficha fica no canto inferior esquerdo; a abertura de pista/janelas à direita permanece livre na captura. A ficha cobre parte da zona inferior esquerda, não a abertura visível. Isso é inspeção de pixels da vista inicial; não se reivindica ensaio de passagem animada ou áudio neste lote. Mobile continua com o tradeoff acima. CSS não corrigiu geometria/oclusão Canvas.

Evidências: `C:/Users/davir/OneDrive/Documentos/GitHub/portfolio/.agent-grid/screenshots/mission-13/ui-after/`. Primeiras capturas e baseline preservados. Pasta final-status contém a versão com estado ambiente no summary; final registra a rodada anterior a esse ajuste. Comparar `ui-before/programs/baseline-catalog-320-pt-atleta-hibrido.png` → `ui-after/final-status/after-program-320-pt-atleta-hibrido.png`, `ui-before/hud-reading/before-case-320-en.png` → `ui-after/final-status/after-case-320-en-atleta-hibrido.png`, `before-recruiter-320-pt.png` → `after-recruiter-320-pt.png`. Defaults têm capturas próprias; o baseline desta etapa não capturou a garagem default sem seleção, logo não há par default antes/depois inventado. Before/after selecionados usam programa/idioma/viewport/Cinematic equivalentes; primeiras capturas sem guarda de conclusão da câmera não são prova comparável de enquadramento.

### Verificações e incompatibilidade conhecida

- npm run lint / npm run build: PASS; aviso existente de chunk SceneRoot >500 kB.
- node --test tests/foundation.test.mjs tests/trackside.test.mjs tests/trackside-model.test.mjs tests/experience-audio.test.mjs tests/personal-details.test.mjs tests/rescue-3d.test.mjs tests/art-direction.test.mjs tests/editorial-content.test.mjs tests/mechanical-polish.test.mjs: 52 PASS.
- Script dirigido mission13-ui: primeira rodada 555 PASS; rodada final com estados do summary 596 PASS, console/rede vazios, results.json de final-status. Nome/resumo/tags/links exatos e não ocluídos; cada case com stack e resumo dentro da primeira dobra, sem scroll; seis defaults sem forçar seleção; fontes preservadas.
- Smoke existente browser-smoke.mjs foi executado e **falhou** no critério legado `.drf-showcase.height < innerHeight * .25` da garagem default. Não foi alterado: é incompatível com o novo requisito de contexto completo sem seleção. Não declarar smoke original PASS.
- Cópia temporária do mesmo smoke, substituindo somente esse critério por presença de resumo/case/cinco tags canônicas e limite de 60%, passou nos 13 grupos restantes/atualizados: history, scroll Recruiter, teclado/foco/Escape, cinco zonas, retry, mobile e fallback; console/rede vazios. Evidências em compatible-smoke. Não substitui aprovação/atualização do teste pelo Lead.
- git diff --check: PASS. Só UI própria/teste/documento no diff; cópia temporária de smoke/evidências ficam externas, nenhum teste existente reescrito.

Limites: Chrome headless real instalado, dispositivos mobile emulados; sem teste físico, performance, auditoria completa AA, passagem animada ou áudio. O fechamento entrega este lote e aguarda integração/revisão Lead; não abre refinamentos novos.
