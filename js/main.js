/*
===============================================
  FIREBASE INITIALIZATION
===============================================
*/
const firebaseConfig = {
    apiKey: "AIzaSyDCa0WJlM0c5aVTb2YD6g5N9EFlSwk458Q",
    authDomain: "schoolconnect-970d5.firebaseapp.com",
    databaseURL: "https://schoolconnect-970d5-default-rtdb.firebaseio.com",
    projectId: "schoolconnect-970d5",
    storageBucket: "schoolconnect-970d5.appspot.com",
    messagingSenderId: "145576179199",
    appId: "1:145576179199:web:65897f211727a3bbf263ca"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();
const auth = firebase.auth(); // Auth is needed for the login modal

/*
===============================================
  PUBLIC ANNOUNCEMENT BOARD LOGIC (main.js)
===============================================
*/
const announcementsDiv = document.getElementById("announcements");
const filterSelect = document.getElementById("filter");
const toast = document.getElementById("toast");
const pinnedToggle = document.getElementById("pinned-toggle");
const darkModeToggle = document.getElementById("dark-mode-toggle");
const body = document.body;

const overlay = document.getElementById("fullscreen-overlay");
const exitBtn = document.getElementById("exit-btn");
const largeTitle = document.getElementById("large-title");
const largeCategory = document.getElementById("large-category");
const largeMessage = document.getElementById("large-message");
const largeTime = document.getElementById("large-time");
const largePinBtn = document.getElementById("large-pin-btn");
let currentAnnouncementId = null;

const searchOverlay = document.getElementById("search-overlay");
const openSearchBtn = document.getElementById("open-search-btn");
const closeSearchBtn = document.getElementById("close-search-btn");
const modalSearchInput = document.getElementById("modal-search-input");
const searchResultsDiv = document.getElementById("search-results-announcements");

// Login Overlay Elements
const loginOverlay = document.getElementById("login-overlay");
const openLoginBtn = document.getElementById("open-login-btn");
const closeLoginBtn = document.getElementById("close-login-btn");

let announcements = [];
let wasSearchModalActive = false;

function enableDarkMode() {
  body.classList.add('dark-mode');
  localStorage.setItem('darkMode', 'enabled');
}

function disableDarkMode() {
  body.classList.remove('dark-mode');
  localStorage.setItem('darkMode', 'disabled');
}

function initDarkMode() {
  const savedMode = localStorage.getItem('darkMode');
  if (savedMode === 'enabled') {
    enableDarkMode();
    darkModeToggle.checked = true;
  } else if (savedMode === null && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    enableDarkMode();
    darkModeToggle.checked = true;
  } else {
    disableDarkMode();
    darkModeToggle.checked = false;
  }
}

darkModeToggle.addEventListener('change', () => {
  if (darkModeToggle.checked) {
    enableDarkMode();
  } else {
    disableDarkMode();
  }
});

initDarkMode();

function getPinnedAnnouncements() {
  return JSON.parse(localStorage.getItem('pinnedAnnouncements')) || [];
}

function togglePin(id) {
  let pinned = getPinnedAnnouncements();
  const index = pinned.indexOf(id);
  if (index > -1) {
    pinned.splice(index, 1);
  } else {
    pinned.push(id);
  }
  localStorage.setItem('pinnedAnnouncements', JSON.stringify(pinned));
  displayAnnouncements(announcementsDiv, applyFilters(announcements, filterSelect.value, null, pinnedToggle.checked), filterSelect.value, pinnedToggle.checked);
  if (searchOverlay.classList.contains('active')) {
    performSearch();
  }
  updateLargePinButton(id);
}

function showToast() {
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 3000);
}

// --- ⬇️ UPDATED THIS FUNCTION ⬇️ ---
db.ref("announcements").on("value", (snapshot) => {
  const newData = [];
  snapshot.forEach((categorySnap) => {
    const categoryVal = categorySnap.val();
    if (categoryVal && categoryVal.title && categoryVal.message && categoryVal.category) {
      // Handle edge case (less likely)
      newData.push({
        id: categorySnap.key,
        ...categoryVal // Push all data from the snapshot
      });
    } else if (categoryVal && typeof categoryVal === 'object') {
      // Standard case: loop through each category
      categorySnap.forEach((postSnap) => {
        const post = postSnap.val();
        if (post && post.title && post.message) {
          newData.push({
            id: postSnap.key,
            ...post // Push all data from the post (including downloadURL and isImage)
          });
        }
      });
    }
  });
  if (announcements.length && newData.length > announcements.length) {
    showToast();
  }
  announcements = newData;
  displayAnnouncements(announcementsDiv, applyFilters(announcements, filterSelect.value, null, pinnedToggle.checked), filterSelect.value, pinnedToggle.checked);
});

