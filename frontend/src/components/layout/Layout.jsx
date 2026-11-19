// ==============================================================================
// Fraud Detection and Risk Assessment System
// Main Layout Shell with Sidebar Collapse / Full Width Toggle
// ==============================================================================
import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopNav from './TopNav';

export default function Layout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

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
    </div>
  );
}
