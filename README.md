# 🚀 KTM Games – Open Source Platform (Website + Launcher)
*A modern gaming platform built with React, TypeScript, Supabase, and Electron.*

<img src="https://ktm.lovable.app/favicon.png" width="120">

---

## 📌 Table of Contents
- [Overview](#-overview)  
- [Features](#-features)  
- [Tech Stack](#-tech-stack)  
- [Project Structure](#-project-structure)  
- [Installation](#-installation)  
- [Environment Variables](#-environment-variables)  
- [Supabase Database Schema](#-supabase-database-schema)  
- [Supabase Functions](#-supabase-functions)  
- [AI Features](#-ai-features)  
- [Electron Launcher](#-electron-launcher)  
- [Scripts](#-scripts)  
- [Contributing](#-contributing)  
- [License](#-license)

---

# 📖 Overview
**KTM Games** is a complete platform for browsing, downloading, and launching PC games.  
It contains two fully integrated products:

### 🟦 KTM Games Website  
Built using **React + TypeScript + Supabase**, providing:
- Game pages  
- AI-powered recommendations  
- Smart sitemap generation  
- Real-time views  
- Comments  
- Full SEO  
- Responsive UI  
- Smart visibility (hiding empty sections)

### 🟩 KTM Launcher (Electron)
A desktop application allowing:
- Direct game downloads  
- Resume/pause  
- Local storage for installed games  
- Custom installation directory  
- Game launching  
- Library system  
- Settings page  
- Light/Dark mode  
- Full filesystem access

---

# 🌟 Features

### Website  
✔ Dynamic game pages  
✔ Categories & filters  
✔ Realtime views  
✔ SEO meta tags  
✔ Auto-generated sitemap  
✔ Trailer player  
✔ Screenshots gallery  
✔ AI recommendations  
✔ Comments system  
✔ Caching  
✔ Dual themes  

### Launcher  
✔ Electron-based  
✔ Windows installer  
✔ Download manager  
✔ Resume/pause  
✔ Local configs  
✔ Game auto-detection  
✔ “Play Now” button  
✔ Library  
✔ Settings  
✔ Node.js fs access  

---

# 🛠 Tech Stack
| Layer | Technology |
|------|------------|
| Frontend | React, TypeScript, Vite |
| Backend | Supabase |
| Realtime | Supabase Channels |
| AI | Edge Functions |
| Launcher | Electron + Node.js |
| Styling | TailwindCSS |
| Deployment | Lovable.dev |

---

# 📂 Project Structure

```
ktm/
│
├── src/
│   ├── pages/
│   ├── ui/
│   ├── hooks/
│   ├── integrations/
│
├── electron/
│   ├── main.js
│   ├── preload.js
│   ├── launcher-ui/
│
└── README.md
```

---

# 🔧 Installation

### 1️⃣ Clone Repo
```bash
git clone https://github.com/KTM-source/ktm.git
cd ktm
```

### 2️⃣ Install Dependencies
```bash
npm install
```

### 3️⃣ Run Dev
```bash
npm run dev
```

### 4️⃣ Build
```bash
npm run build
```

---

# 🔐 Environment Variables

```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

Launcher:

```
DOWNLOAD_PATH=
LAUNCHER_THEME=
```

---

# 🗃 Supabase Database Schema (Simplified)

### Table: games
| Field | Type |
|-------|------|
| id | uuid |
| title | text |
| slug | text |
| version | text |
| category | text |
| size | text |
| description | text |
| screenshots | array |
| features | array |
| download_link | text |
| system_requirements_minimum | json |
| system_requirements_recommended | json |
| views | int |
| created_at | timestamp |
| updated_at | timestamp |

---

# ⚙️ Supabase Functions

### 1. `generate-sitemap`
Builds dynamic XML sitemap.

### 2. `find-similar-games`
AI similarity recommendations.

### 3. `increment_views`
Atomic view counter.

---

# 🤖 AI Features
✔ Similar games  
✔ Chat assistant  
✔ Description rewriting  
✔ Translation  
✔ Site stats Q&A  

---

# 🟦 Electron Launcher

### Run Launcher
```bash
cd launcher
npm install
npm start
```

### Build Installer
```bash
npm run build
```

Features:
- Download manager  
- Config save  
- Game launching  
- Light/dark mode  
- Library  

---

# 📜 Scripts

| Script | What it does |
|--------|--------------|
| `npm run dev` | Dev mode |
| `npm run build` | Build website |
| `npm run preview` | Preview build |
| `npm run launch` | Start launcher |
| `npm run build:launcher` | Build installer |

---

# 🤝 Contributing
PRs welcome. Please follow TypeScript clean style.

---

# 📄 License
MIT License.

---

# 🎉 Final Notes
KTM Games is designed for performance, scalability, and AI integration.  
Feel free to use, modify, and build upon it!
