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

// === YOUR SECURE WEB APP URL ===
const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbxdmrmKXNw86rFD6Dm41qmFJ155i4X37Orklb_r56LT5MQMTXjI8wBmvKjb6h6kBERQ/exec";


/*
===============================================
  LOGIN LOGIC (for index.html)
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
                
                if (code === 'auth/invalid-credential' || code.indexOf('invalid-login-credentials') !== -1) {
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


// --- NEW SECURE GLOBAL FACEBOOK API FUNCTIONS ---
// These functions now call your Google Apps Script Web App

/**
 * NEW: Securely posts 0, 1, or many images via the server.
 */
async function postToFacebookAPI(announcementData) {
  const response = await fetch(WEB_APP_URL, {
    method: 'POST',
    body: JSON.stringify({
      action: 'post',
      payload: announcementData
    }),
    headers: {
      'Content-Type': 'text/plain;charset=utf-8',
    },
  });

  const result = await response.json();
  if (result.status === 'error') {
    throw new Error(result.message);
  }
  return result; // Returns { status: "success", id: "...", type: "..." }
}

/**
 * NEW: Securely updates a text post via the server.
 */
async function updatePostOnFacebookAPI(fbPostId, newPostData) {
  const response = await fetch(WEB_APP_URL, {
    method: 'POST',
    body: JSON.stringify({
      action: 'update',
      payload: {
        fbPostId: fbPostId,
        newPostData: newPostData
      }
    }),
    headers: {
      'Content-Type': 'text/plain;charset=utf-8',
    },
  });

  const result = await response.json();
  if (result.status === 'error') {
    throw new Error(result.message);
  }
  return result.result;
}

/**
 * NEW: Securely deletes any post via the server.
 */
async function deletePostOnFacebookAPI(fbPostId) {
  const response = await fetch(WEB_APP_URL, {
    method: 'POST',
    body: JSON.stringify({
      action: 'delete',
      payload: {
        fbPostId: fbPostId
      }
    }),
    headers: {
      'Content-Type': 'text/plain;charset=utf-8',
    },
  });

  const result = await response.json();
  if (result.status === 'error') {
    throw new Error(result.message);
  }
  return result.result;
}


// --- DARK MODE SYNC FUNCTIONS (From main.js) ---
const DARK_MODE_KEY = 'schoolconnect-dark-mode'; 

function applyDarkMode(isDark) {
    const body = document.body;
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    if (isDark) {
        body.classList.add('dark-mode');
        if (darkModeToggle) darkModeToggle.checked = true;
    } else {
        body.classList.remove('dark-mode');
        if (darkModeToggle) darkModeToggle.checked = false;
    }
}

function saveDarkModePreference(isDark) {
    localStorage.setItem(DARK_MODE_KEY, isDark ? 'enabled' : 'disabled');
}

function initDarkMode() {
    const savedMode = localStorage.getItem(DARK_MODE_KEY);
    const body = document.body;
    const darkModeToggle = document.getElementById('dark-mode-toggle');

    if (savedMode === 'enabled') {
        applyDarkMode(true);
    } else if (savedMode === 'disabled') {
        applyDarkMode(false);
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        applyDarkMode(true); // Default to system preference if no local setting
    } else {
        applyDarkMode(false);
    }
    
    // Attach listener after initial load
    if (darkModeToggle) {
        darkModeToggle.addEventListener('change', () => {
            const isDark = darkModeToggle.checked;
            applyDarkMode(isDark);
            saveDarkModePreference(isDark);
        });
    }
}

