// src/components/MainLayout.jsx
import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

export default function MainLayout({ user }) {
  // State for Sidebar interactions 
  const [activeFolder, setActiveFolder] = useState("Inbox");
  const [isDropdownOpen, setIsDropdownOpen] = useState(true);

  return (
    // Uses the .notes-shell CSS class for the main flex layout
    <div className="notes-shell"> 
      
      {/* Sidebar (Fixed width column) */}
      <Sidebar
        user={user} // Passed to Sidebar for profile info/signout
        activeFolder={activeFolder} 
        setActiveFolder={setActiveFolder} 
        isDropdownOpen={isDropdownOpen} 
        setIsDropdownOpen={setIsDropdownOpen} 
      />

      {/* Main Content Area (Outlet renders the child page) */}
      <main className="notes-main">
        <Outlet /> 
      </main>
    </div>
  );
}