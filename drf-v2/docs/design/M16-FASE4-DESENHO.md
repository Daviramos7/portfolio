# M16 · Fase 4 — desenho da garagem elevada (RASCUNHO)

Status: **rascunho para o Davi decidir**. Nada aqui foi implementado. Sem código, sem mudança de câmera.
Decisões de base: D1 **B** (sala técnica de vidro sobre o pit, DRF-01 como show car, boxes embaixo),
D2 **B** (horizonte de Recife fictício), D3 **A** (3–5 carros). Fontes: `M16-REFERENCIAS.md` §2–3 e o código
atual lido sem alteração (`src\scene\camera\framing.ts`, `src\scene\garage\Garage.ts`,
`src\scene\trackside\TrackOpening.ts`, `preparation.ts`).

## 0. Como a cena é hoje (medido no código)

- Sala fechada: x de −8,4 a +8,4, z de −6,6 (parede do fundo com abertura de serviço) a ~+11,9; teto a 4,65 m;
  piso em `y = −0,007` (cota da M15). DRF-01 na origem.
- Telemetria (x −5,7) e pit wall (x +5,75) são monitores em z −4,9, **na frente da abertura do fundo**.
  Perfil (x −7,65) e estratégia (x +7,65) ficam nas paredes laterais e olham para os lados.
- Pista no **mesmo nível** do piso: faixa de serviço de z −8,5 a −33,75; a passagem é uma parábola de
  (−16,8; −27,6) a (+11,2; −14,6), 2,2–2,6 s, a cada 25–45 s. Horizonte = 12 caixas abstratas em z ≈ −38.
- Câmera: 5 enquadramentos desktop + 5 mobile + 2 da tela de programas; transições pelo corredor de serviço
  (`buildCameraPath`, pontos de passagem a y 2,02–2,05, z 5,4), 1,6–2,4 s.
- Orçamento atual (M15): **91 draw calls / 67.334 triângulos** no hero desktop.

## 1. Proposta de volume

**Ideia central: subir a sala inteira, não reconstruir.** O grupo da garagem atual (piso, paredes, estações, DRF-01)
é transladado para cima em **H**, e embaixo dele nasce o andar dos boxes. Como tudo sobe junto, cada câmera pode
subir o mesmo H e **a trajetória relativa à sala fica idêntica** (mesmas curvas, mesmos tempos, mesmo corredor).
O que muda é o que aparece pelo vidro.

### 1.1 Altura (H)
| H | Leitura | Corrida no hero desktop (y na tela, −1 = base) |
| --- | --- | --- |
| 3,5 m | mezanino; pouco "alto" | −0,02 a −0,21 |
| **4,5 m (proposta)** | box de F1 real tem 4–5 m de pé-direito; a laje fica crível | ≈ −0,07 a −0,30 (interpolado) |
| 5,0 m | Paddock Club "de verdade" | −0,05 a −0,35 |
Cálculo: projeção das posições/alvos atuais de `framing.ts` + H, FOV 43° (desktop) e 63° (390×844), pista no eixo do
olhar entre z −14 e −32. Script e saída (fora do Git):
`C:\Users\davir\OneDrive\Documentos\GitHub\portfolio\.agent-grid\screenshots\mission-16\fase4-desenho\projecao-estacoes.py` / `.txt`.

### 1.2 Fachada, caixilho e guarda-corpo (o que torna a altura *intencional*)
- A parede do fundo (z −6,6) vira **fachada de vidro** de ponta a ponta (x −8,4 a +8,4).
- Montantes a cada **2,4 m** (7 vãos), travessa a 2,6 m; peitoril de carbono de 0,25 m e **guarda-corpo a 1,05 m**
  com corrimão de metal — primeiro plano escuro que "segura" a altura.
- **Vidro falso**: um plano com env map e opacidade baixa (~0,08), sem `transmission` (caro no mobile).
  Alternativa mais barata: só o caixilho, sem plano de vidro.
- Laje com **borda visível** (testa da laje de 0,3 m) e a cobertura dos boxes lá embaixo com sombra de contato.
- Os monitores de telemetria e pit wall continuam no fundo, agora como **consoles virados para o vidro**
  (como sala de controle de prova). Altura dos monitores a revisar para não tapar a reta (ver §2).

