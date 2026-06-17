const EMAILJS_PUBLIC_KEY = "k4v5bBnrqZ9qnsu51";
const EMAILJS_SERVICE_ID = "service_1r6yipm";
const EMAILJS_TEMPLATE_ID = "template_g5tskxc";

const menuHamburguer = document.querySelector('.menu-hamburguer');
const navResponsive = document.querySelector('.nav-responsive');
const languageToggle = document.getElementById('lang-toggle-checkbox');
const projectsContainer = document.getElementById('projects-container');
const contactForm = document.getElementById('contact-form');
const formStatus = document.getElementById('form-status');
const submitButton = contactForm ? contactForm.querySelector('.form-submit') : null;
const navLinks = document.querySelectorAll('.nav a, .nav-responsive a');
const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

let revealObserver = null;
let revealAnimationsReady = false;
let emailInitialized = false;
let isSubmitting = false;

const translations = {
    en: {
        navHome: "Home",
        navServices: "Services",
        navPortfolio: "Portfolio",
        navContact: "Contact",
        homeHello: "Hello, I'm",
        homeTitle: "Davi Ramos Ferreira",
        homeSubtitle: "<span>Data</span> Engineering & <span>Full Stack</span>",
        homeDescriptionIntro: "I'm Davi Ramos Ferreira, a Computer Science student (Uninassau, 2027) focused on <strong>Data Engineering</strong> and Full Stack Development. Currently interning at SEFAZ Jaboatão dos Guararapes, where I build a fiscal management system from scratch — <strong>Python/FastAPI</strong> backend, <strong>Angular</strong> frontend, and <strong>ETL pipelines with Pandas</strong>.",
        homeDescriptionMore: "Passionate about building efficient pipelines, automating processes, and turning raw data into decisions. Here you'll find real projects with concrete metrics. Always looking for new challenges in the data and tech world!",
        viewProjects: "View Projects",
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
        contactTitle: "Contact <span>Me!</span>",
        formName: "Full Name",
        formEmail: "E-mail",
        formNumber: "Phone Number",
        formSubject: "Subject",
        formMessage: "Message",
        formSend: "Send Message",
        footerText: "Copyright &copy; 2026 by &lt;/Davi Ramos Ferreira&gt;, All Rights Reserved",
        menuOpen: "Open menu",
        menuClose: "Close menu",
        featuredProject: "Featured",
        technologiesLabel: "Technologies",
        demoLabel: "Demo",
        repositoryLabel: "Repository",
        imageFallback: "Image unavailable",
        formSending: "Sending...",
        formSuccess: "Message sent successfully.",
        formError: "Message could not be sent. Please try again.",
        formInvalid: "Please complete the required fields.",
        emailUnavailable: "Email service is unavailable. Please try again later."
    },
    pt: {
        navHome: "Início",
        navServices: "Serviços",
        navPortfolio: "Portfólio",
        navContact: "Contato",
        homeHello: "Olá, eu sou",
        homeTitle: "Davi Ramos Ferreira",
        homeSubtitle: "Engenharia de <span>Dados</span> & <span>Full Stack</span>",
        homeDescriptionIntro: "Sou Davi Ramos Ferreira, estudante de Ciências da Computação (Uninassau, 2027) com foco em <strong>Engenharia de Dados</strong> e Desenvolvimento Full Stack. Atualmente estagiário na SEFAZ de Jaboatão dos Guararapes, onde desenvolvo um sistema de gestão fiscal municipal do zero — backend em <strong>Python/FastAPI</strong>, frontend em <strong>Angular</strong> e pipeline <strong>ETL com Pandas</strong>.",
        homeDescriptionMore: "Apaixonado por construir pipelines eficientes, automatizar processos e transformar dados brutos em decisões estratégicas. Aqui você encontra projetos reais com métricas concretas. Sempre em busca de novos desafios no universo de dados e tecnologia!",
        viewProjects: "Ver projetos",
        downloadCV: "Baixar currículo",
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
        contactTitle: "Fale <span>Comigo!</span>",
        formName: "Nome Completo",
        formEmail: "E-mail",
        formNumber: "Número de Telefone",
        formSubject: "Assunto",
        formMessage: "Mensagem",
        formSend: "Enviar Mensagem",
        footerText: "Copyright &copy; 2026 por &lt;/Davi Ramos Ferreira&gt;, Todos os Direitos Reservados",
        menuOpen: "Abrir menu",
        menuClose: "Fechar menu",
        featuredProject: "Destaque",
        technologiesLabel: "Tecnologias",
        demoLabel: "Demonstração",
        repositoryLabel: "Repositório",
        imageFallback: "Imagem indisponível",
        formSending: "Enviando...",
        formSuccess: "Mensagem enviada com sucesso.",
        formError: "Não foi possível enviar a mensagem. Tente novamente.",
        formInvalid: "Preencha os campos obrigatórios.",
        emailUnavailable: "Serviço de e-mail indisponível. Tente novamente mais tarde."
    }
};

