// src/components/MainLayout.jsx
import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";

export default function MainLayout({ user }) {
  // one shared folder state for Sidebar + NotesPage
  const [activeFolder, setActiveFolder] = useState("All");
  const [isDropdownOpen, setIsDropdownOpen] = useState(true);

  return (
    <div className="notes-shell">
      <Sidebar
        user={user}
        activeFolder={activeFolder}
        setActiveFolder={setActiveFolder}
        isDropdownOpen={isDropdownOpen}
        setIsDropdownOpen={setIsDropdownOpen}
      />

      {/* pass folder state to child pages */}
      <main className="notes-main">
        <Outlet context={{ activeFolder, setActiveFolder }} />
      </main>
    </div>
  );
}
