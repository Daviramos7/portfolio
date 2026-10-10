# Missão 11 — apoios dianteiros e composição de projeto

Base `60b28c436d586db1f46705e0d0e2b4b6e3461d56`, branch `feat/drf-engineering-3d`.

## Causas e correções

Os braços superiores e o pushrod dianteiros terminavam acima/fora do nariz
afunilado. As duas rodas dianteiras agora têm raízes reposicionadas na superfície
real, dez pequenos suportes de carroceria e quatro juntas de upright. Duas
geometrias compartilhadas usam o registro existente de recursos/dispose.
O nariz ganhou somente um nome para identificação nos testes; sua forma não mudou.
Suspensão traseira, câmera, áudio e Trackside permanecem preservados.

O monitor de projeto estava fisicamente alto e cortado no enquadramento existente.
Seu centro baixou de 3,4 para 2,3; as três placas inferiores foram compactadas e
baixadas. Elas mostram nomes, enquanto o monitor mostra título, stack e status
provenientes de `screenLines`. Não houve mudança de fontes, conteúdo, CSS ou câmera.

## Verificação executada

- Lint, build e diff-check passaram; 34 testes passaram, incluindo três novos.
- Raycasts verificam dez suportes interceptando o nariz real; braços terminam nos
  uprights, ficam fora do envelope dos pneus e não atravessam o nariz após a raiz.
- Triângulos dos novos suportes/juntas custam menos que um pneu existente.
- Chrome instalado headless, WebGL real, 1440×900 e 390×844, sem emulação de media.
  Preferência nativa reduzida e Cinemático escolhido pela UI; erros/console: zero.
- Hero e projeto usam o aplicativo; frontal, 3/4 e closes usam fixture externa com
  poses fixas idênticas antes/depois, sem alterar o controlador de produção.

Capturas duráveis (24 PNGs e dois registros JSON):
`C:/Users/davir/OneDrive/Documentos/GitHub/portfolio/.agent-grid/screenshots/mission-11-3d/`
Comparação: `index.html`; pastas `before/` e `after/`.

## Custos e limites

Snapshot no enquadramento de projeto: desktop 38→39 calls, 26916→26918 triângulos;
mobile 40→40 calls, 41140→41140 triângulos. Geometrias 54→56 / 48→50;
texturas 28 / 23 inalteradas, DPR 1, MSAA ativo. São contagens desse enquadramento,
não orçamento de pico do hero nem FPS/GPU medido.
Chunk SceneRoot: 612,72 kB, gzip estimado pelo Vite 159,59 kB; warning >500 kB permanece.

Monitor completo e nomes sem corte nas capturas atuais; stack pequeno em 390 px.
Não houve validação física mobile, 320 px ou medição de performance nesta rodada.
Os closes externos servem à inspeção mecânica, não à validação da câmera do app.
Smoke integrado final fica com o Lead; não foi repetido smoke amplo nesta entrega.
