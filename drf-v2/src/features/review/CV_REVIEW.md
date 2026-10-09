# Revisão local — currículo rascunho

O currículo não foi aprovado. Nenhum arquivo público ou alteração de `cvUrl` faz parte deste lote.

O Lead fornecerá o artefato de revisão em um diretório local separado, fora de `public/` e do código versionado. A revisão inicial pode usar o visualizador local de PDF, sem publicar o arquivo.

Em desenvolvimento, abrir Recruiter Mode com `cv-review=1` na query e usar **Revisar rascunho local**. A entrada é condicionada a `import.meta.env.DEV`; produção não carrega o componente. O proprietário escolhe um PDF local, com aviso permanente **RASCUNHO / DRAFT — não aprovado**, prévia e download local. O arquivo não é pré-carregado nem enviado. A URL temporária é revogada na troca do arquivo e ao sair do Recruiter. Não inserir caminhos no catálogo, em `public/` ou no bundle.

O slider usa `audioVolume` e `setAudioVolume` do Lead, entre 0 e 1, com valor inicial de 0,25. Ajustar volume não ativa áudio nem persiste consentimento para áudio ligado. O ganho audível depende do setter da cena, fora da área da UI.
