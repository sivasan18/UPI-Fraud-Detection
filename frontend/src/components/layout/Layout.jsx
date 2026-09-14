// ==============================================================================
// Fraud Detection and Risk Assessment System
// Main Layout Shell
// ==============================================================================
import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopNav from './TopNav';
import ModeSwitchModal from './ModeSwitchModal';
import { useApp } from '../../context/AppContext';

const PAGE_TITLES = {
  '/': 'Dashboard',
  '/upload': 'Upload Transactions',
  '/extraction': 'OCR Data Extraction',
  '/confirm': 'Verify Extracted Data',
  '/history': 'Transaction History',
  '/profile': 'User Behaviour Profile',
  '/analyse': 'Fraud Analysis',
  '/result': 'Analysis Result',
  '/suspicious': 'Suspicious Alert',
  '/alerts': 'Fraud Alerts',
  '/reports': 'Reports',
  '/adaptive': 'Adaptive Learning',
  '/monitoring': 'Model Monitoring',
  '/settings': 'Settings & Data Management',
  '/about': 'About Project',
};

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const { isPasswordModalOpen, closePasswordModal } = useApp();
  const title = PAGE_TITLES[location.pathname] || 'Fraud Detection and Risk Assessment';

  return (
    <div className="app-layout">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className="main-content">
        <TopNav title={title} onMenuToggle={() => setSidebarOpen(true)} />
        <div className="page-content">
          <Outlet />
        </div>
      </main>
      <ModeSwitchModal isOpen={isPasswordModalOpen} onClose={closePasswordModal} />
    </div>
  );
}