function applyFilters(data, categoryFilter, searchTerm, showPinned) {
  const pinnedIds = getPinnedAnnouncements();
  let filtered = data;
  if (showPinned) {
    filtered = filtered.filter(a => pinnedIds.includes(a.id));
  }
  if (categoryFilter !== "all" && categoryFilter !== null) {
    filtered = filtered.filter(a => a.category === categoryFilter);
  }
  if (searchTerm) {
    const lowerSearchTerm = searchTerm.toLowerCase().trim();
    filtered = filtered.filter(a =>
      a.title.toLowerCase().includes(lowerSearchTerm) ||
      a.message.toLowerCase().includes(lowerSearchTerm)
    );
  }
  filtered.sort((a, b) => {
    const isAPinned = pinnedIds.includes(a.id);
    const isBPinned = pinnedIds.includes(b.id);
    if (isAPinned && !isBPinned) return -1;
    if (!isAPinned && isBPinned) return 1;
    return new Date(b.timestamp) - new Date(a.timestamp);
  });
  return filtered;
}

// --- ⬇️ UPDATED THIS FUNCTION ⬇️ ---
function displayAnnouncements(container, filteredData, categoryFilter, showPinnedOnly) {
  container.innerHTML = "";
  const pinnedIds = getPinnedAnnouncements();
  if (!filteredData.length) {
    let noMatchMessage = "No announcements match your current criteria.";
    if (showPinnedOnly && !pinnedIds.length) {
      noMatchMessage = "<p>You haven't pinned any announcements yet. Click the <i class='fas fa-thumbtack'></i> icon on an announcement to pin it.</p>";
    } else if (showPinnedOnly) {
      noMatchMessage = "<p>No pinned announcements match your current filters.</p>";
    } else if (container === searchResultsDiv) {
      noMatchMessage = modalSearchInput.value.trim() ? "No announcements found matching your search term." : "Start typing to see matching announcements.";
    }
    const messageElement = document.createElement('p');
    messageElement.className = container === searchResultsDiv ? 'search-tip' : '';
    messageElement.innerHTML = noMatchMessage;
    container.appendChild(messageElement);
    return;
  }
  
  filteredData.forEach((data) => {
    const div = document.createElement("div");
    
    div.className = `announcement category-${(data.category || 'unknown').toLowerCase()}`;
    div.dataset.announcement = JSON.stringify(data);
    
    const isPinned = pinnedIds.includes(data.id);

    // --- NEW: Logic to show image OR link ---
    let attachmentHTML = '';
    if (data.downloadURL) {
      if (data.isImage) {
        // If it's an image, create an <img> tag
        attachmentHTML = `<img src="${data.downloadURL}" alt="${data.fileName || 'Announcement Image'}" class="announcement-image" onclick="event.stopPropagation()">`;
      } else {
        // Otherwise, create a link (for PDFs, etc.)
        const fileName = data.fileName || 'View Attachment';
        attachmentHTML = `
          <div class="attachment-container">
            <a href="${data.downloadURL}" target="_blank" rel="noopener noreferrer" class="attachment-link" onclick="event.stopPropagation()">
              <i class="fas fa-paperclip"></i> ${fileName}
            </a>
          </div>
        `;
      }
    }
    // --- END OF NEW LOGIC ---

    // --- UPDATED: Add the {attachmentHTML} variable below the time ---
    div.innerHTML = `
      <i class="fas fa-thumbtack pin-btn ${isPinned ? 'pinned' : ''}" title="${isPinned ? 'Unpin' : 'Pin'} announcement"></i>
      <div class="category">${data.category || "Unknown"}</div>
      <h3>${data.title || "No Title"}</h3>
      <p>${data.message || "No message provided."}</p>
      <div class="time">🕒 ${new Date(data.timestamp).toLocaleString()}</div>
      ${attachmentHTML}
    `;
    container.appendChild(div);
  });
}

function updateLargePinButton(id) {
  const pinnedIds = getPinnedAnnouncements();
  const isPinned = pinnedIds.includes(id);
  if (isPinned) {
    largePinBtn.classList.add('pinned');
    largePinBtn.title = 'Unpin announcement';
  } else {
    largePinBtn.classList.remove('pinned');
    largePinBtn.title = 'Pin announcement';
  }
}

