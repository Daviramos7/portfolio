# Próximo ciclo — correções e conteúdo

Base conferida: `6ffea5b`, branch do Lead `feat/drf-engineering`.
Um worker ativo por vez neste ciclo; sem QA adicional, dependências, push ou deploy.
O registro de franquia atual da ferramenta é 42% disponível; não é orçamento por tarefa.

## 1. Frontend/UX — lote integrado na Missão 05

Entrega preservada em `d5715be` e integrada por fast-forward; revisão do diff sem
alterações fora da UI. Fundação, catálogo e cena mantidos. Testes/capturas integrados
ficam no smoke do Lead. Os critérios abaixo descrevem o lote executado.

Reutilizar DRF Frontend/UX (`pane-node-f5a143e1-2f77-4bb0-95fa-f0417ccd8378`),
Codex, modelo solicitado `gpt-6.1-sol`, esforço Medium.
Worktree existente `.agent-grid/worktrees/drf-frontend-ux`, branch
`feat/drf-engineering-ui`, atualizado para a base integrada antes do turno.

- Corrigir letras empilhadas/quebras na Estratégia, títulos e layouts estreitos.
- Garantir nome completo, seleção e leitura de projetos em HTML acima da cena.
  Oclusão de placa/objeto da cena é dependência de 3D, não autorização para editar geometria.
- Navegação persistente no Recruiter, retorno contextual e restauração de leitura/scroll.
- Omitir campos opcionais vazios e placeholders públicos genéricos em PT/EN;
  preservar qualificações, fontes e limitações verificadas, sem fabricar substitutos.
- Validar foco, teclado, 1440/390/320 px, dois idiomas e acesso sem WebGL.

Propriedade: `src/features/`, `src/components/drf/`, `src/hooks/ui/`, `src/styles/ui/`.
Entregar diff, capturas e lint/build/13 testes da fundação; parar sem commit/integração.
Lead revisa e integra em etapa posterior, sem alterações ao estado ou catálogo nesta missão.

## 2. Portfolio Intelligence Analyst — preparado, não criado

Após autorização: Codex / `gpt-6.1-sol` / Medium. Criar via AgentGrid um worktree
`drf-portfolio-intelligence`, branch `feat/drf-engineering-research`, a partir do
commit integrado conferido no início da auditoria. Escrita exclusiva:
`drf-v2/docs/research/`; portfólio e repositórios consultados somente leitura.

Lote 01: **Atleta Híbrido, BrasilScore e Auditoria de Despesas Públicas**.
Partir dos links/evidências do catálogo e dos checkouts acessíveis; conferir estado e SHA.
Leia AGENTS/README e siga somente arquivos relevantes de arquitetura, implementação,
testes, documentação e histórico. Sem varreduras repetidas, instalações, migrações,
serviços externos ou execução que use credenciais/dados privados.

Entrega única inicial: `docs/research/LOTE-01.md`, matriz compacta por projeto:
problema; solução/arquitetura; contribuição pessoal comprovada; tecnologias;
funcionalidades implementadas; estado real; métricas/resultados/testes;
fontes (URL, revisão, arquivo/linhas); links/demo e pendências.
Separar documentação, evidência no código e comportamento reproduzido.
Commits não comprovam exclusividade de autoria; testes existentes não significam execução.
Não incluir segredos, dados internos da SEFAZ ou detalhes operacionais privados.
Manter afirmações sem prova como pendências editoriais, sem publicar no catálogo.

**Gate:** apresentar os três projetos ao proprietário antes de ampliar a auditoria.
Próximo lote candidato: Stock Data Pipeline, Horta Inteligente e Análise SPFC;
demais projetos só após inventário relevante e aprovação da ampliação.

## 3. Resume Specialist — planejado, não iniciado

Depende da primeira auditoria e da revisão das informações pelo proprietário.
Worker isolado, Codex/Medium, para currículo PT-BR ATS em PDF + fonte editável DOCX,
uma coluna, texto selecionável, títulos convencionais e tipografia legível.
Saída de rascunho separada em `docs/research/resume-draft/`; sem alterar `curriculo/`,
`public/content/`, `cvUrl` ou downloads. Revisão do proprietário antecede substituição/publicação.

## 4. DRF 3D Creative — próxima rodada, inativo

Reutilizar `pane-node-56dc575d-c905-4bd2-a189-f7dcfc906ab3`, seu worktree/branch existentes.
Após UX crítica: câmera suave sem cortes (movimento reduzido permanece direto), composição,
luz, materiais/detalhamento e superfícies internas legíveis. Receber os defeitos de oclusão
identificados pela UX; conteúdo de negócio só depois da revisão do lote de pesquisa.
Depois, Trackside: carros fictícios ocasionais, áudio espacial opcional inicialmente off,
reflexos e vibração amortecida analítica de objetos leves, sem física pesada.
Usar os contratos/gates/relógio CAR_PASS existentes; preservar reduced motion e silêncio inicial.
Não executar esta frente em paralelo com as correções críticas atuais.

Pendência confirmada na Missão 05: as três placas em `Garage.ts` nas posições
`[-8.045, 2.1/1.65/1.2, -2.6]` continuam encobertas na vista Garage desktop.
Raycast da câmera aos centros encontra primeiro o quadro de ferramentas em
`[-6.3, 2, -0.96]` ou suas ferramentas. Na vista inicial mobile 390 px, as placas
também ficam fora do enquadramento. Diagnóstico executado sobre as geometrias atuais
no Chrome/Vite, sem editar a cena. O HUD resolve o acesso HTML, não a oclusão.
Worker 3D deve revisar composição/posição das placas e obstáculos no próximo lote;
reprodução: abrir Garage e observar o suporte de programas atrás do quadro de ferramentas.

Sequência: UX limitada → revisão do Lead → autorização para lote 01 → apresentação/revisão
do lote → currículo rascunho e eventual ampliação autorizada → próxima rodada 3D.
