const cards = [...document.querySelectorAll('.listing-card')];
const filterButtons = [...document.querySelectorAll('.filter-chip')];
const destination = document.querySelector('#destination');
const vehicle = document.querySelector('#vehicle');
const price = document.querySelector('#price');
const sort = document.querySelector('#sort');
const resultCount = document.querySelector('#result-count');
const emptyState = document.querySelector('#empty-state');
const grid = document.querySelector('#listing-grid');
const activeFilters = new Set();

function applyFilters() {
  const query = (destination?.value || '').trim().toLowerCase();
  const vehicleValue = vehicle?.value || 'all';
  const maxPrice = Number(price?.value || 100);

  let visible = cards.filter((card) => {
    const cityMatch = !query || card.dataset.city.includes(query);
    const vehicleMatch = vehicleValue === 'all' || card.dataset.vehicle.includes(vehicleValue);
    const priceMatch = Number(card.dataset.price) <= maxPrice;
    const tagList = card.dataset.tags.split(' ');
    const tagMatch = [...activeFilters].every((tag) => tagList.includes(tag));
    return cityMatch && vehicleMatch && priceMatch && tagMatch;
  });

  visible.sort((a, b) => {
    if (sort?.value === 'price-low') return Number(a.dataset.price) - Number(b.dataset.price);
    if (sort?.value === 'price-high') return Number(b.dataset.price) - Number(a.dataset.price);
    if (sort?.value === 'rating') return Number(b.dataset.rating) - Number(a.dataset.rating);
    return 0;
  });

  cards.forEach((card) => card.hidden = true);
  visible.forEach((card) => {
    card.hidden = false;
    grid.appendChild(card);
  });

  if (resultCount) resultCount.textContent = visible.length;
  if (emptyState) emptyState.hidden = visible.length !== 0;
}

document.querySelector('#pad-search')?.addEventListener('submit', (event) => {
  event.preventDefault();
  applyFilters();
  document.querySelector('.results-section')?.scrollIntoView({ behavior: 'smooth' });
});

filterButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const filter = button.dataset.filter;
    if (activeFilters.has(filter)) {
      activeFilters.delete(filter);
      button.classList.remove('active');
    } else {
      activeFilters.add(filter);
      button.classList.add('active');
    }
    applyFilters();
  });
});

function clearAll() {
  activeFilters.clear();
  filterButtons.forEach((button) => button.classList.remove('active'));
  if (destination) destination.value = '';
  if (vehicle) vehicle.value = 'all';
  if (price) price.value = '100';
  if (sort) sort.value = 'recommended';
  applyFilters();
}

document.querySelector('#clear-filters')?.addEventListener('click', clearAll);
document.querySelector('#empty-clear')?.addEventListener('click', clearAll);
vehicle?.addEventListener('change', applyFilters);
price?.addEventListener('change', applyFilters);
sort?.addEventListener('change', applyFilters);

document.querySelectorAll('.heart').forEach((button) => {
  button.addEventListener('click', () => {
    button.classList.toggle('saved');
    button.textContent = button.classList.contains('saved') ? '♥' : '♡';
  });
});

document.querySelectorAll('.view-button').forEach((button) => {
  button.addEventListener('click', () => {
    window.location.href = 'pad-listing.html';
  });
});

document.querySelectorAll('[data-city-jump]').forEach((pin) => {
  pin.addEventListener('click', () => {
    const city = pin.dataset.cityJump;
    const target = cards.find((card) => card.dataset.city === city);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      target.animate(
        [{ boxShadow: '0 0 0 0 rgba(216,93,9,0)' }, { boxShadow: '0 0 0 6px rgba(216,93,9,.35)' }, { boxShadow: '0 10px 26px rgba(14,62,45,.07)' }],
        { duration: 1200 }
      );
    }
  });
});

applyFilters();
