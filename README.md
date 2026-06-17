# Portfólio — Davi Ramos Ferreira

> Engenharia de Dados · Desenvolvimento Full Stack · Python · FastAPI · Angular · PySpark

[![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge\&logo=linkedin\&logoColor=white)](https://www.linkedin.com/in/davi-ramos-ferreira-325354294/)
[![GitHub](https://img.shields.io/badge/GitHub-181717?style=for-the-badge\&logo=github\&logoColor=white)](https://github.com/Daviramos7)
[![Portfólio](https://img.shields.io/badge/Portfólio-000000?style=for-the-badge\&logo=About.me\&logoColor=white)](https://portfolio-eight-ivory-17.vercel.app/)

---

## Sobre

Sou estudante de Ciência da Computação na Uninassau, com conclusão prevista para 2027, e atuo com Engenharia de Dados e Desenvolvimento Full Stack.

Atualmente sou estagiário na SEFAZ de Jaboatão dos Guararapes, onde participo do desenvolvimento de uma plataforma de gestão e análise de receitas municipais, utilizando:

* Angular no frontend;
* Python e FastAPI no backend;
* Pandas e processos ETL para ingestão e tratamento de dados;
* APIs REST para integração entre as camadas;
* arquivos Parquet para armazenamento e processamento analítico.

Tenho interesse em construir pipelines eficientes, automatizar processos e transformar dados brutos em informações úteis para tomada de decisão.

---

## Stack principal

### Engenharia de Dados

`Python` `Pandas` `PySpark` `ETL` `SQL` `PostgreSQL` `Selenium` `Watchdog`

### Backend

`FastAPI` `Uvicorn` `API REST` `Swagger`

### Frontend

`Angular` `TypeScript` `HTML` `CSS` `JavaScript`

### Ferramentas

`Git` `GitHub` `Docker` `Figma` `Power BI` `Matplotlib`

---

## Projetos em destaque

### Plataforma de Análise de Receitas Municipais

Estudo de caso sanitizado de uma plataforma profissional para ingestão, tratamento e análise de receitas municipais.

O projeto apresenta dashboards, filtros, comparações temporais e automação do processamento de dados.

`Angular` `FastAPI` `Python` `Pandas` `ETL`

> O código, os dados e o ambiente de produção não são públicos por questões de confidencialidade. A imagem apresentada no portfólio utiliza um protótipo do Figma e não expõe informações internas.

---

### [Auditoria de Despesas Públicas com PySpark](https://github.com/Daviramos7/analise-despesas-recife-pyspark)

Pipeline ETL com PySpark para ingestão, tratamento e análise de **127.119 registros** de despesas públicas do Recife em 2023.

A análise identificou mais de **R$ 7,8 bilhões em valores liquidados** e gera automaticamente:

* indicadores financeiros;
* ranking dos órgãos por valor liquidado;
* validações de qualidade;
* relatório em JSON;
* resultado agregado em CSV;
* visualização em PNG;
* pacote ZIP com os arquivos produzidos.

`Python` `PySpark` `Spark SQL` `Pandas` `Matplotlib` `ETL`

> O tempo de processamento varia conforme o ambiente utilizado e, por isso, não é apresentado como uma métrica fixa.

---

### [Stock Data Pipeline](https://github.com/Daviramos7/stock_data_pipeline)

Pipeline ETL para coleta, transformação e visualização de dados do mercado financeiro.

O projeto integra dados externos, realiza o processamento das informações e disponibiliza um dashboard interativo para análise de ativos.

[Ver demonstração](https://stockdatapipeline-jnuagfhrnt8jts3ymssrsp.streamlit.app/)

`Python` `Pandas` `ETL` `Streamlit`

---

### [Análise de Dados — SPFC](https://github.com/Daviramos7/Projeto-SPFC)

Projeto de coleta e análise de estatísticas de jogadores do São Paulo FC.

Utiliza automação com Selenium, tratamento com Pandas e geração de gráficos para apresentar os resultados processados.

`Python` `Pandas` `Selenium` `Matplotlib`

---

### [Task Manager](https://github.com/Daviramos7/task_manager)

Sistema de gerenciamento de tarefas desenvolvido com Python e SQLite.

O projeto permite organizar e acompanhar atividades, aplicando persistência de dados e lógica de gerenciamento.

`Python` `SQLite3`

---

### [Guess the Pokémon](https://guess-the-pokemon-coral.vercel.app/)

Jogo interativo no qual o usuário precisa descobrir um Pokémon a partir de dicas e tentativas limitadas.

O projeto utiliza a PokéAPI, sistema de autocomplete, manipulação de estado e interface responsiva.

`HTML` `CSS` `JavaScript` `PokéAPI`

---

## Funcionalidades do portfólio

* layout responsivo para celular, tablet e desktop;
* suporte a português e inglês;
* projetos renderizados dinamicamente com JavaScript;
* cards gerados a partir de uma única estrutura de dados;
* formulário de contato integrado ao EmailJS;
* menu mobile acessível;
* navegação por teclado;
* estados de foco visíveis;
* animações leves com `IntersectionObserver`;
* suporte a `prefers-reduced-motion`;
* metadados para SEO e compartilhamento;
* carregamento otimizado de imagens;
* fallback para imagens de projetos indisponíveis.

---

## Arquitetura

O portfólio é um projeto estático desenvolvido com HTML, CSS e JavaScript puro.

Não utiliza:

* npm;
* Node.js;
* frameworks;
* bibliotecas de interface;
* ferramentas de build;
* templates do Canva para os cards.

Estrutura principal:

```text
portfolio/
├── css/
│   └── style.css
├── curriculo/
│   └── Davi Ramos 2026.pdf
├── img/
│   ├── municipal-revenue-platform.png
│   ├── public-expenditure-big-data.png
│   ├── profile-optimized.jpg
│   └── favicon.png
├── js/
│   ├── projects.js
│   └── script.js
├── AGENTS.md
├── index.html
└── README.md
```

---

## Como executar localmente

Clone o repositório:

```bash
git clone https://github.com/Daviramos7/portfolio.git
cd portfolio
```

Abra a pasta no Visual Studio Code:

```bash
code .
```

Inicie o projeto utilizando a extensão Live Server:

```text
Clique em “Go Live” na barra inferior do VS Code.
```

Também é possível utilizar um servidor local com Python:

```bash
python -m http.server 5500
```

Depois acesse:

```text
http://localhost:5500
```

Não é necessário executar:

```text
npm install
npm run dev
npm run build
```

O projeto não utiliza npm e não possui `package.json`.

---

## Como adicionar um projeto

### 1. Prepare uma screenshot

Salve uma captura limpa do projeto dentro da pasta:

```text
img/
```

Prefira:

* proporção 16:9;
* resolução de 1280×720 ou 1600×900;
* arquivo PNG, JPG ou WebP;
* captura da interface real;
* nenhum título incorporado na imagem;
* nenhuma moldura ou arte criada no Canva.

Exemplo:

```text
img/meu-projeto.png
```

### 2. Abra o arquivo de projetos

Edite:

```text
js/projects.js
```

### 3. Adicione um objeto ao array `projects`

```javascript
{
    id: "meu-projeto",

    title: {
        en: "Project title",
        pt: "Título do projeto"
    },

    description: {
        en: "Short project description.",
        pt: "Descrição curta do projeto."
    },

    image: "img/meu-projeto.png",

    alt: {
        en: "Accessible description of the project screenshot",
        pt: "Descrição acessível da captura do projeto"
    },

    technologies: [
        "Python",
        "FastAPI",
        "PostgreSQL"
    ],

    repositoryUrl: "https://github.com/usuario/repositorio",

    demoUrl: "https://projeto-publicado.com",

    featured: false
}
```

A ordem dos objetos no array determina a ordem dos cards no site.

### Campos opcionais

Caso o projeto não tenha repositório público:

```javascript
repositoryUrl: null
```

Caso o projeto não tenha demonstração:

```javascript
demoUrl: null
```

Caso seja um projeto em destaque:

```javascript
featured: true
```

Use destaque somente nos projetos mais relevantes.

### Renderização automática

O site cria automaticamente:

* imagem;
* título;
* descrição;
* tecnologias;
* selo de destaque;
* botão da demonstração;
* botão do repositório;
* textos em português e inglês;
* atributos de acessibilidade.

Não é necessário editar:

```text
index.html
css/style.css
js/script.js
```

para adicionar um novo projeto.

---

## Validação

Depois de adicionar ou alterar um projeto:

1. abra o site pelo Live Server;
2. atualize com `Ctrl + F5`;
3. confira português e inglês;
4. teste os links;
5. confira as imagens;
6. teste o layout em celular e desktop;
7. abra o console do navegador;
8. confirme que não existem erros JavaScript.

---

## Publicação

O portfólio está publicado em:

[portfolio-eight-ivory-17.vercel.app](https://portfolio-eight-ivory-17.vercel.app/)

As alterações enviadas para a branch de produção são publicadas pela Vercel após o merge.

---

## Licença

Copyright © 2026 Davi Ramos Ferreira.

Todos os direitos reservados.

---

Desenvolvido por [Davi Ramos Ferreira](https://github.com/Daviramos7)
