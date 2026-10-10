# Rescue UI — P0

Base integrada: a1b97c5. Diagnóstico antes de editar: Chrome instalado, sem emulação de preferência de movimento; 61 combinações (1440/390/320, PT/EN, imersivo/Recruiter, cinco zonas e projeto longo).

**Letras empilhadas não reproduzidas.** Nenhuma correção fictícia de layout foi aplicada. Em 320 px, estação 296 px e título 262 px; writing-mode horizontal-tb, transform none, zoom 1, quebras regulares. Evidências e computed styles: `C:/Users/davir/OneDrive/Documentos/GitHub/portfolio/.agent-grid/screenshots/drf-rescue-ui/before-computed.json`, capturas `before-*.png` no mesmo diretório. Se reaparecer em label Canvas, reprodução/objeto deve seguir ao Lead/3D, fora desta área.

Restrição ambiental reproduzida: matchMedia reduce=true nativo; ambiente inicialmente habilitado no estado, mas reduzido efetivo. UI agora diferencia restrição de desativação e oferece três escolhas explícitas da sessão, mantendo sistema como padrão; cinematic requer intenção e não liga áudio. Escape fecha o controle e restaura foco sem rolagem.

Currículo: link condicional ao cvUrl canônico integrado pelo Lead; versão pública atual, não o rascunho DEV. Nenhum PDF/asset ou catálogo alterado pela UI. Revisão local DEV permanece separada e ausente da produção.

## Validação do marco P0

Lint e build PASS; 21 testes de fundação/trackside PASS (15 + 6). Teste próprio rescue-ui.test.mjs: PASS, 22 verificações dirigidas em Chrome instalado headless, viewport emulado 1440×900/390×844/320×844, preferência nativa sem emulatedMedia. Inclui padrão system, cinematic/reduced efetivos, áudio permanece off, Escape/foco, larguras, rótulo inglês, PDF público e leitura HTML com WebGL bloqueado por fixture de navegador. Sem erros de console/rede observados. O primeiro teste dirigido precisou corrigir seu foco (DOM.click não foca um radio); nenhum defeito de Escape da UI foi mascarado.

Capturas finais: after-motion-system-1440/390/320.png, after-motion-en-320.png, after-recruiter-cv-1440/390/320.png, after-fallback-strategy-320.png no diretório externo já indicado. Inspeção visual da captura 320 confirmou opções legíveis, sem coluna de letras; controle fechado ocupa uma linha adicional compacta. Teste físico mobile, performance, filme cinematográfico e oclusão Canvas não medidos. Chunk 3D existente 604,69 kB conserva aviso de build, fora desta área. History geral não repetido neste lote. P1 visual adicional permanece separado.

Reexecutar smoke dirigido com preview compilado em 5175: node --test tests/rescue-ui.test.mjs; variáveis opcionais DRF_RESCUE_URL, CHROME_PATH, DRF_RESCUE_CAPTURE_DIR. Capturas padrão ficam no Temp, nunca em src.
