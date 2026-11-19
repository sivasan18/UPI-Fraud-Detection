// ==============================================================================
// Achariya College of Engineering and Technology — Administrator Profiles
// UPI Fraud Detection and Risk Assessment System
//
// STUDENT GUIDE FOR MANUAL EDITS:
// ------------------------------------------------------------------------------
// This file configures the 4 Administrator ID cards shown on the Sign-In page.
//
// 1. DISPLAY NAMES vs AUTHENTICATION USERNAMES:
//    - `fullName` & `placeholderName`: These are the REAL NAMES shown on the ID card
//      (e.g., 'Gopika', 'Padmashri', 'Megala', 'Subasri'). You can safely change
//      these strings at any time without affecting login!
//    - `username`: This is the FIXED login identifier sent to Supabase Auth
//      ('USER1', 'USER2', 'USER3', 'USER4'). DO NOT change this unless you also
//      update the Supabase Auth user directory in `services/auth.js`.
//
// 2. PROFILE DETAILS:
//    - `regNumber`: College registration / roll number printed below the barcode.
//    - `department`: College department (e.g., 'B.Tech CSE').
//    - `avatar`: Path to the profile photo located in `frontend/public/avatars/`.
//    - `bio`: Short professional description of the administrator's project role.
//
// Theme: Strict Black (#000000), Yellow (#facc15), White (#ffffff)
// All four administrators are female.
// ==============================================================================

export const ADMIN_PROFILES = [
  // ----------------------------------------------------------------------------
  // USER 1: Lead Administrator & Security Architect
  // ----------------------------------------------------------------------------
  {
    id: 'user_1',
    userNum: '01',
    userLabel: 'USER 1',         // Label displayed on top selection button
    username: 'USER1',           // Fixed auth login identifier (DO NOT CHANGE)
    fullName: 'Gopika',          // Display Name shown on ID Card (EDITABLE)
    placeholderName: 'Gopika',   // Fallback placeholder name (EDITABLE)
    designation: 'Administrator',
    college: 'ACHARIYA COLLEGE',
    department: 'B.Tech CSE',
    location: 'Pondicherry',
    since: '2023',
    regNumber: 'No.23TD0526',    // College Registration Number (EDITABLE)
    handle: '@AchariyaAdmin01',
    avatar: '/avatars/rank_a.jpg', // Photo in public/avatars/
    status: 'ACTIVE ADMIN',
    bio: 'Lead Administrator & Security Architect overseeing UPI transaction validation rails.',
  },

  // ----------------------------------------------------------------------------
  // USER 2: Behavioural Profiling & Neural Risk Engine
  // ----------------------------------------------------------------------------
  {
    id: 'user_2',
    userNum: '02',
    userLabel: 'USER 2',         // Label displayed on top selection button
    username: 'USER2',           // Fixed auth login identifier (DO NOT CHANGE)
    fullName: 'Padmashri',       // Display Name shown on ID Card (EDITABLE)
    placeholderName: 'Padmashri',// Fallback placeholder name (EDITABLE)
    designation: 'Administrator',
    college: 'ACHARIYA COLLEGE',
    department: 'B.Tech CSE',
    location: 'Pondicherry',
    since: '2023',
    regNumber: 'No.23TD0565',    // College Registration Number (EDITABLE)
    handle: '@AchariyaAdmin02',
    avatar: '/avatars/female_user2.jpg', // Photo in public/avatars/
    status: 'ACTIVE ADMIN',
    bio: 'Administrator overseeing behavioural profiling and 13-pattern neural risk assessment.',
  },

  // ----------------------------------------------------------------------------
  // USER 3: OCR Screenshot Extraction & Data Verification
  // ----------------------------------------------------------------------------
  {
    id: 'user_3',
    userNum: '03',
    userLabel: 'USER 3',         // Label displayed on top selection button
    username: 'USER3',           // Fixed auth login identifier (DO NOT CHANGE)
    fullName: 'Megala',          // Display Name shown on ID Card (EDITABLE)
    placeholderName: 'Megala',   // Fallback placeholder name (EDITABLE)
    designation: 'Administrator',
    college: 'ACHARIYA COLLEGE',
    department: 'B.Tech CSE',
    location: 'Pondicherry',
    since: '2023',
    regNumber: 'No.23TD0549 ',   // College Registration Number (EDITABLE)
    handle: '@AchariyaAdmin03',
    avatar: '/avatars/rank_c.jpg', // Photo in public/avatars/
    status: 'ACTIVE ADMIN',
    bio: 'Administrator managing client-side WASM OCR screenshot extraction and data verification.',
  },

  // ----------------------------------------------------------------------------
  // USER 4: Security Rule Auditing & Alert Mitigation
  // ----------------------------------------------------------------------------
  {
    id: 'user_4',
    userNum: '04',
    userLabel: 'USER 4',         // Label displayed on top selection button
    username: 'USER4',           // Fixed auth login identifier (DO NOT CHANGE)
    fullName: 'Subasri',         // Display Name shown on ID Card (EDITABLE)
    placeholderName: 'Subasri',  // Fallback placeholder name (EDITABLE)
    designation: 'Administrator',
    college: 'ACHARIYA COLLEGE',
    department: 'B.Tech CSE',
    location: 'Pondicherry',
    since: '2023',
    regNumber: 'No.23TD0602 ',   // College Registration Number (EDITABLE)
    handle: '@AchariyaAdmin04',
    avatar: '/avatars/female_user4.jpg', // Photo in public/avatars/
    status: 'ACTIVE ADMIN',
    bio: 'Administrator in charge of security rule auditing, system telemetry, and alert mitigation.',
  },
];
