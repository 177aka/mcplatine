// Service Worker PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(err => console.log(err));
  });
}

// Éléments DOM
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

// Fonctionnalité de la croix principale : bascule vers l'écran de chargement infini
closeBtn.addEventListener('click', () => {
  loadingScreen.classList.add('active');
});

// Fonctionnalité de la croix sur l'écran de chargement : revient à la page principale
loadingCloseBtn.addEventListener('click', () => {
  loadingScreen.classList.remove('active');
});

// Clics sur les liens (simule le comportement de chargement infini)
document.getElementById('modalitesLink').addEventListener('click', (e) => {
  e.preventDefault();
  loadingScreen.classList.add('active');
});

document.getElementById('restaurantsLink').addEventListener('click', (e) => {
  e.preventDefault();
  loadingScreen.classList.add('active');
});

// Interaction sur la carte promo
document.getElementById('promoCard').addEventListener('click', () => {
  openModal("Carte Platine", "Offre vérifiée et prête à être appliquée par le gérant.");
});

// Fonctionnalité interactive sur le temps d'expiration
let remainingDays = 3;
periodText.addEventListener('click', () => {
  remainingDays = remainingDays > 1 ? remainingDays - 1 : 5;
  periodText.textContent = `Période de l'offre : Expire dans ${remainingDays} jours`;
});