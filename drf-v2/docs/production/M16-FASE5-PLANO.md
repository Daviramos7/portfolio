# M16 — Fase 5: plano do DRF-01 padrão 2026

Data: 16/11/2026 · Missão de fila 13 (`m16-13-drf01-conceito`) · Base: `MISSAO-16-BRIEFING.md` (Fase 5),
`M16-REFERENCIAS.md` (§1.1–1.4, decisões D4, D5, D6, D9, D10, D12), `M16-FASE4-DESENHO.md` (§1.3 show car).

Este documento é só plano. **Nada entrou na cena**; imagens e malhas ficam fora do Git, em
`C:\Users\davir\drf-ia3d\drf01\`.

## 1. O que foi gerado (passos 1–3)

| Etapa | Saída | Observação |
|---|---|---|
| FLUX.2 klein, prompt P3 | 8 seeds 3/4 frontal + 4 laterais + 4 topo (`imagens.json`, folhas em `drf01-34\`, `drf01-lateral\`, `drf01-topo\`) | Sem logo, sem pintura de equipe real. |
| Escolha | s77 e s1234 (`escolhas.json`, motivos registrados) | s2026 descartada por microtexto falso na tampa do motor. |
| TripoSG | `drf01-34-s77-bruta.glb` (1.215.668 faces, 77,1 s) e `drf01-34-s1234-bruta.glb` (1.244.482 faces, 75,8 s) | Registro em `malhas.json`. Malha bruta, sem limpeza. |
| Blender | Prévia 2×2 em argila e prancha de medidas de cada malha (`previas\`) | Script `scripts\drf01_medidas.py`. |

### Medidas (malha escalada para 5,6 m de comprimento)

| Malha | Largura total | Entre-eixos | Roda Ø diant./tras. | Altura |
|---|---|---|---|---|
| Referência §1.1 | 1,90 m | 3,40 m | 0,71 m | — |
| s77 | 3,26 m | 3,27 m | 1,04 / 1,01 m | 1,56 m |
| s1234 | 3,02 m | 3,15 m | 1,05 / 1,02 m | 1,67 m |

Metodologia: comprimento total (asa a asa) fixado em 5,6 m; eixos achados pelo pico de contato dos pneus no chão;
largura é a total da malha (asa dianteira e pneus incluídos). Se a malha real não mede 5,6 m de ponta a ponta, todas
as outras medidas escalam junto.

## 2. O que a IA acertou (e vale aproveitar)
- **Entre-eixos coerente** (92–96% da referência): a distribuição longitudinal dos volumes está no lugar.
- **Bico baixo e fino** nas duas escolhidas, alinhado com a D5 "limpo/engenharia".
- **Sidepod com entrada definida** (s77) e **undercut visível** (s1234); tampa do motor descendo até a asa (s1234).
- Leitura geral de monoposto de rodas expostas: serve como **massa de referência** para modelar por cima.

## 3. O que a IA errou (e por isso não vai direto para o site)
- **Rodas ~47% maiores** que 0,71 m e **largura +59% a +71%**: é exatamente o "F1 de brinquedo" que o Davi reprovou.
- **Chassi alto** em todas as 8 imagens (1,56–1,67 m na escala usada; um F1 real fica perto de 0,95–1,0 m).
- **Nenhuma imagem tem halo**: volante saindo do cockpit (s1234 tem santantônio; s77 tem um arco que lembra halo,
  mas mole e sem os três pontos de fixação).
- Asas, endplates, suspensão e assoalho saem como superfícies grossas/fundidas, como o briefing já previa.
- 1,2 M faces cada, sem simetria, sem UV útil.

## 4. Proposta de construção
**Recomendação: modelagem à mão no Blender com a malha da IA só como referência de volume**, não limpeza da malha da
IA. Motivo: os erros de proporção são globais (rodas, altura, largura), e consertar escala por região numa malha
fundida de 1,2 M faces dá mais trabalho e pior topologia do que redesenhar por cima com simetria.

1. **Carroceria (monocoque, sidepods, tampa do motor):** blocagem low-poly espelhada no eixo X, usando a s1234
   (undercut) e a s77 (entrada do sidepod) como fundo, já na escala da §1.1 (1 unidade = 1 m).
2. **Modelado à mão, do zero:** asa dianteira de 3 perfis com flaps em dois estágios; asa traseira de 3 perfis com
   flap central separado, sem beam wing; **halo** com três fixações; suspensão push/pull em tubos; **rodas Ø 0,71 m**
   com pneu e aro separados; espelhos com luz de ERS; câmera T; placas de esteira na entrada do sidepod.
3. **Divisão em grupos nomeados** para animação: `aero_front_flap`, `aero_rear_flap` (eixos de giro definidos no
   Blender), `wheel_*`, `body`, `halo`.
4. **Pintura D4 B "Tricolor de faixa":** preto fosco + faixa horizontal vermelha e branca do bico à asa traseira,
   sem escudo, sem logo real. "Patrocínio" só da própria DRF ("DRF Data", "REC/PE"), número 16. A faixa vai como
   textura pequena (ou grupos de material) para permitir as variações de cor dos carros de fundo.
5. **Exportação:** GLB pelo pipeline da skill `drf-blender-pipeline` (prancha 2×2, medição, fallback para o
   procedural atual se o GLB falhar), registro em `ASSETS.md` (origem, prompt, seeds, hashes).

## 5. Comportamento na cena
- **Encaixe:** mesmo lugar do DRF-01 atual (origem da sala, pedestal de 0,12 m, §1.3 da Fase 4). Câmera e
  trajetórias aprovadas **não mudam**; se o carro novo (mais baixo e estreito) mudar o enquadramento, isso vira
  pergunta ao Davi, não ajuste de câmera.
- **Aero ativa D6:** ao entrar na estação Telemetry, flaps de Z-mode para X-mode em ≤ 400 ms (dois grupos girando,
  sem custo de draw call extra). Com reduced motion: troca direta de pose, sem animação.
- **Show car girando devagar:** ver pergunta 1 (o desenho da Fase 4 diz "sem rotação automática por padrão").
  Se aprovado: giro lento só no pedestal, pausa fora do hero e desligado com reduced motion.
- **Luz D10:** a luz em tempo real do show car continua a única dinâmica; a pintura nova precisa ser conferida com a
  luz assada da missão 14 quando ela existir.

## 6. Orçamentos (propostas, a medir depois de pronto)
| Versão | Triângulos | Uso |
|---|---|---|
| Show car (hero) | ≤ 60 mil (proposta) | Sala, close na Telemetry. Medir draw calls antes/depois no hero 1440. |
| Leve (carros de fundo) | 3–5 mil | Corrida ao fundo (4c), `InstancedMesh`, cor por instância, sem flaps animados. |

A versão leve sai da mesma blocagem (decimada + asas como planos simples), não de outra geração de IA.
A corrida com vários carros (4c) continua **fora** até o DRF-01 novo ser aprovado (decisões de 11/11).

## 7. Riscos
- Modelagem à mão é o trabalho mais longo da M16 até aqui; não dá para fechar numa rodada de fila.
- Halo e asas finas são onde o "brinquedo" aparece primeiro: precisam de prancha específica no gate.
- Crédito D9 ("Modelos 3D gerados com IA e finalizados no Blender") só se aplica se sobrar geometria da IA no GLB
  final; com modelagem por cima da referência, o texto deve dizer isso com honestidade.

## 8. Perguntas para o Davi
1. **Show car gira devagar ou fica parado?** O desenho aprovado da Fase 4 (§1.3) diz parado por padrão; a missão 13
   cita giro lento. Proposta: parado no hero, giro lento só fora dele, desligado em reduced motion.
2. **Modelar à mão por cima da referência** (recomendado) ou tentar limpar a malha da IA?
3. Base de volume: **s1234** (undercut) ou **s77** (mais baixa, entrada do sidepod)? Proposta: misturar as duas.
4. Orçamento do show car: ok ≤ 60 mil triângulos?
5. Número **16** e "patrocínios" DRF ("DRF Data", "REC/PE") na carroceria: ok?
6. Quer gerar mais seeds com prompt pedindo halo e chassi baixo antes de modelar, ou a referência atual basta?

Aprovação do Davi: pendente
