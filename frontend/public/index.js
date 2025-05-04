/* index.js tilhører index.html "Hjemmeside" */

document.addEventListener('DOMContentLoaded', function() {
    const burger = document.getElementById('burger');
    const navMenu = document.getElementById('nav-menu');
  
    burger.addEventListener('click', function() {
      // Veksle visningen av menyen ved klikk
      if (navMenu.style.display === 'flex') {
        navMenu.style.display = 'none';
      } else {
        navMenu.style.display = 'flex';
      }
    });
  });
  