function getCurrentLanguage() {
    return languageToggle.checked ? 'pt' : 'en';
}

function initializeEmailService() {
    if (emailInitialized || !window.emailjs) {
        return;
    }

    window.emailjs.init({ publicKey: EMAILJS_PUBLIC_KEY });
    emailInitialized = true;
}

function toggleMenu(forceOpen) {
    const lang = getCurrentLanguage();
    const shouldOpen = typeof forceOpen === "boolean"
        ? forceOpen
        : !menuHamburguer.classList.contains('change');

    menuHamburguer.classList.toggle('change', shouldOpen);
    navResponsive.classList.toggle('is-open', shouldOpen);
    menuHamburguer.setAttribute('aria-expanded', String(shouldOpen));
    menuHamburguer.setAttribute('aria-label', shouldOpen ? translations[lang].menuClose : translations[lang].menuOpen);
}

function createIcon(className) {
    const icon = document.createElement('i');
    icon.className = className;
    icon.setAttribute('aria-hidden', 'true');
    return icon;
}

function createProjectLink(url, label, iconClass, projectTitle) {
    const link = document.createElement('a');
    link.href = url;
    link.target = "_blank";
    link.rel = "noopener";
    link.className = "project-link";
    link.setAttribute('aria-label', `${label}: ${projectTitle}`);

    const text = document.createElement('span');
    text.textContent = label;

    link.append(createIcon(iconClass), text);
    return link;
}

function registerRevealElement(element, index = 0) {
    if (!element) {
        return;
    }

    element.classList.add('reveal');
    element.style.setProperty('--reveal-delay', `${Math.min(index * 45, 180)}ms`);

    if (reducedMotionQuery.matches || !revealObserver) {
        element.classList.add('is-visible');
        return;
    }

    revealObserver.observe(element);
}

function renderProjects(lang) {
    if (!projectsContainer || !Array.isArray(window.projects)) {
        return;
    }

    projectsContainer.textContent = "";

    window.projects.forEach((project, index) => {
        const title = project.title[lang];
        const article = document.createElement('article');
        article.className = project.featured ? "portfolio-box is-featured" : "portfolio-box";
        article.id = `project-${project.id}`;

        const media = document.createElement('div');
        media.className = "project-media";

        const image = document.createElement('img');
        image.src = project.image;
        image.alt = project.alt[lang];
        image.width = 800;
        image.height = 450;
        image.loading = "lazy";
        image.decoding = "async";
        image.addEventListener('error', () => {
            media.classList.add('project-media--fallback');
            media.textContent = "";
            const fallbackText = document.createElement('span');
            fallbackText.textContent = translations[lang].imageFallback;
            media.appendChild(fallbackText);
        }, { once: true });

        media.appendChild(image);

        const content = document.createElement('div');
        content.className = "project-content";

        if (project.featured) {
            const badge = document.createElement('span');
            badge.className = "project-badge";
            badge.textContent = translations[lang].featuredProject;
            content.appendChild(badge);
        }

        const heading = document.createElement('h3');
        heading.textContent = title;

        const description = document.createElement('p');
        description.textContent = project.description[lang];

        const techList = document.createElement('ul');
        techList.className = "project-tech";
        techList.setAttribute('aria-label', translations[lang].technologiesLabel);

        project.technologies.forEach(technology => {
            const item = document.createElement('li');
            item.textContent = technology;
            techList.appendChild(item);
        });

        const links = document.createElement('div');
        links.className = "portfolio-links";

        if (project.demoUrl) {
            links.appendChild(createProjectLink(project.demoUrl, translations[lang].demoLabel, 'bx bx-link-external', title));
        }

        if (project.repositoryUrl) {
            links.appendChild(createProjectLink(project.repositoryUrl, translations[lang].repositoryLabel, 'bx bxl-github', title));
        }

        content.append(heading, description, techList, links);
        article.append(media, content);
        projectsContainer.appendChild(article);

        if (revealAnimationsReady) {
            registerRevealElement(article, index);
        }
    });
}

function setFormStatus(message, type = "") {
    if (!formStatus) {
        return;
    }

    formStatus.textContent = message;
    formStatus.dataset.status = type;
}

function setSubmitState(isSending) {
    if (!submitButton) {
        return;
    }

    const lang = getCurrentLanguage();
    submitButton.disabled = isSending;
    submitButton.setAttribute('aria-busy', String(isSending));
    submitButton.textContent = isSending ? translations[lang].formSending : translations[lang].formSend;
}

