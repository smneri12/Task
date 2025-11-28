// src/components/Sidebar.jsx
import React from "react";
import { Link, useLocation } from "react-router-dom"; 
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faInbox,
  faUniversity,
  faBriefcase,
  faUser,
  faChevronDown,
  faSignOutAlt,
  faCalendar,
  faFolder,
  faLayerGroup,            // 👈 NEW ICON FOR WORKSPACE
} from "@fortawesome/free-solid-svg-icons";
import { signOut } from "firebase/auth";
import { auth } from "../firebase"; 

// --- STATIC DATA ---
const folderOptions = [
  { key: "Inbox", label: "Inbox", icon: faInbox },
  { key: "School", label: "School", icon: faUniversity },
  { key: "Work", label: "Work", icon: faBriefcase },
  { key: "Personal", label: "Personal", icon: faUser },
];

const mainNavLinks = [
  { path: "/notes", label: "Notes", icon: faFolder },
  { path: "/tasks", label: "Tasks", icon: faBriefcase },
  { path: "/calendar", label: "Calendar", icon: faCalendar },
  { path: "/projects", label: "Projects", icon: faFolder },
];

export default function Sidebar({
  user,
  activeFolder,
  setActiveFolder,
  isDropdownOpen,
  setIsDropdownOpen,
}) {
  const location = useLocation(); 
  
  const profileEmail = user?.email || "test@example.com"; 
  const profileName = user?.displayName || "Drew Miguel";
  const profileInitials = profileName.split(" ").map(n => n[0]).join("") || "N";

  return (
    <aside className="notes-sidebar">
      {/* --- User Profile Block --- */}
      <div className="sidebar-profile">
        <div className="avatar">{profileInitials}</div>
        <div>
          <div className="profile-name">{profileName}</div>
          <div className="profile-sub">Your personal workspace</div>
        </div>
      </div>

      {/* --- Folder chips (no more "Notes" pill above Inbox) --- */}
      <div className="sidebar-section">
        <div className="folder-list">
          {folderOptions.map((folder) => (
            <button
              key={folder.key}
              className={`folder-chip ${
                activeFolder === folder.key ? "active" : ""
              }`}
              onClick={() => setActiveFolder(folder.key)}
            >
              <FontAwesomeIcon icon={folder.icon} />
              <span>{folder.label}</span>
            </button>
          ))}
          <button
            className={`folder-chip ${activeFolder === "All" ? "active" : ""}`}
            onClick={() => setActiveFolder("All")}
          >
            <FontAwesomeIcon icon={faInbox} />
            <span>All</span>
          </button>
        </div>
      </div>

      {/* --- Main App Navigation Links AS DROPDOWN --- */}
      <div className="sidebar-section">
        <button
          className="sidebar-dropdown"
          onClick={() => setIsDropdownOpen((prev) => !prev)}
        >
          <div className="dropdown-label">
            <FontAwesomeIcon icon={faLayerGroup} /> {/* 👈 changed icon */}
            <span>Workspace</span>
          </div>
          <FontAwesomeIcon
            icon={faChevronDown}
            className={isDropdownOpen ? "rotated" : ""}
          />
        </button>

        {isDropdownOpen && (
          <nav className="sidebar-nav nav-list">
            {mainNavLinks.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-row ${
                  location.pathname === item.path ? "active" : ""
                }`}
              >
                <FontAwesomeIcon icon={item.icon} />
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>
        )}
      </div>

      {/* --- Sign Out Block --- */}
      <div className="signout-block">
        <div className="signout-line" />
        <button className="signout-btn" onClick={() => signOut(auth)}>
          <FontAwesomeIcon icon={faSignOutAlt} />
          <div style={{ marginLeft: "10px" }}>
            <div className="profile-name">Sign out</div>
            <div className="profile-sub">{profileEmail}</div>
          </div>
        </button>
      </div>
    </aside>
  );
}
