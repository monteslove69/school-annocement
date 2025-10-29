/*
===============================================
  FIREBASE INITIALIZATION (COMBINED)
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
const auth = firebase.auth(); // Now includes auth for login

/*
===============================================
  START: ORIGINAL main.js CODE
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

// NEW: Login Overlay Elements
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
    return new Date(b.timestamp) - new Date(a.timestamp);
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

// NEW: Login Modal Functions
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

// NEW: Login Modal Listeners
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
    } else if (loginOverlay && loginOverlay.classList.contains('active')) { // MODIFIED
      closeLoginModal(); // MODIFIED
    }
  }
});
/*
===============================================
  END: ORIGINAL main.js CODE
===============================================
*/


/*
===============================================
  START: ORIGINAL script.js CODE (Login & Admin)
===============================================
*/
// Firebase init is already done at the top.

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
                if (code.indexOf('user-not-found') !== -1 || code.indexOf('no-such-user') !== -1) {
                    message = "No account found for that email.";
                    emailEl.classList.add('error');
                    emailErrorEl.textContent = message;
                } else if (code.indexOf('wrong-password') !== -1) {
                    message = 'Incorrect password. Please try again.';
                    passwordEl.classList.add('error');
                    passwordErrorEl.textContent = message;
                } else if (code.indexOf('invalid-email') !== -1) {
                    message = 'That email address is invalid.';
                    emailEl.classList.add('error');
                    emailErrorEl.textContent = message;
                } else if (code.indexOf('too-many-requests') !== -1) {
                    message = 'Too many failed attempts. Please try again later.';
                } else if (code.indexOf('user-disabled') !== -1) {
                    message = 'This user account has been disabled.';
                } else {
                    if (error.message) message = error.message;
                }
                if (loginErrorEl && !(emailErrorEl && emailErrorEl.textContent) && !(passwordErrorEl && passwordErrorEl.textContent)) {
                    loginErrorEl.textContent = message;
                    loginErrorEl.style.display = 'block';
                }
                loginBtn.disabled = false;
                loginBtn.innerHTML = originalText;
            });
    });
}

// This logic for admin.html will not run on index.html, which is correct.
if (window.location.pathname.includes("admin.html")) {
    auth.onAuthStateChanged((user) => {
        if (!user) {
            alert("⚠️ Please log in first!");
            // This redirect should go to the main page, not login.html
            window.location.href = "index.html"; 
        } else {
            // ✅ Processor starts here once the user is authenticated
            startScheduledProcessor();
        }
    });

    const postBtn = document.getElementById("postBtn");
    const logoutBtn = document.getElementById("logoutBtn");
    if (postBtn) {
        addPostButtonListener(postBtn);
    }

    const scheduleToggleEl = document.getElementById('scheduleToggle');
    const scheduleAtEl = document.getElementById('scheduleAt');
    const datetimeWrapper = document.getElementById('datetimeWrapper');
    const clearScheduleBtn = document.getElementById('clearSchedule');
    if (scheduleToggleEl && datetimeWrapper && scheduleAtEl) {
        const setWrapper = (show) => {
            if (show) {
                datetimeWrapper.classList.add('active');
                datetimeWrapper.setAttribute('aria-hidden', 'false');
            } else {
                datetimeWrapper.classList.remove('active');
                datetimeWrapper.setAttribute('aria-hidden', 'true');
            }
        };
        scheduleToggleEl.addEventListener('change', () => {
            setWrapper(scheduleToggleEl.checked);
        });
        if (clearScheduleBtn) {
            clearScheduleBtn.addEventListener('click', (e) => {
                e.preventDefault();
                scheduleToggleEl.checked = false;
                scheduleAtEl.value = '';
                setWrapper(false);
            });
        }
        setWrapper(!!scheduleToggleEl.checked);
    }

    const filterCategory = document.getElementById('filterCategory');
    const manageBtn = document.getElementById('manageBtn');
    const modal = document.getElementById('manageModal');
    const closeModal = document.getElementById('closeModal');

    if (filterCategory) {
        filterCategory.addEventListener('change', (e) => {
            loadAnnouncements(e.target.value);
        });
    }

    if (manageBtn && modal && closeModal) {
        manageBtn.addEventListener('click', () => {
            modal.classList.add('show');
            loadAnnouncements('All');
            loadScheduledAnnouncements();
            document.body.style.overflow = 'hidden';
        });
        closeModal.addEventListener('click', () => {
            modal.classList.remove('show');
            document.body.style.overflow = '';
        });
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('show');
                document.body.style.overflow = '';
            }
        });
        modal.querySelector('.modal-content').addEventListener('click', (e) => {
            e.stopPropagation();
        });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.classList.contains('show')) {
                modal.classList.remove('show');
                document.body.style.overflow = '';
            }
        });
    }

    if (logoutBtn) {
        logoutBtn.addEventListener("click", () => {
            auth.signOut()
                .then(() => {
                    alert("👋 Logged out successfully!");
                    window.location.href = "index.html";
                })
                .catch((error) => alert("Error logging out: " + error.message));
        });
    }
}

