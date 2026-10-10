# DRF — tipografia M12

Diagnóstico: Geist Variable era usada em títulos, parágrafos, nome e estações. A hierarquia dependia de tamanho/peso e tracking negativo (-.035em); labels/metadata já usavam uppercase, sem família display própria. Numerais e códigos tinham escolhas mono locais sem token comum.

Direção: Barlow Condensed 700 somente para títulos de programas, nome profissional, cinco estações e títulos de projeto. Condensação vertical de sinalização técnica, sem pôr parágrafos/tags/controles em fonte estreita. Geist Variable existente permanece para leitura em sentence case. Mono nativa serve códigos e medidas tabulares, não prosa; não requer download extra. Uppercase fica restrito aos identificadores curtos já existentes.

Tokens em src/styles/tokens.css: --drf-font-display/body/mono, --drf-type-display/heading/panel-title/project-title/body/caption, --drf-leading-body, --drf-tracking-label. Aplicação isolada em src/styles/ui/typography.css, importada por PortfolioShell; nenhuma mudança em App/index.css. Ajustes mobile mantêm nomes completos e a ficha sem clamp.

## Fonte e licença

- [Barlow Condensed — Google Fonts](https://fonts.google.com/specimen/Barlow+Condensed), [projeto original](https://github.com/jpt/barlow), [OFL oficial](https://raw.githubusercontent.com/google/fonts/main/ofl/barlowcondensed/OFL.txt): SIL OFL 1.1, Copyright 2017 The Barlow Project Authors. Licença redistribuída em public/fonts/drf/OFL-Barlow.txt. Nenhum arquivo de fonte modificado.
- Binário oficial Google Fonts v13: https://fonts.gstatic.com/s/barlowcondensed/v13/HTxwL3I-JCGChYJ8VI-L6OO_au7B46r2z3bWuQ.woff2; armazenado como public/fonts/drf/barlow-condensed-latin-700.woff2; 22.444 bytes.
- SHA256: 3787A5A419171630E6890CFA47C4DA067474D005CD0FF8DC11EC090FDC3EE2B8.
- Latin U+0000–00FF cobre os acentos PT precompostos presentes nos títulos. Faixa unicode oficial preservada no @font-face. Um peso real 700, font-display:swap, sem Google API em runtime, sem fontes novas para corpo/mono.

Specimen privado: typography-specimen.html, capturado ANTES da aplicação ampla em C:/Users/davir/OneDrive/Documentos/GitHub/portfolio/.agent-grid/screenshots/mission-12-ui/specimen-typography-specimen.png. Não é página de produção. Carregamento local/acentos verificados via document.fonts, sem alegar teste físico.

Comparações: before/after-garage-{1440,390,320}-{pt,en}.png, before/after-case-{largura}-{idioma}.png, before/after-recruiter-{largura}-{idioma}.png e before/after-station-{zona}-1440-pt.png no mesmo diretório externo. Mesmos programa Atleta, idioma, viewport e Cinematic explícito pela UI. Não se usou emulatedMedia para forçar preferência do sistema.

## Coordenação Canvas

Barlow e tokens foram informados ao Lead antes da aplicação. CSS não muda CanvasTexture automaticamente. A frente 3D deve carregar a FontFace/document.fonts e redesenhar suas texturas após conclusão antes de harmonizar as placas; esta entrega não altera cenas nem invalida texturas. O @font-face HTML é carregado por demanda, não deve ser tratado como garantia de fonte pronta no boot 3D.
