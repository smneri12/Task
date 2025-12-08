// src/pages/NotesPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSearch,
  faPlus,
  faDownload,
  faTrashAlt,
  faPen,
  faBold,
  faItalic,
  faListUl,
  faListOl,
  faHighlighter,
  faCrop,
  faHeading,
  faPalette,
  faEraser,
  faArrowLeft,
  faEllipsisV,
  faChevronDown,
} from "@fortawesome/free-solid-svg-icons";
import {
  fetchNotes,
  createNote,
  updateNoteFirestore,
  deleteNoteFirestore,
} from "../services/notes";
import "../index.css";

// --- STATIC DATA ---
const folderOptions = [
  { key: "School", label: "School" },
  { key: "Work", label: "Work" },
  { key: "Personal", label: "Personal" },
  { key: "All", label: "All" },
];

const fallbackFolderKey = "School";

// Normalize folder values so 'school', ' School ' etc. all behave the same
const normalizeFolder = (value) =>
  (value || fallbackFolderKey).toString().trim().toLowerCase();

const canonicalFolder = (value) => {
  const key = normalizeFolder(value);
  if (key === "school") return "School";
  if (key === "work") return "Work";
  if (key === "personal") return "Personal";
  if (key === "all") return "All";
  return fallbackFolderKey;
};

const quickCreateOptions = [
  { key: "note", label: "Note" },
  { key: "tasks", label: "Tasks", path: "/tasks" },
  { key: "calendar", label: "Calendar", path: "/calendar" },
  { key: "projects", label: "Projects", path: "/projects" },
];


const defaultFormatting = {
  fontSize: "16px",
  fontFamily: "'Inter', system-ui, sans-serif",
  fontWeight: "normal",
  fontStyle: "normal",
  color: "#111827",
  highlight: false,
  heading: "body",
};

const fontOptions = [
  "'Inter', system-ui, sans-serif",
  "'Georgia', serif",
  "'Montserrat', sans-serif",
  "'Courier New', monospace",
  "'Merriweather', serif",
];

const sizeOptions = ["14px", "16px", "18px", "20px", "22px", "24px"];
const headingOptions = [
  { value: "h1", label: "Heading 1", fontSize: "28px", fontWeight: "700" },
  { value: "h2", label: "Heading 2", fontSize: "24px", fontWeight: "700" },
  { value: "h3", label: "Heading 3", fontSize: "20px", fontWeight: "600" },
  { value: "h4", label: "Heading 4", fontSize: "18px", fontWeight: "600" },
  { value: "body", label: "Body", fontSize: "16px", fontWeight: "400" },
];


