# Missão 15 — Exterior Continuity & Audio Recovery

Base `8d93bbf`. Somente exterior e áudio; câmera, GLB, rolamento, curva XZ,
easter eggs, fontes, projetos, dados pessoais e currículos congelados.
Workers existentes reutilizados: 3D Creative e Frontend/UX na área de áudio.

## Resultado e causas

- O desnível era real: piso interno −0,007, deck 1,545, asfalto/pneus 1,55.
  Diferença de 1,557 unidade de cena. A rampa lateral não explicava a conexão
  frontal. Plataforma/rampa removidas; pista/pneus em −0,007, apron −0,012.
  Faixa começa em Z=−8,5, sem finishes coplanares sobre o piso interno.
  Separator/fence retornaram à base da pista; horizonte/canopy preservados.
- Quatro pneus reais GLB foram verificados com raycasts em 101 amostras por
  sentido e rolamento ativo; tolerância de 12 mm para tread facetado/apron.
- Áudio não estava falhando em carregar: contexto running e três assets 200.
  Pausas intencionais causavam silêncio; base ativa tinha RMS ~4–6e−5 em
  volume 25%. Agora retém 80 s da gravação, excertos 40–56 s com crossfade
  equal-power de 4 s. Ganho calibrado por RMS/pico, limitado a 0,24 (real
  ~0,232), não volume máximo nem alteração de PCM. Oficina esparsa, prioridade
  do carro, panner/pose e opt-in/volume/mute preservados.
- Gravação real: 181,69 s de relógio, 180,05 s PCM, callback loss registrado.
  Zero segundos inteiros com RMS zero, mediana por segundo ~0,000575,
  pico 0,03278, nenhum sample clipado. Não são loudness ou aprovação auditiva.
  Retenção PCM: 39,84 MiB, antes 16,40 MiB; fontes compartilham buffers.
  Pico de memória e hardware acústico não medidos. Assets CC0/hashes iguais.

## Integração e evidências

Commits dos workers: `bf09a35` exterior, `d058210` áudio/DEV, `005c7d7`
documentação sonora. Merges locais: `c133c77` e `12ab1bf`, sem conflitos.

Lint/build e 75 testes node:test PASS. Smoke final: 13 grupos PASS,
1440×900/390/320, PT/EN, cinco estações, Cinemático/reduced, histórico,
foco, Recruiter, fallback WebGL e recovery; console/rede sem erros.
Lead repetiu os 12 controles sonoros no checkout integrado: PASS, sem erros
normais; 404/aborts pertencem somente à fixture intencional de falha.
Worker verificou também 13 checks DEV solo.
Relatórios detalhados: MISSAO-15-SCENE.md e MISSAO-15-AUDIO.md.

Galeria privada `.agent-grid/screenshots/mission-15/index.html`: PNGs com
mesmos enquadramentos, vídeos completos antes/depois nos dois sentidos e
amostras sonoras. Frames decodificados para conferir início/meio/fim; captura
headless contínua, sem retiming. Logs/WAVs/WEBMs pesados ficam fora do Git.
Draw calls inalterados no exterior; −14 triângulos, sem textura nova.
Snapshot hero integrado: 91 calls/67.334 triângulos. Não é FPS ou pico de GPU.

## Revisão local e limites

Preview `http://127.0.0.1:5173/`: escolher Movimento → Cinemático;
áudio OFF até gesto, volume inicial 25%. Escuta humana ainda necessária.
Para DEV: `npm run dev -- --host 127.0.0.1 --port 5176 --strictPort`
em drf-v2 (esse servidor não foi deixado rodando pelo Lead). Após opt-in,
`const d = document.querySelector('canvas').drfDebugTrackside`;
`d.audio()` mostra camadas, `d.solo('ventilation')` isola base, também
aceita `'workshop'`/`'pass'`; `d.solo(null)` restaura.
Solo não cria contexto/consentimento/eventos. Produção não expõe o hook.

**Passagem mobile permanece parcial e mais ocluída.** Em 320 a ficha cobre
boa parte do carro na cota correta; no desktop o hero também oculta trechos.
Teste de frustum não representa oclusão por HUD/hero. Não foi elevado o piso
novamente ou alterada câmera/UI para mascarar. Projeto olha para seus displays.
Continuidade geométrica corrigida; qualidade visual/sonora não aprovada por IA.
Chrome instalado headless/mobile emulado, sem dispositivo físico ou audição.
Main/V1/CVs e pesquisa untracked preservados, sem push/deploy/instalação.
