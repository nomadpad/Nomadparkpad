const menuButton = document.querySelector('.menu-button');
const nav = document.querySelector('.main-nav');

menuButton?.addEventListener('click', () => {
  const open = menuButton.getAttribute('aria-expanded') === 'true';
  menuButton.setAttribute('aria-expanded', String(!open));

  if (!open) {
    nav.style.display = 'flex';
    nav.style.position = 'absolute';
    nav.style.top = '84px';
    nav.style.left = '5%';
    nav.style.right = '5%';
    nav.style.padding = '22px';
    nav.style.flexDirection = 'column';
    nav.style.background = '#fff';
    nav.style.borderRadius = '14px';
    nav.style.boxShadow = '0 20px 50px rgba(14,62,45,.16)';
  } else {
    nav.removeAttribute('style');
  }
});

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));

document.querySelector('.early-form')?.addEventListener('submit', (event) => {
  event.preventDefault();
  const button = event.currentTarget.querySelector('button');
  const original = button.textContent;
  button.textContent = 'Thanks — You’re on the list';
  button.disabled = true;

  setTimeout(() => {
    button.textContent = original;
    button.disabled = false;
  }, 2200);
});