// These functions are defined globally, so they can be called
// by the admin.html page if it's loaded.
function loadAnnouncements(category = 'All') {
    const announcementsList = document.getElementById('announcements-list');
    if (!announcementsList) return;
    announcementsList.innerHTML = '<div class="loading">Loading announcements...</div>';

    // 1. Set the database reference based on the filter
    const fetchRef = (category === 'All')
        ? db.ref('announcements')
        : db.ref('announcements/' + category);

    fetchRef.once('value')
        .then((snapshot) => {
            announcementsList.innerHTML = '';
            if (!snapshot.exists()) {
                announcementsList.innerHTML = '<div class="no-announcements">No announcements found.</div>';
                return;
            }

            // 2. Create an empty array to hold all announcements
            let allAnnouncements = [];

            if (category === 'All') {
                // If 'All', loop through each category first...
                snapshot.forEach((categorySnapshot) => {
                    const categoryName = categorySnapshot.key;
                    // ...then loop through each post in that category
                    categorySnapshot.forEach((announcement) => {
                        // Add the post to our array, making sure to include its ID and category
                        allAnnouncements.push({
                            id: announcement.key,
                            category: categoryName,
                            ...announcement.val()
                        });
                    });
                });
            } else {
                // If a specific category, just loop through its posts
                snapshot.forEach((announcement) => {
                    // Add the post to our array, including its ID
                    allAnnouncements.push({
                        id: announcement.key,
                        ...announcement.val()
                        // The 'category' field is already in announcement.val()
                    });
                });
            }

            // 3. --- THIS IS THE NEW SORTING LOGIC ---
            // Sort the entire array by timestamp in descending order (newest first)
            allAnnouncements.sort((a, b) => {
                const dateA = a.timestamp ? new Date(a.timestamp) : new Date(0);
                const dateB = b.timestamp ? new Date(b.timestamp) : new Date(0);
                return dateB - dateA; // Sorts from largest date (newest) to smallest (oldest)
            });
            // --- END OF NEW SORTING LOGIC ---


            // 4. Check if the sorted array is empty
            if (allAnnouncements.length === 0) {
                announcementsList.innerHTML = '<div class="no-announcements">No announcements found.</div>';
                return;
            }
            
            // 5. Now, loop through the *sorted* array and display each item
            allAnnouncements.forEach(data => {
                // Use the 'id' we stored and the full data object
                displayAnnouncement(data.id, data);
            });
        })
        .catch((error) => {
            announcementsList.innerHTML = `<div class="error">Error loading announcements: ${error.message}</div>`;
        });
}
// --- ⬆️ MODIFIED FUNCTION ⬆️ ---

/**
 * Creates and displays an announcement item in the list.
 * @param {string} id The unique ID of the announcement.
 * @param {object} data The announcement data (title, message, category, timestamp).
 */