// --- ⬇️ UPDATED THIS FUNCTION ⬇️ ---
function openFullScreen(data) {
  currentAnnouncementId = data.id;
  wasSearchModalActive = searchOverlay.classList.contains('active');
  
  largeTitle.textContent = data.title;
  largeMessage.textContent = data.message;
  largeCategory.textContent = data.category;
  largeTime.textContent = `Posted: ${new Date(data.timestamp).toLocaleString()}`;
  largeCategory.className = `category category-${(data.category || 'unknown').toLowerCase()}`;
  
  // --- NEW: Logic to show image OR link in modal ---
  const largeAttachmentEl = document.getElementById('large-attachment');
  if (data.downloadURL) {
    if (data.isImage) {
      // If it's an image, create an <img> tag for the modal
      largeAttachmentEl.innerHTML = `<img src="${data.downloadURL}" alt="${data.fileName || 'Announcement Image'}" class="announcement-image-large">`;
    } else {
      // Otherwise, create a link (for PDFs, etc.)
      const fileName = data.fileName || 'View Attachment';
      largeAttachmentEl.innerHTML = `
        <a href="${data.downloadURL}" target="_blank" rel="noopener noreferrer" class="attachment-link">
          <i class="fas fa-paperclip"></i> ${fileName}
        </a>
      `;
    }
  } else {
    // Clear it if no attachment
    largeAttachmentEl.innerHTML = '';
  }
  // --- END OF NEW LOGIC ---

  updateLargePinButton(data.id);
  searchOverlay.classList.remove('active');
  loginOverlay.classList.remove('active'); // Close login if open
  overlay.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeFullScreen() {
  overlay.classList.remove('active');
  currentAnnouncementId = null;
  if (wasSearchModalActive) {
    searchOverlay.classList.add('active');
    modalSearchInput.focus();
    document.body.style.overflow = 'hidden';
    performSearch();
    wasSearchModalActive = false;
  } else {
    document.body.style.overflow = 'auto';
  }
}

function openSearchModal() {
  overlay.classList.remove('active'); // Close announcement if open
  loginOverlay.classList.remove('active'); // Close login if open
  searchOverlay.classList.add('active');
  document.body.style.overflow = 'hidden';
  modalSearchInput.focus();
  displayAnnouncements(searchResultsDiv, [], null, false);
}

function closeSearchModal() {
  searchOverlay.classList.remove('active');
  document.body.style.overflow = 'auto';
  modalSearchInput.value = "";
  displayAnnouncements(announcementsDiv, applyFilters(announcements, filterSelect.value, null, pinnedToggle.checked), filterSelect.value, pinnedToggle.checked);
}

function performSearch() {
  const searchTerm = modalSearchInput.value;
  const searchResults = applyFilters(announcements, 'all', searchTerm, false);
  displayAnnouncements(searchResultsDiv, searchResults, 'all', false);
}

// Login Modal Functions
function openLoginModal() {
  searchOverlay.classList.remove('active'); // Close search if open
  overlay.classList.remove('active'); // Close announcement if open
  loginOverlay.classList.add('active');
  document.body.style.overflow = 'hidden';
  const emailInput = document.getElementById('email');
  if(emailInput) emailInput.focus(); // Focus on email input
}

function closeLoginModal() {
  loginOverlay.classList.remove('active');
  document.body.style.overflow = 'auto';
}


filterSelect.addEventListener("change", () => displayAnnouncements(announcementsDiv, applyFilters(announcements, filterSelect.value, null, pinnedToggle.checked), filterSelect.value, pinnedToggle.checked));
pinnedToggle.addEventListener("change", () => displayAnnouncements(announcementsDiv, applyFilters(announcements, filterSelect.value, null, pinnedToggle.checked), filterSelect.value, pinnedToggle.checked));

openSearchBtn.addEventListener('click', (e) => {
  e.preventDefault();
  openSearchModal();
});
closeSearchBtn.addEventListener('click', closeSearchModal);
modalSearchInput.addEventListener("input", performSearch);

// Login Modal Listeners
if (openLoginBtn) {
  openLoginBtn.addEventListener('click', (e) => {
    e.preventDefault();
    openLoginModal();
  });
}
if (closeLoginBtn) {
  closeLoginBtn.addEventListener('click', closeLoginModal);
}
if (loginOverlay) {
  loginOverlay.addEventListener('click', (e) => {
    if (e.target === loginOverlay) {
      closeLoginModal();
    }
  });
}

searchOverlay.addEventListener('click', (e) => {
  if (e.target === searchOverlay) {
    closeSearchModal();
  }
});

document.addEventListener('click', (e) => {
  const announcementCard = e.target.closest('.announcement');
  if (!announcementCard) return;
  if (e.target.classList.contains('pin-btn')) {
    try {
      const id = JSON.parse(announcementCard.dataset.announcement).id;
      if (id) togglePin(id);
    } catch (error) {
      console.error("Error parsing ID for pinning:", error);
    }
    e.stopPropagation();
  } else {
    // Check if the click was on the image or link
    if (e.target.closest('.attachment-link') || e.target.closest('.announcement-image')) {
      // Let the link or image click go through
      return;
    }
    // Otherwise, open the modal
    try {
      const data = JSON.parse(announcementCard.dataset.announcement);
      openFullScreen(data);
    } catch (error) {
      console.error("Error parsing announcement data:", error);
    }
  }
});

largePinBtn.addEventListener('click', () => {
  if (currentAnnouncementId) {
    togglePin(currentAnnouncementId);
  }
});

exitBtn.addEventListener('click', closeFullScreen);

overlay.addEventListener('click', (e) => {
  if (e.target === overlay) {
    closeFullScreen();
  }
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    if (overlay.classList.contains('active')) {
      closeFullScreen();
    } else if (searchOverlay.classList.contains('active')) {
      closeSearchModal();
    } else if (loginOverlay && loginOverlay.classList.contains('active')) {
      closeLoginModal();
    }
  }
});

