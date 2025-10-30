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

// NOTE: This file contains logic for BOTH the login modal (on index.html)
// and the admin panel (on admin.html).

const loginBtn = document.getElementById("loginBtn");
if (loginBtn) {
    // This is the login logic for your main.js file
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

    // --- ⬇️ UPDATED: Create attachment HTML (if it exists) ⬇️ ---
    let attachmentHTML = '';
    if (data.downloadURL) {
        if (data.isImage) {
            // If it's an image, create an <img> tag
            attachmentHTML = `<img src="${data.downloadURL}" alt="${data.fileName || 'Announcement Image'}" class="announcement-image">`;
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
    // --- ⬆️ END OF UPDATE ⬆️ ---

    div.innerHTML = `
        <div class="announcement-header">
            <div class="announcement-title">${data.title}</div>
            <span class="announcement-category">${data.category}</span>
        </div>
        <div class="announcement-message readable-text">${data.message}</div>
        <div class="announcement-meta">
            Posted on: ${postedDate}
        </div>
        
        ${attachmentHTML} 
        
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
            
            // Note: This simple edit form does not support editing/deleting the attachment.
            // That would require more complex logic.

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
                
                // --- UPDATED: Keep the original attachment data ---
                const updates = {
                    title,
                    message,
                    category: newCategory,
                    timestamp: data.timestamp, // Keep original timestamp
                    lastEdited: new Date().toISOString(),
                    fileName: data.fileName || null,
                    downloadURL: data.downloadURL || null,
                    isImage: data.isImage || false // <-- Pass this along
                };
                // --- END OF UPDATE ---

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
    // Note: This does not delete the file from Cloudinary, only the database record.
    // Deleting from Cloudinary would require a secure backend function.
    if (confirm('Are you sure you want to delete this announcement?')) {
        db.ref(`announcements/${category}/${id}`).remove()
            .then(() => {
                alert('✅ Announcement deleted!');
                loadAnnouncements(document.getElementById('filterCategory').value);
            })
            .catch(error => alert('❌ Error deleting announcement: ' + error.message));
    }
}

// --- ⬇️ UPDATED THIS FUNCTION ⬇️ ---
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

                // --- NEW: Add attachment info (with icon) to scheduled list ---
                let attachmentMeta = '';
                if (data.fileName) {
                    const icon = data.isImage ? 'fa-image' : 'fa-paperclip';
                    attachmentMeta = `<div class="scheduled-meta-file"><i class="fas ${icon}"></i> ${data.fileName}</div>`;
                }
                // --- END OF NEW BLOCK ---

                const div = document.createElement('div');
                div.className = 'scheduled-item';
                div.innerHTML = `
                    <div>
                        <div><strong>${data.title}</strong></div>
                        <div class="scheduled-meta">Scheduled for: ${scheduledDate}</div>
                        ${attachmentMeta}
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

// --- ⬇️ UPDATED THIS FUNCTION ⬇️ ---
function postScheduledNow(key) {
    const ref = db.ref('scheduled_announcements/' + key);
    ref.once('value')
        .then(snap => {
            const data = snap.val();
            if (!data) throw new Error('Scheduled announcement not found');
            const postRef = db.ref('announcements/' + data.category).push();
            
            // --- UPDATED: Ensure all data (including file) is copied ---
            return postRef.set({
                title: data.title,
                message: data.message,
                category: data.category,
                timestamp: new Date().toISOString(),
                scheduledFrom: data.scheduledAt,
                fileName: data.fileName || null,
                downloadURL: data.downloadURL || null,
                isImage: data.isImage || false // <-- Pass this along
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
    // Note: This does not delete the file from Cloudinary, only the database record.
    if (!confirm('Cancel this scheduled announcement?')) return;
    db.ref('scheduled_announcements/' + key).remove()
        .then(() => {
            alert('✅ Scheduled announcement canceled.');
            loadScheduledAnnouncements();
        })
        .catch(err => alert('❌ Error cancelling scheduled announcement: ' + err.message));
}

let _scheduledProcessorInterval = null;

// Using the more efficient 5-second interval
function startScheduledProcessor(intervalSeconds = 5) {
    
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

                    // --- UPDATED: Ensure all data (including file) is posted ---
                    const p = postRef.set({
                        title: data.title,
                        message: data.message,
                        category: data.category,
                        timestamp: new Date().toISOString(),
                        scheduledFrom: data.scheduledAt,
                        fileName: data.fileName || null,
                        downloadURL: data.downloadURL || null,
                        isImage: data.isImage || false // <-- Pass this along
                    }).then(() => db.ref('scheduled_announcements/' + key).remove());

                    tasks.push(p); 
                });
                return Promise.all(tasks);
            })
            .then((tasks) => {
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
                console.warn('Scheduled processor error:', err.message || err);
            });
    };

    run();
    _scheduledProcessorInterval = setInterval(run, intervalSeconds * 1000);
    console.log(`Scheduled processor started, running every ${intervalSeconds} seconds.`);
}


// --- ⬇️ REPLACED THIS ENTIRE FUNCTION ⬇️ ---
function addPostButtonListener(postBtn) {
    postBtn.addEventListener('click', async () => {
        
        // --- ⚠️ YOUR CLOUDINARY DETAILS ⚠️ ---
        const CLOUD_NAME = "dr65ufuol"; // ⬅️ Your Cloud Name
        const UPLOAD_PRESET = "schoolconnect-upload"; // ⬅️ Your Upload Preset
        // ------------------------------------------

        // 1. Get all text and file data
        const title = document.getElementById('title').value.trim();
        const message = document.getElementById('message').value.trim();
        const category = document.getElementById('category').value;
        const scheduleToggle = document.getElementById('scheduleToggle').checked;
        const scheduleAt = document.getElementById('scheduleAt').value;
        const file = document.getElementById('fileUpload').files[0];
        const uploadStatus = document.getElementById('uploadStatus');

        if (!title || !message || !category) {
            alert('⚠️ Please fill in all fields (Title, Message, and Category)!');
            return;
        }

        // Disable button
        postBtn.disabled = true;
        postBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Posting...';
        uploadStatus.textContent = '';

        const announcementData = {
            title: title,
            message: message,
            category: category,
            timestamp: new Date().toISOString(),
        };

        // 2. Handle File Upload (if one exists)
        if (file) {
            uploadStatus.textContent = 'Uploading file...';
            try {
                // --- THIS IS THE CLOUDINARY UPLOAD LOGIC ---
                const formData = new FormData();
                formData.append('file', file);
                formData.append('upload_preset', UPLOAD_PRESET); 
                
                const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/upload`, {
                    method: 'POST',
                    body: formData
                });
                
                const data = await response.json();
                
                if (data.secure_url) {
                    // Add file info to our announcement data
                    announcementData.fileName = file.name;
                    announcementData.downloadURL = data.secure_url; // This is the URL we save to Firebase
                    
                    // --- ⬇️ THIS IS THE NEW LINE ⬇️ ---
                    announcementData.isImage = file.type.startsWith('image/'); // Save if it's an image
                    // --- ⬆️ END OF NEW LINE ⬆️ ---

                    uploadStatus.textContent = 'Upload complete!';
                } else {
                    throw new Error('File upload failed. Please try again.');
                }
                // --- END OF CLOUDINARY LOGIC ---

            } catch (error) {
                alert('❌ Error uploading file: ' + error.message);
                postBtn.disabled = false;
                postBtn.innerHTML = 'Post Announcement';
                uploadStatus.textContent = 'Upload failed.';
                return; // Stop if upload fails
            }
        } 
        
        // 3. Save everything to Firebase
        await saveAnnouncementToFirebase(announcementData, scheduleToggle, scheduleAt);
        
        // Reset button and status
        postBtn.disabled = false;
        postBtn.innerHTML = 'Post Announcement';
        uploadStatus.textContent = '';
    });
}

// --- ⬇️ ADDED THIS NEW HELPER FUNCTION ⬇️ ---
async function saveAnnouncementToFirebase(dataToSave, isScheduled, scheduledTime) {
    try {
        if (isScheduled) {
            // --- Save as a SCHEDULED post ---
            if (!scheduledTime) {
                alert('⚠️ Please select a date and time for the scheduled announcement!');
                return;
            }
            const scheduledAtDate = new Date(scheduledTime);
            if (scheduledAtDate.getTime() <= Date.now()) {
                alert('⚠️ Scheduled time must be in the future!');
                return;
            }

            const scheduledData = {
                ...dataToSave,
                scheduledAt: scheduledAtDate.toISOString()
            };

            await db.ref('scheduled_announcements').push(scheduledData);
            alert('✅ Announcement scheduled successfully!');
            
        } else {
            // --- Save as an IMMEDIATE post ---
            await db.ref(`announcements/${dataToSave.category}`).push(dataToSave);
            alert('✅ Announcement posted successfully!');
        }

        // 4. Clear the form
        document.getElementById('title').value = '';
        document.getElementById('message').value = '';
        document.getElementById('category').value = '';
        document.getElementById('fileUpload').value = null; // Clear file input
        document.getElementById('scheduleToggle').checked = false;
        document.getElementById('scheduleAt').value = '';
        const dtWrapper = document.getElementById('datetimeWrapper');
        if (dtWrapper) {
            dtWrapper.classList.remove('active');
            dtWrapper.setAttribute('aria-hidden', 'true');
        }

    } catch (error) {
        alert('❌ Error saving announcement to Firebase: ' + error.message);
    }
}