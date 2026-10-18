if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(err => console.log(err));
  });
}

const modal = document.getElementById('infoModal');
const modalTitle = document.getElementById('modalTitle');
const modalBody = document.getElementById('modalBody');
const modalClose = document.getElementById('modalClose');
const loadingScreen = document.getElementById('loadingScreen');
const closeBtn = document.getElementById('closeBtn');
const loadingCloseBtn = document.getElementById('loadingCloseBtn');
const periodText = document.getElementById('periodText');

function openModal(title, body) {
  modalTitle.textContent = title;
  modalBody.textContent = body;
  modal.classList.add('active');
}

if (modalClose) {
  modalClose.addEventListener('click', () => {
    modal.classList.remove('active');
  });
}

closeBtn.addEventListener('click', () => {
  loadingScreen.classList.add('active');
});

loadingCloseBtn.addEventListener('click', () => {
  loadingScreen.classList.remove('active');
});

document.getElementById('modalitesLink').addEventListener('click', (e) => {
  e.preventDefault();
  loadingScreen.classList.add('active');
});

document.getElementById('restaurantsLink').addEventListener('click', (e) => {
  e.preventDefault();
  loadingScreen.classList.add('active');
});

document.getElementById('promoCard').addEventListener('click', () => {
  openModal("Carte Platine", "Offre vérifiée et prête à être appliquée par le gérant.");
});

let remainingDays = 3;
periodText.addEventListener('click', () => {
  remainingDays = remainingDays > 1 ? remainingDays - 1 : 5;
  periodText.textContent = `Période de l'offre : Expire dans ${remainingDays} jours`;
});