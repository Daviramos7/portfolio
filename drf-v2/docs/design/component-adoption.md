# Component adoption — Rescue UI

P0: agrupamento de controles inspirado na hierarquia da [coss Toolbar](https://coss.com/ui/docs/components/toolbar), acessada também via [Origin UI](https://github.com/telestrator-labs/origin-ui). Elemento perceptível: ferramentas compactas, escolha exclusiva em painel contextual, estados e foco explícitos. Implementação original em EnvironmentControls.tsx/nightShift.css, com detalhes e radios HTML; nenhum pacote/código Base UI incorporado, nenhum roving-focus de Toolbar reivindicado. Licença da árvore coss atual: [AGPL-3.0](https://github.com/cosscom/coss/blob/main/LICENSE); nenhum código dessa árvore copiado.

Comparação: before-ambient-native.png / after-motion-system-320.png no diretório externo de evidências descrito em RESCUE-UI.md.

[Skiper 37](https://skiper-ui.com/v1/skiper37): uso gratuito requer atribuição. Crédito de inspiração: Skiper UI. InstrumentValue existente é autoria própria, revelando somente dígitos finais; sem NumberFlow instalado ou código copiado. Skiper 69/80 Pro consultados só como referência. Nenhuma nova adoção Skiper reivindicada no P0.

[Cult marketing analytics](https://www.cult-ui.com/docs/components/marketing-hero-analytics) e [analytics-chart](https://www.cult-ui.com/docs/components/analytics-chart): consultados no P0, sem código/asset incorporado nessa etapa.

## P1 — padrões incorporados, autoria DRF

| Referência oficial / licença consultada | Adaptação perceptível | Arquivos |
| --- | --- | --- |
| [Origin](https://github.com/telestrator-labs/origin-ui) / [coss Toolbar](https://coss.com/ui/docs/components/toolbar); árvore atual coss [AGPL-3.0](https://github.com/cosscom/coss/blob/main/LICENSE). Não se presume a licença do fork antigo. | Toolbar real de instrumento: comandos agrupados, separação de replay, um Tab stop, setas/Home/End para foco; seletor nativo separado. | InstrumentToolbar.tsx, TelemetryInstrument.tsx |
| [Skiper 37 gratuito](https://skiper-ui.com/v1/skiper37), termos License & Usage: pessoal/comercial com atribuição. | Revelação controlada dos dígitos finais documentados; seleção/replay explícito, movimento efetivo do contrato, pause por IntersectionObserver/visibilidade da página. Reduzido = final estático, replay indisponível. Crédito público com link Skiper UI na estação. | InstrumentValue.tsx, TelemetryInstrument.tsx |
| [Cult analytics hero](https://www.cult-ui.com/docs/components/marketing-hero-analytics) / [analytics-chart](https://www.cult-ui.com/docs/components/analytics-chart); [LICENSE.md oficial MIT](https://github.com/nolly-studio/cult-ui/blob/main/LICENSE.md), copyright 2023 Jordan-Gilliam no arquivo consultado. | Console com seleção de canal/resultado, valor dominante, subdivisões instrumentais de período/fonte, contexto e evidência completos. Curva/tooltip de série não se aplicam ao catálogo: nenhum gráfico, ranking ou dado live fabricado. | TelemetryInstrument.tsx, stationInstruments.css |

Os três padrões são implementações originais, sem copiar fonte, identidade ou assets das bibliotecas; nenhuma biblioteca foi instalada. Skiper 69/80 Pro não utilizados. A fonte Cult atual consultada anuncia componentes gratuitos MIT; isso não constitui adoção/cópia do chart. Não há números aleatórios/intermediários: tanto DOM acessível quanto visual contêm sempre o valor final real. Animação finita de 420 ms, sem loop; pausada fora do viewport ou quando a página está oculta.

Estações: Garagem = ficha técnica com fatos; Telemetria = um instrumento selecionável para os sete resultados; Pit Wall = trilha cronológica com formação; Perfil = folha profissional/formação/interesses/Driver Performance; Estratégia = decisões e limites separados. Os dados são os existentes; nenhum objetivo de carreira ou contribuição foi inventado. Recruiter conserva a leitura completa de todos os resultados.

Evidências externas: `C:/Users/davir/OneDrive/Documentos/GitHub/portfolio/.agent-grid/screenshots/drf-rescue-ui/`. Compare `p1-before-telemetry-1440.png` com `p1-after-telemetry-1440.png`: lista vertical de sete instrumentos → console de um resultado, com acesso aos sete. As outras quatro estações têm pares `p1-before-{zona}-1440.png` / `p1-after-{zona}-1440.png`. O antes não atesta frame 3D (harness antigo); o depois usa guarda de documento novo/ready e dois RAF. Controle explícito: `p1-explicit-cinematic-320.png` e gravação GIF homônima, sem emulatedMedia. Mobile final: `p1-after-telemetry-320-en.png` / `390-en.png`.
