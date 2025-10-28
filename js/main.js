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

db.ref("announcements").on("value", (snapshot) => {
  const newData = [];
  snapshot.forEach((categorySnap) => {
    const categoryVal = categorySnap.val();
    if (categoryVal && categoryVal.title && categoryVal.message && categoryVal.category) {
      newData.push({
        id: categorySnap.key,
        title: categoryVal.title || "Untitled",
        message: categoryVal.message || "No message",
        category: categoryVal.category || "Uncategorized",
        timestamp: categoryVal.timestamp || new Date().toISOString()
      });
    } else if (categoryVal && typeof categoryVal === 'object') {
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
    return new Date(b.timestamp) - new Date(b.timestamp);
  });
  return filtered;
}

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

function openFullScreen(data) {
  currentAnnouncementId = data.id;
  wasSearchModalActive = searchOverlay.classList.contains('active');
  largeTitle.textContent = data.title;
  largeMessage.textContent = data.message;
  largeCategory.textContent = data.category;
  largeTime.textContent = `Posted: ${new Date(data.timestamp).toLocaleString()}`;
  largeCategory.className = 'category';
  updateLargePinButton(data.id);
  searchOverlay.classList.remove('active');
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
    // FIX: Re-run the search to display the updated pinned status
    performSearch(); 
    wasSearchModalActive = false;
  } else {
    document.body.style.overflow = 'auto';
  }
}

function openSearchModal() {
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

filterSelect.addEventListener("change", () => displayAnnouncements(announcementsDiv, applyFilters(announcements, filterSelect.value, null, pinnedToggle.checked), filterSelect.value, pinnedToggle.checked));
pinnedToggle.addEventListener("change", () => displayAnnouncements(announcementsDiv, applyFilters(announcements, filterSelect.value, null, pinnedToggle.checked), filterSelect.value, pinnedToggle.checked));

openSearchBtn.addEventListener('click', (e) => {
  e.preventDefault();
  openSearchModal();
});
closeSearchBtn.addEventListener('click', closeSearchModal);
modalSearchInput.addEventListener("input", performSearch);

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
    }
  }
});
