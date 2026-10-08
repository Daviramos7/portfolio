# AGENTS.md

## Projeto

Este repositório contém duas versões do portfólio.

### V1 / Legacy
Arquivos na raiz:
- index.html
- css/
- js/
- img/
- curriculo/

A V1 é um projeto estático em HTML, CSS e JavaScript puro.
Não modificar esses arquivos sem necessidade explícita.

### V2 / DRF Engineering
Diretório:
- drf-v2/

A V2 é o novo portfólio principal, inspirado em engenharia de motorsport/F1.

Stack autorizada:
- React
- TypeScript
- Vite
- npm
- Tailwind CSS
- shadcn/ui
- Three.js
- React Three Fiber
- Drei
- GSAP
- Framer Motion

Bibliotecas e referências de UI permitidas:
- Origin UI
- Skiper UI
- Cult UI

Priorize componentes gratuitos/open-source.
Não copie identidades visuais prontas; adapte tudo ao design system DRF Engineering.

## Regras gerais

1. Trabalhar na branch feat/drf-engineering.
2. Não alterar a V1 sem necessidade explícita.
3. Nunca trabalhar diretamente na main.
4. Antes de adicionar dependências, verificar se já existe solução equivalente.
5. Evitar dependências pesadas desnecessárias.
6. Manter suporte a prefers-reduced-motion.
7. Priorizar performance mobile e desktop.
8. O conteúdo deve continuar acessível mesmo se WebGL falhar.
9. Não usar porcentagens arbitrárias para representar domínio técnico.
10. Toda interação deve:
   - comunicar algo sobre Davi;
   - melhorar a navegação; ou
   - reforçar a metáfora de engenharia/motorsport.
   Caso contrário, remover.

## Validação da V2

Após mudanças relevantes:

- npm run lint
- npm run build
- testar console do navegador
- testar desktop e mobile
- testar navegação sem WebGL quando aplicável
- informar arquivos alterados
- resumir mudanças realizadas