async function handleContactSubmit(event) {
    event.preventDefault();

    if (!contactForm || isSubmitting) {
        return;
    }

    const lang = getCurrentLanguage();

    if (!contactForm.checkValidity()) {
        setFormStatus(translations[lang].formInvalid, "error");
        contactForm.reportValidity();
        return;
    }

    initializeEmailService();

    if (!window.emailjs || !emailInitialized) {
        setFormStatus(translations[lang].emailUnavailable, "error");
        return;
    }

    isSubmitting = true;
    contactForm.setAttribute('aria-busy', 'true');
    setSubmitState(true);
    setFormStatus(translations[lang].formSending, "info");

    const parms = {
        name: document.getElementById("name").value.trim(),
        email: document.getElementById("email").value.trim(),
        subject: document.getElementById("subject").value.trim(),
        number: document.getElementById("number").value.trim(),
        message: document.getElementById("message").value.trim()
    };

    try {
        await window.emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, parms);
        contactForm.reset();
        setFormStatus(translations[lang].formSuccess, "success");
    } catch (error) {
        setFormStatus(translations[lang].formError, "error");
    } finally {
        isSubmitting = false;
        contactForm.removeAttribute('aria-busy');
        setSubmitState(false);
    }
}

function setActiveNavLink(sectionId) {
    navLinks.forEach(link => {
        const isActive = link.getAttribute('href') === `#${sectionId}`;
        link.classList.toggle('is-active', isActive);
        if (isActive) {
            link.setAttribute('aria-current', 'page');
        } else {
            link.removeAttribute('aria-current');
        }
    });
}

function initializeActiveSectionTracking() {
    const sections = document.querySelectorAll('section[id]');

    if (!('IntersectionObserver' in window)) {
        setActiveNavLink('home');
        return;
    }

    const sectionObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                setActiveNavLink(entry.target.id);
            }
        });
    }, {
        rootMargin: '-45% 0px -45% 0px',
        threshold: 0
    });

    sections.forEach(section => sectionObserver.observe(section));
}

function initializeRevealAnimations() {
    const revealTargets = [
        document.querySelector('.home-content'),
        document.querySelector('.home-img'),
        ...document.querySelectorAll('.services, .portfolio, .contact'),
        ...document.querySelectorAll('.services-box'),
        ...document.querySelectorAll('.portfolio-box'),
        contactForm
    ].filter(Boolean);

    revealAnimationsReady = true;

    if (!('IntersectionObserver' in window) || reducedMotionQuery.matches) {
        revealTargets.forEach(element => {
            element.classList.add('reveal', 'is-visible');
        });
        return;
    }

    revealObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                revealObserver.unobserve(entry.target);
            }
        });
    }, {
        rootMargin: '0px 0px -12% 0px',
        threshold: 0.12
    });

    revealTargets.forEach((element, index) => registerRevealElement(element, index));
}

function setLanguage(lang) {
    document.querySelectorAll('[data-key]').forEach(element => {
        const key = element.getAttribute('data-key');
        if (!translations[lang][key]) {
            return;
        }

        if (element.hasAttribute('placeholder')) {
            element.setAttribute('placeholder', translations[lang][key]);
        } else {
            element.innerHTML = translations[lang][key];
        }
    });

    document.documentElement.lang = lang;
    menuHamburguer.setAttribute('aria-label', menuHamburguer.classList.contains('change') ? translations[lang].menuClose : translations[lang].menuOpen);
    renderProjects(lang);

    if (isSubmitting) {
        setSubmitState(true);
    }
}

function handleLanguageChange() {
    const lang = getCurrentLanguage();
    localStorage.setItem('language', lang);

    if (reducedMotionQuery.matches) {
        setLanguage(lang);
        return;
    }

    document.body.classList.add('is-language-changing');
    window.setTimeout(() => {
        setLanguage(lang);
        document.body.classList.remove('is-language-changing');
    }, 120);
}

menuHamburguer.addEventListener('click', () => {
    toggleMenu();
});

navResponsive.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
        toggleMenu(false);
    });
});

languageToggle.addEventListener('change', handleLanguageChange);

if (contactForm) {
    contactForm.addEventListener('submit', handleContactSubmit);
}

document.addEventListener('DOMContentLoaded', () => {
    initializeEmailService();

    const savedLang = localStorage.getItem('language') || 'en';
    languageToggle.checked = savedLang === 'pt';
    setLanguage(savedLang);
    toggleMenu(false);
    setActiveNavLink('home');
    initializeActiveSectionTracking();
    initializeRevealAnimations();
});
