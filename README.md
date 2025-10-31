SchoolConnect
A responsive web application designed for schools and universities to post, manage, and schedule announcements. Built with vanilla JavaScript and Firebase, it features a secure admin panel for staff and a clean, real-time, filterable interface for students.

View the Live Demo: https://joseph-montes.github.io/school-connect/

🚀 Core Features
Admin Panel (admin.html)
Secure Authentication: Admin-only login page powered by Firebase Auth.

Full CRUD: Admins can Create, Read, Update, and Delete all announcements.

Multi-File Uploader:

Upload multiple images, PDFs, and documents at the same time.

File uploads are handled by Cloudinary, keeping the database fast.

Ability to add or remove files when editing a post.

File preview shows all staged files before posting.

Post Scheduling: A "Schedule for later" option allows admins to set a future date and time for an announcement to be automatically posted.

Manage Dashboard: View, edit, or delete all current and scheduled posts from one place.

Public Feed (index.html)
Real-time Database: New announcements from the admin panel appear instantly without needing a page refresh.

Smart Image Gallery:

1 Image: Displays as a large, full-width banner.

2 Images: Displays in a clean, 2-column grid.

3+ Images: Displays a 3-image grid with a +More overlay showing the count of extra images.

File Support: Non-image files (like PDFs) are displayed as clean download links.

Category Filtering: Filter the feed by categories (Urgent, Events, Exams, etc.).

Personal Pinning: Users can pin their most important announcements, which are saved to their browser's local storage.

Dark Mode: A toggle to switch between light and dark themes.

Fully Responsive: The design works seamlessly on both desktop and mobile devices.

🛠️ Tech Stack
This project was built from scratch using:

Frontend: HTML5, CSS3, and Vanilla JavaScript (ES6+)

Backend & Database: Firebase

Realtime Database: Used to store all announcement text and file metadata.

Authentication: Used to secure the admin panel.

File Storage: Cloudinary

Handles all file uploads, image/PDF delivery, and provides a generous free tier.
