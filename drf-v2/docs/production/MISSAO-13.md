# Missão 13 — Visual Rescue

Base `f8f90a7`, `feat/drf-engineering` inicialmente limpa; capacidade live 85%.
A avaliação do proprietário prevalece: áudio/tipografia/stacks parciais,
passagem externa/easter eggs ruins, câmera Cinemático boa e preservada.

## Diagnóstico antes da implementação

Workers existentes 3D/UI reutilizados, árvores limpas atualizadas por FF;
Analyst não ativado. Pesquisa untracked preservada integralmente. Main
`c1bb276a7a8d354e19e39a19ed1f5166a645f19e`, V1 e currículo público intocados.
Baseline integrado: lint/build e 52 testes core PASS; aviso de chunk mantido.

Diagnósticos `a12c70e`/`647e0aa` revisados com PNGs atuais em
`.agent-grid/screenshots/mission-13/{scene-before,ui-before}/`.
Lead inspecionou passagem desktop, projeto Atleta em 320, cinco elementos
nas poses reais e leitura/Recruiter mobile. Carro com corpo estreito/rodas
dominantes/asas retangulares; janela inteira breve. Controle com corpo plano
e suporte frontal invasivo; inscrições pequenas. Stack existe, mas case a
coloca abaixo da primeira dobra e HUD compete com a cena. Não é bug de câmera.

Blender 5.2/exportador GLB já instalados, verificados sem instalar/configurar
o sistema. Autorizada modelagem original nova com orçamento limitado; UI
antecipa stack e reduz chrome redundante, mantendo Barlow/Geist e conteúdo.
Detalhes de causa/metodologia nas notas SCENE/UI, sem substituir evidências.

Áudio existente opt-in/volume/mute preservado; gravação de carro de rua,
não motor de competição. Sinal RMS anterior não equivale a escuta humana.
Não substituir por outra gravação sem procedência e melhoria demonstrável.
Capturas Chrome headless com WebGL real; mobile emulado, não telefone físico.
Sem push/deploy/publicação de currículo ou alteração de projetos auditados.
