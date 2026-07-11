const rate = document.querySelector('#nightly-rate');
const nights = document.querySelector('#available-nights');
const rateOut = document.querySelector('#rate-output');
const nightsOut = document.querySelector('#nights-output');
const incomeOut = document.querySelector('#income-output');

function updateIncome() {
  const r = Number(rate?.value || 0);
  const n = Number(nights?.value || 0);
  if (rateOut) rateOut.textContent = r;
  if (nightsOut) nightsOut.textContent = n;
  if (incomeOut) incomeOut.textContent = (r * n).toLocaleString();
}

rate?.addEventListener('input', updateIncome);
nights?.addEventListener('input', updateIncome);
updateIncome();

document.querySelector('.host-form')?.addEventListener('submit', (event) => {
  event.preventDefault();
  const message = event.currentTarget.querySelector('.host-form-message');
  const button = event.currentTarget.querySelector('button');
  if (message) message.textContent = 'Thanks! Your founding-host interest has been recorded for this preview.';
  if (button) {
    button.textContent = 'Thanks — You’re on the list';
    button.disabled = true;
  }
});