### 1.3 Show car
- DRF-01 continua na **origem** da sala (mesma posição relativa → hero e transições preservados), sobre um
  **pedestal baixo de 0,12 m** com disco de piso e faixa de luz. Uma luz em tempo real só nele (D10).
- Sem rotação automática por padrão (respeita o aprovado e o reduced motion); giro lento seria opcional.

### 1.4 Corte lateral (esquema)
```
 y
 ~7   (teto da sala)  ┌─────────────────────────┐
                      │ sala técnica · DRF-01    │ caixilho/guarda-corpo
 4,5  ───── laje ─────┴──────────┐  [vidro]     │
                                  │╲  vista  ╲
      boxes (piso 0)  │ carro │   │  ╲        ╲
 0    ────────────────┴───────┴───┴── pit lane ─┬ muro ─┬──── RETA ─────┬── zebra/curva ──
                     z ≈ −2      −6,6       −9,5   −17  −18   −20 … −32        horizonte z −60+
```

## 2. As 5 estações: hoje × proposta

"Hoje" = o que a câmera enxerga no código atual. "Proposta (só translação)" = mesma câmera + H.
Valores de pista em y de tela (−1 = base, 0 = centro), H = 5 como pior caso.

| Estação | Câmera hoje (pos → alvo) | Hoje vê | Proposta (só translação, H 5) | Ajuste sugerido (precisa do Davi) | Impacto na trajetória |
| --- | --- | --- | --- | --- | --- |
| **Garagem (hero)** | (4,8; 1,85; 7,05) → (0; 0,8; 0,15) | carro + abertura do fundo; pista em +0,13…+0,22 (acima do carro) | carro na sala; **pela fachada, reta em −0,05…−0,35** e horizonte em +0,37 | nenhum | nenhum (mesma curva, +H) |
| **Telemetria** | (−3,4; 1,9; −0,25) → (−5,7; 1,7; −4,75) | monitor; pista −0,03…−0,21 | monitor; reta em **−0,39…−1,0** (metade de baixo; parte sai da tela) | baixar o alvo ~0,6 m **ou** subir os consoles para a reta passar acima deles | nenhum se só o alvo muda |
| **Pit wall** | (3,45; 1,9; −0,25) → (5,75; 1,8; −4,75) | monitor; pista −0,08…−0,26 | reta em **−0,44…−1,07** | igual à telemetria (simétrico) | idem |
| **Perfil** | (−3,25; 1,85; 3,7) → (−7,65; 1,75; 2,1) | parede esquerda; pista fora da tela | igual (olha para o lado) | nenhum | nenhum |
| **Estratégia** | (3,3; 1,85; 4,4) → (7,65; 1,95; 1,9) | parede direita; pista fora da tela | igual | nenhum | nenhum |
| (tela de programas) | (−3,7; 1,9; −0,6) → (−8,045; 1,7; −3) | parede esquerda | igual | nenhum | nenhum |

Mobile 390 (FOV 63°): hero com a reta em −0,05…−0,23; telemetria/pit wall em −0,29…−0,65. **A ficha do mobile
ocupa a parte de baixo da tela**, então nessas duas estações a corrida fica coberta (ver Riscos).

Regra: nenhuma trajetória muda sem o Davi aprovar uma por uma. A proposta mínima (só +H) mantém as 5 iguais em
forma; os ajustes de alvo de telemetria/pit wall são opcionais e separados.

## 3. Pista, traçado e velocidade

### 3.1 Planta (esquema, vista de cima, sem escala exata)
```
 z
 −6,6  ════ fachada de vidro (sala elevada, x −8,4 … +8,4) ════
 −9,5  ┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄ pit lane (faixa branca, boxes embaixo) ┄┄┄┄┄┄┄┄┄┄┄
 −17   ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬ muro do pit + pórtico ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
 −20   ──────────────────────────────────────────────────────╮  ▣100 ▣50
 −26   ═══ RETA → (carros entram pela esquerda, x −40) ══════════╮  zebra
 −32   ──────────────────────────────────────────────────────╮ │  (curva 1, à direita,
                                                                ╰─╯   sai para z −45)
 −60…  horizonte: silhuetas de Recife (Boa Viagem, ponte, farol do Marco Zero), planos recortados
        x:  −40 ……………… −8 ………… 0 ………… +8 ……………… +30
```
- Spline: `CatmullRomCurve3` com reta em z ≈ −26 de x −40 a +22, depois **curva à direita** (raio ~18 m) saindo
  para o fundo. A curva é o que mostra "carro entrando/saindo" (M16-REFERENCIAS §3.1).
