# UPI Fraud Detection and Risk Assessment System
> **Undergraduate B.Tech Final-Year Project**  
> *Department of Computer Science & Engineering*

---

## 🌟 Project Overview

**UPI Fraud Detection and Risk Assessment System** is a lightweight, explainable, and production-ready cybersecurity application for detecting fraudulent UPI transactions and assessing risk against behavioral baselines.

### 📐 Simplified Modern Architecture
* **Frontend**: React 19 + Vite (Strict three-color palette: Black `#000000`, Yellow `#facc15`, White `#ffffff`).
* **Source Code**: GitHub Repository.
* **Database**: Supabase PostgreSQL.
* **Authentication**: Supabase Auth (4 Administrator accounts with username-to-email mapping).
* **Hosting**: Vercel.
* **OCR Pipeline**: Client-side WebAssembly (`tesseract.js`) with dedicated layout parsers for **BHIM**, **PhonePe**, and **Google Pay**.
* **Risk Engine**: 13 Suspicious Behavioral Patterns (P1–P13) with Explainable AI (XAI) rationale and actionable safety recommendations.
* **Zero Backend Hosting Overhead**: No Flask, no Render, no secondary server or API proxies.

---

## 🔄 End-to-End Workflow

```
UPI Screenshot / Statement Upload
   ↓
Client-Side OCR (Tesseract.js WASM)
   ↓
App Recognition (BHIM / PhonePe / Google Pay)
   ↓
Field Extraction (Amount, Receiver, UPI ID, UTR, Date, Time, Mandates)
   ↓
Interactive Verification & Data Confirmation (/confirm)
   ↓
Persisted Directly to Supabase PostgreSQL (Shared for all 4 Admins)
   ↓
13-Pattern Behavioral Fraud Assessment (P1–P13)
   ↓
Explainable Output: Risk Score, Severity Gauge, "Why?" Explanation, & "What Next?" Guidance
```

---

## 👥 Administrator Accounts & Authentication

The application provides equal administrative access to all four designated project administrators. Users sign in using their **Username** and **Password** (no email input field displayed on the login screen):

| Username | Mapped Supabase Auth Email | Default Password | Role |
| :--- | :--- | :--- | :--- |
| **USER1** | `user1@achariyacollege.com` | `admin123` | Administrator |
| **USER2** | `user2@achariyacollege.com` | `admin123` | Administrator |
| **USER3** | `user3@achariyacollege.com` | `admin123` | Administrator |
| **USER4** | `user4@achariyacollege.com` | `admin123` | Administrator |

* **Session Persistence**: Sessions persist across browser page refreshes via Supabase Auth.
* **Header Integration**: The top navigation bar displays the active administrator's username (e.g. `USER1 [Admin]`) and provides a **Sign Out** button.
* **Independent Password Reset**: Each administrator can update their password independently in the application under **Settings** or via the Supabase Dashboard.

### Creating Accounts in Supabase Dashboard
1. Go to your [Supabase Dashboard](https://supabase.com/dashboard).
2. Navigate to **Authentication** → **Users**.
3. Click **Add User** → **Create User** for each of the 4 accounts:
   - `user1@achariyacollege.com` / `admin123` (Auto-confirm email: **Checked**)
   - `user2@achariyacollege.com` / `admin123` (Auto-confirm email: **Checked**)
   - `user3@achariyacollege.com` / `admin123` (Auto-confirm email: **Checked**)
   - `user4@achariyacollege.com` / `admin123` (Auto-confirm email: **Checked**)

---

## 🗄️ Database Setup & SQL Migration

Run the provided migration script [`supabase/supabase_auth_migration.sql`](./supabase/supabase_auth_migration.sql) in your Supabase SQL Editor:
1. Removes obsolete Flask session tables (`admin_sessions`, `auth_login_attempts`, `admin_audit_logs`).
2. Retains all application transaction tables:
   - `public.transactions`
   - `public.fraud_analyses`
   - `public.alerts`
   - `public.validated_samples`
   - `public.training_runs`
   - `public.system_config`
3. Grants table privileges and applies Row Level Security (RLS) policies so all 4 authenticated administrators share access to the same records.

---

## 🧭 Navigation & Page Visibility

### Active Mode (Default)
In Active Mode, only production monitoring and management items are displayed:
* **OVERVIEW**: Dashboard
* **TRANSACTIONS**: Upload Transactions, Transaction History
* **INTELLIGENCE**: Fraud Analysis, Alerts, Reports
* **SYSTEM**: Settings, About Project

*(Demo-only presentation pages such as "How It Works", "Behaviour Profile", "Adaptive Learning", and "Model Monitoring" are hidden in Active Mode).*

### Demo Mode
In Demo Mode, all 17 presentation, tutorial, and simulation pages are available:
* Switch between modes using the **Switch Mode** button in the header (Confirmation password: `admin123`).
* Demo transactions and active transactions remain strictly isolated using the `mode` flag.

### 🍔 Sidebar Collapse / Full-Width Content
* Clicking the three-horizontal-line **hamburger icon** in the header collapses the left navigation sidebar completely.
* The main content area expands smoothly to 100% full screen width, providing wider charts, tables, and inspection views.
* Clicking the hamburger icon again restores the sidebar on the left side.

---

## ⚡ Local Development & Vercel Deployment

### 1. Local Development
```bash
# Clone the repository
git clone https://github.com/sivasan18/UPI-Fraud-Detection.git
cd UPI-Fraud-Detection

# Set environment variables
cp .env.example frontend/.env
# Add your VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to frontend/.env

# Install dependencies and start Vite dev server
cd frontend
npm install
npm run dev
```

### 2. Deploy to Vercel
1. Push this repository to GitHub.
2. Go to [Vercel Dashboard](https://vercel.com/) and click **New Project** → Import the GitHub repository.
3. Configure the project:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend` (or leave root with the included `vercel.json`)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Add Environment Variables in Vercel:
   - `VITE_SUPABASE_URL`: `https://eojjgcmdxkavnqzkjkjr.supabase.co`
   - `VITE_SUPABASE_ANON_KEY`: *(Your Supabase publishable anon key)*
5. Click **Deploy**.
