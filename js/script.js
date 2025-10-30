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

// NOTE: I am combining your login logic and admin logic into one file
// as that is how you provided it.

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
                
                // --- Using the modern, correct error code ---
                if (code === 'auth/invalid-credential' || code === 'auth/invalid-login-credentials') {
                    message = 'Invalid email or password. Please try again.';
                    loginErrorEl.textContent = message;
                    loginErrorEl.style.display = 'block';
                    emailEl.classList.add('error');
                    passwordEl.classList.add('error');
                } else if (code.indexOf('invalid-email') !== -1) {
                    message = 'That email address is invalid.';
                    emailEl.classList.add('error');
                    emailErrorEl.textContent = message;
                } else if (code.indexOf('too-many-requests') !== -1) {
                    message = 'Too many failed attempts. Please try again later.';
                    loginErrorEl.textContent = message;
                    loginErrorEl.style.display = 'block';
                } else if (code.indexOf('user-disabled') !== -1) {
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

if (window.location.pathname.includes("admin.html")) {

    // --- ⬇️ ADMIN DARK MODE LOGIC ⬇️ ---
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    const body = document.body;
    const DARK_MODE_KEY = 'schoolconnect-dark-mode'; // Key for localStorage

    function applyDarkMode(isDark) {
        if (isDark) {
            body.classList.add('dark-mode');
            if (darkModeToggle) darkModeToggle.checked = true;
        } else {
            body.classList.remove('dark-mode');
            if (darkModeToggle) darkModeToggle.checked = false;
        }
    }

    function saveDarkModePreference(isDark) {
        localStorage.setItem(DARK_MODE_KEY, isDark ? 'true' : 'false');
    }

    const savedPreference = localStorage.getItem(DARK_MODE_KEY);
    let isDark = savedPreference === 'true';
    applyDarkMode(isDark);

    if (darkModeToggle) {
        darkModeToggle.addEventListener('change', () => {
            isDark = darkModeToggle.checked;
            applyDarkMode(isDark);
            saveDarkModePreference(isDark);
        });
    }
    // --- ⬆️ END ADMIN DARK MODE LOGIC ⬆️ ---


    // --- Original Admin Page Logic ---
    auth.onAuthStateChanged((user) => {
        if (!user) {
            alert("⚠️ Please log in first!");
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

// --- ⬇️ MODIFIED FUNCTION ⬇️ ---
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
                return dateB - dateA; 
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
// --- ⬆️ MODIFIED FUNCTION ⬆️ ---

/**
 * Creates and displays an announcement item in the list.
 * @param {string} id The unique ID of the announcement.
 * @param {object} data The announcement data (title, message, category, timestamp).
 */
function displayAnnouncement(id, data) {
    const announcementsList = document.getElementById('announcements-list');
    if (!announcementsList) return; // Added safety check
    
    const div = document.createElement('div');
    
    // --- This applies the dynamic category class for CSS coloring ---
    div.className = `announcement-item category-${(data.category || 'unknown').toLowerCase()}`;

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
               console.error("Edit modal elements not found");
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
            if (modalContent) modalContent.onclick = (e) => e.stopPropagation();

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
                if (!btn) return; // Safety check
                const originalClick = btn.onclick;
                btn.onclick = () => {
                    if(originalClick) originalClick();
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

// --- ⬇️ THIS IS THE FIX ⬇️ ---

// 1. Change the default interval from 30 seconds to 5 seconds
function startScheduledProcessor(intervalSeconds = 5) {
    
// --- ⬆️ END OF FIX ⬆️ ---

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
                // 3. Optional: Reload announcement lists if the management modal is open
                // (Check if tasks is not undefined and has items)
                if (tasks && tasks.length > 0) {
                    const manageModal = document.getElementById('manageModal');
                    if (manageModal && manageModal.classList.contains('show')) {
                        const filterCategoryEl = document.getElementById('filterCategory');
                        const categoryToLoad = filterCategoryEl ? filterCategoryEl.value : 'All';
                        loadAnnouncements(categoryToLoad);
                        loadScheduledAnnouncements();
                    }
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
    
    // --- ⬇️ THIS IS THE FIX ⬇️ ---
    
    // 2. Update the console log message to match
    console.log(`Scheduled processor started, running every ${intervalSeconds} seconds.`);
    
    // --- ⬆️ END OF FIX ⬆️ ---
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