# 🔐 VaultDrop — Secure File Sharing

> 🚀 **Live Demo:** https://vaultdrop-app.vercel.app/

VaultDrop is a modern, secure, and fast file-sharing web application that allows users to upload files and share them instantly using a unique link — with optional password protection and expiry controls.

---

## ✨ Features

* 📁 Upload files up to **50MB**
* 🔗 Instant **shareable link generation**
* 🔒 **Password-protected files**
* ⏳ **Auto-expiry links** (time-based or download-based)
* 📊 **Download tracking system**
* 👁️ File preview (image, video, audio, PDF, text)
* 📱 Fully responsive modern UI
* ⚡ Fast performance using Supabase backend
* 🧠 Smart UI states (loading, error, password gate)

---

## 🧠 How It Works

1. User uploads a file
2. File is stored in **Supabase Storage**
3. Metadata is saved in database
4. Unique link is generated
5. Receiver can:

   * Enter password (if set)
   * Preview file
   * Download securely

---

## 🛠️ Tech Stack

### Frontend

* HTML5
* CSS3 (Glassmorphism UI)
* JavaScript (Vanilla JS)

### Backend

* Supabase (Database + Storage)

### Deployment

* Vercel

---

## 📂 Project Structure

```
VaultDrop/
│── index.html          # Upload page
│── file.html           # Download page
│
├── css/
│   ├── style.css       # Main UI styles
│   └── file.css        # File page styles
│
├── js/
│   ├── config.js       # Supabase config
│   ├── upload.js       # Upload logic
│   └── file.js         # Download logic
│
└── supabase/
    └── setup.sql       # Database setup
```

---

## ⚙️ Setup Instructions

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/your-username/vaultdrop.git
cd vaultdrop
```

---

### 2️⃣ Setup Supabase

* Go to https://supabase.com
* Create a new project
* Copy:

  * Project URL
  * Anon Public Key

Then update in:

```
js/config.js
```

```js
const SUPABASE_URL = "YOUR_URL";
const SUPABASE_ANON_KEY = "YOUR_KEY";
```

👉 Config file reference 

---

### 3️⃣ Run Database Script

* Open Supabase → SQL Editor
* Paste and run:

```
supabase/setup.sql
```

👉 Database schema includes:

* file metadata
* expiry system
* download tracking


---

### 4️⃣ Create Storage Bucket

* Name: `files`
* Set it to **public**

---

### 5️⃣ Run Project

Just open:

```
index.html
```

or deploy on **Vercel**

---

## 🔐 Security Features

* Password-protected file access
* Expiry-based deletion logic
* Download limits
* Row Level Security (RLS) enabled
* Secure storage via Supabase

⚠️ Note: Passwords are currently stored as plain text (can be upgraded to hashing for production)

---

## 📸 UI Highlights

* Drag & Drop upload system
* Real-time upload progress
* QR code for sharing
* Clean futuristic UI
* Mobile responsive design

---

## 🚀 Future Enhancements

* 🔑 Password hashing (SHA-256 / bcrypt)
* 📧 Email-based file sharing
* ☁️ Private storage mode
* 📊 Analytics dashboard
* 🧹 Auto-delete expired files (cron job)

---

## 👨‍💻 Author

**Aayush Parekh**

* 💻 Full-Stack Developer
* 🛡️ Ethical Hacker
* 🔍 Scam Buster

📧 [aayushparekh26@gmail.com](mailto:aayushparekh26@gmail.com)

---

## ⚡ Tagline

> **"Drop files. Share instantly. Secure everything."**

---

## ⭐ Support

If you like this project:

* ⭐ Star the repo
* 🍴 Fork it
* 🔥 Share with others

---

> “Some codes run machines.
> Some codes reveal minds.” 🚀
