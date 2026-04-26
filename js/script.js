const menuHamburguer = document.querySelector('.menu-hamburguer');
menuHamburguer.addEventListener('click', () => {
    toggleMenu();
});

function toggleMenu() {
    const nav = document.querySelector('.nav-responsive');
    menuHamburguer.classList.toggle('change');

    if (menuHamburguer.classList.contains('change')) {
        nav.style.display = 'block';
    } else {
        nav.style.display = 'none';
    }
}

function sendMail() {
    let parms = {
        name : document.getElementById("name").value,
        email : document.getElementById("email").value, 
        subject : document.getElementById("subject").value,
        number : document.getElementById("number").value,
        message : document.getElementById ("message").value
    }

    emailjs.send("service_1r6yipm","template_g5tskxc",parms).then(alert("Email sent!!"))
}

const translations = {
    en: {
        navHome: "Home",
        navServices: "Services",
        navPortfolio: "Portfolio",
        navContact: "Contact",
        navAbout: "About",
        homeHello: "Hello, I'm",
        homeTitle: "Davi Ramos Ferreira",
        homeSubtitle: "<span>Data</span> Engineering & <span>Full Stack</span>",
        homeDescription: "I'm Davi Ramos Ferreira, a Computer Science student (Uninassau, 2027) focused on <strong>Data Engineering</strong> and Full Stack Development. Currently interning at SEFAZ Jaboatão dos Guararapes, where I build a fiscal management system from scratch — <strong>Python/FastAPI</strong> backend, <strong>Angular</strong> frontend, and <strong>ETL pipelines with Pandas</strong>.<br><br>Passionate about building efficient pipelines, automating processes, and turning raw data into decisions. Here you'll find real projects with concrete metrics. Always looking for new challenges in the data and tech world!",
        downloadCV: "Download CV",
        servicesTitle: "My <span>Services</span>",
        dataScienceTitle: "Data Engineering",
        dataScienceDesc: "Focused on building high-performance data pipelines and ETL processes. I use Python, Pandas, and PySpark to collect, clean, and process large volumes of data — including a pipeline that processed 127,119 public expense records in 10.25 seconds with zero memory shuffle.",
        dataEngTitle: "Full Stack Development",
        dataEngDesc: "Building real systems end-to-end. Currently developing a fiscal management system — Angular frontend designed in Figma, FastAPI backend with auto-documented REST endpoints via Swagger, and automated data monitoring with Watchdog.",
        programmingTitle: "Programming",
        programmingDesc: "I have experience in Python and Java programming, focusing on problem-solving, clean code, and efficient algorithms. I enjoy developing logic-driven applications, automating processes, and optimizing performance. From backend development to scripting and software solutions, I am always looking for innovative ways to improve and create scalable systems.",
        webDevTitle: "Web Development",
        webDevDesc: "I specialize in creating and optimizing websites with modern technologies like HTML, CSS, JavaScript, and responsive design. My focus is on building user-friendly, efficient, and visually appealing applications that provide a seamless experience across devices. Whether it's landing pages, websites, or projects, I am committed to delivering high-quality solutions tailored to your needs.",
        portfolioTitle: "Latest <span>Projects</span>",
        stockDataPipelineTitle: "Stock Data Pipeline",
        stockDataPipelineDesc: "A data pipeline project for stock analysis, using Python and ETL tools.",
        spfcAnalysisTitle: "Data Analysis - SPFC",
        spfcAnalysisDesc: "Data collection and analysis of São Paulo FC players using Python, Selenium, and Pandas. Features an interactive menu and charts.",
        taskManagerTitle: "Task Manager",
        taskManagerDesc: "A task management system to organize and track activities.",
        whoArePokemonTitle: "Guess the Pokémon",
        whoArePokemonDesc: "A game where the player guesses the Pokémon, built with HTML, CSS, and JavaScript.",
        contactTitle: "Contact <span>Me!</span>",
        formName: "Full Name",
        formEmail: "E-mail",
        formNumber: "Phone Number",
        formSubject: "Subject",
        formMessage: "Message",
        formSend: "Send Message",
        aboutTitle: "About Me",
        aboutSubtitle: "<span>Data</span> Engineering & <span>Full Stack</span>",
        aboutDescription: "I'm Davi Ramos Ferreira, a Computer Science student driven by the challenge of building systems that turn raw data into real decisions. My focus is <strong>Data Engineering</strong>, and I'm passionate about every layer of the data stack — from pipeline architecture to the final dashboard.<br><br>Currently interning at SEFAZ Jaboatão dos Guararapes, building a full fiscal management system using <strong>Angular, FastAPI, Python, and Pandas</strong>. My projects include ETL pipelines with PySpark, web scraping automation with Selenium, and REST APIs optimized for performance.<br><br>I'm a constant learner, always seeking challenges that push me forward in the world of data and technology.",
        footerText: "Copyright &copy; 2026 by &lt;/Davi Ramos Ferreira&gt;, All Rights Reserved",
    },
    pt: {
        navHome: "Início",
        navServices: "Serviços",
        navPortfolio: "Portfólio",
        navContact: "Contato",
        navAbout: "Sobre",
        homeHello: "Olá, eu sou",
        homeTitle: "Davi Ramos Ferreira",
        homeSubtitle: "Engenharia de <span>Dados</span> & <span>Full Stack</span>",
        homeDescription: "Sou Davi Ramos Ferreira, estudante de Ciências da Computação (Uninassau, 2027) com foco em <strong>Engenharia de Dados</strong> e Desenvolvimento Full Stack. Atualmente estagiário na SEFAZ de Jaboatão dos Guararapes, onde desenvolvo um sistema de gestão fiscal municipal do zero — backend em <strong>Python/FastAPI</strong>, frontend em <strong>Angular</strong> e pipeline <strong>ETL com Pandas</strong>.<br><br>Apaixonado por construir pipelines eficientes, automatizar processos e transformar dados brutos em decisões estratégicas. Aqui você encontra projetos reais com métricas concretas. Sempre em busca de novos desafios no universo de dados e tecnologia!",
        downloadCV: "Baixar CV",
        servicesTitle: "Meus <span>Serviços</span>",
        dataScienceTitle: "Engenharia de Dados",
        dataScienceDesc: "Foco na construção de pipelines de dados de alta performance e processos ETL. Utilizo Python, Pandas e PySpark para coletar, limpar e processar grandes volumes de dados — incluindo um pipeline que processou 127.119 registros de despesas públicas em 10,25 segundos com otimização total de memória.",
        dataEngTitle: "Desenvolvimento Full Stack",
        dataEngDesc: "Construção de sistemas reais do zero. Atualmente desenvolvendo um sistema de gestão fiscal — frontend em Angular com design no Figma, backend FastAPI com endpoints REST documentados via Swagger, e monitoramento automatizado de dados com Watchdog.",
        programmingTitle: "Programação",
        programmingDesc: "Tenho experiência em programação Python e Java, com foco na resolução de problemas, código limpo e algoritmos eficientes. Gosto de desenvolver aplicações orientadas pela lógica, automatizar processos e otimizar o desempenho. Do desenvolvimento de backend a scripts e soluções de software, estou sempre procurando maneiras inovadoras de melhorar e criar sistemas escaláveis. ",
        webDevTitle: "Desenvolvimento Web",
        webDevDesc: "Sou especialista na criação e otimização de sites com tecnologias modernas como HTML, CSS, JavaScript e design responsivo. Meu foco é construir aplicações fáceis de usar, eficientes e visualmente atraentes que proporcionem uma experiência perfeita em todos os dispositivos. Sejam landing pages, sites ou projetos, estou comprometido em entregar soluções de alta qualidade adaptadas às suas necessidades.",
        portfolioTitle: "Últimos <span>Projetos</span>",
        stockDataPipelineTitle: "Pipeline de Dados de Ações",
        stockDataPipelineDesc: "Um projeto de pipeline de dados para análise de ações, utilizando Python e ferramentas de ETL.",
        spfcAnalysisTitle: "Análise de Dados - SPFC",
        spfcAnalysisDesc: "Coleta e análise de dados de jogadores do São Paulo FC com Python, Selenium e Pandas. Apresenta um menu interativo e gráficos.",
        taskManagerTitle: "Gerenciador de Tarefas",
        taskManagerDesc: "Um sistema de gerenciamento de tarefas para organizar e acompanhar atividades.",
        whoArePokemonTitle: "Adivinhe o Pokémon",
        whoArePokemonDesc: "Um jogo onde o jogador adivinha o Pokémon, construído com HTML, CSS e JavaScript.",
        contactTitle: "Fale <span>Comigo!</span>",
        formName: "Nome Completo",
        formEmail: "E-mail",
        formNumber: "Número de Telefone",
        formSubject: "Assunto",
        formMessage: "Mensagem",
        formSend: "Enviar Mensagem",
        aboutTitle: "Sobre Mim",
        aboutSubtitle: "Engenharia de <span>Dados</span> & <span>Full Stack</span>",
        aboutDescription: "Sou Davi Ramos Ferreira, estudante de Ciências da Computação movido pelo desafio de construir sistemas que transformam dados brutos em decisões reais. Meu foco é <strong>Engenharia de Dados</strong>, e sou apaixonado por cada camada da stack de dados — da arquitetura do pipeline ao dashboard final.<br><br>Atualmente estagiário na SEFAZ Jaboatão dos Guararapes, desenvolvendo um sistema de gestão fiscal completo com <strong>Angular, FastAPI, Python e Pandas</strong>. Meus projetos incluem pipelines ETL com PySpark, automação de scraping com Selenium e APIs REST otimizadas para performance.<br><br>Estou em constante evolução, sempre buscando desafios que me façam crescer no universo de dados e tecnologia.",
        footerText: "Copyright &copy; 2025 por &lt;/Davi Ramos Ferreira&gt;, Todos os Direitos Reservados",
    }
};

const languageToggle = document.getElementById('lang-toggle-checkbox');

const setLanguage = (lang) => {
    document.querySelectorAll('[data-key]').forEach(element => {
        const key = element.getAttribute('data-key');
        if (translations[lang][key]) {
            if (element.hasAttribute('placeholder')) {
                element.setAttribute('placeholder', translations[lang][key]);
            } else {
                element.innerHTML = translations[lang][key];
            }
        }
    });
    document.documentElement.lang = lang;
};

const handleLanguageChange = () => {
    const lang = languageToggle.checked ? 'pt' : 'en';
    localStorage.setItem('language', lang);
    setLanguage(lang);
};

languageToggle.addEventListener('change', handleLanguageChange);

document.addEventListener('DOMContentLoaded', () => {
    const savedLang = localStorage.getItem('language') || 'en';
    languageToggle.checked = savedLang === 'pt';
    setLanguage(savedLang);
});