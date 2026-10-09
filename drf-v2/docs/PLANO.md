# Plano de implementação e trabalho paralelo

Estado: fase documental concluída; desenvolvimento/workers dependem de autorização do usuário. Branch obrigatória: `feat/drf-engineering`. Stack já disponível: React/TypeScript/Vite, Tailwind/shadcn, Three/R3F/Drei, GSAP e Framer Motion. Sem dependências novas planejadas.

## Estrutura e propriedade exclusiva

Os caminhos novos são propostos; nesta missão existem apenas os três documentos. A propriedade abaixo vale por arquivo e subárvore, inclusive quando ainda não criados.

```text
drf-v2/
  docs/BRIEFING.md, CONTRATOS.md, PLANO.md  Lead
  docs/qa/                               QA
  src/
    App.tsx, main.tsx, index.css, App.css  Lead (entrada/integração)
    app/                                 Lead (estado, URL, fallback, adaptadores)
    contracts/                           Lead (tipos canônicos)
    content/                             Lead (catálogo PT/EN, evidências)
    styles/tokens.css                    Lead (tokens compartilhados)
    components/                          Frontend/UX (inclui ui/button.tsx)
    features/                            Frontend/UX (shell, zonas, recruiter, painéis)
    styles/ui/                           Frontend/UX (estilos da interface)
    hooks/ui/                            Frontend/UX (hooks apenas da UI)
    scene/                               3D Developer
      SceneRoot.tsx
      garage/, car/, camera/, trackside/, audio/, performance/
    lib/                                 Lead (inclui utils.ts; helpers compartilhados)
    assets/                              Lead (assets atuais do template)
  public/
    content/                             Lead (mídia/currículo revisados)
    scene/                               3D Developer (modelos, texturas, áudio)
    favicon.svg, icons.svg               Lead (assets atuais)
  tests/                                 QA (contratos, cenários e fixtures)
```

Também exclusivos do Lead: `package.json`, `package-lock.json`, `vite.config.ts`, `tsconfig*.json`, `eslint.config.js`, `components.json`, `index.html`, `.gitignore`, README V2 e qualquer arquivo fora das áreas atribuídas. Frontend não edita CSS global/tokens; 3D não edita estado do app; QA não corrige arquivos de produto. Registros de licença: Lead em `public/content/ASSETS.md`; 3D em `public/scene/ASSETS.md`.

Todos leem contratos/conteúdo; só Lead escreve neles. Solicitação de novo campo/token passa ao Lead, que publica alteração aditiva antes de uso. Nenhum worker gera componentes/dependências automaticamente ou altera lockfile. Arquivo novo deve estar na subárvore do responsável; exceção exige transferência explícita antes da edição.

V1 protegida: raiz `index.html`, `css/`, `js/`, `img/`, `curriculo/`, README e AGENTS são somente leitura. Não mover/renomear assets originais, não alterar repositórios de projetos consultados, não trocar branch enquanto outros trabalham. Usar o checkout compartilhado desta branch com divisão exclusiva; não criar worktrees/branches extras nesta rodada. Lead integra sem commits/push/deploy automáticos.

## Sequência exata para iniciar

1. **Usuário autoriza workers e desenvolvimento.** Lead reconfirma branch/Git e verifica workers existentes para reutilizar antes de criar novos. Pendência da Horta continua visível, sem impedir trabalho independente.
2. **Lead prepara o mínimo compartilhado:** materializa tipos dos contratos, catálogo inicial revisado, tokens provisórios e interfaces `SceneRoot`/`PortfolioShell`; prepara estado/URL e adaptador. Publica caminhos/exportações congelados e lista de arquivos exclusivos. É um handoff técnico curto, não conclusão do Recruiter Mode.
3. **Iniciar 3D, Frontend/UX e QA na mesma rodada**, após esse handoff. Prompts contêm escopo, proibições, critérios e obrigação de fechar cada turno com resumo visível. Não convocar outro Lead concorrente.
4. **Primeiro incremento paralelo:** 3D entrega garagem geométrica/DRF-01 original e câmera para Garage; Frontend entrega shell PT/EN, painel desse projeto e leitura Recruiter da mesma fatia; QA verifica schema, IDs, paridade, foco e plano de falhas. Lead integra exports e fallback. Revisar captura conjunta de UI + cena, sem esperar acabamento de nenhuma experiência.
5. **Segundo incremento paralelo:** 3D abre as cinco zonas e implementa Trackside/CAR_PASS; Frontend amplia as mesmas zonas, telemetria documentada, experiência, Driver Performance e controles de áudio/ambiente; QA testa transições, teclado, reduced motion, cancelamento, modo e erros. Lead revisa evidências/assets e resolve somente integração.
6. **Aceite integrado:** QA executa matriz abaixo e relata falhas com reprodução/caminhos; cada proprietário corrige sua área no mesmo worker. Lead realiza lint/build e integra ajustes; QA revalida cenários afetados. Esperar todas as respostas dos workers antes de declarar conclusão.
7. **Entregar primeira versão funcional ao usuário** com arquivos alterados, evidências, resultados e pendências. Publicação/commit ficam fora desta autorização e desta sequência.

