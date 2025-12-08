// src/components/Sidebar.jsx
import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUniversity,
  faBriefcase,
  faUser,
  faChevronDown,
  faSignOutAlt,
  faCalendar,
  faFolder,
  faLayerGroup,
  faBook,
  faCheck,
  faListCheck, // <-- checklist icon for Tasks
} from "@fortawesome/free-solid-svg-icons";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";

// --- STATIC DATA ---
const folderOptions = [
  { key: "School", label: "School", icon: faUniversity },
  { key: "Work", label: "Work", icon: faBriefcase }, // Work stays briefcase
  { key: "Personal", label: "Personal", icon: faUser },
  { key: "All", label: "All", icon: faCheck }, // All -> check icon
];

const mainNavLinks = [
  { path: "/tasks", label: "Tasks", icon: faListCheck }, // Tasks -> checklist icon
  { path: "/calendar", label: "Calendar", icon: faCalendar },
  { path: "/projects", label: "Projects", icon: faFolder }, // Projects stays folder
];

export default function Sidebar({
  user,
  activeFolder,
  setActiveFolder,
  isDropdownOpen,
  setIsDropdownOpen,
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const [notesOpen, setNotesOpen] = useState(true);

  const profileEmail = user?.email || "test@example.com";
  const profileName = user?.displayName || "Drew Miguel";
  const profileInitials =
    profileName
      .split(" ")
      .map((n) => n[0])
      .join("") || "N";

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

      {/* --- Notes dropdown with folders --- */}
      <div className="sidebar-section">
        <button
          className="sidebar-dropdown"
          onClick={() => setNotesOpen((prev) => !prev)}
        >
          <div className="dropdown-label">
            <FontAwesomeIcon icon={faBook} /> {/* Notes -> notebook icon */}
            <span>Notes</span>
          </div>
          <FontAwesomeIcon
            icon={faChevronDown}
            className={notesOpen ? "rotated" : ""}
          />
        </button>
        {notesOpen && (
          <div className="folder-list">
            {folderOptions.map((folder) => (
              <button
                key={folder.key}
                className={`folder-chip ${
                  activeFolder === folder.key ? "active" : ""
                }`}
                onClick={() => {
                  setActiveFolder(folder.key);
                  navigate("/notes"); // always go back to Notes page
                }}
              >
                <FontAwesomeIcon icon={folder.icon} />
                <span>{folder.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* --- Workspace Nav --- */}
      <div className="sidebar-section workspace-section">
        <button
          className="sidebar-dropdown"
          onClick={() => setIsDropdownOpen((prev) => !prev)}
        >
          <div className="dropdown-label">
            <FontAwesomeIcon icon={faLayerGroup} />
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
