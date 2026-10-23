# M16 · Revisão independente da Fase 1

Escopo: `083fdc0` (anisotropia nas superfícies de texto) e `04bda80` (DPR 1,5 no `low` + `dprGovernor.ts`).
Revisão de leitura + uma simulação numérica do governador (script fora do Git, descrito no achado 1).
**Nenhum código foi alterado.** Linhas citadas no estado do commit `04bda80`.

Resumo: **nada de gravidade alta**. Um problema real de critério no governador (achado 1, média), um teste de
navegador fraco demais para pegar regressão da D11 (achado 2, média) e um limite de projeto que convém registrar
(achado 3, média). O resto é baixo ou só registro. A anisotropia (`083fdc0`) está correta.

## Achados

### 1. Com o teto de 30 fps do ambiente, a média de intervalo não mede o custo do quadro — **média**
`src\scene\garageRenderer.ts:174` amostra `nowMs − lastTimestamp` em **todo** RAF, inclusive nos que o teto de 30 fps
pula sem renderizar (o `return` antecipado do teto vem depois da amostra). Quadros pulados custam um vsync e
"diluem" a média. Simulação com o próprio `createDprGovernor` (render de T ms + quadros pulados de 1 vsync, 20 s):

| vsync | custo do quadro renderizado | fps renderizado | média (EWMA) | estado |
| --- | --- | --- | --- | --- |
| 16,7 ms | 25 ms | 24,0 | 20,6 ms | `full` |
| 16,7 ms | **30 ms** | **21,4** | 23,7 ms | **`full`** (não cai) |
| 16,7 ms | **35 ms** | **28,6** | 35,0 ms | **`degraded`** (cai) |
| 8,3 ms (120 Hz) | 30 ms | 26,1 | 19,7 ms | `full` |

O critério **não é monotônico**: o caso pior (21 fps) fica em 1,5 e o melhor (28,6 fps) cai para 1. O comentário
"< 40 fps" em `src\scene\dprGovernor.ts:5` só vale quando o loop renderiza todo RAF (transições de câmera).
Script e saída (fora do Git):
`C:\Users\davir\OneDrive\Documentos\GitHub\portfolio\.agent-grid\screenshots\mission-16\revisao-fase1\dilution.mjs` / `.txt`.
**Sugestão:** amostrar só nos quadros renderizados, usando `nowMs − lastRenderedAt` (intervalo entre renders), e
comparar com a cadência esperada: no ambiente (30 fps) cair se a média passar de ~40 ms (< 25 fps) por 2 s; nas
transições (cadência nativa) manter 25 ms. Teste novo simulando o teto, como na tabela.

### 2. O smoke aceita DPR 1 no mobile, então não pega regressão da D11 — **média**
`tests\browser-smoke.mjs:365-366`: `assert.ok(lowDpr === 1.5 || lowDpr === 1)`. Se alguém voltar o `low` para 1 fixo,
ou o governador cair sempre, o smoke continua verde. Na máquina do smoke (RTX 3060, 3x emulado) o valor é sempre 1,5.
**Sugestão:** exigir `1.5` quando `data-scene-dpr-state === 'full'` e aceitar 1 só com o estado `degraded`/`latched`,
registrando o estado no relatório do smoke.

### 3. O governador não distingue CPU de GPU — **média (limite de projeto)**
O sinal (intervalo de RAF) sobe também com trabalho de CPU: React, áudio e a projeção dos rótulos, que chama
`getBoundingClientRect` por quadro renderizado (`garageRenderer.ts:242-243`, anterior à Fase 1). Baixar o DPR só ajuda
quando o gargalo é preenchimento de pixels. A evidência de degradação do relatório (CPU 30x no CDP) era **gargalo de
CPU**: prova que o mecanismo dispara, **não** que ajuda. Não medi o fps antes × depois da queda.
**Sugestão:** aceitar como está (o custo de cair é só nitidez, e não oscila) e corrigir o texto do `MISSAO-16.md`; ou
testar com carga de GPU (ex.: DPR 3 forçado / shader pesado) e medir fps antes e depois da queda. `EXT_disjoint_timer_query`
daria o tempo de GPU, mas falta em boa parte dos celulares.

### 4. `data-scene-dpr-state` fica velho quando a troca não muda o DPR — **baixa**
`dprGovernor.ts:54` devolve `false` se `devicePixelRatio ≤ 1`; aí o `resize()` não roda e o dataset
(`garageRenderer.ts:164`) não é atualizado, embora o estado interno tenha mudado (e conte para o `latched`).
Só diagnóstico, sem efeito visual. **Sugestão:** atualizar `sceneDprState` direto após `sample()`, ou não contar
degradação quando o teto já é 1.

