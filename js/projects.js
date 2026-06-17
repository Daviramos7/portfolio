const projects = [
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
        featured: true
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
