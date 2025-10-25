// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDCa0WJlM0c5aVTb2YD6g5N9EFlSwk458Q",
  authDomain: "schoolconnect-970d5.firebaseapp.com",
  databaseURL: "https://schoolconnect-970d5-default-rtdb.firebaseio.com",
  projectId: "schoolconnect-970d5",
  storageBucket: "schoolconnect-970d5.appspot.com",
  messagingSenderId: "145576179199",
  appId: "1:145576179199:web:65897f211727a3bbf263ca"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.database();
const auth = firebase.auth();

// ===========================
// LOGIN SYSTEM
// ===========================
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
    emailEl.classList.remove('error');
    passwordEl.classList.remove('error');
  }

  // Basic email format check
  function isValidEmail(email) {
    // simple regex for basic validation
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  // Clear relevant field error when user types
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

    // Client-side validation
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
      // some Firebase accounts may have longer requirements, but 6 is a common minimum
      passwordErrorEl.textContent = 'Password must be at least 6 characters.';
      passwordEl.classList.add('error');
      hasError = true;
    }

    if (hasError) return;

    // Disable button while authenticating
    loginBtn.disabled = true;
    const originalText = loginBtn.innerHTML;
    loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing in...';

    auth.signInWithEmailAndPassword(email, password)
      .then(() => {
        // success: show a brief success notice then redirect
        if (loginSuccessEl) {
          loginSuccessEl.textContent = '✅ Login successful — redirecting...';
          loginSuccessEl.style.display = 'block';
          // add class for animation if present
          setTimeout(() => loginSuccessEl.classList.add('show'), 20);
        }
        // small delay so user sees success feedback
        setTimeout(() => {
          window.location.href = 'admin.html';
        }, 900);
      })
      .catch((error) => {
        // Map common Firebase Auth error codes to friendly messages
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
          // fallback to message when available
          if (error.message) message = error.message;
        }

        // show global login error when not field-specific
        if (loginErrorEl && !(emailErrorEl && emailErrorEl.textContent) && !(passwordErrorEl && passwordErrorEl.textContent)) {
          loginErrorEl.textContent = message;
          loginErrorEl.style.display = 'block';
        }

        // re-enable the button and restore text
        loginBtn.disabled = false;
        loginBtn.innerHTML = originalText;
      });
  });
}

// ===========================
// ADMIN PAGE
// ===========================
if (window.location.pathname.includes("admin.html")) {
  auth.onAuthStateChanged((user) => {
    if (!user) {
      alert("⚠️ Please log in first!");
      window.location.href = "login.html";
    } else {
      // start background processor for scheduled announcements
      startScheduledProcessor();
    }
  });
  
  const postBtn = document.getElementById("postBtn");
  const logoutBtn = document.getElementById("logoutBtn");
  
  if (postBtn) {
    addPostButtonListener(postBtn);
  }

  // Show/hide schedule datetime input (animated)
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

    // initialize visibility
    setWrapper(!!scheduleToggleEl.checked);
  }

  // Initialize announcement management
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
    // Modal management
    manageBtn.addEventListener('click', () => {
      modal.classList.add('show');
      // Load announcements when opening modal
      loadAnnouncements('All');
      loadScheduledAnnouncements();
      // Prevent scrolling of the background
      document.body.style.overflow = 'hidden';
    });

    closeModal.addEventListener('click', () => {
      modal.classList.remove('show');
      // Restore scrolling
      document.body.style.overflow = '';
    });

    // Close modal when clicking outside
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.remove('show');
        document.body.style.overflow = '';
      }
    });

    // Prevent closing when clicking inside modal content
    modal.querySelector('.modal-content').addEventListener('click', (e) => {
      e.stopPropagation();
    });

    // Handle escape key
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
          window.location.href = "login.html";
        })
        .catch((error) => alert("Error logging out: " + error.message));
    });
  }
}

// ===========================
// ANNOUNCEMENT MANAGEMENT
// ===========================

function loadAnnouncements(category = 'All') {
  const announcementsList = document.getElementById('announcements-list');
  if (!announcementsList) return;

  announcementsList.innerHTML = '<div class="loading">Loading announcements...</div>';

  const fetchAnnouncements = (category === 'All')
    ? db.ref('announcements').once('value')
    : db.ref('announcements/' + category).once('value');

  fetchAnnouncements
    .then((snapshot) => {
      announcementsList.innerHTML = '';
      if (!snapshot.exists()) {
        announcementsList.innerHTML = '<div class="no-announcements">No announcements found.</div>';
        return;
      }

      if (category === 'All') {
        // Handle all categories
        snapshot.forEach((categorySnapshot) => {
          const categoryName = categorySnapshot.key;
          categorySnapshot.forEach((announcement) => {
            displayAnnouncement(announcement.key, { ...announcement.val(), category: categoryName });
          });
        });
      } else {
        // Handle single category
        snapshot.forEach((announcement) => {
          displayAnnouncement(announcement.key, announcement.val());
        });
      }
    })
    .catch((error) => {
      announcementsList.innerHTML = `<div class="error">Error loading announcements: ${error.message}</div>`;
    });
}

