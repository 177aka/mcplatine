const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwY4dFf7R8uF0mt73GLS8zXSjDSaZOZBsDLxxioO8Gwe8GexEBmMbghlYIEE6JRo_z5/exec";

let deviceId = localStorage.getItem('mcd_device_id');
if (!deviceId) {
  deviceId = 'DEV-' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  localStorage.setItem('mcd_device_id', deviceId);
}

const lockScreen = document.getElementById('lockScreen');
const accessCodeInput = document.getElementById('accessCodeInput');
const unlockBtn = document.getElementById('unlockBtn');
const lockError = document.getElementById('lockError');

function lockApp() {
  if (lockScreen) lockScreen.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
  document.body.style.height = '100vh';
  document.body.style.position = 'fixed';
  document.body.style.width = '100%';
}

function unlockApp() {
  if (lockScreen) lockScreen.classList.add('hidden');
  document.body.style.overflow = '';
  document.body.style.height = '';
  document.body.style.position = '';
  document.body.style.width = '';
}

// Vérification au démarrage + contrôle strict en ligne / tolérance hors-ligne
if (localStorage.getItem('platine_unlocked') === 'true') {
  const savedCode = localStorage.getItem('platine_used_code');
  
  if (savedCode && deviceId) {
    // On essaie de vérifier auprès de Google Sheets
    fetch(`${GOOGLE_SCRIPT_URL}?action=verify&code=${encodeURIComponent(savedCode)}&deviceId=${encodeURIComponent(deviceId)}`)
      .then(response => response.json())
      .then(data => {
        if (!data.valid) {
          // INTERNET ACTIF MAIS CODE SUPPRIMÉ/BLOQUÉ : On bloque immédiatement !
          localStorage.removeItem('platine_unlocked');
          localStorage.removeItem('platine_used_code');
          lockApp();
          if (lockError) lockError.textContent = "Accès révoqué ou supprimé par l'administrateur.";
        } else {
          // TOUT EST VALIDE : On déverrouille
          unlockApp();
        }
      })
      .catch(() => {
        // PAS DE RÉSEAU (Erreur de connexion) : On laisse l'accès temporairement 
        // pour ne pas bloquer le client légitime s'il n'a pas de 4G sur le moment.
        unlockApp();
      });
  } else {
    localStorage.removeItem('platine_unlocked');
    lockApp();
  }
} else {
  lockApp();
}

if (unlockBtn) {
  unlockBtn.addEventListener('click', () => {
    const enteredCode = accessCodeInput.value.trim();
    if (!enteredCode) {
      lockError.textContent = "Veuillez entrer un code.";
      return;
    }

    unlockBtn.textContent = "Vérification...";
    lockError.textContent = "";

    fetch(`${GOOGLE_SCRIPT_URL}?action=verify&code=${encodeURIComponent(enteredCode)}&deviceId=${encodeURIComponent(deviceId)}`)
      .then(response => response.json())
      .then(data => {
        if (data.valid) {
          localStorage.setItem('platine_unlocked', 'true');
          localStorage.setItem('platine_used_code', enteredCode); // Mémorise le code utilisé
          unlockApp();
        } else {
          lockError.textContent = data.reason || "Code invalide ou déjà utilisé ailleurs.";
          unlockBtn.textContent = "Déverrouiller";
        }
      })
      .catch(() => {
        lockError.textContent = "Erreur de connexion internet.";
        unlockBtn.textContent = "Déverrouiller";
      });
  });
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(err => console.log(err));
  });
}

window.addEventListener('load', () => {
  setTimeout(() => {
    const splash = document.getElementById('splashScreen');
    if (splash) {
      splash.classList.add('fade-out');
      setTimeout(() => splash.remove(), 300);
    }
  }, 400);
});

function checkEnvironment() {
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
  const isDesktop = !isTouchDevice && !/Mobile|Android/i.test(navigator.userAgent);

  if (isMobile && !isStandalone && !isDesktop) {
    document.getElementById('pwaInstallNotice').classList.add('active');
  }
}

checkEnvironment();

const pwaNotice = document.getElementById('pwaInstallNotice');
if (pwaNotice) {
  pwaNotice.addEventListener('click', () => {
    pwaNotice.classList.remove('active');
  });
}

const mainView = document.getElementById('mainView');
const subView = document.getElementById('subView');
const pageTitle = document.getElementById('pageTitle');
const pageBody = document.getElementById('pageBody');
const backBtn = document.getElementById('backBtn');
const periodText = document.getElementById('periodText');

function openSubPage(title, contentHTML) {
  pageTitle.textContent = title;
  pageBody.innerHTML = contentHTML;
  mainView.classList.remove('active');
  subView.classList.add('active');
  window.scrollTo(0, 0);
}

if (backBtn) {
  backBtn.addEventListener('click', () => {
    subView.classList.remove('active');
    mainView.classList.add('active');
    window.scrollTo(0, 0);
  });
}

document.getElementById('modalitesLink').addEventListener('click', (e) => {
  e.preventDefault();
  const modalitesHTML = `
    <div class="modalites-text">
      <p>Dans les restaurants McDonald's du Canada participants des régions précisées dans l'offre. Disponibilité varie d'un restaurant à l'autre. 1 réclamation/offre, sauf indication contraire dans l'offre. Max. 1 offre/transaction. Ne peut être jumelée à aucune autre offre/promo ni rabais/bon.</p>
      <p>Taxes en sus. Frais de consigne (bouteille et emballage) applicables là où la loi l'exige. Prix McLivraison peuvent être supérieurs à ceux en resto. Frais de livr. (0 $), de service (11 %) et pour petite commande (2 $) (commandes de moins de 12 $, avant tx/frais), et tout autre frais/tx requis par la loi.</p>
      <p>L'offre ne peut être reproduite, transférée ou utilisée par autrui. Valable au moment où le produit est servi. Des exclusions peuvent s'appliquer. Aucune substitution. Peut ne pas s'appliquer aux commandes personnalisées. Supplément peut s'appliquer pour l'ajout/substitution d'ingrédient/garniture, ou personnalisation. Périodes d'offres valables aux heures locales. McDonald's se réserve le droit de mettre un terme à cette offre en tout temps.</p>
    </div>
  `;
  openSubPage("Modalités de cette offre", modalitesHTML);
});

document.getElementById('restaurantsLink').addEventListener('click', (e) => {
  e.preventDefault();
  const restauHTML = `
    <div class="modalites-text">
      <p>Cette offre est valable dans la grande majorité des restaurants McDonald's du Canada participants.</p>
      <p>Veuillez présenter l'offre directement au comptoir en restaurant lors de votre commande.</p>
      <p><em>Note : L'offre s'applique exclusivement au comptoir et n'est pas disponible au service-au-volant, aux bornes ni à la livraison.</em></p>
    </div>
  `;
  openSubPage("Restaurants participants", restauHTML);
});

const cycleDays = [
  "Expire dans 3 jours",
  "Expire dans 2 jours",
  "Expire demain",
  "Expire aujourd'hui"
];

let cycleIndex = parseInt(localStorage.getItem('platine_cycle_index')) || 0;
if (periodText) {
  periodText.textContent = `Période de l'offre : ${cycleDays[cycleIndex]}`;

  periodText.addEventListener('click', () => {
    cycleIndex = (cycleIndex + 1) % cycleDays.length;
    localStorage.setItem('platine_cycle_index', cycleIndex);
    periodText.textContent = `Période de l'offre : ${cycleDays[cycleIndex]}`;
  });
}