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
  loginBtn.addEventListener("click", () => {
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();
    
    if (!email || !password) {
      alert("⚠️ Please enter both email and password!");
      return;
    }
    
    auth.signInWithEmailAndPassword(email, password)
      .then(() => {
        alert("✅ Login successful!");
        window.location.href = "admin.html";
      })
      .catch(error => {
        alert("❌ Login failed: " + error.message);
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
    }
  });
  
  const postBtn = document.getElementById("postBtn");
  const logoutBtn = document.getElementById("logoutBtn");
  
  if (postBtn) {
    postBtn.addEventListener("click", () => {
      const title = document.getElementById("title").value.trim();
      const message = document.getElementById("message").value.trim();
      const category = document.getElementById("category").value;
      
      if (!title || !message || !category) {
        alert("⚠️ Please fill in all fields and select a category!");
        return;
      }
      
      const postRef = db.ref("announcements/" + category).push();
      postRef
        .set({
          title,
          message,
          category,
          timestamp: new Date().toISOString()
        })
        .then(() => {
          alert("✅ Announcement posted to '" + category + "'!");
          document.getElementById("title").value = "";
          document.getElementById("message").value = "";
          document.getElementById("category").value = "";
        })
        .catch((error) => {
          alert("❌ Failed to post: " + error.message);
        });
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