### 5. Teste 7 de `dpr-governor.test.mjs` verifica texto, não comportamento — **baixa**
`tests\dpr-governor.test.mjs:54`: três regex sobre o código-fonte do renderer. Passa mesmo que a chamada vire código
morto, e quebra com uma reformatação inofensiva. É o único teste da ligação renderer ↔ governador.
**Sugestão:** extrair a regra de amostragem (achado 1) para uma função pura testável, ou cobrir pelo smoke lendo
`data-scene-dpr-state`.

### 6. Faltam casos de teste do governador — **baixa**
Sem teste para: troca `low → balanced → low` com estado `degraded` (hoje o estado persiste; parece intencional, mas
não está escrito); `devicePixelRatio` fracionário (1,25); restauração com vsync de 120 Hz.
**Sugestão:** um teste por caso, documentando a intenção.

### 7. Margem de restauração apertada em 60 Hz — **baixa (registro)**
Voltar para 1,5 exige média < 18 ms por 10 s (`dprPolicy.restoreBelowMs`); em 60 Hz o mínimo é 16,7 ms. Um quadro
perdido a cada ~15 já impede a volta. É conservador de propósito (evita oscilar), mas na prática a restauração quase
só acontece em telas ≥ 90 Hz. **Sugestão:** registrar no relatório; se o Davi quiser restauração mais fácil, usar
~20 ms (ainda abaixo do limiar de queda, 25 ms).

### 8. Interrupção por resize pode atrasar a queda no mobile — **baixa**
`resize()` chama `interrupt()` (`garageRenderer.ts:151`). Se o canvas mudar de tamanho com frequência (barra de
endereço do celular aparecendo/sumindo, teclado virtual), a janela de 2 s recomeça e a queda demora. Não reproduzi;
depende de o palco acompanhar a altura dinâmica da viewport. **Sugestão:** zerar só no resize que muda o DPR
(troca de qualidade), não em todo resize.

### 9. `textTextures` não é limpo no `dispose` — **baixa**
`src\scene\garage\resources.ts:167` limpa `textures`, mas não o `Set` `textTextures` (criado na linha 27): guarda
referências a texturas já liberadas enquanto o objeto viver. Não vaza GPU (o `dispose` das texturas roda pelo
conjunto `textures`). **Sugestão:** `textTextures.clear()` junto dos outros.

## Verificado e sem problema

- **Troca de aba / visibilidade:** aba oculta → `active()` falso → `interrupt()` (`garageRenderer.ts:410`); ao voltar,
  `resize()` também zera. Intervalos > 250 ms são descartados (`dprGovernor.ts:41`). OK.
- **Recruiter Mode (sem canvas):** `active()` exige `mode === 'immersive'`; `render` e `resize` saem cedo e o loop
  zera a média. Nenhum acesso ao canvas fora do modo imersivo vem do governador. OK.
- **Reduced motion:** sem ambiente nem passagens, o loop não roda contínuo e o governador não amostra: o DPR fica
  1,5 e só se paga por quadro sob demanda. Aceitável (custo não é contínuo).
- **Listeners:** o governador não registra nenhum; o `ResizeObserver` é desconectado no `dispose` (linha 99). OK.
- **Oscilação:** no máximo uma volta; a segunda queda trava em 1 (`dprGovernor.ts:47`). OK.
- **Custo do próprio governador:** algumas operações aritméticas por RAF e nenhuma alocação; o `devicePixelRatio`
  só é lido no `resize`. Desprezível.
- **Anisotropia (`083fdc0`):** aplicada antes da criação da garagem, então o primeiro upload já usa;
  `Math.max(1, …)` cobre a falta da extensão; só as texturas de texto (`sign`, telas de programa, atlas pessoal)
  recebem; os mapas de material ficam em 1 (coberto por `text-sharpness.test.mjs:21`). O `CanvasTexture` em
  `Garage.ts:74` (manchas do piso) e as do `floorSurface.ts` não são texto: corretamente de fora.
- **Smoke:** passou depois da mudança (exit 0, console e rede sem erros), com a ressalva do achado 2.

## Prioridade sugerida
1 (critério de amostragem) → 2 (smoke) → 3 (corrigir o texto da evidência) → o resto quando tocar no arquivo.

Aprovação do Davi: pendente.
