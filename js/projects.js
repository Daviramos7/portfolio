const projects = [
    {
        id: "municipal-revenue-platform",

        title: {
            pt: "Plataforma de Análise de Receitas Municipais",
            en: "Municipal Revenue Analytics Platform"
        },

        description: {
            pt: "Estudo de caso sanitizado de uma plataforma profissional para ingestão, tratamento e análise de receitas municipais, com dashboards, comparações temporais e automação de dados.",
            en: "A sanitized case study of a professional platform for municipal revenue ingestion, processing, and analysis, featuring dashboards, time-based comparisons, and data automation."
        },

        image: "img/municipal-revenue-platform.png",

        alt: {
            pt: "Protótipo no Figma do dashboard de análise de receitas municipais",
            en: "Figma prototype of the municipal revenue analytics dashboard"
        },

        technologies: [
            "Angular",
            "FastAPI",
            "Python",
            "Pandas",
            "ETL"
        ],

        repositoryUrl: null,

        demoUrl: null,

        featured: true
    },


    {
        id: "public-expenditure-big-data",

        title: {
            pt: "Auditoria de Despesas Públicas com PySpark",
            en: "Public Expenditure Audit with PySpark"
        },

        description: {
            pt: "Pipeline ETL com PySpark para ingestão, tratamento e análise de 127.119 registros de despesas públicas do Recife, totalizando mais de R$ 7,8 bilhões em valores liquidados.",
            en: "A PySpark ETL pipeline for ingesting, processing, and analyzing 127,119 public expenditure records from Recife, totaling more than R$ 7.8 billion in liquidated expenses."
        },

        image: "img/public-expenditure-big-data.png",

        alt: {
            pt: "Dashboard da auditoria de despesas públicas do Recife com indicadores e ranking dos órgãos por valor liquidado",
            en: "Recife public expenditure audit dashboard with indicators and ranking of agencies by liquidated amount"
        },

        technologies: [
            "Python",
            "PySpark",
            "Spark SQL",
            "Pandas",
            "ETL"
        ],

        repositoryUrl: "https://github.com/Daviramos7/analise-despesas-recife-pyspark",

        demoUrl: null,

        featured: true
    },
    
    {
        id: "stock-data-pipeline",
        title: {
            en: "Stock Data Pipeline",
            pt: "Pipeline de Dados de Ações"
        },
        description: {
            en: "A data pipeline project for stock analysis, using Python and ETL tools.",
            pt: "Um projeto de pipeline de dados para análise de ações, utilizando Python e ferramentas de ETL."
        },
        image: "img/Dashboard.png",
        alt: {
            en: "Stock Data Pipeline Project",
            pt: "Projeto Pipeline de Dados de Ações"
        },
        technologies: ["Python", "ETL", "Pandas"],
        repositoryUrl: "https://github.com/Daviramos7/stock_data_pipeline?tab=readme-ov-file",
        demoUrl: "https://stockdatapipeline-jnuaqfhrnt8jts3ymssrsp.streamlit.app/",
        featured: false
    },
    {
        id: "spfc-analysis",
        title: {
            en: "Data Analysis - SPFC",
            pt: "Análise de Dados - SPFC"
        },
        description: {
            en: "Data collection and analysis of São Paulo FC players using Python, Selenium, and Pandas. Features an interactive menu and charts.",
            pt: "Coleta e análise de dados de jogadores do São Paulo FC com Python, Selenium e Pandas. Apresenta um menu interativo e gráficos."
        },
        image: "img/spfc-analysis.png",
        alt: {
            en: "SPFC Analysis Project",
            pt: "Projeto Análise de Dados - SPFC"
        },
        technologies: ["Python", "Selenium", "Pandas", "Matplotlib"],
        repositoryUrl: "https://github.com/Daviramos7/Projeto-SPFC",
        demoUrl: "",
        featured: false
    },
    {
        id: "task-manager",
        title: {
            en: "Task Manager",
            pt: "Gerenciador de Tarefas"
        },
        description: {
            en: "A task management system to organize and track activities.",
            pt: "Um sistema de gerenciamento de tarefas para organizar e acompanhar atividades."
        },
        image: "img/task_manager.png",
        alt: {
            en: "Task Manager Project",
            pt: "Projeto Gerenciador de Tarefas"
        },
        technologies: ["Python", "SQLite3"],
        repositoryUrl: "https://github.com/Daviramos7/task_manager",
        demoUrl: "",
        featured: false
    },
    {
        id: "guess-the-pokemon",
        title: {
            en: "Guess the Pokémon",
            pt: "Adivinhe o Pokémon"
        },
        description: {
            en: "A game where the player guesses the Pokémon, built with HTML, CSS, and JavaScript.",
            pt: "Um jogo onde o jogador adivinha o Pokémon, construído com HTML, CSS e JavaScript."
        },
        image: "img/Who are a Pokémon.png",
        alt: {
            en: "Guess the Pokémon Project",
            pt: "Projeto Adivinhe o Pokémon"
        },
        technologies: ["HTML", "CSS", "JavaScript"],
        repositoryUrl: "https://github.com/Daviramos7/Guess-the-Pokemon",
        demoUrl: "https://guess-the-pokemon-coral.vercel.app/",
        featured: false
    }
];

window.projects = projects;
