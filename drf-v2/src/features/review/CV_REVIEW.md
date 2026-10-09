# Preparação local — currículo rascunho

O currículo não foi aprovado. Nenhum arquivo, link de download ou alteração de `cvUrl` faz parte deste lote.

O Lead fornecerá o artefato de revisão em um diretório local separado, fora de `public/` e do código versionado. A revisão inicial pode usar o visualizador local de PDF, sem publicar o arquivo.

Se houver necessidade de revisão dentro da UI, preparar uma entrada optativa exclusivamente sob `import.meta.env.DEV`, com sinalizador explícito de revisão e aviso permanente **RASCUNHO / DRAFT — não aprovado**. Selecionar o arquivo local por intenção; não inserir caminho no catálogo, URL pública ou bundle de produção. Esse mecanismo depende do artefato e fica para aprovação posterior.

Pendência de áudio: este marco usa a base `a6fa06a`, com ativação/desativação e movimento ambiente. O Lead informou uma extensão posterior com `audioVolume` inicial de 0,25, `setAudioVolume` limitado a 0–1 e setter opcional da cena. A adoção dessa extensão e do slider acessível será um follow-up curto. Ajustar volume não deve ativar áudio nem persistir consentimento para áudio ligado.
