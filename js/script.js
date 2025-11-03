// Turns the menu hamburguer into a X
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

// Contact Form EmailJS
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


// --- Translation Feature ---

const translations = {
    en: {
        // Nav
        navHome: "Home",
        navServices: "Services",
        navPortfolio: "Portfolio",
        navContact: "Contact",
        navAbout: "About",
        // Home Section
        homeHello: "Hello, I'm",
        homeTitle: "Davi Ramos Ferreira",
        homeSubtitle: "<span>Data</span> Science & <span>Analytics</span>",
        homeDescription: "I'm Davi Ramos Ferreira, a Systems Information student passionate about transforming data into innovative solutions. My current focus is <strong>Data Science</strong>, applying my skills in <strong>Python, SQL, Power BI, and Machine Learning</strong> to extract valuable insights.<br><br>My background in programming and databases gives me a solid foundation for solving complex problems. Here, you'll find projects that demonstrate how I use technology to make sense of data. I'm always looking for new challenges to grow in the world of data analytics! 📊",
        downloadCV: "Download CV",
        // Services Section
        servicesTitle: "My <span>Services</span>",
        dataScienceTitle: "Data Science",
        dataScienceDesc: "Passionate about uncovering insights from data. I use Python, SQL, and tools like Power BI to perform analysis, create predictive models (Machine Learning), and transform complex information into clear visualizations that drive strategic decisions. 🚀",
        programmingTitle: "Programming",
        programmingDesc: "I have experience in Python and Java programming, focusing on problem-solving, clean code, and efficient algorithms. I enjoy developing logic-driven applications, automating processes, and optimizing performance. From backend development to scripting and software solutions, I am always looking for innovative ways to improve and create scalable systems. 🚀",
        webDevTitle: "Web Development",
        webDevDesc: "I specialize in creating and optimizing websites with modern technologies like HTML, CSS, JavaScript, and responsive design. My focus is on building user-friendly, efficient, and visually appealing applications that provide a seamless experience across devices. Whether it's landing pages, websites, or projects, I am committed to delivering high-quality solutions tailored to your needs. 🚀",
        // Portfolio Section
        portfolioTitle: "Latest <span>Projects</span>",
        stockDataPipelineTitle: "Stock Data Pipeline",
        stockDataPipelineDesc: "A data pipeline project for stock analysis, using Python and ETL tools.",
        spfcAnalysisTitle: "Data Analysis - SPFC", // ADICIONADO
        spfcAnalysisDesc: "A data analysis project for São Paulo FC, using Python with libraries like Pandas and Selenium.", // ADICIONADO
        taskManagerTitle: "Task Manager",
        taskManagerDesc: "A task management system to organize and track activities.",
        whoArePokemonTitle: "Guess the Pokémon", // CORRIGIDO
        whoArePokemonDesc: "A game where the player guesses the Pokémon, built with HTML, CSS, and JavaScript.",
        // Contact Section
        contactTitle: "Contact <span>Me!</span>",
        formName: "Full Name",
        formEmail: "E-mail",
        formNumber: "Phone Number",
        formSubject: "Subject",
        formMessage: "Message",
        formSend: "Send Message",
        // About Section
        aboutTitle: "About Me",
        aboutSubtitle: "<span>Data</span> Science & <span>Analytics</span>",
        aboutDescription: "I'm Davi Ramos Ferreira, a Systems Information student driven by the curiosity to uncover stories through data. My passion is <strong>Data Science</strong>, and my goal is to use technology to support smarter decision-making.<br><br>Currently, I'm deepening my skills across the entire data lifecycle: from extraction and analysis with <strong>Python and SQL</strong>, to creating interactive dashboards in <strong>Power BI</strong> and building <strong>Machine Learning</strong> models. My previous experience in development (Java, JavaScript, HTML/CSS) complements my journey, allowing me not only to analyze but also to build complete solutions.<br><br>I am a constant learner, always seeking challenges that allow me to evolve in the fascinating world of technology and data. 🚀",
        // Footer
        footerText: "Copyright &copy; 2025 by &lt;/Davi Ramos Ferreira&gt;, All Rights Reserved",
    },
    pt: {
        // Nav
        navHome: "Início",
        navServices: "Serviços",
        navPortfolio: "Portfólio",
        navContact: "Contato",
        navAbout: "Sobre",
        // Home Section
        homeHello: "Olá, eu sou",
        homeTitle: "Davi Ramos Ferreira",
        homeSubtitle: "Ciência de <span>Dados</span> & <span>Analytics</span>",
        homeDescription: "Sou Davi Ramos Ferreira, um estudante de Sistemas de Informação apaixonado por transformar dados em soluções inovadoras. Meu foco atual é <strong>Ciência de Dados</strong>, aplicando minhas habilidades em <strong>Python, SQL, Power BI e Machine Learning</strong> para extrair insights valiosos.<br><br>Minha base em programação e bancos de dados me dá uma fundação sólida para resolver problemas complexos. Aqui, você encontrará projetos que demonstram como eu uso a tecnologia para dar sentido aos dados. Estou sempre em busca de novos desafios para crescer no universo da análise de dados! 📊",
        downloadCV: "Baixar CV",
        // Services Section
        servicesTitle: "Meus <span>Serviços</span>",
        dataScienceTitle: "Ciência de Dados",
        dataScienceDesc: "Apaixonado por descobrir insights em dados. Utilizo Python, SQL e ferramentas como Power BI para realizar análises, criar modelos preditivos (Machine Learning) e transformar informações complexas em visualizações claras que impulsionam decisões estratégicas. 🚀",
        programmingTitle: "Programação",
        programmingDesc: "Tenho experiência em programação Python e Java, com foco na resolução de problemas, código limpo e algoritmos eficientes. Gosto de desenvolver aplicações orientadas pela lógica, automatizar processos e otimizar o desempenho. Do desenvolvimento de backend a scripts e soluções de software, estou sempre procurando maneiras inovadoras de melhorar e criar sistemas escaláveis. 🚀",
        webDevTitle: "Desenvolvimento Web",
        webDevDesc: "Sou especialista na criação e otimização de sites com tecnologias modernas como HTML, CSS, JavaScript e design responsivo. Meu foco é construir aplicações fáceis de usar, eficientes e visualmente atraentes que proporcionem uma experiência perfeita em todos os dispositivos. Sejam landing pages, sites ou projetos, estou comprometido em entregar soluções de alta qualidade adaptadas às suas necessidades. 🚀",
        // Portfolio Section
        portfolioTitle: "Últimos <span>Projetos</span>",
        stockDataPipelineTitle: "Pipeline de Dados de Ações",
        stockDataPipelineDesc: "Um projeto de pipeline de dados para análise de ações, utilizando Python e ferramentas de ETL.",
        spfcAnalysisTitle: "Análise de Dados - SPFC", // ADICIONADO
        spfcAnalysisDesc: "Coleta e análise de dados de jogadores do São Paulo FC com Python, Selenium e Pandas. Apresenta um menu interativo e gráficos.", // ADICIONADO
        taskManagerTitle: "Gerenciador de Tarefas",
        taskManagerDesc: "Um sistema de gerenciamento de tarefas para organizar e acompanhar atividades.",
        whoArePokemonTitle: "Adivinhe o Pokémon", // CORRIGIDO
        whoArePokemonDesc: "Um jogo onde o jogador adivinha o Pokémon, construído com HTML, CSS e JavaScript.",
        // Contact Section
        contactTitle: "Fale <span>Comigo!</span>",
        formName: "Nome Completo",
        formEmail: "E-mail",
        formNumber: "Número de Telefone",
        formSubject: "Assunto",
        formMessage: "Mensagem",
        formSend: "Enviar Mensagem",
        // About Section
        aboutTitle: "Sobre Mim",
        aboutSubtitle: "Ciência de <span>Dados</span> & <span>Analytics</span>",
        aboutDescription: "Sou Davi Ramos Ferreira, um estudante de Sistemas de Informação movido pela curiosidade de desvendar histórias através dos dados. Minha paixão é a <strong>Ciência de Dados</strong>, e meu objetivo é utilizar a tecnologia para apoiar tomadas de decisão mais inteligentes.<br><br>Atualmente, estou aprofundando minhas competências em todo o ciclo de vida dos dados: desde a extração e análise com <strong>Python e SQL</strong>, até a criação de dashboards interativos com <strong>Power BI</strong> e a construção de modelos de <strong>Machine Learning</strong>. Minha experiência prévia com desenvolvimento (Java, JavaScript, HTML/CSS) complementa minha jornada, permitindo-me não apenas analisar, mas também construir soluções completas.<br><br>Estou em constante aprendizado, sempre buscando desafios que me permitam evoluir no fascinante mundo da tecnologia e dos dados. 🚀",
        // Footer
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
                // Usa innerHTML para renderizar tags como <span> corretamente
                element.innerHTML = translations[lang][key];
            }
        }
    });
    // Define o atributo lang na tag <html> para acessibilidade
    document.documentElement.lang = lang;
};

// Função para lidar com a mudança do botão
const handleLanguageChange = () => {
    const lang = languageToggle.checked ? 'pt' : 'en';
    localStorage.setItem('language', lang); // Salva a preferência
    setLanguage(lang);
};

// Adiciona o evento de 'change' ao botão
languageToggle.addEventListener('change', handleLanguageChange);

// Define o idioma inicial quando a página carrega
document.addEventListener('DOMContentLoaded', () => {
    // Verifica se já existe um idioma salvo, senão usa 'en' como padrão
    const savedLang = localStorage.getItem('language') || 'en';
    languageToggle.checked = savedLang === 'pt';
    setLanguage(savedLang);
});