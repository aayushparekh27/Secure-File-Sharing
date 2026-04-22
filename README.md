# 🔐 VaultDrop — Secure File Sharing Platform

> 🚀 **Live Demo:** https://vaultdrop-app.vercel.app/
>
> **Securely share files up to 50MB instantly with end-to-end encryption, password protection, and expiry controls. No account required.**

## What is VaultDrop?

VaultDrop is a **free, secure, and fast file-sharing web application** that allows users to upload and share files instantly using a unique link. It's perfect for:

- 📧 Sending large files via email
- 🔒 Sharing sensitive documents securely
- 💼 Business file transfers
- 👥 Temporary file sharing with expiry
- 🎯 Quick file distribution without accounts

---

## ✨ Features

### 🔐 Security First
* **End-to-End Encryption** - Your files are encrypted during transfer
* 🔒 **Password-Protected Files** - Add optional passwords to shared links
* 🔐 **Secure Storage** - Files stored in encrypted Supabase Storage
* 🛡️ **No Account Needed** - Direct upload without registration

### 📤 Smart File Sharing
* 📁 Upload files up to **50MB** per file
* 📦 **Multiple File Upload** - Share entire folders at once
* 🔗 Instant **shareable link generation**
* 📊 **Download Tracking** - See how many times files were downloaded
* ⏳ **Auto-Expiry Links** - Set time-based or download-based expiry
* 📱 **QR Code Generation** - Share links via QR codes

### 👁️ Preview & Access
* 📸 **Image Preview** (JPG, PNG, GIF, WebP, SVG)
* 🎬 **Video Preview** (MP4, WebM, MOV)
* 🎵 **Audio Preview** (MP3, WAV, FLAC)
* 📄 **PDF Viewer** - Preview PDFs directly
* 📝 **Text Preview** - View text files instantly
* ✅ Full file support for all types

### 🎨 User Experience
* 📱 **Fully Responsive Design** - Works on mobile, tablet, desktop
* ⚡ **Fast Performance** - Optimized for speed
* 🎯 **Drag & Drop Upload** - Intuitive file selection
* 🌙 **Modern Dark UI** - Beautiful glassmorphism design
* 🧠 **Smart UI States** - Loading, error, success states

---

## 🚀 Why Use VaultDrop?

| Feature | VaultDrop | Email | Cloud Drive | Other Services |
|---------|-----------|-------|-------------|-----------------|
| No Account | ✅ | ✅ | ❌ | ❌ |
| Free | ✅ | ✅ | ⚠️ | ⚠️ |
| Encrypted | ✅ | ⚠️ | ⚠️ | ⚠️ |
| Password Protected | ✅ | ❌ | ⚠️ | ✅ |
| Expiry Controls | ✅ | ❌ | ❌ | ⚠️ |
| Multiple Files | ✅ | ⚠️ | ✅ | ✅ |
| QR Code | ✅ | ❌ | ❌ | ❌ |
| Fast | ✅ | ✅ | ⚠️ | ⚠️ |

---

## 🧠 How It Works

1. **Upload** - Select or drag & drop files (up to 50MB each)
2. **Configure** - Set password, expiry, and other options
3. **Generate** - Get instant shareable link and QR code
4. **Share** - Send link to anyone
5. **Download** - Recipient enters password (if set) and downloads securely

---

## 🛠️ Tech Stack

### Frontend
* **HTML5** - Semantic markup
* **CSS3** - Glassmorphism design, fully responsive
* **JavaScript (Vanilla)** - No frameworks, lightweight and fast

### Backend
* **Supabase** - PostgreSQL Database + Encrypted Storage
* **Supabase Auth** - Secure authentication

### Deployment
* **Vercel** - Fast global edge network

### Additional Tools
* **QRCode.js** - QR code generation
* **Fetch API** - Modern file handling

---

## 📂 Project Structure

```
VaultDrop/
│── index.html              # Upload page
│── file.html               # Download/preview page
│── robots.txt              # SEO - Search engine indexing
│── sitemap.xml             # SEO - URL map for search engines
│── README.md               # Documentation
│
├── css/
│   ├── style.css           # Main UI styles & animations
│   └── file.css            # Download page styles
│
├── js/
│   ├── config.js           # Supabase configuration
│   ├── upload.js           # Upload & batch handling logic
│   ├── file.js             # Download, preview & password logic
│   └── info.js             # Information & help content
│
└── supabase/
    └── setup.sql           # Database schema setup
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

### 6️⃣ Search Console Setup

Keep the Google verification file at the site root:

```text
googlebb2f2bac71c63b54.html
```

Also keep these root files live after deployment:

* `robots.txt`
* `sitemap.xml`

Current sitemap URL:

```text
https://vaultdrop-app.vercel.app/sitemap.xml
```

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
