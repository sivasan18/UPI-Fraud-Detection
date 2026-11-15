// ==============================================================================
// Fraud Detection and Risk Assessment System
// Main Layout Shell with Sidebar Collapse / Full Width Toggle
// ==============================================================================
import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopNav from './TopNav';
import ModeSwitchModal from './ModeSwitchModal';
import { useApp } from '../../context/AppContext';

export default function Layout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { isPasswordModalOpen, closePasswordModal } = useApp();

  const toggleSidebar = () => {
    setSidebarCollapsed((prev) => !prev);
  };

  return (
    <div className={`app-layout ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <Sidebar
        isCollapsed={sidebarCollapsed}
        onClose={() => setSidebarCollapsed(true)}
      />
      <main className={`main-content ${sidebarCollapsed ? 'expanded-full' : ''}`}>
        <TopNav onMenuToggle={toggleSidebar} />
        <div className="page-content">
          <Outlet />
        </div>
      </main>
      <ModeSwitchModal
        isOpen={isPasswordModalOpen}
        isLogin={false}
        onClose={closePasswordModal}
      />
    </div>
  );
}
