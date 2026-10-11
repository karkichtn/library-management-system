# Library Management System

> **Course Assignment:** Assignment 4 — CRUD with Client-Side Rendering  
> **Project ID:** 2  
> **Repository:** [https://github.com/karkichtn/library-management-system](https://github.com/karkichtn/library-management-system)

---

## 📖 Project Overview

The **Library Management System** is a full-stack web application designed to streamline library cataloging, user management, and book issue/return tracking. Built as part of **Assignment 4 (CRUD with Client-Side Rendering)**, this application leverages a decoupled client-server architecture featuring a modern React Single Page Application (SPA) on the frontend and an Express/Node.js REST API with MongoDB Atlas on the backend.

All core assignment milestones (User Authentication, Book CRUD APIs, React Catalogue with Search & Filters, Book Issue and Return system, Centralized Error Handling, and Automated API Testing) have been fully developed, integrated, and verified with 100% automated test coverage.

---

## 👥 Project Team

| # | Role | Name / GitHub Handle | Responsibilities / Assigned Tasks |
|---|---|---|---|
| 1 | **Team Lead & Full-Stack Developer** | Chetan Singh ([@karkichtn](https://github.com/karkichtn)) | • Project management and code review<br>• [Issue #1](https://github.com/karkichtn/library-management-system/issues/1) — Project Foundation and Authentication<br>• [Issue #5](https://github.com/karkichtn/library-management-system/issues/5) — Backend Error Handling & Automated API Tests |
| 2 | **Backend Developer** | Deepesh Shikarwar ([@depeshsikarwar](https://github.com/depeshsikarwar)) | • [Issue #2](https://github.com/karkichtn/library-management-system/issues/2) — Book Model and Read APIs<br>• [Issue #6](https://github.com/karkichtn/library-management-system/issues/6) — Book Write APIs |
| 3 | **Frontend Developer** | Jagjeet Singh ([@JagguDada01](https://github.com/JagguDada01)) | • [Issue #3](https://github.com/karkichtn/library-management-system/issues/3) — React Book Catalogue Foundation<br>• [Issue #7](https://github.com/karkichtn/library-management-system/issues/7) — Book Search, Category Filters, and Admin Forms |
| 4 | **Full-Stack Feature Developer** | Lanchenba Singh ([@Lanchenba-Mayanglambam](https://github.com/Lanchenba-Mayanglambam)) | • [Issue #4](https://github.com/karkichtn/library-management-system/issues/4) — Book Issue & Return Backend<br>• [Issue #8](https://github.com/karkichtn/library-management-system/issues/8) — Book Issue & Return Frontend Interface |

---

## 🛠️ Technology Stack

### Frontend
- **Framework:** [React.js](https://react.dev/) (v18.3) with [Vite](https://vitejs.dev/)
- **Routing:** [React Router DOM](https://reactrouter.com/) (v6.28)
- **Styling:** Vanilla CSS3 (Custom Responsive Layouts with Flexbox & CSS Grid)
- **Deployment Platform:** [Vercel](https://vercel.com/) (configured with SPA rewrites in `frontend/vercel.json`)

### Backend
- **Runtime:** [Node.js](https://nodejs.org/) (ES Modules)
- **Framework:** [Express.js](https://expressjs.com/) (v4.21)
- **Database:** [MongoDB Atlas](https://www.mongodb.com/atlas) with [Mongoose](https://mongoosejs.com/) (v8.9)
- **Authentication:** JSON Web Tokens (`jsonwebtoken`) & `bcryptjs` password hashing
- **Deployment Platform:** [Render](https://render.com/) (configured with `render.yaml` Blueprint)

### Automated Testing
- **Test Runner:** Node.js native test runner (`node:test`, `node:assert/strict`)
- **Integration Testing:** `supertest` & `mongodb-memory-server` in-memory database
- **Test Coverage:** 82 backend test cases + 19 frontend unit tests (100% pass rate)

---

## 🎯 Feature Roadmap & Implementation Status

| Module / Feature | Description | Status |
|---|---|---|
| **Repository Scaffolding** | Directory structure, package configuration, and baseline setup | ✅ **Complete** |
| **Foundation & Authentication** | User registration/login, JWT tokens, Role-Based Access Control (`admin` vs `student`) | ✅ **Complete** ([PR #9](https://github.com/karkichtn/library-management-system/pull/9)) |
| **Book Model and Read APIs** | Mongoose schema, book retrieval (`GET /api/books`, `GET /api/books/:id`), search and category filters | ✅ **Complete** ([PR #10](https://github.com/karkichtn/library-management-system/pull/10)) |
| **React Book Catalogue** | Client-side catalogue display, reusable book cards, loading, empty, and error states | ✅ **Complete** ([PR #14](https://github.com/karkichtn/library-management-system/pull/14)) |
| **Book Issue and Return Backend** | Borrowing record model, atomic issue/return endpoints, availability tracking, concurrency protection | ✅ **Complete** ([PR #16](https://github.com/karkichtn/library-management-system/pull/16)) |
| **Backend Error Handling & Tests** | Centralized Express error-handling middleware, uniform JSON error format, and automated API test suite | ✅ **Complete** ([PR #12](https://github.com/karkichtn/library-management-system/pull/12)) |
| **Book Write APIs** | Mutation endpoints (`POST`, `PUT`, `DELETE /api/books`), input validation, and admin authorization | ✅ **Complete** ([PR #11](https://github.com/karkichtn/library-management-system/pull/11)) |
| **Book Search, Filters, and Admin Forms** | Live search, category filtering, controlled Add/Edit book forms, and role-based controls | ✅ **Complete** ([PR #15](https://github.com/karkichtn/library-management-system/pull/15)) |
| **Book Issue/Return Interface** | React borrowing/return interface, student loan tracking, and librarian management views | ✅ **Complete** ([PR #17](https://github.com/karkichtn/library-management-system/pull/17)) |

---

## 📡 API Endpoints

### Authentication & Profiles (`/api/auth`)
- `POST /api/auth/register` — Register a new student or admin account
- `POST /api/auth/login` — Authenticate credentials and receive a signed JWT token
- `GET /api/auth/me` — Retrieve the profile of the currently authenticated user *(Requires Token)*

### Book Management (`/api/books`)
- `GET /api/books` — Retrieve all books (supports query parameters: `search`, `category`, `available`)
- `GET /api/books/:id` — Retrieve detailed record for a specific book
- `POST /api/books` — Add a new book *(Restricted: Admin)*
- `PUT /api/books/:id` — Update an existing book's details *(Restricted: Admin)*
- `DELETE /api/books/:id` — Remove a book from the catalog *(Restricted: Admin)*

### Issue & Return Records (`/api/issues`)
- `POST /api/issues/issue` — Issue an available book to a student with due date *(Restricted: Admin)*
- `POST /api/issues/return/:id` — Process the return of an issued book *(Restricted: Admin)*
- `GET /api/issues/my-borrowed` — List books currently borrowed by the authenticated student *(Requires Token)*
- `GET /api/issues/all` — Retrieve complete borrowing history with optional status filter *(Restricted: Admin)*

### Health Check (`/api/health`)
- `GET /api/health` — Service health check and database connection monitor

---

## ⚙️ Local Development Setup

### Prerequisites
- [Node.js](https://nodejs.org/) (v18.0.0 or higher)
- [npm](https://www.npmjs.com/) (v9.0.0 or higher)
- [MongoDB Atlas](https://www.mongodb.com/atlas) connection URI or local MongoDB instance

### 1. Clone the Repository
```bash
git clone https://github.com/karkichtn/library-management-system.git
cd library-management-system
```

### 2. Backend Setup
1. Navigate to the `backend/` directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create your local environment configuration:
   ```bash
   cp .env.example .env
   ```
4. Configure `.env` with your settings:
   ```env
   PORT=5001
   MONGO_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/library_db?retryWrites=true&w=majority
   JWT_SECRET=your_jwt_secret_key_here
   CLIENT_URL=http://localhost:5173
   ```
5. (Optional) Seed the initial administrator account:
   ```bash
   npm run seed:admin
   ```
6. Run automated backend tests:
   ```bash
   npm test
   ```
7. Start the backend development server:
   ```bash
   npm run dev
   ```

### 3. Frontend Setup
1. Open a new terminal and navigate to `frontend/`:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create your local environment configuration:
   ```bash
   cp .env.example .env
   ```
4. Verify `frontend/.env`:
   ```env
   VITE_API_URL=http://localhost:5001/api
   ```
5. Run automated frontend tests:
   ```bash
   npm test
   ```
6. Start the Vite development server:
   ```bash
   npm run dev
   ```
   *The client application will start at `http://localhost:5173`.*

---

## 🔐 Environment Variables Reference

### Backend (`backend/.env`)
| Variable | Description | Production Example |
|---|---|---|
| `PORT` | Port for the Express server to listen on | Assigned automatically by hosting provider (`10000` on Render) |
| `MONGO_URI` | MongoDB Atlas cluster connection string | `mongodb+srv://<user>:<password>@cluster.mongodb.net/library?retryWrites=true&w=majority` |
| `JWT_SECRET` | Secret key used to sign and verify JSON Web Tokens | `your-secure-production-random-secret` |
| `CLIENT_URL` | Deployed frontend origin URL for CORS configuration | `https://your-frontend.vercel.app` |

### Frontend (`frontend/.env`)
| Variable | Description | Production Example |
|---|---|---|
| `VITE_API_URL` | Base endpoint URL for backend REST API requests | `https://your-backend.onrender.com/api` |

---

## 🚀 Production Deployment Instructions

### 1. Backend Deployment (Render)
1. Go to [Render Dashboard](https://dashboard.render.com/) and click **New → Blueprint** (or **New → Web Service**).
2. Connect the GitHub repository `karkichtn/library-management-system`.
3. If using **Blueprint**, Render automatically detects `render.yaml`.
4. If setting up manually as a **Web Service**:
   - **Root Directory:** `backend`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Health Check Path:** `/api/health`
5. Configure Environment Variables in Render:
   - `NODE_ENV`: `production`
   - `MONGO_URI`: *Your MongoDB Atlas connection URI*
   - `JWT_SECRET`: *A secure random string*
   - `CLIENT_URL`: *Your deployed Vercel frontend URL (e.g. `https://your-frontend.vercel.app`)*
6. Click **Deploy**. Note the assigned backend URL (e.g., `https://library-management-system-backend.onrender.com`).

### 2. Frontend Deployment (Vercel)
1. Go to [Vercel Dashboard](https://vercel.com/dashboard) and click **Add New → Project**.
2. Import the GitHub repository `karkichtn/library-management-system`.
3. In Project Settings:
   - **Framework Preset:** `Vite`
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
4. In **Environment Variables**, add:
   - `VITE_API_URL`: *Your deployed backend API URL including `/api` (e.g., `https://library-management-system-backend.onrender.com/api`)*
5. Click **Deploy**. Vercel will build and assign your production frontend URL (e.g., `https://library-management-system-frontend.vercel.app`).
6. Update the backend `CLIENT_URL` on Render with this Vercel domain to ensure CORS requests succeed.

---

## 📜 Academic Integrity & License

This project is developed solely for educational purposes as part of **Assignment 4 — CRUD with Client-Side Rendering**. All rights reserved by the project team.
