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
const loadingSteps = document.getElementById('loadingSteps');
const trialBtn = document.getElementById('trialBtn');
const closeBtn = document.getElementById('closeBtn');

// --- Anti-veille de l'écran (Wake Lock API) ---
let wakeLock = null;
async function requestWakeLock() {
  if ('wakeLock' in navigator) {
    try {
      wakeLock = await navigator.wakeLock.request('screen');
    } catch (err) {
      console.log("Erreur Wake Lock:", err);
    }
  }
}

// Relâcher ou réactiver le Wake Lock si l'app change de focus
document.addEventListener('visibilitychange', async () => {
  if (wakeLock !== null && document.visibilityState === 'visible') {
    if (localStorage.getItem('platine_unlocked') === 'true') {
      await requestWakeLock();
    }
  }
});

function lockApp() {
  if (lockScreen) lockScreen.classList.remove('hidden');
  document.body.classList.add('locked');
  if (wakeLock) {
    wakeLock.release().then(() => { wakeLock = null; });
  }
}

function unlockApp() {
  if (lockScreen) lockScreen.classList.add('hidden');
  document.body.classList.remove('locked');
  requestWakeLock(); // Active l'anti-veille dès le déverrouillage
}

function showCustomModal(title, message, onConfirm, confirmText = "Confirmer") {
  const existingOverlay = document.getElementById('customModalOverlay');
  if (existingOverlay) existingOverlay.remove();

  const overlay = document.createElement('div');
  overlay.id = 'customModalOverlay';
  overlay.className = 'custom-modal-overlay';

  overlay.innerHTML = `
    <div class="custom-modal">
      <h3>${title}</h3>
      <p>${message}</p>
      <div class="custom-modal-actions">
        <button class="btn-cancel" id="modalCancelBtn">Annuler</button>
        <button class="btn-confirm-danger" id="modalConfirmBtn">${confirmText}</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  document.getElementById('modalCancelBtn').addEventListener('click', () => {
    overlay.remove();
  });

  document.getElementById('modalConfirmBtn').addEventListener('click', () => {
    overlay.remove();
    if (onConfirm) onConfirm();
  });
}

// Vérification initiale de la licence au démarrage
if (localStorage.getItem('platine_unlocked') === 'true') {
  const savedCode = localStorage.getItem('platine_used_code');
  
  if (savedCode && deviceId) {
    if(loadingSteps) loadingSteps.textContent = "Vérification de la licence en arrière-plan...";
    fetch(`${GOOGLE_SCRIPT_URL}?action=verify&code=${encodeURIComponent(savedCode)}&deviceId=${encodeURIComponent(deviceId)}`)
      .then(response => response.json())
      .then(data => {
        if(loadingSteps) loadingSteps.textContent = "";
        if (!data.valid) {
          localStorage.removeItem('platine_unlocked');
          localStorage.removeItem('platine_used_code');
          lockApp();
          if (lockError) lockError.textContent = data.reason || "Licence expirée ou révoquée.";
        } else {
          unlockApp();
        }
      })
      .catch(() => {
        if(loadingSteps) loadingSteps.textContent = "";
        unlockApp(); // Tolérance hors-ligne
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
      lockError.textContent = "Veuillez entrer une licence valide.";
      return;
    }

    unlockBtn.disabled = true;
    unlockBtn.textContent = "Connexion...";
    lockError.textContent = "";
    
    if(loadingSteps) loadingSteps.textContent = "1. Connexion au serveur sécurisé...";
    
    setTimeout(() => {
      if(loadingSteps) loadingSteps.textContent = "2. Interrogation de l'API Google Sheets...";
    }, 400);

    fetch(`${GOOGLE_SCRIPT_URL}?action=verify&code=${encodeURIComponent(enteredCode)}&deviceId=${encodeURIComponent(deviceId)}`)
      .then(response => {
        if(loadingSteps) loadingSteps.textContent = "3. Analyse de la réponse du serveur...";
        return response.json();
      })
      .then(data => {
        unlockBtn.disabled = false;
        unlockBtn.textContent = "Déverrouiller";
        if(loadingSteps) loadingSteps.textContent = "";

        if (data.valid) {
          localStorage.setItem('platine_unlocked', 'true');
          localStorage.setItem('platine_used_code', enteredCode);
          unlockApp();
        } else {
          lockError.textContent = data.reason || "Licence invalide ou déjà utilisée sur un autre appareil.";
        }
      })
      .catch(() => {
        unlockBtn.disabled = false;
        unlockBtn.textContent = "Déverrouiller";
        if(loadingSteps) loadingSteps.textContent = "";
        lockError.textContent = "Erreur de connexion internet avec le serveur.";
      });
  });
}

if (trialBtn) {
  trialBtn.addEventListener('click', () => {
    const hasClaimedTrial = localStorage.getItem('platine_trial_claimed');
    if (hasClaimedTrial === 'true') {
      showCustomModal(
        "Déjà réclamé",
        "Vous avez déjà réclamé votre journée d'essai gratuite sur cet appareil. Contactez @qcplgstarz sur Snapchat pour un forfait complet ou sur-mesure.",
        () => {},
        "Compris"
      );
      return;
    }
    
    localStorage.setItem('platine_trial_claimed', 'true');
    window.location.href = "https://www.snapchat.com/add/qcplgstarz";
  });
}

if (closeBtn) {
  closeBtn.addEventListener('click', () => {
    const currentLicence = localStorage.getItem('platine_used_code') || "Aucune";
    
    const accountHTML = `
      <div class="modalites-text">
        <p>Bienvenue dans votre espace de gestion <strong>Mon Compte</strong>.</p>
        
        <div class="account-box">
          <strong>Votre Licence active :</strong>
          <div class="licence-row">
            <span id="maskedLicence">••••••••••••••••</span>
            <button id="toggleLicenceBtn" type="button">Afficher</button>
          </div>
          <div class="warning-share">Avertissement : Ne partagez jamais votre licence sous peine de révocation définitive et immédiate.</div>
        </div>

        <div class="account-box">
          <strong>État de l'abonnement :</strong>
          <p style="margin: 6px 0 0 0; font-size:13px; color:#444;" id="subStatusText">Chargement des données en direct...</p>
        </div>

        <div class="account-box">
          <strong>Tarifs & Support officiel :</strong>
          <p style="margin: 6px 0 0 0; font-size:13px;">
            • 1 Jour : 2 $<br>
            • 1 Semaine : 7 $<br>
            • 2 Mois : 13 $<br>
            • À Vie : 34 $<br>
            • Sur mesure : Disponible sur demande.<br><br>
            Pour tout achat ou question, contactez <strong>qcplgstarz</strong> sur Snapchat.
          </p>
        </div>

        <button class="danger-btn" id="logoutBtn">Se déconnecter de l'appareil</button>
      </div>
    `;

    openSubPage("Mon Compte", accountHTML);

    let isVisible = false;
    const toggleBtn = document.getElementById('toggleLicenceBtn');
    const maskedSpan = document.getElementById('maskedLicence');
    
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        isVisible = !isVisible;
        if (isVisible) {
          maskedSpan.textContent = currentLicence;
          toggleBtn.textContent = "Masquer";
        } else {
          maskedSpan.textContent = "••••••••••••••••";
          toggleBtn.textContent = "Afficher";
        }
      });
    }

    // Interrogation pour récupérer le statut et le temps restant exact
    const subStatusText = document.getElementById('subStatusText');
    fetch(`${GOOGLE_SCRIPT_URL}?action=verify&code=${encodeURIComponent(currentLicence)}&deviceId=${encodeURIComponent(deviceId)}`)
      .then(res => res.json())
      .then(data => {
        if (subStatusText) {
          if (data.valid) {
            let expirationText = data.expDate === "À vie" ? "Accès permanent (À vie)" : `Expire le : ${data.expDate}`;
            
            // Calcul du temps restant si ce n'est pas "À vie"
            let timeRemainingHTML = "";
            if (data.expDate !== "À vie") {
              const expDateObj = new Date(data.expDate + "T23:59:59");
              const now = new Date();
              const diffTime = expDateObj - now;
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              
              if (diffDays > 0) {
                timeRemainingHTML = `<br><small style="color: #22a7f2; font-weight: 600;">Temps restant : ${diffDays} jour(s)</small>`;
              } else {
                timeRemainingHTML = `<br><small style="color: #d8232a; font-weight: 600;">Expire aujourd'hui</small>`;
              }
            }

            subStatusText.innerHTML = `
              <span style="color: green; font-weight: bold;">● Licence active et valide</span><br>
              <span>${expirationText}</span>
              ${timeRemainingHTML}
              <br><small style="color: #666;">Appareil lié et sécurisé.</small>
            `;
          } else {
            subStatusText.innerHTML = `<span style="color: red; font-weight: bold;">● ${data.reason || "Problème détecté avec la licence"}</span>`;
          }
        }
      })
      .catch(() => {
        if (subStatusText) {
          subStatusText.textContent = "Statut actif (Mode hors-ligne)";
        }
      });

    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        showCustomModal(
          "Déconnexion",
          "Êtes-vous sûr de vouloir vous déconnecter de cet appareil ? Vous aurez besoin d'une licence valide pour vous reconnecter.",
          () => {
            localStorage.removeItem('platine_unlocked');
            localStorage.removeItem('platine_used_code');
            window.location.reload();
          },
          "Se déconnecter"
        );
      });
    }
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