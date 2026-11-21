// ==============================================================================
// Fraud Detection and Risk Assessment System
// Main Layout Shell with Sidebar (desktop) and Bottom Navigation (mobile)
// ==============================================================================
import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopNav from './TopNav';
import BottomNav from './BottomNav';

export default function Layout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const toggleSidebar = () => {
    setSidebarCollapsed((prev) => !prev);
  };

  return (
    <div className={`app-layout ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      {/* Desktop sidebar navigation (hidden on mobile by responsive CSS) */}
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

      {/* Mobile bottom navigation with main options and Sign Out */}
      <BottomNav />
    </div>
  );
}
