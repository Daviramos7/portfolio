# Reprodução offline

Use somente `.agent-grid/labs/night-shift-audit/guess-the-pokemon/`, porta5286 livre. Obtenha arquivos textuais listados no manifest da revisão `14d501c2a87fa0eaad5030614a04c0cc4bcaaed4` e confira hashes; não copie imagens oficiais. Fonte pública: https://github.com/Daviramos7/Guess-the-Pokemon .

Em `LAB/tooling`, use package.json/package-lock.json deste harness e `npm ci --ignore-scripts --cache <cache-do-lab>`; instalação isolada, não package do projeto. Node22 e Chrome local compatível já disponível são necessários. `browser.mjs` usa `C:/Program Files/Google/Chrome/Application/chrome.exe`; ajustar exclusivamente caminho local se necessário. Trabalhando no LAB, execute `node browser.mjs <diretorio-evidencias-lab>`.

O harness serve HTML/CSS/JS originais, fixtures locais e SVGs sintéticos; intercepta PokéAPI e bloqueia todos os demais hosts do navegador. Fixa Math.random=0; não mede distribuição. Encerramento de browser/servidor em finally. Exit1 indica quatro checks FAIL desta revisão. Log de recursos inclui falhas instrumentais de CDN e 503 intencionais. PNGs não representam arte original. Testes complementares, não suite do autor. RSS do run registrado foi amostrado externamente via psutil a ~100ms no processo Node e descendentes próprios; executar só Node não recria essa instrumentação externa. Nenhum benchmark de API externa foi feito.
