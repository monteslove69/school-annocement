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

// --- Main App Elements ---
const announcementsDiv = document.getElementById("announcements");
const filterSelect = document.getElementById("filter");
const toast = document.getElementById("toast");
const pinnedToggle = document.getElementById("pinned-toggle");
const darkModeToggle = document.getElementById("dark-mode-toggle");
const body = document.body;

// --- Full Screen Announcement Overlay Elements ---
const overlay = document.getElementById("fullscreen-overlay");
const exitBtn = document.getElementById("exit-btn");
const largeTitle = document.getElementById("large-title");
const largeCategory = document.getElementById("large-category");
const largeMessage = document.getElementById("large-message");
const largeTime = document.getElementById("large-time");
const largePinBtn = document.getElementById("large-pin-btn");
let currentAnnouncementId = null;

// --- NEW Search Modal Elements ---
const searchOverlay = document.getElementById("search-overlay");
const openSearchBtn = document.getElementById("open-search-btn"); // The nav tab button
const closeSearchBtn = document.getElementById("close-search-btn");
const modalSearchInput = document.getElementById("modal-search-input"); // The new input
const searchResultsDiv = document.getElementById("search-results-announcements");

let announcements = [];
let wasSearchModalActive = false; // 🔑 FIX 2: Tracks if the search modal was open when fullscreen was launched

// ==============================
// DARK MODE LOGIC
// ==============================

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
    // Check for OS preference if no setting saved
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

// ==============================
// PINNING & TOAST LOGIC
// ==============================

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
  // Re-render both main and search views after pinning
  displayAnnouncements(announcementsDiv, applyFilters(announcements, filterSelect.value, null, pinnedToggle.checked), filterSelect.value, pinnedToggle.checked);
  // Re-run search logic if modal is open
  if (searchOverlay.classList.contains('active')) {
    performSearch();
  }
  updateLargePinButton(id);
}

function showToast() {
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 3000);
}

// ==============================
// DATABASE FETCH & MAIN DISPLAY
// ==============================

db.ref("announcements").on("value", (snapshot) => {
  const newData = [];

  snapshot.forEach((categorySnap) => {
    const categoryVal = categorySnap.val();
    
    // Check if the node itself is an announcement
    if (categoryVal && categoryVal.title && categoryVal.message && categoryVal.category) {
      newData.push({
        id: categorySnap.key,
        title: categoryVal.title || "Untitled",
        message: categoryVal.message || "No message",
        category: categoryVal.category || "Uncategorized",
        timestamp: categoryVal.timestamp || new Date().toISOString()
      });
    } else if (categoryVal && typeof categoryVal === 'object') {
      // If it's a category container, iterate through child posts
      categorySnap.forEach((postSnap) => {
        const post = postSnap.val();
        if (post && post.title && post.message) {
          newData.push({
            id: postSnap.key,
            title: post.title || "Untitled",
            message: post.message || "No message",
            category: post.category || "Uncategorized",
            timestamp: post.timestamp || new Date().toISOString()
          });
        }
      });
    }
  });

  if (announcements.length && newData.length > announcements.length) {
    showToast();
  }

  announcements = newData;
  // Initial display call using the default filters and container
  displayAnnouncements(announcementsDiv, applyFilters(announcements, filterSelect.value, null, pinnedToggle.checked), filterSelect.value, pinnedToggle.checked);
});

// ==============================
// CORE FILTER/SEARCH LOGIC (REUSABLE)
// ==============================

function applyFilters(data, categoryFilter, searchTerm, showPinned) {
  const pinnedIds = getPinnedAnnouncements();
  let filtered = data;

  // 1. Pinned Filter
  if (showPinned) {
    filtered = filtered.filter(a => pinnedIds.includes(a.id));
  }

  // 2. Category Filter
  if (categoryFilter !== "all" && categoryFilter !== null) {
    filtered = filtered.filter(a => a.category === categoryFilter);
  }

  // 3. Search Filter
  if (searchTerm) {
    const lowerSearchTerm = searchTerm.toLowerCase().trim();
    filtered = filtered.filter(a =>
      a.title.toLowerCase().includes(lowerSearchTerm) ||
      a.message.toLowerCase().includes(lowerSearchTerm)
    );
  }

  // 4. Sorting (Pinned first, then by date)
  filtered.sort((a, b) => {
    const isAPinned = pinnedIds.includes(a.id);
    const isBPinned = pinnedIds.includes(b.id);
    
    if (isAPinned && !isBPinned) return -1;
    if (!isAPinned && isBPinned) return 1;
    
    return new Date(b.timestamp) - new Date(a.timestamp);
  });

  return filtered;
}

/**
 * Renders announcements into a specified container.
 * @param {HTMLElement} container The DOM element to render into (e.g., announcementsDiv or searchResultsDiv).
 * @param {Array} filteredData The list of announcements to display.
 * @param {string} categoryFilter The currently selected category filter.
 * @param {boolean} showPinnedOnly Whether the pinned toggle is active.
 */
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
    div.className = "announcement";
    // Store the full data object on the element for easy retrieval when clicked
    div.dataset.announcement = JSON.stringify(data);
    
    const isPinned = pinnedIds.includes(data.id);
    
    div.innerHTML = `
      <i class="fas fa-thumbtack pin-btn ${isPinned ? 'pinned' : ''}" title="${isPinned ? 'Unpin' : 'Pin'} announcement"></i>
      <div class="category">${data.category || "Unknown"}</div>
      <h3>${data.title || "No Title"}</h3>
      <p>${data.message || "No message provided."}</p>
      <div class="time">🕒 ${new Date(data.timestamp).toLocaleString()}</div>
    `;
    container.appendChild(div);
  });
}

