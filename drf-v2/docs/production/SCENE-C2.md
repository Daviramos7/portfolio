# C2 — revisão de acabamento para aceite do Lead

Base: 14a5292b19cdf01f686fd6a36eabf730a5394639. Branch feat/drf-engineering-3d.
C2 melhora a composição existente; não representa aceite de overhaul premium.
D não foi iniciado. Contratos, conteúdo, UI e câmeras existentes preservados.

Luz exterior fria e mais clara contrasta com manutenção quente à esquerda;
recorte lateral evidencia pintura, pneus e cockpit. As mesmas quatro fontes
principais foram reposicionadas/ajustadas, sem novos passes de luz/sombra.
PMREM estático autoral tem painéis menores; contato radial substitui elipse dura,
e sombra PCF 1024 recebe menor intensidade (não simula penumbra física).
Carbono tem specular reduzido para não parecer metal nas asas; rodas têm aro
anular, raios metálicos e disco interno; entradas e fixadores originais refinados.
Piso mapeado uma vez na sala tem albedo/roughness/normal e marcas coerentes com
a baia; grid uniforme removido. Luminária com cabo e ferramentas pequenas na
bancada sustentam a função de manutenção. Placas aprovadas mantêm geometria.

Capturas reais em Chrome headless instalado, sem fixture CSS, no preview 5174:
`C:/Users/davir/AppData/Local/Temp/drf-c2/`.
- before-1440.png / after-1440.png: viewport 1440×900, DPR emulado 2;
  render DPR 1,5 balanced/MSAA; pose 4.8,1.85,7.05 e mesma orientação.
- before-390.png / after-390.png: viewport 390×844, DPR emulado 2;
  render DPR 1 low/sem MSAA; pose 5.6,2.15,9.6 e mesma orientação.
- flow-project-1440.png / flow-project-390.png / flow-project-320.png:
  enquadramentos das placas; títulos visíveis sem tool board à frente.
- smoke/: capturas das cinco zonas, painéis, Recruiter e fallback.
As comparações hero usam PT/reduced motion em ambas para congelar o ambiente.
Revisão visual das imagens confirmou piso/luz perceptivelmente diferentes;
as superfícies permanecem estilizadas e a arquitetura ainda é regular.

Contadores do passe principal (não incluem passe de sombra):
| Hero | Antes | C2 |
|---|---:|---:|
| Desktop draw calls | 62 | 66 |
| Desktop triângulos | 45.392 | 48.088 |
| Desktop geometrias/texturas | 39/18 | 43/21 |
| Mobile draw calls | 53 | 57 |
| Mobile triângulos | 42.578 | 45.274 |
| Mobile geometrias/texturas | 36/15 | 40/18 |

JS cena lazy: 598,37 kB minificado / 154,57 kB gzip (antes 596,11 / 153,67).
JS inicial: 90,60 kB gzip. Continua aviso Vite de chunk acima de 500 kB.
Medição isolada 30 s: Chrome 155.0.8059.40, ANGLE/D3D11 RTX3060,
3.212 intervalos entre frames renderizados, mediana 6,9 ms e p95 7,3 ms.
`performance.json` e `flow-results.txt` no diretório externo acima. Estes são
intervalos headless durante 10 trajetos, com possível fim de ambiente no polling;
não representam tempo CPU/GPU, benchmark físico nem FPS garantido.

Lint/build/14 testes da fundação passaram. Smoke final no preview cobre cinco
zonas, teclado/PT/EN, painel sem snap, cancelamento, ocultação, reduced motion,
context loss/retry e ausência WebGL. 54 raios geométricos desktop/mobile nas
três placas passaram; nenhuma câmera ou ferramenta de navegação foi reescrita.
Console/rede sem erros críticos; driver ainda avisa X4122 no PMREM do Three.
Não houve profiling de heap/GPU, teste físico mobile ou ensaio prolongado.
Aliasing permanece visível em low mobile, que limita DPR e desliga MSAA.
Lead deve integrar/rever arte; Trackside/CAR_PASS e áudio seguem inativos.
