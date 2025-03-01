// Turns the menu hamburguer into a X

const menuHamburguer = document.querySelector('.menu-hamburguer')
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

function sendMail (){
    let parms = {
        name : document.getElementById("name").value,
        email : document.getElementById("email").value, 
        subject : document.getElementById("subject").value,
        number : document.getElementById("number").value,
        message : document.getElementById ("message").value
    }

    emailjs.send("service_1r6yipm","template_g5tskxc",parms).then(alert("Email sent!!"))
}