// ==============================
// ANNOUNCEMENT MODAL LOGIC
// ==============================

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

/**
 * Opens the fullscreen announcement modal.
 * @param {object} data The full announcement object.
 */
function openFullScreen(data) {
  currentAnnouncementId = data.id;

  // 🔑 FIX 2: Capture state before we hide the search modal
  wasSearchModalActive = searchOverlay.classList.contains('active'); 
  
  largeTitle.textContent = data.title;
  largeMessage.textContent = data.message;
  // FIX 1: The category text content is set, rely on CSS to fix formatting issues.
  largeCategory.textContent = data.category;
  largeTime.textContent = `Posted: ${new Date(data.timestamp).toLocaleString()}`;
  
  // Ensure category class is set correctly (for styling based on content)
  largeCategory.className = 'category'; 
  
  updateLargePinButton(data.id);
  
  // 🔑 FIX 1: Hide the search modal to prevent overlay conflict
  searchOverlay.classList.remove('active'); 
  
  overlay.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeFullScreen() {
  overlay.classList.remove('active');
  currentAnnouncementId = null;

  // 🔑 FIX 2: Use the captured state to restore the view
  if (wasSearchModalActive) {
      searchOverlay.classList.add('active');
      modalSearchInput.focus(); // Keep the input focused for continuous searching
      document.body.style.overflow = 'hidden'; // Keep body hidden for search modal
      wasSearchModalActive = false; // Reset flag for next time
  } else {
      // If search wasn't active, return to the default flow (main page)
      document.body.style.overflow = 'auto';
  }
}

// ==============================
// NEW SEARCH MODAL LOGIC
// ==============================

function openSearchModal() {
  searchOverlay.classList.add('active');
  document.body.style.overflow = 'hidden';
  modalSearchInput.focus(); // Focus the input when the modal opens
  // Initial display: shows search tip
  displayAnnouncements(searchResultsDiv, [], null, false); 
}

function closeSearchModal() {
  searchOverlay.classList.remove('active');
  document.body.style.overflow = 'auto';
  modalSearchInput.value = ""; // Clear search term on close
  // Re-display main announcements view if needed
  displayAnnouncements(announcementsDiv, applyFilters(announcements, filterSelect.value, null, pinnedToggle.checked), filterSelect.value, pinnedToggle.checked);
}

function performSearch() {
  const searchTerm = modalSearchInput.value;
  // Apply search filter to ALL announcements, ignoring the main view's category/pinned filters
  const searchResults = applyFilters(announcements, 'all', searchTerm, false); 
  // Display search results in the search modal container
  displayAnnouncements(searchResultsDiv, searchResults, 'all', false);
}

// ==============================
// EVENT LISTENERS
// ==============================

// Main View Filters
filterSelect.addEventListener("change", () => displayAnnouncements(announcementsDiv, applyFilters(announcements, filterSelect.value, null, pinnedToggle.checked), filterSelect.value, pinnedToggle.checked));
pinnedToggle.addEventListener("change", () => displayAnnouncements(announcementsDiv, applyFilters(announcements, filterSelect.value, null, pinnedToggle.checked), filterSelect.value, pinnedToggle.checked));


// New Search Modal Event Handlers
openSearchBtn.addEventListener('click', (e) => {
    e.preventDefault(); // Prevent default link behavior
    openSearchModal();
});
closeSearchBtn.addEventListener('click', closeSearchModal);

modalSearchInput.addEventListener("input", performSearch);

searchOverlay.addEventListener('click', (e) => {
    // Close modal if user clicks on the dimmed background area
    if (e.target === searchOverlay) {
        closeSearchModal();
    }
});

// Event listener for opening full screen from EITHER the main or search results
// This uses event delegation, which is why it works for dynamically loaded content (search results)
document.addEventListener('click', (e) => {
  const announcementCard = e.target.closest('.announcement');
  if (!announcementCard) return;

  // Pin button click handler (works in both main and search results)
  if (e.target.classList.contains('pin-btn')) {
    // Pin button is clicked, toggle pin status
    try {
        const id = JSON.parse(announcementCard.dataset.announcement).id;
        if (id) {
          togglePin(id);
        }
    } catch (error) {
        console.error("Error parsing ID for pinning:", error);
    }
    // Prevent the card click logic from firing after pinning
    e.stopPropagation(); 
  } 
  
  // Card click handler (opens full screen)
  else {
    try {
      const data = JSON.parse(announcementCard.dataset.announcement);
      // This will now hide the search overlay before showing the fullscreen announcement
      openFullScreen(data); 
    } catch (error) {
      console.error("Error parsing announcement data:", error);
    }
  }
});


// Full Screen Announcement Overlay Handlers
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
      closeFullScreen(); // Will now return to search if it was active
    } else if (searchOverlay.classList.contains('active')) {
      closeSearchModal();
    }
  }
});

// Initial display on load (called inside the db.ref handler)
// displayAnnouncements() has been replaced by the call in the db.ref handler