function displayAnnouncement(id, data) {
    const announcementsList = document.getElementById('announcements-list');
    if (!announcementsList) return; // Add check
    const div = document.createElement('div');
    div.className = 'announcement-item';

    // START: ADDED DATE/TIME LOGIC
    let postedDate = '';
    if (data.timestamp) {
        const date = new Date(data.timestamp);
        // Format: Month DD, YYYY at HH:MM AM/PM
        postedDate = date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    }
    // END: ADDED DATE/TIME LOGIC

    div.innerHTML = `
        <div class="announcement-header">
            <div class="announcement-title">${data.title}</div>
            <span class="announcement-category">${data.category}</span>
        </div>
        <div class="announcement-message readable-text">${data.message}</div>
        <div class="announcement-meta">
            Posted on: ${postedDate}
        </div>
        <div class="announcement-actions">
            <button class="edit-btn" onclick="editAnnouncement('${id}', '${data.category}')">
                <i class="fas fa-edit"></i> Edit
            </button>
            <button class="delete-btn" onclick="deleteAnnouncement('${id}', '${data.category}')">
                <i class="fas fa-trash"></i> Delete
            </button>
        </div>
    `;
    announcementsList.appendChild(div);
}

function editAnnouncement(id, category) {
    db.ref(`announcements/${category}/${id}`).once('value')
        .then((snapshot) => {
            const data = snapshot.val();
            if (!data) return;
            const editModal = document.getElementById('editModal');
            const editTitle = document.getElementById('editTitle');
            const editMessage = document.getElementById('editMessage');
            const editCategory = document.getElementById('editCategory');
            const updateBtn = document.getElementById('updateBtn');
            const closeEditModal = document.getElementById('closeEditModal');
            const cancelEditBtn = document.getElementById('cancelEditBtn');
            
            // Add null checks for all elements
            if (!editModal || !editTitle || !editMessage || !editCategory || !updateBtn || !closeEditModal || !cancelEditBtn) {
                console.error("Edit modal elements not found.");
                return;
            }

            editTitle.value = data.title;
            editMessage.value = data.message;
            editCategory.value = data.category;
            editModal.classList.add('show');
            const closeEditForm = () => {
                editModal.classList.remove('show');
                editTitle.value = '';
                editMessage.value = '';
                editCategory.value = '';
            };
            closeEditModal.onclick = closeEditForm;
            cancelEditBtn.onclick = closeEditForm;
            editModal.onclick = (e) => {
                if (e.target === editModal) {
                    closeEditForm();
                }
            };
            
            const modalContent = editModal.querySelector('.modal-content');
            if(modalContent) modalContent.onclick = (e) => e.stopPropagation();

            const escHandler = (e) => {
                if (e.key === 'Escape' && editModal.classList.contains('show')) {
                    closeEditForm();
                }
            };
            document.addEventListener('keydown', escHandler);
            const handleUpdate = () => {
                const title = editTitle.value.trim();
                const message = editMessage.value.trim();
                const newCategory = editCategory.value;
                if (!title || !message || !newCategory) {
                    alert('⚠️ Please fill in all fields!');
                    return;
                }
                const updates = {
                    title,
                    message,
                    category: newCategory,
                    timestamp: data.timestamp, // Keep original timestamp
                    lastEdited: new Date().toISOString() // Add last edited timestamp
                };
                if (newCategory !== category) {
                    const oldRef = db.ref(`announcements/${category}/${id}`);
                    const newRef = db.ref(`announcements/${newCategory}`).push();
                    // Firebase set will overwrite the key, need to ensure the new record has the old timestamp
                    newRef.set(updates)
                        .then(() => oldRef.remove())
                        .then(() => {
                            alert('✅ Announcement updated and moved to new category!');
                            closeEditForm();
                            loadAnnouncements(document.getElementById('filterCategory').value);
                        })
                        .catch(error => alert('❌ Error updating announcement: ' + error.message));
                } else {
                    db.ref(`announcements/${category}/${id}`).update(updates)
                        .then(() => {
                            alert('✅ Announcement updated!');
                            closeEditForm();
                            loadAnnouncements(document.getElementById('filterCategory').value);
                        })
                        .catch(error => alert('❌ Error updating announcement: ' + error.message));
                }
            };
            updateBtn.onclick = handleUpdate;
            const cleanup = () => {
                document.removeEventListener('keydown', escHandler);
                updateBtn.onclick = null;
                closeEditModal.onclick = null;
                cancelEditBtn.onclick = null;
                editModal.onclick = null;
            };
            [closeEditModal, cancelEditBtn].forEach(btn => {
                const originalClick = btn.onclick;
                btn.onclick = () => {
                    originalClick();
                    cleanup();
                };
            });
        })
        // --- ⬇️ THIS IS THE FIX ⬇️ ---
        .catch(error => alert('❌ Error loading announcement: ' + error.message));
}