/*
===============================================
  LOGIN MODAL AUTHENTICATION LOGIC
===============================================
*/
const loginBtn = document.getElementById("loginBtn");
if (loginBtn) {
    const emailEl = document.getElementById('email');
    const passwordEl = document.getElementById('password');
    const emailErrorEl = document.getElementById('emailError');
    const passwordErrorEl = document.getElementById('passwordError');
    const loginErrorEl = document.getElementById('loginError');
    const loginSuccessEl = document.getElementById('loginSuccess');

    function clearErrors() {
        if (emailErrorEl) emailErrorEl.textContent = '';
        if (passwordErrorEl) passwordErrorEl.textContent = '';
        if (loginErrorEl) {
            loginErrorEl.style.display = 'none';
            loginErrorEl.textContent = '';
        }
        if (loginSuccessEl) {
            loginSuccessEl.style.display = 'none';
            loginSuccessEl.textContent = '';
            loginSuccessEl.classList.remove('show');
        }
        if (emailEl) emailEl.classList.remove('error');
        if (passwordEl) passwordEl.classList.remove('error');
    }

    function isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    [emailEl, passwordEl].forEach((el) => {
        if (!el) return;
        el.addEventListener('input', () => {
            clearErrors();
        });
    });

    loginBtn.addEventListener('click', () => {
        clearErrors();
        const email = emailEl.value.trim();
        const password = passwordEl.value.trim();
        let hasError = false;
        if (!email) {
            emailErrorEl.textContent = 'Please enter your email.';
            emailEl.classList.add('error');
            hasError = true;
        } else if (!isValidEmail(email)) {
            emailErrorEl.textContent = 'Please enter a valid email address.';
            emailEl.classList.add('error');
            hasError = true;
        }
        if (!password) {
            passwordErrorEl.textContent = 'Please enter your password.';
            passwordEl.classList.add('error');
            hasError = true;
        } else if (password.length < 6) {
            passwordErrorEl.textContent = 'Password must be at least 6 characters.';
            passwordEl.classList.add('error');
            hasError = true;
        }
        if (hasError) return;

        loginBtn.disabled = true;
        const originalText = loginBtn.innerHTML;
        loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing in...';

        auth.signInWithEmailAndPassword(email, password)
            .then(() => {
                if (loginSuccessEl) {
                    loginSuccessEl.textContent = '✅ Login successful — redirecting...';
                    loginSuccessEl.style.display = 'block';
                    setTimeout(() => loginSuccessEl.classList.add('show'), 20);
                }
                setTimeout(() => {
                    window.location.href = 'admin.html';
                }, 900);
            })
            .catch((error) => {
                const code = error.code || '';
                let message = 'Login failed. Please try again.';
                
                if (code === 'auth/invalid-credential' || code === 'auth/invalid-login-credentials') {
                    message = 'Invalid email or password. Please try again.';
                    loginErrorEl.textContent = message;
                    loginErrorEl.style.display = 'block';
                    emailEl.classList.add('error');
                    passwordEl.classList.add('error');
                } else if (code === 'auth/invalid-email') {
                    message = 'That email address is invalid.';
                    emailEl.classList.add('error');
                    emailErrorEl.textContent = message;
                } else if (code === 'auth/too-many-requests') {
                    message = 'Too many failed attempts. Please try again later.';
                    loginErrorEl.textContent = message;
                    loginErrorEl.style.display = 'block';
                } else if (code === 'auth/user-disabled') {
                    message = 'This user account has been disabled.';
                    loginErrorEl.textContent = message;
                    loginErrorEl.style.display = 'block';
                } else {
                    console.error("Firebase Login Error:", error); 
                    message = 'An unexpected error occurred. Please try again.';
                    loginErrorEl.textContent = message;
                    loginErrorEl.style.display = 'block';
                }
                
                loginBtn.disabled = false;
                loginBtn.innerHTML = originalText;
            });
    });
}