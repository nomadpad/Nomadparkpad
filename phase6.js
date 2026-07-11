const requestArrival = document.querySelector('#request-arrival');
const requestDeparture = document.querySelector('#request-departure');

function updateRequestPrice() {
  let nights = 1;
  if (requestArrival?.value && requestDeparture?.value) {
    const start = new Date(requestArrival.value + 'T12:00:00');
    const end = new Date(requestDeparture.value + 'T12:00:00');
    const diff = Math.round((end - start) / 86400000);
    nights = diff > 0 ? diff : 1;
  }
  const stay = nights * 22;
  document.querySelector('#request-nights')?.replaceChildren(String(nights));
  document.querySelector('#request-stay-cost')?.replaceChildren(`$${stay}`);
  document.querySelector('#request-total')?.replaceChildren(`$${stay + 4}`);
}

requestArrival?.addEventListener('change', () => {
  if (requestArrival.value && requestDeparture && !requestDeparture.value) {
    const next = new Date(requestArrival.value + 'T12:00:00');
    next.setDate(next.getDate() + 1);
    requestDeparture.value = next.toISOString().split('T')[0];
  }
  updateRequestPrice();
});
requestDeparture?.addEventListener('change', updateRequestPrice);
updateRequestPrice();

document.querySelector('#booking-request-form')?.addEventListener('submit', (event) => {
  event.preventDefault();
  const payload = {
    arrival: requestArrival?.value || '',
    departure: requestDeparture?.value || '',
    travelers: document.querySelector('#request-travelers')?.value || '',
    vehicle: document.querySelector('#request-vehicle')?.value || '',
    length: document.querySelector('#request-length')?.value || '',
    pets: document.querySelector('#request-pets')?.value || '',
    message: document.querySelector('#request-message')?.value || ''
  };
  localStorage.setItem('nomadParkPadBookingRequest', JSON.stringify(payload));
  const msg = document.querySelector('.request-message');
  if (msg) msg.textContent = 'Booking request saved in this browser preview. The host dashboard can now represent it as pending.';
  const button = event.currentTarget.querySelector('button[type="submit"]');
  if (button) { button.textContent = 'Request Sent in Preview'; button.disabled = true; }
});

document.querySelector('#message-form')?.addEventListener('submit', (event) => {
  event.preventDefault();
  const input = document.querySelector('#message-input');
  const stream = document.querySelector('#message-stream');
  if (!input || !stream || !input.value.trim()) return;

  const bubble = document.createElement('div');
  bubble.className = 'message-bubble traveler-message';
  const p = document.createElement('p');
  p.textContent = input.value.trim();
  const small = document.createElement('small');
  small.textContent = 'Just now';
  bubble.append(p, small);
  stream.appendChild(bubble);
  input.value = '';
  stream.scrollTop = stream.scrollHeight;
});

document.querySelectorAll('.quick-replies button').forEach(button => {
  button.addEventListener('click', () => {
    const input = document.querySelector('#message-input');
    if (input) input.value = button.textContent;
  });
});

document.querySelector('#report-conversation')?.addEventListener('click', () => {
  alert('A real report flow will be connected to trust and safety tools in a later phase.');
});

document.querySelector('#cancel-trip')?.addEventListener('click', () => {
  const message = document.querySelector('.trip-status-message');
  if (message) message.textContent = 'Cancellation marked in this preview. No real booking was changed.';
});

document.querySelector('#review-button')?.addEventListener('click', () => {
  alert('The review form will be added in the next marketplace phase.');
});