function deleteAnnouncement(id, category) {
    if (confirm('Are you sure you want to delete this announcement?')) {
        db.ref(`announcements/${category}/${id}`).remove()
            .then(() => {
                alert('✅ Announcement deleted!');
                loadAnnouncements(document.getElementById('filterCategory').value);
            })
            .catch(error => alert('❌ Error deleting announcement: ' + error.message));
    }
}

function loadScheduledAnnouncements() {
    const scheduledList = document.getElementById('scheduled-list');
    if (!scheduledList) return;
    scheduledList.innerHTML = '<div class="loading">Loading scheduled announcements...</div>';
    db.ref('scheduled_announcements').orderByChild('scheduledAt').once('value')
        .then(snapshot => {
            scheduledList.innerHTML = '';
            if (!snapshot.exists()) {
                scheduledList.innerHTML = '<div class="no-announcements">No scheduled announcements.</div>';
                return;
            }
            snapshot.forEach(child => {
                const data = child.val();
                const key = child.key;
                const scheduledDate = new Date(data.scheduledAt).toLocaleString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true
                });
                const div = document.createElement('div');
                div.className = 'scheduled-item';
                div.innerHTML = `
                    <div>
                        <div><strong>${data.title}</strong></div>
                        <div class="scheduled-meta">Scheduled for: ${scheduledDate}</div>
                    </div>
                    <div class="scheduled-actions">
                        <button class="post-now-btn" data-key="${key}">Post Now</button>
                        <button class="cancel-sched-btn" data-key="${key}">Cancel</button>
                    </div>
                `;
                scheduledList.appendChild(div);
            });
            scheduledList.querySelectorAll('.post-now-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const key = e.currentTarget.getAttribute('data-key');
                    postScheduledNow(key);
                });
            });
            scheduledList.querySelectorAll('.cancel-sched-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const key = e.currentTarget.getAttribute('data-key');
                    cancelScheduled(key);
                });
            });
        })
        .catch(err => {
            scheduledList.innerHTML = `<div class="error">Error loading scheduled announcements: ${err.message}</div>`;
        });
}

function postScheduledNow(key) {
    const ref = db.ref('scheduled_announcements/' + key);
    ref.once('value')
        .then(snap => {
            const data = snap.val();
            if (!data) throw new Error('Scheduled announcement not found');
            const postRef = db.ref('announcements/' + data.category).push();
            return postRef.set({
                title: data.title,
                message: data.message,
                category: data.category,
                timestamp: new Date().toISOString(),
                scheduledFrom: data.scheduledAt
            }).then(() => ref.remove());
        })
        .then(() => {
            alert('✅ Scheduled announcement posted now.');
            loadAnnouncements(document.getElementById('filterCategory').value);
            loadScheduledAnnouncements();
        })
        .catch(err => alert('❌ Error posting scheduled announcement: ' + err.message));
}

function cancelScheduled(key) {
    if (!confirm('Cancel this scheduled announcement?')) return;
    db.ref('scheduled_announcements/' + key).remove()
        .then(() => {
            alert('✅ Scheduled announcement canceled.');
            loadScheduledAnnouncements();
        })
        .catch(err => alert('❌ Error cancelling scheduled announcement: ' + err.message));
}