/*
===============================================
  ADMIN PANEL LOGIC (admin.html)
===============================================
*/
if (window.location.pathname.includes("admin.html")) {

    initDarkMode();

    let filesToUpload = [];
    let uploadAbortController = null; 
    
    let editFilesToKeep = [];
    let editFilesToUpload = [];

    const logoutBtn = document.getElementById("logoutBtn");
    const postBtn = document.getElementById("postBtn");

    auth.onAuthStateChanged((user) => {
        if (!user) {
            alert("⚠️ Please log in first!");
            window.location.href = "index.html";
        }
    });

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

    const fileUpload = document.getElementById('fileUpload');
    const filePreviewContainer = document.getElementById('filePreviewContainer');
    const clearFilesBtn = document.getElementById('clearFilesBtn');
    const cancelUploadBtn = document.getElementById('cancelUploadBtn');

    function updateFilePreview() {
        filePreviewContainer.innerHTML = ''; 
        if (filesToUpload.length > 0) {
            clearFilesBtn.style.display = 'inline-block'; 
            Array.from(filesToUpload).forEach((file, index) => {
                const previewWrapper = document.createElement('div');
                previewWrapper.className = 'file-preview';
                
                let previewElement;
                if (file.type.startsWith('image/')) {
                    previewElement = document.createElement('img');
                    previewElement.src = URL.createObjectURL(file);
                    previewElement.onload = () => URL.revokeObjectURL(previewElement.src);
                } else {
                    previewElement = document.createElement('div');
                    previewElement.className = 'file-preview-icon';
                    previewElement.innerHTML = `<i class="fas fa-file-alt"></i>`;
                }
                
                const fileName = document.createElement('span');
                fileName.textContent = file.name;

                const removeBtn = document.createElement('button');
                removeBtn.className = 'file-preview-remove';
                removeBtn.innerHTML = '&times;';
                removeBtn.onclick = () => {
                    filesToUpload.splice(index, 1); 
                    updateFilePreview(); 
                };

                previewWrapper.appendChild(previewElement);
                previewWrapper.appendChild(fileName);
                previewWrapper.appendChild(removeBtn);
                filePreviewContainer.appendChild(previewWrapper);
            });
        } else {
            clearFilesBtn.style.display = 'none'; 
        }
    }

    if (fileUpload && filePreviewContainer) {
        fileUpload.addEventListener('change', () => {
            Array.from(fileUpload.files).forEach(file => {
                if (!filesToUpload.some(f => f.name === file.name && f.size === file.size)) {
                    filesToUpload.push(file);
                }
            });
            updateFilePreview(); 
            fileUpload.value = null; 
        });
    }

    if (clearFilesBtn) {
        clearFilesBtn.addEventListener('click', (e) => {
            e.preventDefault();
            filesToUpload = []; 
            updateFilePreview(); 
        });
    }

    if (cancelUploadBtn) {
        cancelUploadBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (uploadAbortController) {
                uploadAbortController.abort(); 
            }
        });
    }


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
                            category: category, 
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
    
    // --- (No changes to displayAnnouncement from last version) ---
    function displayAnnouncement(id, data) {
        const announcementsList = document.getElementById('announcements-list');
        if (!announcementsList) return; 
        
        const div = document.createElement('div');
        
        // Use 'Unknown' class if orphaned
        const categoryClass = data.isOrphaned ? 'unknown' : (data.category || 'unknown').toLowerCase();
        div.className = `announcement-item category-${categoryClass}`;

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

        let attachmentHTML = '';
        if (data.attachments && data.attachments.length > 0) {
            const images = data.attachments.filter(att => att.isImage);
            const files = data.attachments.filter(att => !att.isImage);
            const imageCount = images.length;

            let imagesHTML = '';
            if (imageCount > 0) {
                
                if (imageCount <= 3) {
                    imagesHTML = images.map(att => `<div class="announcement-image-wrapper">
                                     <img src="${att.downloadURL}" alt="${att.fileName}" class="announcement-image-thumbnail">
                                   </div>`).join('');
                } else { 
                    imagesHTML = images.slice(0, 3) 
                        .map(att => `<div class="announcement-image-wrapper">
                                       <img src="${att.downloadURL}" alt="${att.fileName}" class="announcement-image-thumbnail">
                                     </div>`).join('');
                    
                    const moreCount = imageCount - 4; 
                    
                    imagesHTML += `<div class="announcement-image-wrapper more-images-wrapper">
                                     <img src="${images[3].downloadURL}" alt="${images[3].fileName}" class="announcement-image-thumbnail">
                                     ${moreCount > 0 ? `<div class="more-images-overlay">+${moreCount}</div>` : ''}
                                   </div>`;
                }
                
                attachmentHTML += `<div class="attachment-grid">${imagesHTML}</div>`;
            }
            
            if (files.length > 0) {
                const filesHTML = files
                    .map(att => `
                        <a href="${att.downloadURL}" target="_blank" rel="noopener noreferrer" class="attachment-link" onclick="event.stopPropagation()">
                            <i class="fas fa-paperclip"></i> ${att.fileName}
                        </a>
                    `)
                    .join('');
                attachmentHTML += `<div class="attachment-container">${filesHTML}</div>`;
            }
        }
        
        const fbPostId = data.fbPostId ? data.fbPostId.replace(/'/g, "\\'") : '';
        const fbPostType = data.fbPostType ? data.fbPostType.replace(/'/g, "\\'") : '';
        
        const isOrphaned = data.isOrphaned || false;
        
        // Edit button is now ALWAYS enabled, but its function changes
        const editButtonHTML = `<button class="edit-btn" onclick="openEditModal('${id}', '${data.category}', '${fbPostId}', '${fbPostType}', ${isOrphaned})">
                                   <i class="fas fa-edit"></i> Edit
                               </button>`;
        
        div.innerHTML = `
            <div class="announcement-header">
                <div class="announcement-title">${data.title}</div>
                <span class="announcement-category">${data.category}</span>
            </div>
            <div class="announcement-message readable-text">${data.message}</div>
            <div class="announcement-meta">
                Posted on: ${postedDate}
                ${isOrphaned ? '<br><b>This is a Facebook-only post.</b>' : ''} 
            </div>
            
            ${attachmentHTML} 
            
            <div class="announcement-actions">
                ${editButtonHTML} 
                <button class="delete-btn" onclick="openDeleteModal('${id}', '${data.category}', '${fbPostId}', ${isOrphaned})">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </div>
        `;
        announcementsList.appendChild(div);
    }
    
    // --- (No changes to editAnnouncement from last version) ---
    function editAnnouncement(id, category, mode = 'both') {
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
                
                const editFilePreview = document.getElementById('editFilePreviewContainer');
                const editNewFilePreview = document.getElementById('editNewFilePreviewContainer');
                const editFileUpload = document.getElementById('editFileUpload');
                const editUploadStatus = document.getElementById('editUploadStatus');

                if (!editModal || !editTitle || !editMessage || !editCategory || !updateBtn || !closeEditModal || !cancelEditBtn || !editFilePreview || !editNewFilePreview || !editFileUpload) {
                   console.error("Edit modal elements not found");
                   return; 
                }

                editTitle.value = data.title;
                editMessage.value = data.message;
                editCategory.value = data.category;
                editFilesToKeep = data.attachments ? [...data.attachments] : [];
                editFilesToUpload = [];
                editUploadStatus.textContent = '';
                
                const originalFbPostId = data.fbPostId || null;
                const originalFbPostType = data.fbPostType || 'feed'; 

                const renderEditFilePreviews = () => {
                    editFilePreview.innerHTML = '';
                    editNewFilePreview.innerHTML = '';

                    // 1. Render existing files
                    editFilesToKeep.forEach((file, index) => {
                        const previewWrapper = document.createElement('div');
                        previewWrapper.className = 'file-preview';
                        
                        let previewElement;
                        if (file.isImage) {
                            previewElement = document.createElement('img');
                            previewElement.src = file.downloadURL;
                        } else {
                            previewElement = document.createElement('div');
                            previewElement.className = 'file-preview-icon';
                            previewElement.innerHTML = `<i class="fas fa-file-alt"></i>`;
                        }
                        
                        const fileName = document.createElement('span');
                        fileName.textContent = file.fileName;

                        const removeBtn = document.createElement('button');
                        removeBtn.className = 'file-preview-remove';
                        removeBtn.innerHTML = '&times;';
                        removeBtn.onclick = () => {
                            editFilesToKeep.splice(index, 1); 
                            renderEditFilePreviews(); 
                        };

                        previewWrapper.appendChild(previewElement);
                        previewWrapper.appendChild(fileName);
                        previewWrapper.appendChild(removeBtn);
                        editFilePreview.appendChild(previewWrapper);
                    });

                    // 2. Render new files
                    editFilesToUpload.forEach((file, index) => {
                        const previewWrapper = document.createElement('div');
                        previewWrapper.className = 'file-preview';
                        
                        let previewElement;
                        if (file.type.startsWith('image/')) {
                            previewElement = document.createElement('img');
                            previewElement.src = URL.createObjectURL(file);
                        } else {
                            previewElement = document.createElement('div');
                            previewElement.className = 'file-preview-icon';
                            previewElement.innerHTML = `<i class="fas fa-file-alt"></i>`;
                        }
                        
                        const fileName = document.createElement('span');
                        fileName.textContent = file.name;

                        const removeBtn = document.createElement('button');
                        removeBtn.className = 'file-preview-remove';
                        removeBtn.innerHTML = '&times;';
                        removeBtn.onclick = () => {
                            editFilesToUpload.splice(index, 1); 
                            renderEditFilePreviews(); 
                        };

                        previewWrapper.appendChild(previewElement);
                        previewWrapper.appendChild(fileName);
                        previewWrapper.appendChild(removeBtn);
                        editNewFilePreview.appendChild(previewWrapper);
                    });
                };
                
                renderEditFilePreviews();

                const newFileUploadListener = () => {
                    Array.from(editFileUpload.files).forEach(file => {
                        if (!editFilesToUpload.some(f => f.name === file.name && f.size === file.size)) {
                            editFilesToUpload.push(file);
                        }
                    });
                    renderEditFilePreviews();
                    editFileUpload.value = null;
                };
                editFileUpload.onchange = newFileUploadListener;

                editModal.classList.add('show');
                
                const closeEditForm = () => {
                    editModal.classList.remove('show');
                    editFileUpload.onchange = null;
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
                
                // --- MODIFIED: handleUpdate now accepts a 'mode' ---
                const handleUpdate = async (mode) => {
                    const title = editTitle.value.trim();
                    const message = editMessage.value.trim();
                    const newCategory = editCategory.value;
                    if (!title || !message || !newCategory) {
                        alert('⚠️ Please fill in all fields!');
                        return;
                    }
                    
                    updateBtn.disabled = true;
                    updateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Updating...';
                    editUploadStatus.textContent = '';
                    
                    let finalAttachments = [...editFilesToKeep];
                    let currentFbPostId = originalFbPostId;

                    if (editFilesToUpload.length > 0) {
                        uploadAbortController = new AbortController();
                        try {
                            let newUploadedFiles = [];
                            for (let i = 0; i < editFilesToUpload.length; i++) {
                                const file = editFilesToUpload[i];
                                editUploadStatus.textContent = `Uploading new file ${i + 1} of ${editFilesToUpload.length}...`;
                                const result = await uploadFileToCloudinary(file, uploadAbortController.signal);
                                newUploadedFiles.push(result);
                            }
                            finalAttachments = [...editFilesToKeep, ...newUploadedFiles];
                            editUploadStatus.textContent = 'Uploads complete!';
                        } catch (error) {
                            if (error.name === 'AbortError') {
                                alert('Upload canceled.');
                            } else {
                                alert('❌ Error uploading new files: ' + error.message);
                            }
                            updateBtn.disabled = false;
                            updateBtn.innerHTML = '<i class="fas fa-save"></i> Update Announcement';
                            editUploadStatus.textContent = 'Upload failed.';
                            uploadAbortController = null;
                            return;
                        }
                    }

                    uploadAbortController = null;
                    editUploadStatus.textContent = 'Saving...';
                    
                    const updates = {
                        title,
                        message,
                        category: newCategory,
                        timestamp: data.timestamp,
                        lastEdited: new Date().toISOString(),
                        attachments: finalAttachments,
                        fbPostId: currentFbPostId,
                        fbPostType: originalFbPostType 
                    };
                    
                    // --- MODIFIED: Only run FB logic if mode is 'both' ---
                    let fbUpdatePromise = Promise.resolve();
                    if (mode === 'both') { 
                        if (currentFbPostId && originalFbPostType.startsWith('photo')) { 
                            console.warn('This is a photo post. Skipping Facebook update as it is not supported by the API for URL-based photos.');
                        } else if (currentFbPostId) {
                            const newPostData = { title, message, attachments: finalAttachments };
                            fbUpdatePromise = updatePostOnFacebookAPI(currentFbPostId, newPostData)
                                .catch(fbError => {
                                    console.error('Facebook Edit Failed:', fbError);
                                    alert(`⚠️ Warning: Announcement saved, but failed to update on Facebook: ${fbError.message}`);
                                });
                        }
                    }
                    // --- END MODIFICATION ---

                    if (newCategory !== category) {
                        const oldRef = db.ref(`announcements/${category}/${id}`);
                        const newRef = db.ref(`announcements/${newCategory}`).push();
                        
                        Promise.all([
                            fbUpdatePromise,
                            newRef.set(updates)
                        ])
                            .then(() => oldRef.remove())
                            .then(() => {
                                let alertMessage = '✅ Announcement updated and moved to new category!';
                                if (mode === 'both' && currentFbPostId && originalFbPostType.startsWith('photo')) {
                                     alertMessage = '✅ Announcement updated and moved in Firebase.\n\n(Note: Editing Facebook photo posts is not supported, so the original Facebook post was not changed.)';
                                }
                                alert(alertMessage);
                                closeEditForm();
                                loadAnnouncements(document.getElementById('filterCategory').value);
                            })
                            .catch(error => alert('❌ Error updating announcement: ' + error.message));
                    } else {
                        Promise.all([
                            fbUpdatePromise,
                            db.ref(`announcements/${category}/${id}`).update(updates)
                        ])
                            .then(() => {
                                let alertMessage = '✅ Announcement updated!';
                                 if (mode === 'both' && currentFbPostId && originalFbPostType.startsWith('photo')) {
                                     alertMessage = '✅ Announcement updated in Firebase.\n\n(Note: Editing Facebook photo posts is not supported, so the original Facebook post was not changed.)';
                                }
                                alert(alertMessage);
                                closeEditForm();
                                loadAnnouncements(document.getElementById('filterCategory').value);
                            })
                            .catch(error => alert('❌ Error updating announcement: ' + error.message));
                    }

                    updateBtn.disabled = false;
                    updateBtn.innerHTML = '<i class="fas fa-save"></i> Update Announcement';
                };
                
                // --- MODIFIED: Pass mode to handleUpdate ---
                updateBtn.onclick = () => handleUpdate(mode);
                
                const cleanup = () => {
                    document.removeEventListener('keydown', escHandler);
                    updateBtn.onclick = null;
                    closeEditModal.onclick = null;
                    cancelEditBtn.onclick = null;
                    editModal.onclick = null;
                    editFileUpload.onchange = null;
                };
                
                [closeEditModal, cancelEditBtn].forEach(btn => {
                    if (!btn) return; 
                    const originalClick = btn.onclick;
                    btn.onclick = () => {
                        if(originalClick) originalClick();
                        cleanup();
                    };
                });
            })
            .catch(error => alert('❌ Error loading announcement: ' + error.message));
    }


    // --- NEW: Delete Choice Modal Logic ---
    const deleteChoiceModal = document.getElementById('deleteChoiceModal');
    const closeDeleteChoiceModal = document.getElementById('closeDeleteChoiceModal');
    const deleteLocalBtn = document.getElementById('deleteLocalBtn');
    const deleteFbBtn = document.getElementById('deleteFbBtn');
    const deleteBothBtn = document.getElementById('deleteBothBtn');
    
    // ===========================================
    // === MODIFICATION START: New reset function and updated openDeleteModal ===
    // ===========================================
    
    /**
     * Helper function to close the delete modal and reset all buttons to be visible.
     */
    const closeDeleteModalAndReset = () => {
        deleteChoiceModal.classList.remove('show');
        // Reset button visibility for the next time
        deleteLocalBtn.style.display = 'block';
        deleteFbBtn.style.display = 'block';
        deleteBothBtn.style.display = 'block';
    };

    function openDeleteModal(id, category, fbPostId, isOrphaned) {
        
        if (isOrphaned) {
            // This is a Facebook-Only post.
            // Show the modal but ONLY with the "Delete Both" button.
            deleteChoiceModal.classList.add('show');

            // Hide the irrelevant buttons
            deleteLocalBtn.style.display = 'none';
            deleteFbBtn.style.display = 'none';
            
            // Show and configure the "Delete Both" button
            deleteBothBtn.style.display = 'block';
            deleteBothBtn.dataset.id = id;
            deleteBothBtn.dataset.category = category;
            deleteBothBtn.dataset.fbPostId = fbPostId;
        
        } else if (!fbPostId) {
            // This is a standard local-only post. No modal needed.
            if (confirm('Are you sure you want to delete this announcement?')) {
                db.ref(`announcements/${category}/${id}`).remove()
                  .then(() => {
                      alert('✅ Announcement deleted from Firebase!');
                      loadAnnouncements(document.getElementById('filterCategory').value);
                  })
                  .catch(error => alert('❌ Error deleting from Firebase: ' + error.message));
            }
        
        } else {
            // This is a standard, synced post (local + FB). Show the 3-button modal.
            deleteChoiceModal.classList.add('show');
            
            // Make sure all buttons are visible
            deleteLocalBtn.style.display = 'block';
            deleteFbBtn.style.display = 'block';
            deleteBothBtn.style.display = 'block';

            // Store data on buttons
            deleteLocalBtn.dataset.id = id;
            deleteLocalBtn.dataset.category = category;
            
            deleteFbBtn.dataset.id = id;
            deleteFbBtn.dataset.category = category;
            deleteFbBtn.dataset.fbPostId = fbPostId;

            deleteBothBtn.dataset.id = id;
            deleteBothBtn.dataset.category = category;
            deleteBothBtn.dataset.fbPostId = fbPostId;
        }
    }

    if (closeDeleteChoiceModal) closeDeleteChoiceModal.onclick = closeDeleteModalAndReset;
    
    // Updated onclick handlers to use the reset function
    if (deleteLocalBtn) deleteLocalBtn.onclick = async (e) => {
        const button = e.currentTarget;
        const { id, category } = button.dataset;
        const originalHtml = button.innerHTML;

        button.disabled = true;
        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Unlinking...'; 

        try {
            await unlinkLocalAnnouncement(id, category); 
        } catch (error) {
            console.error("Local unlink failed:", error); 
        } finally {
            button.disabled = false;
            button.innerHTML = originalHtml;
            closeDeleteModalAndReset(); // Use reset function
        }
    };
    
    if (deleteFbBtn) deleteFbBtn.onclick = async (e) => {
        const button = e.currentTarget;
        const { id, category, fbPostId } = button.dataset;
        const originalHtml = button.innerHTML;

        button.disabled = true;
        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Deleting...';
        
        try {
            await deleteAnnouncementFacebook(id, category, fbPostId);
        } catch (error) {
            console.error("FB delete failed:", error);
        } finally {
            button.disabled = false;
            button.innerHTML = originalHtml;
            closeDeleteModalAndReset(); // Use reset function
        }
    };
    
    if (deleteBothBtn) deleteBothBtn.onclick = async (e) => {
        const button = e.currentTarget;
        const { id, category, fbPostId } = button.dataset;
        
        if (!confirm('Are you sure you want to delete this post from BOTH Facebook and the local app?')) {
            return; 
        }

        const originalHtml = button.innerHTML;
        button.disabled = true;
        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Deleting...';

        try {
            await deleteBoth(id, category, fbPostId);
        } catch (error) {
            console.error("Delete both failed:", error);
        } finally {
            button.disabled = false;
            button.innerHTML = originalHtml;
            closeDeleteModalAndReset(); // Use reset function
        }
    };
    // ===========================================
    // === MODIFICATION END ===
    // ===========================================


    // --- End Delete Choice Modal Logic ---


    // --- NEW: Edit Choice Modal Logic ---
    const editChoiceModal = document.getElementById('editChoiceModal');
    const closeEditChoiceModal = document.getElementById('closeEditChoiceModal');
    const editLocalBtn = document.getElementById('editLocalBtn');
    const editFbTextBtn = document.getElementById('editFbTextBtn');
    const editBothBtn = document.getElementById('editBothBtn');

    // --- (No changes to openEditModal from last version) ---
    function openEditModal(id, category, fbPostId, fbPostType, isOrphaned) {
        
        if (isOrphaned) {
            // This is a Facebook-Only post.
            // We can only edit the text on Facebook.
            if (fbPostType === 'feed') {
                // Directly open the "Edit FB Text" modal.
                openEditFbTextModal(id, category, fbPostId);
            } else {
                // It's an orphaned photo post, which can't be edited.
                alert("Editing photo/album posts on Facebook is not supported.");
            }
        
        } else if (!fbPostId || fbPostType !== 'feed') {
            // This is a normal local-only or local+photo post.
            // Just open the standard local editor.
            editAnnouncement(id, category, 'local'); 
        
        } else {
            // This is a normal, synced local+feed post.
            // Show the 3-button choice modal.
            editChoiceModal.classList.add('show');
            editLocalBtn.dataset.id = id;
            editLocalBtn.dataset.category = category;

            editFbTextBtn.dataset.id = id;
            editFbTextBtn.dataset.category = category;
            editFbTextBtn.dataset.fbPostId = fbPostId;

            editBothBtn.dataset.id = id;
            editBothBtn.dataset.category = category;
        }
    }

    if (closeEditChoiceModal) closeEditChoiceModal.onclick = () => editChoiceModal.classList.remove('show');
    if (editLocalBtn) editLocalBtn.onclick = (e) => {
        const { id, category } = e.currentTarget.dataset;
        editAnnouncement(id, category, 'local'); // Call with 'local' mode
        editChoiceModal.classList.remove('show');
    };
    if (editFbTextBtn) editFbTextBtn.onclick = (e) => {
        const { id, category, fbPostId } = e.currentTarget.dataset;
        openEditFbTextModal(id, category, fbPostId);
        editChoiceModal.classList.remove('show');
    };
    if (editBothBtn) editBothBtn.onclick = (e) => {
        const { id, category } = e.currentTarget.dataset;
        editAnnouncement(id, category, 'both'); // Call with 'both' mode
        editChoiceModal.classList.remove('show');
    };
    // --- End Edit Choice Modal Logic ---


    // --- NEW: Edit FB Text Modal Logic ---
    const editFbTextModal = document.getElementById('editFbTextModal');
    const editFbTitle = document.getElementById('editFbTitle');
    const editFbMessage = document.getElementById('editFbMessage');
    const updateFbTextBtn = document.getElementById('updateFbTextBtn');
    const cancelEditFbTextBtn = document.getElementById('cancelEditFbTextBtn');
    const closeEditFbTextModal = document.getElementById('closeEditFbTextModal');

    async function openEditFbTextModal(id, category, fbPostId) {
        // 1. Get current data from Firebase to pre-fill
        try {
            const snapshot = await db.ref(`announcements/${category}/${id}`).once('value');
            const data = snapshot.val();
            if (data) {
                editFbTitle.value = data.title;
                editFbMessage.value = data.message;
            }
        } catch (error) {
            alert('Error fetching post data: ' + error.message);
            return;
        }

        // 2. Show the modal
        editFbTextModal.classList.add('show');

        // 3. Set up the update button listener
        updateFbTextBtn.onclick = async () => {
            const newTitle = editFbTitle.value.trim();
            const newMessage = editFbMessage.value.trim();
            if (!newTitle || !newMessage) {
                alert('Please fill in both title and message.');
                return;
            }

            updateFbTextBtn.disabled = true;
            updateFbTextBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Updating...';

            try {
                const newPostData = { title: newTitle, message: newMessage };
                await updatePostOnFacebookAPI(fbPostId, newPostData);
                
                // Also update the local record so it matches
                await db.ref(`announcements/${category}/${id}`).update({
                    title: newTitle,
                    message: newMessage,
                    lastEdited: new Date().toISOString()
                });
                
                alert('✅ Facebook post (and local record) updated!');
                editFbTextModal.classList.remove('show');
                loadAnnouncements(document.getElementById('filterCategory').value);

            } catch (fbError) {
                alert(`❌ Failed to update Facebook post: ${fbError.message}`);
            }

            updateFbTextBtn.disabled = false;
            updateFbTextBtn.innerHTML = '<i class="fas fa-save"></i> Update Facebook Post';
        };
    }
    if (cancelEditFbTextBtn) cancelEditFbTextBtn.onclick = () => editFbTextModal.classList.remove('show');
    if (closeEditFbTextModal) closeEditFbTextModal.onclick = () => editFbTextModal.classList.remove('show');
    // --- End Edit FB Text Modal Logic ---


    // ===========================================
    // === MODIFICATION START: Updated unlinkLocalAnnouncement ===
    // ===========================================
    
    /**
     * This function "unlinks" a post from local, turning it into an
     * "orphaned" Facebook-only post. It moves it to the "Unknown" category
     * AND saves the last known title/message.
     */
    function unlinkLocalAnnouncement(id, category) {
        const oldRef = db.ref(`announcements/${category}/${id}`);
        return oldRef.once('value')
            .then(snapshot => {
                const data = snapshot.val();
                if (!data) {
                    throw new Error("Post not found to unlink.");
                }

                // If it doesn't have an fbPostId, just delete it.
                if (!data.fbPostId) {
                    return oldRef.remove();
                }

                // It has an fbPostId, so we create an orphan record in the "Unknown" category
                const newOrphanData = {
                    title: data.title, // <-- MODIFIED: Use original title
                    message: data.message, // <-- MODIFIED: Use original message
                    category: "Unknown",
                    attachments: [], // We can't manage FB attachments
                    isOrphaned: true, // The important flag
                    lastEdited: new Date().toISOString(),
                    timestamp: data.timestamp, // Keep original timestamp
                    fbPostId: data.fbPostId,
                    fbPostType: data.fbPostType
                };

                const newRef = db.ref('announcements/Unknown').push(); // Move to 'Unknown'
                
                // Create the new orphan record and delete the old one
                return Promise.all([
                    newRef.set(newOrphanData),
                    oldRef.remove()
                ]);
            })
            .then(() => {
                alert('✅ Announcement unlinked from local app. It is now listed under "Unknown".');
                loadAnnouncements(document.getElementById('filterCategory').value);
            })
            .catch(error => {
                alert('❌ Error unlinking announcement: ' + error.message);
                throw error; // Re-throw error
            });
    }

    /**
     * This function deletes a post from Facebook and updates the local
     * record to remove the fbPostId.
     */
    function deleteAnnouncementFacebook(id, category, fbPostId) {
        // This function now returns the promise
        return deletePostOnFacebookAPI(fbPostId)
            .then(() => {
                // Set fbPostId to null
                return db.ref(`announcements/${category}/${id}`).update({
                    fbPostId: null,
                    fbPostType: null
                });
            })
            .then(() => {
                alert('✅ Post deleted from Facebook!');
                loadAnnouncements(document.getElementById('filterCategory').value);
            })
            .catch(error => {
                console.error('Facebook Delete Failed:', error);
                alert(`❌ Error deleting from Facebook: ${error.message}`);
                throw error; // Re-throw error
            });
    }

    /**
     * This function deletes from BOTH Facebook and Firebase.
     */
    async function deleteBoth(id, category, fbPostId) {
        // The confirm() is now in the click handler
        
        try {
            // 1. Try to delete from Facebook
            if (fbPostId) { // Only try to delete if fbPostId exists
                await deletePostOnFacebookAPI(fbPostId);
                alert('✅ Post deleted from Facebook.');
            }
        } catch (fbError) {
            console.error('Facebook Delete Failed:', fbError);
            alert(`⚠️ Warning: Failed to delete from Facebook, but will still try to delete locally. Error: ${fbError.message}`);
        }
        
        try {
            // 2. Delete from Firebase
            await db.ref(`announcements/${category}/${id}`).remove();
            alert('✅ Announcement deleted from Firebase!');
        } catch (dbError) {
            alert(`❌ Error deleting from Firebase: ${dbError.message}`);
            throw dbError; // Throw this error
        }
        
        loadAnnouncements(document.getElementById('filterCategory').value);
    }
    // ===========================================
    // === MODIFICATION END ===
    // ===========================================


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

                    let attachmentMeta = '';
                    if (data.attachments && data.attachments.length > 0) {
                        const imageCount = data.attachments.filter(att => att.isImage).length;
                        const fileCount = data.attachments.filter(att => !att.isImage).length;
                        
                        if (imageCount > 0) {
                            attachmentMeta += `<div class="scheduled-meta-file"><i class="fas fa-image"></i> ${imageCount} Image(s)</div>`;
                        }
                        if (fileCount > 0) {
                            attachmentMeta += `<div class="scheduled-meta-file"><i class="fas fa-paperclip"></i> ${fileCount} File(s)</div>`;
                        }
                    }

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

    function postScheduledNow(key) {
        const ref = db.ref('scheduled_announcements/' + key);
        ref.once('value')
            .then(snap => {
                const data = snap.val();
                if (!data) throw new Error('Scheduled announcement not found');
                
                const postData = { ...data };
                delete postData.scheduledAt; 
                postData.timestamp = new Date().toISOString(); 
                postData.scheduledFrom = data.scheduledAt; 

                const p = (async () => {
                    let fbPostId = null;
                    let fbPostType = null; 
                    if (postData.postToFacebook) {
                        try {
                            const fbResult = await postToFacebookAPI(postData);
                            if (fbResult && fbResult.id) {
                                fbPostId = fbResult.id;
                                fbPostType = fbResult.type; 
                            }
                            console.log(`Scheduled post ${key} also posted to Facebook.`);
                        } catch (fbError) {
                            console.error(`Scheduled post ${key} FAILED to post to Facebook:`, fbError);
                        }
                    }
                    
                    postData.fbPostId = fbPostId; 
                    postData.fbPostType = fbPostType; 

                    const postRef = db.ref('announcements/' + data.category).push();
                    await postRef.set(postData); 
                    
                    return ref.remove(); 
                })();
                return p;
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

    async function uploadFileToCloudinary(file, signal) {
        const CLOUD_NAME = "dr65ufuol";
        const UPLOAD_PRESET = "schoolconnect-upload";
        
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', UPLOAD_PRESET);

        const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/upload`, {
            method: 'POST',
            body: formData,
            signal: signal 
        });

        const data = await response.json();

        if (data.secure_url) {
            return {
                fileName: file.name,
                downloadURL: data.secure_url,
                isImage: file.type.startsWith('image/')
            };
        } else {
            throw new Error('Cloudinary upload failed for file: ' + file.name);
        }
    }

    // --- (No changes to addPostButtonListener from last version) ---
    function addPostButtonListener(postBtn) {
        const filePreviewContainer = document.getElementById('filePreviewContainer');
        const clearFilesBtn = document.getElementById('clearFilesBtn');
    
        postBtn.addEventListener('click', async () => {
            
            const title = document.getElementById('title').value.trim();
            const message = document.getElementById('message').value.trim();
            const category = document.getElementById('category').value;
            const scheduleToggle = document.getElementById('scheduleToggle').checked;
            const scheduleAt = document.getElementById('scheduleAt').value;
            const uploadStatus = document.getElementById('uploadStatus');
            const cancelUploadBtn = document.getElementById('cancelUploadBtn');
            const postDestination = document.getElementById('postDestination').value;

            if (!title || !message || !category) {
                alert('⚠️ Please fill in all fields (Title, Message, and Category)!');
                return;
            }

            if (scheduleToggle && postDestination === 'facebook') {
                alert('⚠️ "Facebook Only" posts cannot be scheduled. Please post it now or choose another destination.');
                return;
            }

            postBtn.disabled = true;
            postBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Posting...';
            uploadStatus.textContent = '';
            
            const announcementData = {
                title: title,
                message: message,
                category: category,
                timestamp: new Date().toISOString(),
                attachments: []
            };

            if (filesToUpload.length > 0) {
                uploadAbortController = new AbortController(); 
                cancelUploadBtn.style.display = 'block'; 
                
                try {
                    let attachments = [];
                    for (let i = 0; i < filesToUpload.length; i++) {
                        const file = filesToUpload[i];
                        uploadStatus.textContent = `Uploading file ${i + 1} of ${filesToUpload.length} (${file.name})...`;
                        
                        const result = await uploadFileToCloudinary(file, uploadAbortController.signal);
                        attachments.push(result);
                    }
                    
                    announcementData.attachments = attachments; 
                    uploadStatus.textContent = 'All uploads complete!';

                } catch (error) {
                    if (error.name === 'AbortError') {
                        alert('Upload canceled.');
                        uploadStatus.textContent = 'Upload canceled.';
                    } else {
                        alert('❌ Error uploading files: ' + error.message); 
                        uploadStatus.textContent = 'An upload failed.';
                    }
                    postBtn.disabled = false;
                    postBtn.innerHTML = 'Post Announcement';
                    cancelUploadBtn.style.display = 'none';
                    uploadAbortController = null;
                    return; 
                }
            } 
            
            uploadStatus.textContent = 'Saving post...';
            await saveAnnouncementToFirebase(announcementData, scheduleToggle, scheduleAt, postDestination);
            
            postBtn.disabled = false;
            postBtn.innerHTML = 'Post Announcement';
            uploadStatus.textContent = '';
            cancelUploadBtn.style.display = 'none';
            uploadAbortController = null;

            filesToUpload = []; 
            if (filePreviewContainer) filePreviewContainer.innerHTML = ''; 
            if (clearFilesBtn) clearFilesBtn.style.display = 'none'; 
        });
    }

    // --- (No changes to saveAnnouncementToFirebase from last version) ---
    async function saveAnnouncementToFirebase(dataToSave, isScheduled, scheduledTime, postDestination) {
        const filePreviewContainer = document.getElementById('filePreviewContainer');
        const clearFilesBtn = document.getElementById('clearFilesBtn');
        const fileUpload = document.getElementById('fileUpload');

        try {
            if (isScheduled) {
                if (!scheduledTime) {
                    alert('⚠️ Please select a date and time for the scheduled announcement!');
                    return;
                }
                const scheduledAtDate = new Date(scheduledTime);
                if (scheduledAtDate.getTime() <= Date.now()) {
                    alert('⚠️ Scheduled time must be in the future!');
                    return;
                }

                const postToFacebook = (postDestination === 'both');

                const scheduledData = {
                    ...dataToSave,
                    scheduledAt: scheduledAtDate.toISOString(),
                    postToFacebook: postToFacebook 
                };

                await db.ref('scheduled_announcements').push(scheduledData);
                alert('✅ Announcement scheduled successfully!');
                
            } else {
                // POST NOW
                let fbPostId = null;
                let fbPostType = null;
                let fbError = null;
                let postedToFB = false;
                let postedToLocal = false;
                
                // Step 1: Try posting to Facebook if requested
                if (postDestination === 'both' || postDestination === 'facebook') {
                    try {
                        const fbResult = await postToFacebookAPI(dataToSave);
                        if (fbResult && fbResult.id) {
                            fbPostId = fbResult.id; 
                            fbPostType = fbResult.type;
                            postedToFB = true;
                        }
                    } catch (error) {
                        console.error('Facebook post failed:', error);
                        fbError = error;
                    }
                }

                // Step 2: Try posting to Firebase if requested
                if (postDestination === 'local' || postDestination === 'both') {
                    dataToSave.fbPostId = fbPostId;
                    dataToSave.fbPostType = fbPostType;
                    
                    const newPostRef = db.ref(`announcements/${dataToSave.category}`).push();
                    await newPostRef.set(dataToSave);
                    postedToLocal = true;
                }

                // Step 3: Give feedback based on what happened
                if (postDestination === 'both') {
                    if (postedToLocal && postedToFB) {
                        alert('✅ Posted successfully to Firebase and Facebook!');
                    } else if (postedToLocal && fbError) {
                        alert(`✅ Posted to Firebase, but FAILED to post to Facebook: ${fbError.message}`);
                    } else {
                        alert('❌ An error occurred.');
                    }
                } else if (postDestination === 'local') {
                    alert('✅ Posted successfully to Firebase only!');
                } else if (postDestination === 'facebook') {
                    if (postedToFB) {
                        alert('✅ Posted successfully to Facebook only!');
                    } else if (fbError) {
                        alert(`❌ FAILED to post to Facebook: ${fbError.message}`);
                    }
                }
            }

            // Clear the form
            document.getElementById('title').value = '';
            document.getElementById('message').value = '';
            document.getElementById('category').value = '';
            document.getElementById('postDestination').value = 'local';
            fileUpload.value = null; 
            document.getElementById('scheduleToggle').checked = false;
            document.getElementById('scheduleAt').value = '';
            
            filesToUpload = []; 
            if (filePreviewContainer) filePreviewContainer.innerHTML = ''; 
            if (clearFilesBtn) clearFilesBtn.style.display = 'none'; 
            
            const dtWrapper = document.getElementById('datetimeWrapper');
            if (dtWrapper) {
                dtWrapper.classList.remove('active');
                dtWrapper.setAttribute('aria-hidden', 'true');
            }

        } catch (error) {
            alert('❌ Error saving announcement: ' + error.message);
        }
    }
}