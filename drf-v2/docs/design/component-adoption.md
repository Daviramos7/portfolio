# Component adoption — Rescue UI

P0: agrupamento de controles inspirado na hierarquia da [coss Toolbar](https://coss.com/ui/docs/components/toolbar), acessada também via [Origin UI](https://github.com/telestrator-labs/origin-ui). Elemento perceptível: ferramentas compactas, escolha exclusiva em painel contextual, estados e foco explícitos. Implementação original em EnvironmentControls.tsx/nightShift.css, com detalhes e radios HTML; nenhum pacote/código Base UI incorporado, nenhum roving-focus de Toolbar reivindicado. Licença da árvore coss atual: [AGPL-3.0](https://github.com/cosscom/coss/blob/main/LICENSE); nenhum código dessa árvore copiado.

Comparação: before-ambient-native.png / after-motion-system-320.png no diretório externo de evidências descrito em RESCUE-UI.md.

[Skiper 37](https://skiper-ui.com/v1/skiper37): uso gratuito requer atribuição. Crédito de inspiração: Skiper UI. InstrumentValue existente é autoria própria, revelando somente dígitos finais; sem NumberFlow instalado ou código copiado. Skiper 69/80 Pro consultados só como referência. Nenhuma nova adoção Skiper reivindicada no P0.

[Cult marketing analytics](https://www.cult-ui.com/docs/components/marketing-hero-analytics) e [analytics-chart](https://www.cult-ui.com/docs/components/analytics-chart): referências consultadas para hierarquia valor/contexto/evidência. Nenhum código/asset Cult incorporado ou licença Pro presumida. Sem séries fabricadas. Evolução visual das estações fica no lote P1, separado deste marco funcional.