let _scheduledProcessorInterval = null;
function startScheduledProcessor(intervalSeconds = 30) {
    // If the processor is already running, exit.
    if (_scheduledProcessorInterval) return;

    const run = () => {
        // Get the current time in ISO format to use for comparison
        const nowISO = new Date().toISOString();

        // Query Firebase for scheduled announcements where 'scheduledAt' is less than or equal to the current time
        db.ref('scheduled_announcements').orderByChild('scheduledAt').endAt(nowISO).once('value')
            .then(snapshot => {
                // If no scheduled announcements are found that are past due, do nothing
                if (!snapshot.exists()) return;

                const tasks = [];
                // Iterate over the announcements that are past due
                snapshot.forEach(child => {
                    const key = child.key;
                    const data = child.val();

                    // 1. Prepare to post the announcement to the main announcements section
                    const postRef = db.ref('announcements/' + data.category).push();

                    // 2. Set the announcement and remove it from scheduled_announcements
                    const p = postRef.set({
                        title: data.title,
                        message: data.message,
                        category: data.category,
                        timestamp: new Date().toISOString(),
                        scheduledFrom: data.scheduledAt
                    }).then(() => db.ref('scheduled_announcements/' + key).remove());

                    tasks.push(p); // Add the promise to the tasks array
                });

                // Wait for all posts and removals to complete
                return Promise.all(tasks);
            })
            .then((tasks) => {
                if (!tasks || tasks.length === 0) return; // No tasks were run

                // 3. Optional: Reload announcement lists if the management modal is open
                const manageModal = document.getElementById('manageModal');
                if (manageModal && manageModal.classList.contains('show')) {
                    const filterCategoryEl = document.getElementById('filterCategory');
                    const categoryToLoad = filterCategoryEl ? filterCategoryEl.value : 'All';
                    loadAnnouncements(categoryToLoad);
                    loadScheduledAnnouncements();
                }
            })
            .catch(err => {
                // Log any errors during the scheduling process
                console.warn('Scheduled processor error:', err.message || err);
            });
    };

    // Run the processor immediately when it starts
    run();

    // Set up the processor to run every 'intervalSeconds' seconds
    _scheduledProcessorInterval = setInterval(run, intervalSeconds * 1000);
    console.log(`Scheduled processor started, running every ${intervalSeconds} seconds.`);
}

function addPostButtonListener(postBtn) {
    postBtn.addEventListener('click', () => {
        const title = document.getElementById('title').value.trim();
        const message = document.getElementById('message').value.trim();
        const category = document.getElementById('category').value;
        const scheduleToggle = document.getElementById('scheduleToggle').checked;
        const scheduleAt = document.getElementById('scheduleAt').value;

        if (!title || !message || !category) {
            alert('⚠️ Please fill in all fields (Title, Message, and Category)!');
            return;
        }

        const announcementData = {
            title: title,
            message: message,
            category: category,
            timestamp: new Date().toISOString(),
        };

        if (scheduleToggle) {
            if (!scheduleAt) {
                alert('⚠️ Please select a date and time for the scheduled announcement!');
                return;
            }

            const scheduledAtDate = new Date(scheduleAt);
            if (scheduledAtDate.getTime() <= Date.now()) {
                alert('⚠️ Scheduled time must be in the future!');
                return;
            }

            const scheduledData = {
                ...announcementData,
                scheduledAt: scheduledAtDate.toISOString()
            };

            db.ref('scheduled_announcements').push(scheduledData)
                .then(() => {
                    alert('✅ Announcement scheduled successfully!');
                    document.getElementById('title').value = '';
                    document.getElementById('message').value = '';
                    document.getElementById('category').value = '';
                    document.getElementById('scheduleToggle').checked = false;
                    document.getElementById('scheduleAt').value = '';
                    const dtWrapper = document.getElementById('datetimeWrapper');
                    if (dtWrapper) {
                        dtWrapper.classList.remove('active');
                        dtWrapper.setAttribute('aria-hidden', 'true');
                    }
                })
                .catch(error => {
                    alert('❌ Error scheduling announcement: ' + error.message);
                });

        } else {
            // Post immediately
            db.ref(`announcements/${category}`).push(announcementData)
                .then(() => {
                    alert('✅ Announcement posted successfully!');
                    document.getElementById('title').value = '';
                    document.getElementById('message').value = '';
                    document.getElementById('category').value = '';
                })
                .catch(error => {
                    alert('❌ Error posting announcement: ' + error.message);
                });
        }
    });
}
/*
===============================================
  END: ORIGINAL script.js CODE
===============================================
*/
