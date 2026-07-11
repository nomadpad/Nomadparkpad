const storageKey = 'nomadParkPadListingDraft';

function collectDraft() {
  const checked = (selector) => [...document.querySelectorAll(selector)].filter(el => el.checked).map(el => el.value);
  return {
    title: document.querySelector('#listing-title')?.value || 'Quiet Garden Driveway',
    city: document.querySelector('#listing-city')?.value || 'Sherwood Park',
    province: document.querySelector('#listing-province')?.value || 'Alberta',
    description: document.querySelector('#listing-description')?.value || '',
    length: document.querySelector('#max-length')?.value || '24 ft',
    guests: document.querySelector('#max-guests')?.value || '4',
    amenities: checked('input[name="amenity"]'),
    vehicles: checked('input[name="vehicle-fit"]'),
    style: document.querySelector('input[name="host-style"]:checked')?.value || 'Quiet Overnight',
    price: document.querySelector('#nightly-price')?.value || '22'
  };
}

function saveDraft() {
  if (!document.querySelector('#listing-builder')) return;
  localStorage.setItem(storageKey, JSON.stringify(collectDraft()));
  const status = document.querySelector('#save-status');
  if (status) {
    status.textContent = 'Draft saved locally';
    setTimeout(() => status.textContent = 'All changes saved', 500);
  }
}

document.querySelectorAll('#listing-builder input, #listing-builder select, #listing-builder textarea').forEach(el => {
  el.addEventListener('input', saveDraft);
  el.addEventListener('change', saveDraft);
});

const steps = [...document.querySelectorAll('.builder-step')];
const navItems = [...document.querySelectorAll('.builder-nav-item')];
let currentStep = 1;

function showStep(step) {
  currentStep = Math.max(1, Math.min(7, step));
  steps.forEach(el => el.classList.toggle('active', Number(el.dataset.step) === currentStep));
  navItems.forEach(el => el.classList.toggle('active', Number(el.dataset.stepTarget) === currentStep));
  const previous = document.querySelector('#previous-step');
  const next = document.querySelector('#next-step');
  const preview = document.querySelector('#preview-listing');
  if (previous) previous.disabled = currentStep === 1;
  if (next) next.style.display = currentStep === 7 ? 'none' : 'inline-flex';
  if (preview) preview.style.display = currentStep === 7 ? 'inline-flex' : 'none';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

document.querySelector('#next-step')?.addEventListener('click', () => { saveDraft(); showStep(currentStep + 1); });
document.querySelector('#previous-step')?.addEventListener('click', () => showStep(currentStep - 1));
navItems.forEach(item => item.addEventListener('click', () => showStep(Number(item.dataset.stepTarget))));

document.querySelector('#photo-button')?.addEventListener('click', () => {
  alert('Real photo uploads will be connected when cloud storage and user accounts are live.');
});

const calendar = document.querySelector('#availability-calendar');
if (calendar) {
  const weekdays = ['S','M','T','W','T','F','S'];
  weekdays.forEach(day => {
    const label = document.createElement('strong');
    label.textContent = day;
    calendar.appendChild(label);
  });
  for (let day = 1; day <= 31; day++) {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = day;
    if ([15,16,17,22,23,24,30,31].includes(day)) button.classList.add('available');
    button.addEventListener('click', () => button.classList.toggle('available'));
    calendar.appendChild(button);
  }
}

const price = document.querySelector('#nightly-price');
function updateTravelerTotal() {
  const value = Number(price?.value || 22);
  const target = document.querySelector('#traveler-total');
  if (target) target.textContent = `$${value + 4}`;
}
price?.addEventListener('input', updateTravelerTotal);
updateTravelerTotal();

function fillPreview() {
  const raw = localStorage.getItem(storageKey);
  if (!raw) return;
  try {
    const draft = JSON.parse(raw);
    const set = (selector, value) => {
      const el = document.querySelector(selector);
      if (el && value) el.textContent = value;
    };
    set('#preview-title', draft.title);
    set('#preview-city', draft.city);
    set('#preview-map-city', draft.city);
    set('#preview-description', draft.description);
    set('#preview-length', draft.length);
    set('#preview-guests', draft.guests);
    set('#preview-style', draft.style);
    set('#preview-price', draft.price);

    const amenities = document.querySelector('#preview-amenities');
    if (amenities && Array.isArray(draft.amenities) && draft.amenities.length) {
      amenities.innerHTML = '';
      draft.amenities.forEach(item => {
        const span = document.createElement('span');
        span.textContent = `✓ ${item}`;
        amenities.appendChild(span);
      });
    }
  } catch (error) {}
}
fillPreview();

document.querySelectorAll('[data-publish]').forEach(button => {
  button.addEventListener('click', () => {
    const message = document.querySelector('.publish-message');
    document.querySelectorAll('[data-publish]').forEach(btn => {
      btn.textContent = 'Pad Published in Preview';
      btn.disabled = true;
    });
    if (message) message.textContent = 'Your listing is marked active in this browser preview. Real publication will require verification, database storage, and payout setup.';
  });
});

document.querySelectorAll('.accept-request, .decline-request').forEach(button => {
  button.addEventListener('click', () => {
    const card = button.closest('[data-request]');
    if (!card) return;
    card.classList.add('responded');
    card.querySelector('.request-actions').innerHTML = `<strong>${button.classList.contains('accept-request') ? 'Accepted' : 'Declined'}</strong>`;
  });
});

document.querySelector('#pause-listing')?.addEventListener('click', (event) => {
  const button = event.currentTarget;
  const pill = document.querySelector('.status-pill');
  const paused = button.textContent === 'Reactivate';
  button.textContent = paused ? 'Pause' : 'Reactivate';
  if (pill) {
    pill.textContent = paused ? 'Active' : 'Paused';
    pill.className = paused ? 'status-pill live' : 'status-pill draft';
  }
});

showStep(1);
