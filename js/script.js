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
const auth = firebase.auth();

/*
===============================================
  ADMIN PANEL LOGIC (script.js)
===============================================
*/
if (window.location.pathname.includes("admin.html")) {

    // --- ⬇️ ADMIN DARK MODE LOGIC ⬇️ ---
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    const body = document.body;
    const DARK_MODE_KEY = 'schoolconnect-dark-mode'; // Key for localStorage

    /**
     * Applies the dark mode class to the body and updates the toggle.
     * @param {boolean} isDark Whether dark mode should be enabled.
     */
    function applyDarkMode(isDark) {
        if (isDark) {
            body.classList.add('dark-mode');
            if (darkModeToggle) darkModeToggle.checked = true;
        } else {
            body.classList.remove('dark-mode');
            if (darkModeToggle) darkModeToggle.checked = false;
        }
    }

    /**
     * Saves the user's dark mode preference to localStorage.
     * @param {boolean} isDark The user's preference.
     */
    function saveDarkModePreference(isDark) {
        localStorage.setItem(DARK_MODE_KEY, isDark ? 'true' : 'false');
    }

    // 1. Check for a saved preference when the page loads
    const savedPreference = localStorage.getItem(DARK_MODE_KEY);
    let isDark = savedPreference === 'true'; // Default to light mode (false) if no pref
    applyDarkMode(isDark);

    // 2. Add the event listener to the toggle switch
    if (darkModeToggle) {
        darkModeToggle.addEventListener('change', () => {
            isDark = darkModeToggle.checked;
            applyDarkMode(isDark);
            saveDarkModePreference(isDark);
        });
    }
    // --- ⬆️ END ADMIN DARK MODE LOGIC ⬆️ ---


    // --- Admin Page Logic (Auth Check) ---
    auth.onAuthStateChanged((user) => {
        if (!user) {
            alert("⚠️ Please log in first!");
            window.location.href = "index.html";
        } else {
            // ✅ Processor starts here once the user is authenticated
            startScheduledProcessor();
        }
    });

    // --- Admin Page Element Listeners ---
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

// --- ⬇️ ADMIN HELPER FUNCTIONS ⬇️ ---

function loadAnnouncements(category = 'All') {
    const announcementsList = document.getElementById('announcements-list');
    if (!announcementsList) return;
    announcementsList.innerHTML = '<div class="loading">Loading announcements...</div>';

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

            let allAnnouncements = [];
            if (category === 'All') {
                snapshot.forEach((categorySnapshot) => {
                    const categoryName = categorySnapshot.key;
                    categorySnapshot.forEach((announcement) => {
                        allAnnouncements.push({
                            id: announcement.key,
                            category: categoryName,
                            ...announcement.val()
                        });
                    });
                });
            } else {
                snapshot.forEach((announcement) => {
                    allAnnouncements.push({
                        id: announcement.key,
                        ...announcement.val()
                    });
                });
            }

            allAnnouncements.sort((a, b) => {
                const dateA = a.timestamp ? new Date(a.timestamp) : new Date(0);
                const dateB = b.timestamp ? new Date(b.timestamp) : new Date(0);
                return dateB - dateA; // Sorts newest to oldest
            });

            if (allAnnouncements.length === 0) {
                announcementsList.innerHTML = '<div class="no-announcements">No announcements found.</div>';
                return;
            }
            
            allAnnouncements.forEach(data => {
                displayAnnouncement(data.id, data);
            });
        })
        .catch((error) => {
            announcementsList.innerHTML = `<div class="error">Error loading announcements: ${error.message}</div>`;
        });
}

/**
 * Creates and displays an announcement item in the admin list.
 * @param {string} id The unique ID of the announcement.
 * @param {object} data The announcement data (title, message, category, timestamp).
 */
function displayAnnouncement(id, data) {
    const announcementsList = document.getElementById('announcements-list');
    if (!announcementsList) return; // Check if list exists
    
    const div = document.createElement('div');
    div.className = 'announcement-item';

    let postedDate = '';
    if (data.timestamp) {
        const date = new Date(data.timestamp);
        postedDate = date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    }

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
    if (_scheduledProcessorInterval) return;

    const run = () => {
        const nowISO = new Date().toISOString();
        db.ref('scheduled_announcements').orderByChild('scheduledAt').endAt(nowISO).once('value')
            .then(snapshot => {
                if (!snapshot.exists()) return;

                const tasks = [];
                snapshot.forEach(child => {
                    const key = child.key;
                    const data = child.val();
                    const postRef = db.ref('announcements/' + data.category).push();
                    const p = postRef.set({
                        title: data.title,
                        message: data.message,
                        category: data.category,
                        timestamp: new Date().toISOString(),
                        scheduledFrom: data.scheduledAt
                    }).then(() => db.ref('scheduled_announcements/' + key).remove());
                    tasks.push(p);
                });
                return Promise.all(tasks);
            })
            .then((tasks) => {
                if (!tasks || tasks.length === 0) return; // No tasks were run

                const manageModal = document.getElementById('manageModal');
                if (manageModal && manageModal.classList.contains('show')) {
                    const filterCategoryEl = document.getElementById('filterCategory');
                    const categoryToLoad = filterCategoryEl ? filterCategoryEl.value : 'All';
                    loadAnnouncements(categoryToLoad);
                    loadScheduledAnnouncements();
                }
            })
            .catch(err => {
                console.warn('Scheduled processor error:', err.message || err);
            });
    };
    run();
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