- Referências fixas de velocidade (todas baratas e instanciadas): **placas de frenagem 100/50** antes da curva,
  **zebras** vermelho/branco na curva, **postes de iluminação/fiscal a cada 10 m**, faixa branca da borda e a
  **sombra falsa** (decal) sob cada carro.
- Velocidade: a cena atual é estilizada (a passagem de ~28 m em 2,2–2,6 s ≈ 11–13 m/s). 300 km/h reais
  (83 m/s) cruzariam a janela visível (~30 m a 24 m de distância) em ~0,4 s: ilegível. Proposta: **25–35 m/s de
  cena** na reta (~1 s por janela), mais lento na curva. Pergunta para o Davi (§7).
- Mesmo relógio monotônico do `CAR_PASS` atual; áudio de passagem reaproveitado, um evento por carro.

### 3.2 Boxes embaixo (D1 B)
- Sob a sala, 3 portas de box visíveis de cima (só a frente, profundidade falsa de 2 m), com o contexto barato da
  §2.2 das referências: pneus em mantas, cavaletes, quiosque de monitores. Tudo instanciado.

### 3.3 Horizonte (D2 B)
- 1–2 planos recortados (alpha test, atlas único) com silhuetas de Recife a z −60…−90, mais névoa. Fica em
  y +0,03…+0,37 na tela (acima do meio), como pede a regra "horizonte acima do meio" das referências.
- Ficção declarada (Recife não tem circuito) + nota D12 no rodapé.

## 4. Orçamento

| Item | Draw calls | Triângulos | Observação |
| --- | --- | --- | --- |
| Cena atual (M15, hero) | 91 | 67.334 | base medida |
| Fachada (caixilho + guarda-corpo mesclados, vidro falso) | +2 | +1 mil | 1 malha mesclada + 1 plano |
| Laje, pedestal do show car | +2 | +0,5 mil | |
| Boxes embaixo (mesclado + instâncias de props) | +3 | +8 mil | |
| Pista, pit lane, muro, zebras, placas, postes | +4 | +3 mil | instanciado por tipo |
| **Corrida: 3–5 carros** | **+3** | **+15–25 mil** | corpo (1 `InstancedMesh`), rodas (1), sombra falsa (1); carro leve 3–5 mil tri |
| Horizonte Recife | +1 | +1 mil | atlas único |
| **Total estimado** | **~106** | **~95–105 mil** | corrida bem abaixo do teto de ~15 calls |

O que sai: a parede do fundo, a persiana e as 12 caixas do horizonte atual (−3 a −5 calls), não contado acima.
Medir de verdade na implementação (`data-scene-draw-calls`), não confiar nesta estimativa.

- **Mobile (`low`)**: 3 carros no máximo; sem os props dos boxes; horizonte em 1 plano; vidro falso desligado
  (só caixilho); DPR 1,5 com a queda automática da D11 já ativa.
- **Reduced motion**: nenhum carro passando. Os 3–5 carros ficam **parados no grid/pit lane** como cenário;
  câmera instantânea como hoje; pedestal sem giro.
- **Sem WebGL**: nada muda (o conteúdo continua no DOM).

## 5. Cota da M15 (`y = −0,007`)

- Hoje ela proíbe elevar a pista ou mexer em câmera/UI para esconder oclusão.
- Na proposta, **a pista e os boxes continuam em y ≈ 0** (a cota da M15 segue valendo para o chão de fora); quem
  sobe é a **sala** (piso em y = H − 0,007). O que deixa de valer é a ideia de "garagem e pista no mesmo nível".
- Quando: só **depois deste documento aprovado pelo Davi** e a Fase 4 implementada. Até lá, nada muda.
- A pendência conhecida (passagem do carro tapada pela ficha no mobile e pelo hero no desktop) **não se resolve
  sozinha**: no hero ela tende a melhorar (a reta desce para trás do carro, fora do título), no mobile ela pode
  piorar nas estações de fundo (§2).

