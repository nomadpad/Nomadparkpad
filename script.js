const menuToggle = document.querySelector('.menu-toggle');
const navLinks = document.querySelector('.nav-links');

if (menuToggle && navLinks) {
  menuToggle.addEventListener('click', () => {
    navLinks.classList.toggle('open');
  });
}

const waitlistForm = document.querySelector('#waitlistForm');
const formMessage = document.querySelector('#formMessage');

if (waitlistForm) {
  waitlistForm.addEventListener('submit', (event) => {
    event.preventDefault();
    formMessage.textContent = 'You are on the early access list. The road has spoken.';
    waitlistForm.reset();
  });
}

const searchForm = document.querySelector('#searchForm');

if (searchForm) {
  searchForm.addEventListener('submit', (event) => {
    event.preventDefault();
    document.querySelector('#join').scrollIntoView({ behavior: 'smooth' });
  });
}
