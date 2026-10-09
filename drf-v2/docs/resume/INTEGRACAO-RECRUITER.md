# Integração do currículo após aprovação

Preparação da Missão07; nenhuma integração implementada ou publicação autorizada. Rascunhos PDF/DOCX ficam em `.agent-grid/artifacts/resume/mission07/`, fora dos assets públicos e sem substituir `curriculo/Davi Ramos 2026.pdf` daV1.

Estado atual verificado: `profile.cvUrl:null` em `src/content/portfolio.ts`; contrato aceita `string|null`; `validate.ts` aceita HTTPS ou caminho local iniciado por`/` (não`//`). `src/features/ZoneContent.tsx` renderiza o link apenas comcvUrl no DriverProfile, usado também no RecruiterMode; rótulosPT/EN em`uiLabels.ts`. Não é necessário alterarSceneRoot ou contratos.

Após aprovação explícita do proprietário:

1. Confirmar texto, contatos, período/cargo/formação, contribuições e visual doPDF. Aprovação automática de testes não substitui esta revisão.
2. Lead copiar somente oPDF aprovado para `drf-v2/public/cv/Davi_Ramos_Ferreira_CV_PT.pdf`. DOCX/fonte/rascunhos/questões permanecem privados; V1 preservada.
3. Lead atualizar`profile.cvUrl` para `/cv/Davi_Ramos_Ferreira_CV_PT.pdf` no basepath atual`/`. Se hospedagem usar subdiretório, resolver o prefixo público adequado aoBASE_URL antes de definir o caminho; não presumirURL de deploy.
4. Frontend adicionar comportamento de download ao link existente (`download="Davi_Ramos_Ferreira_CV_PT.pdf"`) e rótulosPT/EN apropriados, indicando documento emportuguês. Manter foco/teclado/sem dependênciaWebGL. Evitar modificarApp/estado/câmera para esta ação.
5. QA local: lint/build/fundação e smoke pertinente; URL200/content-typePDF, extração de texto, link/filename emPT/EN, teclado/mobile, fallbackWebGL e retorno contextual preservado. Confirmar ausência dePDFprivado/rascunho nosassets públicos.

Entregar diff revisável; commit/publicação/deploy somente no escopo autorizado posteriormente. Se revisão do proprietário exigir mudanças, atualizar os drafts e repetir QA visual antes de substituir oPDF aprovado.