## Dependências e paralelismo

| Frente | Pré-requisito | Trabalho independente após handoff | Dependência para integração |
|---|---|---|---|
| Lead | Contratos documentados e conteúdo revisado | Estado/URL/fallback, fontes e tokens, auditoria de assets | Exports dos dois produtores e feedback QA |
| 3D Developer | SceneProps/SceneHandle, IDs e tokens | Geometria original, câmera, pista, scheduler/curvas, qualidade e recursos | Target/políticas do Lead; controle de áudio acionado pela UI |
| Frontend/UX | Conteúdo, estado e callbacks | Shell/painéis, leitura Recruiter, tradução, teclado e responsividade | Status da cena; nenhuma espera pelo modelo final |
| QA | Contratos, orçamento e critérios | Fixtures, matriz de cenários e revisão de evidências/diffs | App integrado para testes de navegador/performance |

Caminho crítico: contratos mínimos → primeira fatia integrada → zonas + Trackside + conteúdo → QA integrado. Modelos finais, arte detalhada e pendências editoriais não bloqueiam geometria/protótipos; ausência de material bloqueia somente a afirmação/asset correspondente.

## Primeira versão funcional — critérios de aceite

Todos os itens são requisitos, não declarações de validação já executada.

| Critério | Evidência exigida |
|---|---|
| Garagem principal | Cena navegável com DRF-01 original, abertura para a pista e cinco zonas identificáveis; acesso equivalente por links/botões HTML |
| Paridade de modos | Mesmo catálogo/IDs/textos PT/EN nas duas experiências; seleção/idioma preservados na troca. Recruiter utilizável enquanto 3D carrega ou falha |
| Projetos | Nove registros do briefing contemplados; Atleta e BrasilScore com limites corretos, Horta com pendência explícita enquanto sem material. Driver Performance aponta ao mesmo Atleta. Nenhuma funcionalidade/atribuição não verificada |
| Telemetria | Toda métrica tem fonte/unidade/período/contexto e rótulo de origem; dado ausente não vira zero, benchmark sem contexto não aparece como resultado fixo |
| Experiência e contato | Formação/SEFAZ apenas com conteúdo público; períodos desconhecidos omitidos/identificados. Currículo abre/baixa corretamente após revisão. Link de contato público verificado; envio de formulário não é exigido neste corte |
| Navegação | Links diretos, back/forward, teclado e toque; última transição vence; nada depende de drag/hover. Fechar painéis retorna foco e nenhuma animação bloqueia controles |
| CAR_PASS normal | QA injeta relógio/seed de teste: carro, reflexos e vibração compartilham progresso; áudio espacial opt-in quando disponível; objetos restaurados ao final/cancelamento, um evento por vez, sem física pesada |
| CAR_PASS restrições | Silêncio inicial; mute imediato; nada é agendado em recruiter/aba oculta/leitura/transição; retorno sem rajada de eventos. Reduced motion mantém cena/pista estática, sem vibração/reflexos animados; áudio só por consentimento |
| Falhas e acessibilidade | Forçar WebGL indisponível, perda de contexto e falha de asset; conteúdo HTML/Recruiter acessível, aviso legível e recuperação manual. Foco visível, headings/labels/alt PT/EN, sem armadilhas; contraste AA (4,5:1 texto comum, 3:1 texto grande/controles) |
| Mobile e desktop | Validar 390×844 e 1440×900, mais 320 px de largura sem overflow horizontal do conteúdo; testar pelo menos um mobile real e registrar aparelho/navegador. Emulação não substitui teste GPU real |
| Performance | Registrar bundles/transferências/DPR conforme CONTRATOS; percurso de 30 s pelas zonas + CAR_PASS, aparelho e mediana/p95. Alvos 30 fps mobile/60 desktop nos dispositivos registrados; se faltar dispositivo ou alvo falhar, aceite de performance permanece pendente |
| Higiene técnica | `npm run lint`, `npm run build`, console sem erros não tratados; montagem/desmontagem sem duplicar timers/listeners/áudio; sem assets sem licença, dados privados, dependências novas ou alterações V1 |

QA registra resultado PASS/FAIL/PENDENTE com evidência em `docs/qa/`, sem marcar inspeção estática como validação comportamental. Usar ferramentas já disponíveis; se faltar automação/dispositivo, registrar limitação e realizar verificações manuais possíveis, sem instalar dependências nesta rodada.

## Handoff e controle de conflitos

- Cada worker entrega exportações, arquivos modificados, verificações realizadas e pendências; não editar área alheia para resolver conflito de integração.
- Lead solicita correções ao mesmo proprietário, incorpora mudanças compatíveis e mantém os documentos canônicos curtos. QA identifica conflito; Lead decide transferência antes de qualquer edição cruzada.
- Verificar `git diff --check`, diff dos arquivos rastreados e lista de novos arquivos contra a matriz de propriedade. Conferir explicitamente V1 e lockfile. Não usar `git add .`, reset/clean ou checkout destrutivo.
- Nesta entrega documental: conferir referências, consistência dos três documentos e Git. Lint/build/navegador ficam para mudanças de aplicação; executar build agora geraria artefatos sem validar os contratos ainda documentais.