// FINAL VERSION + USER PROP
export default function NotesPage({ user }) {
  const navigate = useNavigate();
  const { activeFolder, setActiveFolder } = useOutletContext(); // 🔗 from MainLayout
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");

  const [mainSearch, setMainSearch] = useState("");
  const [selectedNoteId, setSelectedNoteId] = useState(null);
  const [draft, setDraft] = useState({
    title: "",
    content: "",
    folder: fallbackFolderKey,
  });
  const [formatting, setFormatting] = useState(defaultFormatting);
  const [saving, setSaving] = useState(false);
  const [createMenuOpen, setCreateMenuOpen] = useState(false);

  // --- Data Loading (final version, now gated by user) ---
  useEffect(() => {
    if (!user) {
      setLoading(false);
      setNotes([]);
      return;
    }

    const load = async () => {
      setLoading(true);
      try {
        const data = await fetchNotes();
        setNotes(data);
      } catch (err) {
        console.error("Error loading notes:", err);
        setStatus("Could not load notes.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [user]);

  // --- Handlers ---
const openNote = (noteId) => {
  const note = notes.find((n) => n.id === noteId);
  if (!note) return;
  setSelectedNoteId(noteId);
  setDraft({
    title: note.title || "Untitled note",
    content: note.content || "",
    folder: canonicalFolder(note.folder),
  });
  setFormatting({ ...defaultFormatting, ...(note.formatting || {}) });
};



  const closeEditor = () => {
    setSelectedNoteId(null);
    setDraft({
      title: "",
      content: "",
      folder: activeFolder === "All" ? fallbackFolderKey : activeFolder,
    });
    setFormatting(defaultFormatting);
  };

  // handleCreate now matches version 1 layout (multiple create types),
  // but still uses your final-version Firestore + user logic.
  const handleCreate = async (typeLabel = "Note", typeKey = "note") => {
    if (typeKey === "calendar") {
      navigate("/calendar");
      return;
    }

    if (!user || !user.uid) {
      setStatus("Error: Must be signed in to create a document.");
      return;
    }

    const folder =
      activeFolder === "All"
        ? fallbackFolderKey
        : canonicalFolder(activeFolder);

    const payload = {
      title: typeLabel === "Note" ? "New doc" : typeLabel,
      content: "",
      folder,

      formatting: defaultFormatting,
      type: typeLabel.toLowerCase(),
    };

    try {
      const ref = await createNote(payload, user.uid);
      const newNote = {
        id: ref.id,
        createdAt: Date.now(),
        ...payload,
        userId: user.uid,
      };
      setNotes((prev) => [newNote, ...prev]);
      openNote(ref.id);
      const createdMsg =
        typeLabel === "Note" ? "New document created." : `${typeLabel} created.`;
      setStatus(createdMsg);
      setCreateMenuOpen(false);
    } catch (err) {
      console.error(err);
      setStatus("Could not create note. Check console for details.");
    }
  };

  const handleDeleteNote = async (id) => {
    try {
      await deleteNoteFirestore(id);
      setNotes((prev) => prev.filter((n) => n.id !== id));
      if (selectedNoteId === id) {
        closeEditor();
      }
      setStatus("Note deleted.");
    } catch (err) {
      console.error(err);
      setStatus("Could not delete note.");
    }
  };

  const handleSave = async () => {
    if (!selectedNoteId) return;
    setSaving(true);
    try {
      const payload = {
        ...draft,
        folder: canonicalFolder(draft.folder),
        formatting,
      };
      await updateNoteFirestore(selectedNoteId, payload);

      setNotes((prev) =>
        prev.map((n) => (n.id === selectedNoteId ? { ...n, ...payload } : n))
      );
      setStatus("Saved");
    } catch (err) {
      console.error(err);
      setStatus("Save failed.");
    } finally {
      setSaving(false);
    }
  };

  // --- Memoized Data & Utilities ---
  const filteredNotes = useMemo(() => {
    const query = mainSearch.toLowerCase().trim();
    return notes.filter((note) => {
      const folderMatch =
        activeFolder === "All" ||
        normalizeFolder(note.folder) === normalizeFolder(activeFolder);

      const text = `${note.title || ""} ${note.content || ""}`.toLowerCase();
      const searchMatch = !query || text.includes(query);
      return folderMatch && searchMatch;
    });
  }, [notes, activeFolder, mainSearch]);


  const formatDate = (dateValue) => {
  // 1. If date is missing/null, handle gracefully
  if (!dateValue) return "";

  let ms;

  // 2. Check if it's a Firestore Timestamp (has a .toDate() method)
  if (typeof dateValue === 'object' && typeof dateValue.toDate === 'function') {
    ms = dateValue.toDate().getTime(); 
  } 
  // 3. Check if it's already a number (client-side Date.now())
  else if (typeof dateValue === 'number') {
    ms = dateValue;
  } 
  // 4. Fallback for unknown formats
  else {
    return ""; 
  }

  try {
    const d = new Date(ms);
    return d.toLocaleDateString("en-US", { day: "numeric", month: "short" });
  } catch (e) {
    return "";
  }
};

  const updateDraftField = (field, value) => {
    setDraft((prev) => ({ ...prev, [field]: value }));
    setNotes((prev) =>
      prev.map((n) => (n.id === selectedNoteId ? { ...n, [field]: value } : n))
    );
  };

  const applyHeading = (value) => {
    const heading = headingOptions.find((h) => h.value === value);
    if (!heading) return;
    setFormatting((prev) => ({
      ...prev,
      heading: value,
      fontSize: heading.fontSize,
      fontWeight: heading.fontWeight,
    }));
  };

  const applyFontSize = (value) => {
    setFormatting((prev) => ({ ...prev, fontSize: value }));
  };

  const applyFontFamily = (value) => {
    setFormatting((prev) => ({ ...prev, fontFamily: value }));
  };

  const toggleBold = () => {
    setFormatting((prev) => ({
      ...prev,
      fontWeight: prev.fontWeight === "bold" ? "normal" : "bold",
    }));
  };

  const toggleItalic = () => {
    setFormatting((prev) => ({
      ...prev,
      fontStyle: prev.fontStyle === "italic" ? "normal" : "italic",
    }));
  };

  const toggleHighlight = () => {
    setFormatting((prev) => ({
      ...prev,
      highlight: !prev.highlight,
    }));
  };

  const resetFormatting = () => setFormatting(defaultFormatting);

  const cropWhitespace = () => {
    if (!selectedNoteId) return;
    const trimmed = draft.content.trim();
    setDraft((prev) => ({ ...prev, content: trimmed }));
    setNotes((prev) =>
      prev.map((n) =>
        n.id === selectedNoteId ? { ...n, content: trimmed } : n
      )
    );
  };

  const addBullet = () => {
    const base =
      draft.content.endsWith("\n") || draft.content.length === 0
        ? draft.content
        : `${draft.content}\n`;
    const updated = `${base}- `;
    setDraft((prev) => ({ ...prev, content: updated }));
    setNotes((prev) =>
      prev.map((n) =>
        n.id === selectedNoteId ? { ...n, content: updated } : n
      )
    );
  };

  const addNumber = () => {
    const lines = draft.content.split("\n").filter(Boolean);
    const next = lines.length + 1;
    const base =
      draft.content.endsWith("\n") || draft.content.length === 0
        ? draft.content
        : `${draft.content}\n`;
    const updated = `${base}${next}. `;
    setDraft((prev) => ({ ...prev, content: updated }));
    setNotes((prev) =>
      prev.map((n) =>
        n.id === selectedNoteId ? { ...n, content: updated } : n
      )
    );
  };

  const downloadNote = (note, e) => {
    e.stopPropagation();
    const blob = new Blob(
      [`${note.title || "Untitled"}\n\n${note.content || ""}`],
      {
        type: "text/plain",
      }
    );
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${(note.title || "note").replace(/\s+/g, "_")}.txt`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  // --- Render ---
  return (
    <>
      {/* HEADER: now follows version 1 layout */}
      <div className="notes-header">
        <div className="header-left">
          <h1>Notes</h1>
          <button
            className="cta-new-wide"
            onClick={() => handleCreate("Note", "note")}
          >
            <span className="pill">NEW NOTE</span>
            Write your next big idea...
          </button>

        </div>
        <div className="header-actions">
          <div className="main-search">
            <input
              placeholder="Search"
              value={mainSearch}
              onChange={(e) => setMainSearch(e.target.value)}
            />
            <FontAwesomeIcon icon={faSearch} />
          </div>

          <div className="folder-switch">
            <span>Folder</span>
            <select
              value={activeFolder}
              onChange={(e) => setActiveFolder(e.target.value)}
            >
              {folderOptions.map((f) => (
                <option key={f.key} value={f.key}>
                  {f.label}
                </option>
              ))}
            </select>
          </div>

          <div className="new-doc-dropdown">
            <button
              className="new-doc"
              onClick={() => setCreateMenuOpen((prev) => !prev)}
            >
              <FontAwesomeIcon icon={faPlus} /> New
              <FontAwesomeIcon icon={faChevronDown} style={{ fontSize: 12 }} />
            </button>
            {createMenuOpen && (
              <div className="create-menu">
                {quickCreateOptions.map((opt) => (
                  <button
                    key={opt.key}
                    className="create-menu-item"
                    onClick={() => {
                      if (opt.key === "note") {
                        handleCreate("Note", "note");
                      } else if (opt.path) {
                        navigate(opt.path);
                        setCreateMenuOpen(false);
                      }
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* NOTES GRID */}
      <div className="notes-grid">
        {loading && <div className="empty">Loading notes…</div>}
        {!loading && filteredNotes.length === 0 && (
          <div className="empty">No notes found.</div>
        )}
        {!loading &&
          filteredNotes.map((note) => (
            <div
              key={note.id}
              className="note-card modern"
              onClick={() => openNote(note.id)}
            >
              <div className="note-card-top">
                <div className="note-date">{formatDate(note.createdAt)}</div>
                <FontAwesomeIcon icon={faEllipsisV} />
              </div>
              <div className="note-title">{note.title || "Untitled"}</div>
              <div className="note-preview">
                {(note.content || "").slice(0, 110) ||
                  "Start writing your note…"}
              </div>
              <div className="note-actions-row">
                <button
                  className="icon-btn"
                  onClick={(e) => downloadNote(note, e)}
                  title="Download"
                >
                  <FontAwesomeIcon icon={faDownload} />
                </button>
                <button
                  className="icon-btn danger"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteNote(note.id);
                  }}
                  title="Delete"
                >
                  <FontAwesomeIcon icon={faTrashAlt} />
                </button>
              </div>
            </div>
          ))}
      </div>
      {status && <div className="status-text">{status}</div>}

      {/* EDITOR PANEL (unchanged except layout CSS) */}
      {selectedNoteId && (
        <div className="editor-panel">
          {/* Editor Bar */}
          <div className="editor-bar">
            {/* Back/Controls */}
            <button className="ghost-btn" onClick={closeEditor}>
              <FontAwesomeIcon icon={faArrowLeft} /> Back
            </button>
            <div className="editor-controls">
              {/* Heading Select */}
              <select
                value={formatting.heading}
                onChange={(e) => applyHeading(e.target.value)}
                className="select"
              >
                {headingOptions.map((h) => (
                  <option key={h.value} value={h.value}>
                    {h.label}
                  </option>
                ))}
              </select>
              {/* Font Size Select */}
              <select
                value={formatting.fontSize}
                onChange={(e) => applyFontSize(e.target.value)}
                className="select"
              >
                {sizeOptions.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
              {/* Font Family Select */}
              <select
                value={formatting.fontFamily}
                onChange={(e) => applyFontFamily(e.target.value)}
                className="select wide"
              >
                {fontOptions.map((font) => (
                  <option key={font} value={font}>
                    {font.replace(/['"]/g, "")}
                  </option>
                ))}
              </select>
              {/* Bold/Italic/Highlight/etc buttons */}
              <button
                className={`ghost-btn ${
                  formatting.fontWeight === "bold" ? "active" : ""
                }`}
                onClick={toggleBold}
              >
                <FontAwesomeIcon icon={faBold} />
              </button>
              <button
                className={`ghost-btn ${
                  formatting.fontStyle === "italic" ? "active" : ""
                }`}
                onClick={toggleItalic}
              >
                <FontAwesomeIcon icon={faItalic} />
              </button>
              <button
                className={`ghost-btn ${
                  formatting.highlight ? "active" : ""
                }`}
                onClick={toggleHighlight}
              >
                <FontAwesomeIcon icon={faHighlighter} />
              </button>
              <button className="ghost-btn" onClick={resetFormatting}>
                <FontAwesomeIcon icon={faEraser} />
              </button>
              <button className="ghost-btn" onClick={cropWhitespace}>
                <FontAwesomeIcon icon={faCrop} />
              </button>
              <label className="ghost-btn color-picker" title="Text color">
                <FontAwesomeIcon icon={faPalette} />
                <input
                  type="color"
                  value={formatting.color}
                  onChange={(e) =>
                    setFormatting((prev) => ({
                      ...prev,
                      color: e.target.value,
                    }))
                  }
                />
              </label>
              <button className="ghost-btn" onClick={addBullet}>
                <FontAwesomeIcon icon={faListUl} />
              </button>
              <button className="ghost-btn" onClick={addNumber}>
                <FontAwesomeIcon icon={faListOl} />
              </button>
            </div>
            {/* Save Actions (kept from your final version) */}
            <div className="editor-actions">
              <div className="status-text" style={{ marginRight: 10 }}>
                {saving ? "Saving..." : status}
              </div>
              <button
                className="primary-btn"
                onClick={handleSave}
                disabled={saving}
              >
                <FontAwesomeIcon icon={faPen} />{" "}
                {saving ? "Updating..." : "Update"}
              </button>
            </div>
          </div>

          {/* Editor Body */}
          <div className="editor-body">
            <div className="editor-meta">
              <input
                className="editor-title"
                value={draft.title}
                onChange={(e) => updateDraftField("title", e.target.value)}
                placeholder="Note title"
              />
<select
  className="select"
  value={draft.folder}
  onChange={(e) => {
    const value = canonicalFolder(e.target.value);
    // update the note's folder field
    updateDraftField("folder", value);
    // ALSO move the workspace to that tab
    setActiveFolder(value);
  }}
>
  {folderOptions
    .filter((f) => f.key !== "All") // 🔥 no Inbox, no All
    .map((f) => (
      <option key={f.key} value={f.key}>
        {f.label}
      </option>
    ))}
</select>



            </div>
            <textarea
              className="editor-textarea"
              value={draft.content}
              onChange={(e) => updateDraftField("content", e.target.value)}
              style={{
                fontSize: formatting.fontSize,
                fontFamily: formatting.fontFamily,
                fontWeight: formatting.fontWeight,
                fontStyle: formatting.fontStyle,
                color: formatting.color,
                backgroundColor: formatting.highlight ? "#fffbe6" : "#fff",
              }}
              placeholder="Start writing your thoughts... Freely type with your tools above."
            />
          </div>
        </div>
      )}
    </>
  );
}





