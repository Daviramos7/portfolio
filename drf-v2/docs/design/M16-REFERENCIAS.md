# Missão 16 · Fase 2 — Referências e direção (v2, pesquisa aprofundada)

Versão 2 · 23/10/2026 · **decisões do Davi registradas em 23/10/2026 (fim do arquivo)** · destino no repo: `drf-v2\docs\design\M16-REFERENCIAS.md`.
Pesquisa feita fora do PC: links + o que olhar em cada um; imagens não embutidas. Referências são **estudo**; nada
de foto, render ou modelo de terceiros entra no site. Paleta DRF atual: preto/carbono, vermelho, branco, metal.
As decisões do Davi estão numeradas (**D1…D12**) ao longo do texto e reunidas no fim.

---

## 0. Diagnóstico: por que hoje parece "genérico"

Antes das escolhas, o que a pesquisa indica como causa (não é só modelo):
1. **Forma**: props e carro procedurais (caixas/cilindros) — resolvido com modelos de verdade (Fases 3–6).
2. **Luz**: cenas de interior que parecem "reais" em three.js quase sempre usam **iluminação assada (baked)** no
   Blender + HDRI, com poucas luzes em tempo real; luz dinâmica pura em interior tende a parecer plástico
   ([three.js forum — realistic ambience](https://discourse.threejs.org/t/achieving-realistic-ambience-in-architectural-three-js-scenes/89753)).
3. **Material**: sem micro-detalhe (rugosidade variável, desgaste, knurling, carbono com trama) tudo vira plástico.
4. **Escala e contexto**: nada no ambiente diz "isto é um box de F1 de verdade" (mantas de pneu, cavaletes de
   câmbio, quiosque de monitores, linha do pit lane).
Ou seja: trocar só os modelos melhora, mas **luz + material + contexto** é o que tira a cara de demo.

---

## 1. DRF-01 no padrão 2026

### 1.1 Números do regulamento oficial (FIA, Seção C)
| Item | Valor 2026 | Artigo / fonte |
| --- | --- | --- |
| Largura máx. da carroceria | **950 mm do eixo central** (≈ 1.900 mm total, sem pneus) | C2.3.1 · [FIA Seção C, iss. 18](https://api.fia.com/system/files/documents/fia_2026_f1_regulations_-_section_c_technical_-_iss_18_-_2026-05-07.pdf) |
| Entre-eixos máx. | **3.400 mm** (era 3.600) | C2.3.3 |
| Asa dianteira | até **3 perfis**; **flap primário e secundário móveis** (curso até 30 mm e 60 mm); troca de modo em **≤ 400 ms**, até 2 atuadores | C3.10.1, C3.10.10 |
| Asa traseira | até **3 perfis** com fendas de 8–12 mm; **1 flap móvel** (miolo, dentro de Y=530), 1 atuador, ≤ 400 ms; 3–5 pares de separadores | C3.11.1, C3.11.6, C3.11.7 |
| Beam wing | **removida** | [F1.com](https://www.formula1.com/en/latest/article/explained-2026-aerodynamic-regulations-fia-x-mode-z-mode-.26c1CtOzCmN3GfLMywrgb2) |
| Espelhos | corpo do espelho **contém uma luz lateral de segurança** (estado do ERS) | C3.7.5 · [The Race](https://www.the-race.com/formula-1/f1-2026-new-car-rules-explained/) |
| Rodas | aro **18"**; diâmetro externo **705–710 mm** (era 720); pneu dianteiro **−25 mm**, traseiro **−30 mm** de largura | [F1Technical](https://www.f1technical.net/news/28128) |
| Coberturas de roda | arcos dianteiros removidos; "drums" e lábios definidos por volumes (C3.14) | C3.14 · F1.com |
| Assoalho | 150 mm mais estreito, parcialmente plano, difusor mais fraco | F1.com |
| Peso mínimo | ~768–770 kg (fontes divergem 2 kg) | F1.com · The Race |
| Aero ativa | **Z-mode** (curva, mais carga) ↔ **X-mode** (reta, flaps abertos) | F1.com |
Versão mais recente do texto: [Seção C, iss. 20 (05/08/2026)](https://www.fia.com/system/files/documents/fia_2026_f1_regulations_-_section_c_technical_-_iss_20_-_2026-08-05.pdf) — não abriu aqui; o Claude Code confere se algo mudou.

### 1.2 Checklist de silhueta (o que o modelo tem que mostrar)
- **Compacto**: proporção entre-eixos/comprimento menor que 2022–25; rodas grandes para o corpo (705 mm).
- **Traseira limpa**: sem beam wing; asa traseira de 3 perfis com o flap central visivelmente separado.
- **Dianteira simples**: 3 perfis, flaps em dois estágios, endplate com winglet; nada da "cascata" de 2022.
- **Rodas dianteiras expostas** e **placas de controle de esteira na entrada do sidepod** (o detalhe que mais data 2026).
- **Undercut** grande sob o sidepod; espelhos com a luzinha de ERS; halo; câmera T; push/pull rod visíveis.
- Medidas de modelagem (1 unidade = 1 m): largura ~1,90; entre-eixos ~3,40; roda Ø 0,71. Se a cena usa outra
  escala, o Claude Code converte e documenta (a M15 mostrou que escala/altura importam).

### 1.3 Como os carros reais de 2026 diferem (para o DRF-01 não virar cópia)
Segundo Mark Hughes ([The Race](https://www.the-race.com/formula-1/mark-hughes-explains-f1-2026-key-car-design-differences)):
Mercedes W17 com bico preso no elemento do meio; McLaren MCL40 com centro da asa muito arqueado e endplates
grandes com winglets; Red Bull RB22 e Aston AMR26 com bico largo; Ferrari SF-26 com bico baixo e estreito;
sidepods de "tubo fino" (Aston) a "topo largo com undercut de ponta a ponta" (Mercedes); assoalho com três placas
na borda na maioria das equipes. Galerias para estudar proporção e pintura:
[RaceFans — os 11 carros de 2026](https://www.racefans.net/2026/01/22/pictures-all-11-new-formula-1-cars-for-the-2026-season/) ·
[Silverstone — todas as pinturas](https://www.silverstone.co.uk/news/f1-car-launches-2026-every-teams-livery-reveal) ·
[The Race — renders oficiais da FIA](https://www.the-race.com/formula-1/f1-reveals-2026-car-everything-you-need-to-know/).

**D5 — Personalidade da silhueta**
- **A · "Agressivo":** bico médio-largo, sidepod de topo largo com caimento forte e undercut longo, endplates grandes.
- **B · "Limpo/engenharia":** bico baixo e estreito, sidepod fino, superfícies lisas, poucos apêndices.
Recomendação: **B** — modela melhor (menos superfície fina para a IA errar) e combina com "precisão".

**D6 — Aero ativa animada:** ao entrar na estação Telemetry, os flaps do DRF-01 passam de Z-mode para X-mode
(≤ 400 ms, como no regulamento). Barato (dois grupos girando) e é exatamente "engenharia + dados". Recomendo **sim**.

### 1.4 Pintura (D4)
- **A · "Carbono Recife":** carbono exposto + faixas diagonais vermelhas + número branco. Mais próxima da identidade.
- **B · "Tricolor de faixa":** preto fosco com faixa horizontal vermelha e branca do bico à asa (alusão ao Santa
  Cruz, sem escudo).
- **C · "Noite no Capibaribe":** preto + vermelho só nas asas e nas luzes de ERS, halo em metal escovado. Mais sóbria.
Regras: sem logos reais; "patrocinadores" só da própria DRF (ex.: "DRF Data", "REC/PE").

---

## 2. Garagem elevada

### 2.1 O que existe de verdade
- **Silverstone Wing** (Populous, 2011): 41 garagens no térreo; acima, salas, mídia, controle de prova e o Paddock
  Club com "vista de cima do pit lane e da reta". Telhado angular em forma de asa, com painéis solares.
  [oversteer48](https://oversteer48.com/silverstone-wing/) · [Autosport](https://www.autosport.com/f1/news/91469/silverstone-unveils-new-wing-complex)
- **Interlagos**: Paddock Club **em cima das garagens da reta principal**, "com o pit lane logo abaixo"; Champions
  Club numa torre sobre a linha de chegada. [F1 Experiences](https://f1experiences.com/blog/where-to-watch-the-action-at-the-sao-paulo-gp)
- **Jeddah** (Tilke, arq. Ulrich Merres): prédio de 280 m e 4 andares em "paisagem" escalonada; garagens embaixo,
  controle de prova e suítes que olham o pit lane e o grid. [F1.com](https://www.formula1.com/en/latest/article/revealed-new-images-of-state-of-the-art-saudi-arabian-pit-and-team-building.3XR9bIkbSNnUljmD176uzD)
- **Yas Marina** (BDP): expansão do Paddock Club. [BDP](https://www.bdp.com/projects/yas-marina-circuit-expansion-at-the-paddock-club)
- Hospitalidade de equipe expõe **show car** no salão: precedente para o DRF-01 "lá em cima".

### 2.2 Como é um box por dentro (para dar realismo ao andar de baixo)
Montado com paredes temporárias; frente com o carro e o time; nos fundos, sala de dados com **monitores
empilhados**, um **quiosque de monitores** perto do carro (engenheiros de pneus), **pneus em mantas térmicas
coloridas**, **câmbios em cavaletes**, assoalho de carbono encostado, peças e caixas etiquetadas.
O pit wall é "extensão do box". [Jalopnik — How an F1 garage works](https://jalopnik.com/how-a-formula-one-garage-works-on-race-day-1788108577)
→ Esses objetos são **contexto barato** (formas simples, instanciáveis) e resolvem "box genérico".

### 2.3 Caminhos (D1)
| | Conceito | O que muda | Custo / risco |
| --- | --- | --- | --- |
| **A · Mezanino de engenharia** | Estações num mezanino dentro do box (3–4 m). DRF-01 no térreo, visto de cima; pista pela abertura. | Câmera sobe e inclina; garagem atual reaproveitada. | **Menor.** Preserva mais da câmera aprovada. Corrida parcialmente escondida pela porta. |
| **B · Sala técnica sobre o pit** (estilo Paddock Club) | Andar de cima, fachada de vidro para pit lane e reta; DRF-01 como show car; boxes embaixo com o contexto da 2.2. | Ambiente e câmera novos. | **Maior.** Melhor vista da corrida; praticamente cena nova. |
| **C · Torre** | 10 m+, pista em panorama. | Tudo novo. | Perde a sensação de oficina. Não recomendo. |
Recomendação: **B** se a corrida é protagonista; **A** se a prioridade é preservar o aprovado.
Sinais que tornam a altura **intencional** (o oposto do "degrau" da M15): caixilho/guarda-corpo em primeiro plano;
telhado das garagens e pit lane visíveis com sombra de contato; linha do horizonte acima do meio da tela; pessoas e
objetos de escala lá embaixo (mecânicos estilizados, cavaletes, pneus).
Custo de vidro: transmissão/refração em tempo real é cara no mobile — usar **vidro falso** (plano levemente
refletivo com env map, sem transmission) ou só o caixilho, sem vidro.

### 2.4 Horizonte (D2)
- **A · Genérico:** arquibancadas, torres de iluminação, céu.
- **B · Recife fictício:** um circuito imaginário com o horizonte de Recife ao fundo (prédios de Boa Viagem,
  coqueiros, Capibaribe, ponte, o farol do Marco Zero) em silhuetas estilizadas de baixo custo (planos recortados).
  É o detalhe "só deste portfólio"; Recife não tem circuito de F1, então é ficção declarada. Recomendo **B**.

---

## 3. Corrida ao fundo

### 3.1 Física e percepção
- 300 km/h = **83 m/s**: uma reta visível de 100 m é cruzada em ~1,2 s. A passagem atual (2,2–2,6 s) equivale a
  ~150–200 m de trecho visível.
- **Motion blur não ajuda**: estudo MIT/Disney/CMU num jogo de corrida não achou efeito em tempo, diversão nem
  sensação de velocidade ([Disney Research](https://studios.disneyresearch.com/2013/11/06/simulated-motion-blur-does-not-improve-player-experience-in-racing-game/)).
- O que vende velocidade: **referências fixas passando** (zebras, placas de frenagem 100/50, postos de fiscal,
  faixas), **movimento relativo** (um carro alcança outro), **curva visível** (carro entra/sai), **som** (já integrado).

### 3.2 Densidade (D3)
- **A · Treino livre:** 3–5 carros espaçados, passagem a cada 6–12 s.
- **B · Corrida viva:** 8–12 carros em grupos, com disputas e "trens" ocasionais.
- Mobile: no máximo 3–4. Reduced motion: carros **parados no grid** ou um único passando devagar.

### 3.3 Técnica e orçamento
- Carros de fundo: versão leve do DRF-01 (~3–6 mil triângulos), pintura por cor de instância, `InstancedMesh`
  (mesma geometria) ou `BatchedMesh` (geometrias diferentes, mesmo material); LOD por distância; spline com curva;
  mesmo relógio do `CAR_PASS`. Sombra: decal de sombra falsa embaixo do carro, não sombra em tempo real.
- Orçamento de referência: ~100–150 draw calls para 60 fps em hardware médio; celular médio sofre acima de
  algumas centenas; DPR máx. 2; uma luz com sombra, mapa 512–1024; KTX2 para texturas; Draco/Meshopt para malha;
  qualidade adaptativa medindo fps ([hontran.dev](https://www.hontran.dev/blog/three-js-performance-optimization)).
  Hoje a cena tem **91 draw calls / 67 mil triângulos** (M15): há folga, mas a corrida tem que caber em ~+15 calls.
- three.js r186: `LightProbeGrid` (r184) para iluminação indireta, PBR revisado; WebGPU **não** é necessário
  ("profile before migrating") ([Utsubo](https://www.utsubo.com/blog/threejs-2026-what-changed)).

---

## 4. Luz e material (D10)
- **A · Assada (recomendada):** iluminação do box e da sala calculada no Blender (lightmap + AO) e aplicada como
  textura; HDRI para reflexos; 1 luz em tempo real só para o carro em exposição. Visual muito mais real e barato
  na GPU; contra: luz fixa (sem ciclo dia/noite) e mais trabalho de pipeline (UV2, bake).
- **B · Tempo real melhorada:** manter luzes dinâmicas, adicionar `LightProbeGrid`, AO em tela e env map. Menos
  pipeline, resultado mais "CG".
HDRIs CC0: Poly Haven (licença CC0, uso livre) — procurar interiores industriais/garagem ([FAQ Poly Haven](https://polyhaven.com/faq)).
Materiais que fazem diferença: carbono com trama + verniz (clearcoat), alumínio escovado/serrilhado, borracha com
rugosidade alta, piso epóxi com reflexo borrado, tinta com leve desgaste nas arestas.

---

## 5. Props (D7)
**Controle "inspirado no 360", sem marca** — reconhecível pela forma: analógico esquerdo no alto e D-pad embaixo;
pegas grossas; bumpers e gatilhos; quatro botões em losango com cores próprias (não a combinação exata
verde/vermelho/azul/amarelo com letras A/B/X/Y) e um **anel com o monograma DRF** no lugar do botão central.
**Handgrip** — dois cabos de alumínio serrilhado, mola de torção grossa, número de resistência gravado
("45 kg"). É o prop do teste da Fase 3 (simples, simétrico, sem marca).
**Contexto do box (novos, baratos):** mantas de pneu coloridas em pilha, cavalete de câmbio, quiosque de monitores,
cobertores de pneu, carrinho de ferramentas, capacete DRF, pit board.
Candidatos a trocar: estojo tricolor (aprovado na M14 — manter?), placa REC/PE, cartão científico.
Melhor entrada para IA: **foto tua** do objeto real em fundo neutro, 3/4, boa luz.

---

## 6. Pipeline de IA 3D na RTX 3060 (12 GB) (D8)

### 6.1 O que existe (out/2026) e cabe
| Modelo | Licença | VRAM | Saída | Cabe 12 GB? |
| --- | --- | --- | --- | --- |
| **Hunyuan3D 2.1** (Tencent) | Community License: vale no Brasil (exclui UE/RU/Coreia do Sul); teto de 1 mi MAU | forma ~10 GB; textura PBR ~21 GB (oficial) | malha + PBR | **Forma sim**; textura só com offload (forks "2GP"/WinPortable, ~6–9 GB, lento, a testar) |
| **TripoSG** | MIT | ~8 GB | só forma | Sim |
| **Direct3D-S2** | MIT | ~10 GB a 512 | só forma | Sim (512) |
| **Pixal3D** (TencentARC, mai/2026) | MIT | sem número; tem modo low-VRAM (1024) | malha + PBR | **A testar** (base TRELLIS.2, que pede 24 GB) |
| TRELLIS.2 | MIT | 24 GB | PBR | Não |
| Step1X-3D | Apache 2.0 | 27–29 GB | malha + textura | Não |
| PartPacker | não comercial | ~10 GB | partes | Excluído (licença) |
Fontes: [Cinevva — linha do tempo 2026](https://app.cinevva.com/guides/ai-3d-model-generation-timeline-2026) ·
[Pixal3D (HF)](https://huggingface.co/TencentARC/Pixal3D) ·
[Guia Hunyuan3D no Windows](https://codersera.com/blog/set-up-hunyuan3d-2-on-windows-a-step-by-step-guide/amp/) ·
[Licença Hunyuan3D](https://huggingface.co/tencent/Hunyuan3D-2/blob/main/LICENSE).

**Ponto importante da licença Hunyuan:** proíbe publicar saídas **sem identificar que foram geradas por máquina**.
→ Se usarmos Hunyuan, o portfólio precisa de um crédito tipo "Modelos 3D gerados com IA (Tencent Hunyuan3D) e
finalizados no Blender" (D9). Pixal3D/TripoSG (MIT) não exigem, mas creditar é honesto e vira ponto do making of.

### 6.2 Imagem de entrada
Sem foto própria, gerar conceito com modelo de imagem local de licença aberta: **FLUX.2 klein 4B/9B (Apache 2.0,
~8 GB)** ou **HiDream-O1 (MIT)**; **evitar Qwen-Image 2.1** (licença de pesquisa, não comercial)
([ranking local 2026](https://local-ai-zone.github.io/blog/local-image-generation-2026.html)).

### 6.3 Rota recomendada
1. **Forma pela IA, material à mão:** gerar só a geometria (Hunyuan 2.1 forma ou TripoSG), e fazer os materiais
   no Blender/three.js (alumínio, carbono, borracha são materiais simples e ficam melhores feitos à mão do que
   textura "pintada" pela IA). Evita o problema de VRAM da textura.
2. **Limpeza no Blender:** decimar, remesh/retopo, espelhar metade (simetria), UV + UV2 para lightmap, escala real.
3. **Carro (Fase 5) híbrido:** IA só para volumes grossos (monocoque, sidepods, cobertura do motor); **asas, halo,
   suspensão e rodas modelados parametricamente** no Blender (são placas, tubos e cilindros — a IA erra superfície
   fina). É o caminho honesto para ficar com cara de 2026.
4. **Exportar:** GLB com Draco/Meshopt + KTX2; orçamento definido antes (ex.: prop ≤ 8 mil tri, carro hero ≤ 80 mil).
Teste da Fase 3: handgrip com **duas** IAs (Hunyuan 2.1 forma × TripoSG), lado a lado, o Davi escolhe.

---

## 7. Marcas e direitos (D12)
Diretrizes da Formula 1: logos exigem licença; as palavras "F1"/"Formula 1" podem ser usadas de forma descritiva,
não como marca do site; conteúdo de terceiros (fotos, vídeo) não pode ser copiado
([F1 — guidelines](https://www.formula1.com/en/toolbar/guidelines.html)). Para o DRF:
- a marca é **DRF Engineering**; "inspirado em Fórmula 1" só como descrição;
- nenhum logo de F1, FIA, Pirelli, equipe ou console; nenhuma foto de terceiro no site;
- referências desta página são só estudo; IA alimentada com conceito próprio, não com foto de carro de equipe;
- rodapé/sobre com nota curta: "projeto pessoal, sem vínculo com a Fórmula 1 ou equipes".

---

## 8. Referências de sites 3D (o nível que se busca)
- **Bruno Simon — folio 2025**: three.js + TSL (WebGL e WebGPU), física Rapier, carro dirigível; **código e
  arquivos Blender abertos (MIT)** — ótimo para estudar pipeline Blender→web. [bruno-simon.com](https://bruno-simon.com/) ·
  [GitHub](https://github.com/brunosimon/folio-2025)
- **Lando Norris (Off+Brand)**: marca pessoal de piloto, cores do capacete, "On track / Off track". [DesignRush](https://designrush.com/best-designs/websites/lando-norris-website-design)
- **Cartier Watches & Wonders (Immersive Garden)**: seis salas 3D com three.js/GLSL, GSAP e áudio — referência de
  "ambiente como interface". [Utsubo — best three.js sites 2026](https://www.utsubo.com/blog/best-threejs-websites-2026)
- Carros 3D premiados: [3D SportCar Website](https://www.awwwards.com/sites/3d-sportcar-website) ·
  [Virtual Car Showroom](https://www.awwwards.com/sites/virtual-car-showroom)

---

## Decisões do Davi (resumo)
| # | Decisão | Opções | Recomendação |
| --- | --- | --- | --- |
| D1 | Garagem elevada | A mezanino · B sala sobre o pit · C torre | B (ou A para preservar mais) |
| D2 | Horizonte | A genérico · B Recife fictício | B |
| D3 | Corrida | A treino livre (3–5) · B corrida viva (8–12) | A primeiro, B se o desempenho deixar |
| D4 | Pintura | A Carbono Recife · B Tricolor · C Noite no Capibaribe | gosto teu |
| D5 | Silhueta | A agressivo · B limpo/engenharia | B |
| D6 | Aero ativa animada na Telemetry | sim · não | sim |
| D7 | Props | trocar quais? manter estojo? tens controle/handgrip reais para fotografar? | handgrip primeiro |
| D8 | IA 3D | autorizar inventário + teste com Hunyuan 2.1 (forma) × TripoSG; Pixal3D se couber | sim, só inventário antes de baixar |
| D9 | Crédito "modelos gerados com IA" no site | sim · não | sim (obrigatório se Hunyuan) |
| D10 | Luz | A assada (Blender) · B tempo real melhorada | A |
| D11 | DPR do mobile (pendente da Fase 1) | 1,5 com degradação · 2 · manter 1 | 1,5 com degradação |
| D12 | Nota "sem vínculo com a F1" no site | sim · não | sim |

## Decisões registradas (Davi, 23/10/2026, 12h57)
| # | Escolha |
| --- | --- |
| D1 | **B** — sala técnica de vidro sobre o pit (estilo Paddock Club), DRF-01 como show car, boxes embaixo |
| D2 | **B** — horizonte de Recife fictício (silhuetas estilizadas) |
| D3 | **A primeiro** (3–5 carros), subir para **B** (8–12) se o desempenho medido permitir |
| D4 | **B** — "Tricolor de faixa": preto fosco + faixa horizontal vermelha e branca, sem escudo |
| D5 | **B** — silhueta limpa/engenharia (bico baixo e estreito, sidepod fino) |
| D6 | **Sim** — flaps Z-mode → X-mode na estação Telemetry (≤ 400 ms) |
| D7 | Referências de props **da internet** (o Davi não vai fotografar). Regra: foto da internet é só **estudo** para escrever o conceito; a imagem de entrada da IA 3D é **gerada localmente** (FLUX.2 klein, Apache 2.0) a partir desse conceito, sem logo nem marca — **nunca** usar foto de terceiro como entrada direta. Registrar os links estudados em `ASSETS.md`. |
| D8 | **Sim** — inventário (licença, tamanho, VRAM) antes de baixar; teste do handgrip com Hunyuan3D 2.1 (forma) × TripoSG; Pixal3D se couber |
| D9 | **Sim** — crédito no site: "Modelos 3D gerados com IA e finalizados no Blender" (+ nome do modelo usado) |
| D10 | **A** — luz assada no Blender (lightmap + AO) + HDRI CC0; 1 luz em tempo real no show car |
| D11 | **DPR 1,5 no modo low**, com degradação automática para 1 quando o frame time sustentado piorar (sem oscilar) |
| D12 | **Sim** — nota "Projeto pessoal, sem vínculo com a Fórmula 1, a FIA ou equipes" no rodapé/sobre |

Impacto em regras anteriores: D1 substitui a cota da M15 (`y=-0,007`) como restrição **depois** do documento de
desenho da Fase 4 aprovado; até lá, a cota vale. D1 também mexe na câmera aprovada: cada trajetória nova precisa de
aprovação do Davi.
