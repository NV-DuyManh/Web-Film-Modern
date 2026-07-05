<div align="center">
  <img src="https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&q=80&w=1200&h=300" alt="ManhFilm Banner" style="border-radius: 15px; margin-bottom: 20px;" />

  <h1>🍿 ManhFilm Platform 🎬</h1>
  
  <p><strong>A comprehensive, modern web application designed for managing and streaming movies with an ultra-premium UI.</strong></p>

  <div>
    <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
    <img src="https://img.shields.io/badge/Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E" alt="Vite" />
    <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
    <img src="https://img.shields.io/badge/firebase-ffca28?style=for-the-badge&logo=firebase&logoColor=black" alt="Firebase" />
    <img src="https://img.shields.io/badge/Cloudinary-3448C5?style=for-the-badge&logo=Cloudinary&logoColor=white" alt="Cloudinary" />
    <img src="https://img.shields.io/badge/Material%20UI-007FFF?style=for-the-badge&logo=mui&logoColor=white" alt="MUI" />
  </div>

  <br />
</div>

---

## 🌟 Introduction

**ManhFilm** is built to deliver a premium streaming experience combined with a powerful Content Management System (CMS). Whether you are managing thousands of movies or serving millions of viewers, ManhFilm provides the tools and the aesthetics to make it happen.

---

## 📸 Sneak Peek (Demo)

<div align="center">
  <img src="https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?auto=format&fit=crop&w=800&q=80" width="48%" alt="Client Home Page Placeholder" style="border-radius: 10px; margin-right: 2%; border: 2px solid #333;" />
  <img src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80" width="48%" alt="Admin Dashboard Placeholder" style="border-radius: 10px; border: 2px solid #333;" />
  <p><em>Left: Stunning Client Interface | Right: Powerful Admin Dashboard</em></p>
</div>

---

## 🚀 Amazing Features

### 💎 Client Portal
- 🎬 **Dynamic Home Page**: Features a stunning hero banner, anime section, cinema releases, and categorized movie lists.
- 🍿 **Immersive Streaming**: Dedicated pages for viewing movie details, trailers, and streaming full episodes (Sub, Dub, Voiceover).
- 📱 **Responsive & Fluid**: Fully responsive UI built with Tailwind CSS, ensuring a buttery-smooth experience on desktop and mobile.
- 🔍 **Smart Search**: Easily find movies by name, category, or type.

### 🛡️ Admin Panel
- 📊 **Analytics Dashboard**: Overview of platform statistics and metrics at a glance.
- 📝 **Movie Management**: Complete CRUD operations for movies. Includes support for specifying release years, duration, age ratings, categories, and uploading posters/banners.
- 👥 **Entity Management**: Easily manage Categories, Actors, Directors, and Characters.
- 🔐 **User Management**: Manage community users, roles, and permissions safely.
- ⚡ **Magic Import**: Import movies and data efficiently using bulk tools.
- ☁️ **Media Uploads**: Seamless integration with **Cloudinary** for blazing-fast image hosting.

---

## 🛠️ Deep Dive Tech Stack

| Domain | Technology | Description |
| :--- | :--- | :--- |
| **Frontend Core** | React 19, Vite 8 | Lightning-fast development & optimized builds |
| **Styling** | Tailwind CSS 4, MUI 7 | Beautiful, utility-first CSS & accessible components |
| **Backend / DB** | Firebase | Firestore (DB), Auth, Storage for seamless serverless backend |
| **Media Hosting** | Cloudinary API | Real-time image optimization and delivery |
| **State & Routing**| Context API, React Router | Centralized state management & dynamic routing |
| **Extra Utilities** | Crypto-js, Swiper, SheetJS | Secure signatures, modern sliders, and excel handling |

---

## 📋 Prerequisites

Before you jump in, ensure you have the following ready:
- 🟢 [Node.js](https://nodejs.org/) (v18 or higher recommended)
- 📦 npm, yarn, or pnpm
- 🔥 A [Firebase](https://firebase.google.com/) Project setup
- ☁️ A [Cloudinary](https://cloudinary.com/) Account setup

---

## ⚙️ Installation & Setup Guide

### 1️⃣ Clone the repository
```bash
git clone <repository-url>
cd FILM_MANAGEMENT
```

### 2️⃣ Install dependencies
```bash
npm install
# or
yarn install
```

### 3️⃣ Configure Firebase
Open `src/config/firebaseConfig.js` and update the `firebaseConfig` object with your Firebase project credentials. *(🔥 Pro-tip: For production, it is highly recommended to move these to a `.env` file).*

```javascript
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.firebasestorage.app",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID",
    measurementId: "YOUR_MEASUREMENT_ID"
};
```

### 4️⃣ Configure Cloudinary
Open `src/config/cloudiaryConfig.jsx` and `src/utils/Contants.jsx` to update your Cloudinary credentials (`cloud_name`, `upload_preset`, `apiKey`, `apiSecret`).

### 5️⃣ Run the Application
```bash
npm run dev
# or
yarn dev
```

### 6️⃣ View the Magic ✨
Navigate to `http://localhost:5173` in your favorite browser.

---

## 📂 Folder Structure

```text
src/
├── 🎨 assets/        # Static assets like images and logos
├── 🧩 components/    # Reusable UI components (Admin & Client)
├── ⚙️ config/        # Configuration files (Firebase, Cloudinary)
├── 🌐 contexts/      # React Context Providers for global state management
├── 📄 pages/         # Page components
│   ├── 🛠️ admin/     # Admin Panel pages (Movies, Users, Actors, etc.)
│   └── 🍿 client/    # Client-facing pages (Home, Watch, etc.)
├── 📡 services/      # API and Firebase interaction logic
└── 🧰 utils/         # Helper functions and constants
```

---

## 📜 Available Scripts

| Command | Action |
| :--- | :--- |
| `npm run dev` | Starts the Vite development server with HMR. |
| `npm run build` | Builds the app for production to the `dist` folder. |
| `npm run preview` | Locally preview the production build. |
| `npm run lint` | Runs ESLint to check for code quality and errors. |

---

<div align="center">
  <p>Made with ❤️ by the ManhFilm Team</p>
  <p>
    <a href="#top">Back to top ⬆️</a>
  </p>
</div>