## 6. Riscos

1. **Ficha do mobile x corrida**: em telemetria/pit wall a reta cai na metade de baixo (−0,29…−0,65 a 390),
   embaixo da ficha. Saídas: H menor (3,5–4,5), baixar o alvo dessas duas câmeras no mobile, ou aceitar que a
   corrida é do hero e das transições.
2. **Monitores tapando a reta**: os consoles do fundo ficam entre a câmera e o vidro. Precisam baixar/afinar.
3. **Vidro**: reflexo falso mal calibrado vira "plástico"; sem vidro algum, perde a sensação de sala.
4. **Escala**: a 4,5–5 m de altura, um carro de 5,6 m a 25 m de distância é pequeno; carro leve precisa de
   silhueta clara (D5) e pintura legível (D4) — depende da Fase 5.
5. **Sombras**: hoje o sol tem sombra 1024 numa caixa de 20 m; com a pista mais longe, sombra em tempo real lá
   fora fica cara → sombra falsa (decal) nos carros e luz assada (D10) no resto.
6. **Escopo**: é praticamente uma cena nova em volta da sala atual. Sugestão de fatiamento: 4a volume + fachada
   (sem corrida), 4b pista/boxes/horizonte, 4c corrida — cada um com antes/depois e gate do Davi.

## 7. Perguntas para o Davi

1. **H**: 3,5 (mais seguro no mobile), **4,5 (proposta)** ou 5,0 (mais "Paddock Club")?
2. Telemetria e pit wall: aceita mudar **só o alvo** dessas duas câmeras (mesma trajetória) para a corrida aparecer,
   ou a corrida fica só no hero?
3. Vidro falso com reflexo ou só o caixilho?
4. Velocidade de cena: legível (~25–35 m/s) ou "real" (rápido, quase um borrão)?
5. A curva à direita (saindo para o fundo) ou à esquerda? (Hoje a passagem faz a curva para a direita.)
6. Show car girando devagar (opcional) ou parado?
7. Reduced motion: carros parados no grid ou nenhum carro?
8. Topa fatiar a Fase 4 em 4a/4b/4c com gate em cada uma?

Aprovação do Davi: pendente.

## 8. Decisões do Davi (23/10/2026, 19h43)

| Pergunta (§7) | Decisão |
| --- | --- |
| 1. Altura H | **4,5 m** |
| 2. Telemetria e pit wall | **pode mudar só o alvo** da câmera (mesma trajetória) |
| 3. Vidro | **vidro falso com reflexo leve** (env map, sem `transmission`) |
| 4. Velocidade de cena | **meio-termo, ~45 m/s, ajustável** |
| 5. Curva | **à direita** |
| 6. Show car | **girando devagar** |
| 7. Reduced motion | carros **parados no grid/pit** |
| 8. Fatiamento | **4a / 4b / 4c com gate** em cada uma |

Ideia do Davi para a 4c (planejar, não implementar antes): com o movimento desligado, os carros ficam estacionados no
pit; ao ligar o modo Cinemático, **saem do pit e voltam à corrida**; ao desligar, voltam ao pit. Regra: a volta ao pit
quando o usuário **desliga** o movimento **não pode ser animada** (corte direto ou fade curto); só a saída do pit, com
o movimento ligado, anima.

Fase 3 no mesmo dia: rota de IA 3D da A5 aprovada (FLUX.2 klein 4B → rembg/BiRefNet → TripoSG sem `diso` → Blender,
no Windows); D8 com **uma IA só** (TripoSG) por enquanto.

## 9. Errata (implementação da 4a, 23/10/2026)

O §2 conferiu se a pista cai **dentro do quadro**, mas não a **oclusão pela laje**. Com H = 4,5 m, a borda do piso
esconde o chão mais perto que z ≈ −47 a partir do hero (desktop e mobile), z ≈ −25 de telemetria/pit wall no desktop e
z ≈ −31 no mobile. A reta em z −26 do §3 **não é vista do hero**. Opções e medidas: `docs\production\MISSAO-16.md`,
seção "Fase 4a". A posição da reta precisa de nova decisão antes da 4b.