function displayAnnouncement(id, data) {
  const announcementsList = document.getElementById('announcements-list');
  const div = document.createElement('div');
  div.className = 'announcement-item';
  div.innerHTML = `
    <div class="announcement-header">
      <div class="announcement-title">${data.title}</div>
      <span class="announcement-category">${data.category}</span>
    </div>
    <div class="announcement-message">${data.message}</div>
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

      // Get edit modal elements
      const editModal = document.getElementById('editModal');
      const editTitle = document.getElementById('editTitle');
      const editMessage = document.getElementById('editMessage');
      const editCategory = document.getElementById('editCategory');
      const updateBtn = document.getElementById('updateBtn');
      const closeEditModal = document.getElementById('closeEditModal');
      const cancelEditBtn = document.getElementById('cancelEditBtn');

      // Fill in the edit form
      editTitle.value = data.title;
      editMessage.value = data.message;
      editCategory.value = data.category;

      // Show the edit modal
      editModal.classList.add('show');

      // Function to close edit modal
      const closeEditForm = () => {
        editModal.classList.remove('show');
        // Reset form
        editTitle.value = '';
        editMessage.value = '';
        editCategory.value = '';
      };

      // Add event listeners for closing
      closeEditModal.onclick = closeEditForm;
      cancelEditBtn.onclick = closeEditForm;
      
      // Close on click outside
      editModal.onclick = (e) => {
        if (e.target === editModal) {
          closeEditForm();
        }
      };

      // Prevent closing when clicking modal content
      editModal.querySelector('.modal-content').onclick = (e) => {
        e.stopPropagation();
      };

      // Handle escape key
      const escHandler = (e) => {
        if (e.key === 'Escape' && editModal.classList.contains('show')) {
          closeEditForm();
        }
      };
      document.addEventListener('keydown', escHandler);

      // Update functionality
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
          timestamp: new Date().toISOString(),
          lastEdited: new Date().toISOString()
        };

        // If category changed, move the announcement
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

      // Add update event listener
      updateBtn.onclick = handleUpdate;

      // Clean up event listeners when closing
      const cleanup = () => {
        document.removeEventListener('keydown', escHandler);
        updateBtn.onclick = null;
        closeEditModal.onclick = null;
        cancelEditBtn.onclick = null;
        editModal.onclick = null;
      };

      // Add cleanup to all closing events
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

// -------------------------
// Scheduled announcements
// -------------------------
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
        const div = document.createElement('div');
        div.className = 'scheduled-item';
        div.innerHTML = `
          <div>
            <div><strong>${data.title}</strong></div>
            <div class="scheduled-meta">Scheduled for: ${new Date(data.scheduledAt).toLocaleString()}</div>
          </div>
          <div class="scheduled-actions">
            <button class="post-now-btn" data-key="${key}">Post Now</button>
            <button class="cancel-sched-btn" data-key="${key}">Cancel</button>
          </div>
        `;
        scheduledList.appendChild(div);
      });

      // Attach listeners
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

// Background processor for automatically posting scheduled announcements
let _scheduledProcessorInterval = null;
function startScheduledProcessor(intervalSeconds = 30) {
  // avoid multiple intervals
  if (_scheduledProcessorInterval) return;
  // Run immediately then every intervalSeconds
  const run = () => {
    const nowISO = new Date().toISOString();
    // find all scheduled announcements due at or before now
    db.ref('scheduled_announcements').orderByChild('scheduledAt').endAt(nowISO).once('value')
      .then(snapshot => {
        if (!snapshot.exists()) return;
        const tasks = [];
        snapshot.forEach(child => {
          const key = child.key;
          const data = child.val();
          // post to announcements
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
      .then(() => {
        // refresh lists in UI (if modal open)
        if (document.getElementById('manageModal') && document.getElementById('manageModal').classList.contains('show')) {
          loadAnnouncements(document.getElementById('filterCategory') ? document.getElementById('filterCategory').value : 'All');
          loadScheduledAnnouncements();
        }
      })
      .catch(err => {
        console.warn('Scheduled processor error:', err.message || err);
      });
  };

  run();
  _scheduledProcessorInterval = setInterval(run, Math.max(5, intervalSeconds) * 1000);
}

function stopScheduledProcessor() {
  if (_scheduledProcessorInterval) {
    clearInterval(_scheduledProcessorInterval);
    _scheduledProcessorInterval = null;
  }
}

function resetForm() {
  document.getElementById('title').value = '';
  document.getElementById('message').value = '';
  document.getElementById('category').value = '';
  const scheduleToggle = document.getElementById('scheduleToggle');
  const scheduleAt = document.getElementById('scheduleAt');
  const datetimeWrapper = document.getElementById('datetimeWrapper');
  if (scheduleToggle) scheduleToggle.checked = false;
  if (scheduleAt) { scheduleAt.value = ''; }
  if (datetimeWrapper) { datetimeWrapper.classList.remove('active'); datetimeWrapper.setAttribute('aria-hidden','true'); }
  
  // Reset the post button
  const postBtn = document.getElementById('postBtn');
  const newPostBtn = postBtn.cloneNode(true);
  postBtn.parentNode.replaceChild(newPostBtn, postBtn);
  newPostBtn.innerHTML = '<i class="fas fa-bullhorn"></i> Post Announcement';
  
  // Add the original post functionality
  addPostButtonListener(newPostBtn);
}

function addPostButtonListener(button) {
  button.addEventListener('click', () => {
    const title = document.getElementById('title').value.trim();
    const message = document.getElementById('message').value.trim();
    const category = document.getElementById('category').value;
    
    if (!title || !message || !category) {
      alert('⚠️ Please fill in all fields and select a category!');
      return;
    }

    // Check scheduling
    const scheduleToggle = document.getElementById('scheduleToggle');
    const scheduleAtEl = document.getElementById('scheduleAt');
    const shouldSchedule = scheduleToggle && scheduleToggle.checked;
    let scheduledAtISO = null;
    if (shouldSchedule && scheduleAtEl && scheduleAtEl.value) {
      const scheduledDate = new Date(scheduleAtEl.value);
      if (isNaN(scheduledDate.getTime())) {
        alert('⚠️ Invalid scheduled date/time.');
        return;
      }
      scheduledAtISO = scheduledDate.toISOString();
      // If scheduled time is in the past, warn
      if (scheduledDate.getTime() <= Date.now()) {
        if (!confirm('The scheduled time is in the past. Post immediately instead?')) {
          return;
        }
        scheduledAtISO = null;
      }
    }

    if (scheduledAtISO) {
      // Save as scheduled announcement
      const schedRef = db.ref('scheduled_announcements').push();
      schedRef.set({
        title,
        message,
        category,
        scheduledAt: scheduledAtISO,
        createdAt: new Date().toISOString(),
        status: 'scheduled'
      })
      .then(() => {
        alert('✅ Announcement scheduled for ' + new Date(scheduledAtISO).toLocaleString());
        resetForm();
        loadScheduledAnnouncements();
      })
      .catch((error) => alert('❌ Failed to schedule: ' + error.message));

      return;
    }

    // Immediate post
    const postRef = db.ref('announcements/' + category).push();
    postRef
      .set({
        title,
        message,
        category,
        timestamp: new Date().toISOString()
      })
      .then(() => {
        alert('✅ Announcement posted to ' + category + '!');
        resetForm();
        loadAnnouncements(document.getElementById('filterCategory').value);
      })
      .catch((error) => {
        alert('❌ Failed to post: ' + error.message);
      });
  });
}

const announcementsList = document.getElementById('announcements-list');

// Function to fetch and display announcements for admin
function loadAdminAnnouncements() {
    const dbRef = firebase.database().ref('announcements');
    
    // Clear the current list
    announcementsList.innerHTML = '';

    dbRef.on('value', (snapshot) => {
        announcementsList.innerHTML = ''; // Clear list on every update
        if (!snapshot.exists() || snapshot.numChildren() === 0) {
            announcementsList.innerHTML = '<p>No announcements posted yet.</p>';
            return;
        }

        // Iterate through all announcements
        snapshot.forEach((childSnapshot) => {
            const key = childSnapshot.key;
            const announcement = childSnapshot.val();

            const announcementDiv = document.createElement('div');
            announcementDiv.className = 'admin-announcement-item';
            announcementDiv.innerHTML = `
                <div class="content">
                    <span class="category-label">${announcement.category}</span>
                    <h3>${announcement.title}</h3>
                    <p>${announcement.message.substring(0, 100)}...</p>
                </div>
                <div class="actions">
                    <button class="edit-btn" data-key="${key}"><i class="fas fa-edit"></i> Edit</button>
                    <button class="delete-btn" data-key="${key}"><i class="fas fa-trash"></i> Delete</button>
                </div>
            `;
            announcementsList.appendChild(announcementDiv);
        });
        
        // Attach event listeners for the new buttons
        attachEditDeleteListeners();
    });
}

// Call this function after successful admin login
// Example: if (user) { loadAdminAnnouncements(); }
