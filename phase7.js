document.querySelector('#checkout-form')?.addEventListener('submit', (event) => {
  event.preventDefault();
  localStorage.setItem('nomadParkPadDemoPayment', JSON.stringify({
    booking: 'NPP-DEMO-0726',
    amount: 27.30,
    status: 'demo-confirmed'
  }));
  window.location.href = 'payment-success.html';
});

document.querySelector('#demo-payout')?.addEventListener('click', (event) => {
  event.currentTarget.disabled = true;
  event.currentTarget.textContent = 'Demo Payout Sent';
  const message = document.querySelector('.payout-message');
  if (message) message.textContent = 'No real money moved. This only demonstrates the payout state.';
});

let selectedRating = 0;
document.querySelectorAll('[data-star]').forEach(button => {
  button.addEventListener('click', () => {
    selectedRating = Number(button.dataset.star);
    document.querySelectorAll('[data-star]').forEach(star => {
      star.classList.toggle('active', Number(star.dataset.star) <= selectedRating);
    });
  });
});

document.querySelector('#review-form')?.addEventListener('submit', (event) => {
  event.preventDefault();
  const message = document.querySelector('.review-message');
  if (!selectedRating) {
    if (message) message.textContent = 'Choose a star rating before submitting.';
    return;
  }
  localStorage.setItem('nomadParkPadDemoReview', JSON.stringify({
    rating: selectedRating,
    review: document.querySelector('#public-review')?.value || ''
  }));
  if (message) message.textContent = 'Demo review saved in this browser.';
  const button = event.currentTarget.querySelector('button[type="submit"]');
  if (button) {
    button.textContent = 'Review Submitted';
    button.disabled = true;
  }
});
