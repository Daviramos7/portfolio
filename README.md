# Portfolio - Davi Ramos Ferreira

Portfolio pessoal desenvolvido para apresentar meus projetos, habilidades e serviços na área de Ciência de Dados, Engenharia de Dados, Programação e Desenvolvimento Web.

## 🌟 Características

- **Design Responsivo**: Totalmente adaptável para desktop, tablet e mobile
- **Modo Bilíngue**: Alternância entre Português (BR) e Inglês (EN)
- **Seções Interativas**:
  - Home com apresentação pessoal
  - Serviços oferecidos (Data Science, Programming, Web Development)
  - Portfólio de projetos
  - Formulário de contato integrado com EmailJS
- **Animações Suaves**: Transições e efeitos hover em elementos
- **Menu Responsivo**

## 🚀 Tecnologias Utilizadas

- **HTML5**: Estrutura semântica da página
- **CSS3**: Estilização e design responsivo
  - Variáveis CSS
  - Flexbox e Grid Layout
  - Media Queries
  - Animações e Transições
- **JavaScript**: Interatividade e funcionalidades
  - Alternância de idiomas
  - Menu responsivo
  - Integração com EmailJS
  - LocalStorage para preferências
- **Bibliotecas Externas**:
  - [Boxicons](https://boxicons.com/): Ícones
  - [EmailJS](https://www.emailjs.com/): Envio de e-mails
  - [Google Fonts](https://fonts.google.com/): Fonte Poppins

## 📁 Estrutura do Projeto
```
portfolio/
│
├── index.html              # Página principal
├── css/
│   └── style.css          # Estilos da aplicação
├── js/
│   └── script.js          # Scripts e funcionalidades
├── img/                   # Imagens do portfolio
│   ├── Foto perfil.png
│   ├── Dashboard.png
│   ├── spfc-analysis.png
│   ├── task_manager.png
│   └── Who are a Pokémon.png
└── curriculo/
    └── Currículo Davi 2025.pdf
```

## 🛠️ Instalação e Execução

### Pré-requisitos

- Navegador web moderno (Chrome, Firefox, Safari, Edge)
- Servidor local (opcional, mas recomendado)

### Passos para Execução

1. **Clone o repositório**:
```bash
git clone https://github.com/Daviramos7/portfolio
cd portfolio
```

2. **Abra o projeto**:

   **Opção 1 - Diretamente no navegador:**
   - Navegue até a pasta do projeto
   - Abra o arquivo `index.html` com seu navegador

   **Opção 2 - Com servidor local (recomendado):**
   
   Usando Python:
```bash
   # Python 3
   python -m http.server 8000
```
   
   Usando Node.js (Live Server):
```bash
   npx live-server
```
   
   Usando PHP:
```bash
   php -S localhost:8000
```

3. **Acesse no navegador**:
   - Servidor local: `http://localhost:8000`
   - Diretamente: Clique duas vezes no arquivo `index.html`

## ⚙️ Configuração do EmailJS

Para o formulário de contato funcionar, você precisa configurar sua conta no EmailJS:

1. Crie uma conta em [EmailJS](https://www.emailjs.com/)
2. Configure um serviço de e-mail
3. Crie um template de e-mail
4. Substitua as credenciais no arquivo `index.html`:
```javascript
emailjs.init({
    publicKey: "SUA_PUBLIC_KEY_AQUI",
});
```

5. Atualize o service ID e template ID no arquivo `js/script.js`:
```javascript
emailjs.send("seu_service_id", "seu_template_id", parms)
```

## 🌐 Funcionalidades

### Alternância de Idiomas

- Clique no botão com as bandeiras no cabeçalho
- Alterna entre Inglês (🇺🇸) e Português (🇧🇷)
- Preferência salva no LocalStorage

### Menu Responsivo

- Animação de transformação em "X" ao clicar
- Menu deslizante com links de navegação

### Formulário de Contato

- Campos: Nome, E-mail, Telefone, Assunto e Mensagem
- Envio via EmailJS
- Alerta de confirmação após envio

### Projetos em Destaque

1. **Stock Data Pipeline**: Pipeline de análise de ações
2. **Análise SPFC**: Análise de dados do São Paulo FC
3. **Task Manager**: Sistema de gerenciamento de tarefas
4. **Guess the Pokémon**: Jogo interativo de adivinhação

## 🎨 Personalização

### Cores

As cores principais podem ser alteradas no arquivo `css/style.css` através das variáveis CSS:
```css
:root {
    --main-color: #00eeff;      /* Cor principal (ciano) */
    --text-color: #ffffff;       /* Cor do texto */
    --bg-color-01: #1f242d;      /* Cor de fundo primária */
    --bg-color-02: #323946;      /* Cor de fundo secundária */
}
```

### Conteúdo

Para alterar textos e traduções, edite o objeto `translations` no arquivo `js/script.js`.

## 📱 Responsividade

O site é totalmente responsivo com breakpoints para:

- Mobile: 0px - 575px
- Tablet: 576px - 767px
- Desktop pequeno: 768px - 991px
- Desktop médio: 992px - 1199px
- Desktop grande: 1200px+

## 🔗 Links Úteis

- [LinkedIn](https://www.linkedin.com/in/davi-ramos-ferreira-325354294/)
- [GitHub](https://github.com/Daviramos7)
  
## 📄 Licença

Copyright © 2025 por Davi Ramos Ferreira. Todos os Direitos Reservados.

---

**Desenvolvido com 💙 por Davi Ramos Ferreira**
