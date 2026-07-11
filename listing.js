const saveButton = document.querySelector('#save-button');
saveButton?.addEventListener('click', () => {
  saveButton.classList.toggle('saved');
  saveButton.textContent = saveButton.classList.contains('saved') ? '♥ Saved' : '♡ Save';
});

document.querySelector('#share-button')?.addEventListener('click', async () => {
  const data = {
    title: 'Quiet Garden Driveway | Nomad Park Pad',
    text: 'Take a look at this example Nomad Park Pad listing.',
    url: window.location.href
  };

  try {
    if (navigator.share) {
      await navigator.share(data);
    } else {
      await navigator.clipboard.writeText(window.location.href);
      alert('Listing link copied.');
    }
  } catch (error) {
    // The user may close the share sheet. No action is needed.
  }
});

const checkIn = document.querySelector('#check-in');
const checkOut = document.querySelector('#check-out');
const nightCount = document.querySelector('#night-count');
const stayCost = document.querySelector('#stay-cost');
const totalCost = document.querySelector('#total-cost');

function updatePrice() {
  let nights = 1;

  if (checkIn?.value && checkOut?.value) {
    const start = new Date(checkIn.value + 'T12:00:00');
    const end = new Date(checkOut.value + 'T12:00:00');
    const calculated = Math.round((end - start) / 86400000);
    nights = calculated > 0 ? calculated : 1;
  }

  const stay = nights * 22;
  if (nightCount) nightCount.textContent = nights;
  if (stayCost) stayCost.textContent = `$${stay}`;
  if (totalCost) totalCost.textContent = `$${stay + 4}`;
}

checkIn?.addEventListener('change', () => {
  if (checkIn.value && checkOut && !checkOut.value) {
    const next = new Date(checkIn.value + 'T12:00:00');
    next.setDate(next.getDate() + 1);
    checkOut.value = next.toISOString().split('T')[0];
  }
  updatePrice();
});

checkOut?.addEventListener('change', updatePrice);
updatePrice();

document.querySelector('#booking-form')?.addEventListener('submit', (event) => {
  event.preventDefault();
  const message = event.currentTarget.querySelector('.booking-message');
  const button = event.currentTarget.querySelector('button[type="submit"]');
  if (message) {
    message.textContent = 'This is an example booking flow. Live requests will be connected when accounts and payments are built.';
  }
  if (button) button.textContent = 'Preview Request Complete';
});

document.querySelector('.show-photos')?.addEventListener('click', () => {
  alert('A full-screen photo gallery will be added when hosts can upload real listing photos.');
});
