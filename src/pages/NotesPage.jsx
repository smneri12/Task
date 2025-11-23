// src/pages/NotesPage.jsx (CLEANED UP FOR LAYOUT)
import React, { useEffect, useMemo, useState } from "react";
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
} from "@fortawesome/free-solid-svg-icons";
import { fetchNotes, createNote, updateNoteFirestore, deleteNoteFirestore } from "../services/notes";
// Removed signOut and auth imports, as Sign Out is now handled in Sidebar.jsx
import "../index.css"; 

// --- STATIC DATA EXTRACTED FROM NotesPage.jsx ---
// NOTE: Folder/Navigation options are now mostly managed in Sidebar.jsx/MainLayout.jsx
const folderOptions = [
  { key: "Inbox", label: "Inbox" },
  { key: "School", label: "School" },
  { key: "Work", label: "Work" },
  { key: "Personal", label: "Personal" },
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


export default function NotesPage() {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");
  // Removed activeFolder and dropdown state, as it's now managed in MainLayout
  const [activeFolder] = useState("Inbox"); // Keep a default for filtering/creation logic
  
  const [mainSearch, setMainSearch] = useState("");
  const [selectedNoteId, setSelectedNoteId] = useState(null);
  const [draft, setDraft] = useState({ title: "", content: "", folder: "Inbox" });
  const [formatting, setFormatting] = useState(defaultFormatting);
  const [saving, setSaving] = useState(false);
  
  // NOTE: sidebarSearch removed, as it's now an independent component in Sidebar.jsx

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        // Fetch notes logic remains the same
        const data = await fetchNotes();
        setNotes(data);
      } catch (err) {
        console.error(err);
        setStatus("Could not load notes.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const openNote = (noteId) => {
    const note = notes.find((n) => n.id === noteId);
    if (!note) return;
    setSelectedNoteId(noteId);
    setDraft({
      title: note.title || "Untitled note",
      content: note.content || "",
      folder: note.folder || "Inbox",
    });
    setFormatting({ ...defaultFormatting, ...(note.formatting || {}) });
  };

  const closeEditor = () => {
    setSelectedNoteId(null);
    setDraft({ title: "", content: "", folder: activeFolder });
    setFormatting(defaultFormatting);
  };

  const handleCreate = async () => {
    const folder = activeFolder === "All" ? "Inbox" : activeFolder;
    const payload = {
      title: "New doc",
      content: "",
      folder,
      formatting: defaultFormatting,
    };

    try {
      const ref = await createNote(payload);
      const newNote = { id: ref.id, createdAt: Date.now(), ...payload };
      setNotes((prev) => [newNote, ...prev]);
      openNote(ref.id);
      setStatus("New document created.");
    } catch (err) {
      console.error(err);
      setStatus("Could not create note.");
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
      const payload = { ...draft, formatting };
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

  const filteredNotes = useMemo(() => {
    // Note: sidebarSearch has been removed from this file, adjusting filtering
    const query = mainSearch.toLowerCase().trim();
    return notes.filter((note) => {
      const folderMatch = activeFolder === "All" || (note.folder || "Inbox") === activeFolder;
      const text = `${note.title || ""} ${note.content || ""}`.toLowerCase();
      const searchMatch = !query || text.includes(query);
      return folderMatch && searchMatch;
    });
  }, [notes, activeFolder, mainSearch]); // Dependency array updated

  const selectedNote = useMemo(
    () => notes.find((n) => n.id === selectedNoteId) || null,
    [notes, selectedNoteId]
  );

  const formatDate = (ms) => {
    if (!ms) return "";
    try {
      const d = new Date(ms);
      return d.toLocaleDateString("en-US", { day: "numeric", month: "short" });
    } catch {
      return "";
    }
  };

  const downloadNote = (note, e) => {
    e.stopPropagation();
    const blob = new Blob([`${note.title || "Untitled"}\n\n${note.content || ""}`], {
      type: "text/plain",
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${(note.title || "note").replace(/\s+/g, "_")}.txt`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  // --- Other formatting functions (applyHeading, applyFontSize, etc.) are kept here ---
  // ... (toggleBold, toggleItalic, toggleHighlight, resetFormatting, cropWhitespace, addBullet, addNumber) ...

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
      prev.map((n) => (n.id === selectedNoteId ? { ...n, content: trimmed } : n))
    );
  };

  const addBullet = () => {
    const base = draft.content.endsWith("\n") || draft.content.length === 0 ? draft.content : `${draft.content}\n`;
    const updated = `${base}- `;
    setDraft((prev) => ({ ...prev, content: updated }));
    setNotes((prev) =>
      prev.map((n) => (n.id === selectedNoteId ? { ...n, content: updated } : n))
    );
  };

  const addNumber = () => {
    const lines = draft.content.split("\n").filter(Boolean);
    const next = lines.length + 1;
    const base = draft.content.endsWith("\n") || draft.content.length === 0 ? draft.content : `${draft.content}\n`;
    const updated = `${base}${next}. `;
    setDraft((prev) => ({ ...prev, content: updated }));
    setNotes((prev) =>
      prev.map((n) => (n.id === selectedNoteId ? { ...n, content: updated } : n))
    );
  };

  const updateDraftField = (field, value) => {
    setDraft((prev) => ({ ...prev, [field]: value }));
    setNotes((prev) =>
      prev.map((n) => (n.id === selectedNoteId ? { ...n, [field]: value } : n))
    );
  };
  
  return (
    // Renders ONLY the main content and the editor panel
    <>
      <div className="notes-header">
        <h1>Notes</h1>
        <div className="header-actions">
          <div className="main-search">
            <input
              placeholder="Search"
              value={mainSearch}
              onChange={(e) => setMainSearch(e.target.value)}
            />
            <FontAwesomeIcon icon={faSearch} />
          </div>
          <button className="new-doc" onClick={handleCreate}>
            <FontAwesomeIcon icon={faPlus} /> New doc
          </button>
        </div>
      </div>

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
                {(note.content || "").slice(0, 110) || "Start writing your note…"}
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

      {selectedNote && (
        <div className="editor-panel">
          {/* Editor Panel Content */}
          <div className="editor-bar">
            {/* Back/Controls */}
            <button className="ghost-btn" onClick={closeEditor}>
              <FontAwesomeIcon icon={faArrowLeft} /> Back
            </button>
            <div className="editor-controls">
                {/* Heading Select */}
                <select value={formatting.heading} onChange={(e) => applyHeading(e.target.value)} className="select">
                    {headingOptions.map((h) => (<option key={h.value} value={h.value}>{h.label}</option>))}
                </select>
                {/* Font Size Select */}
                <select value={formatting.fontSize} onChange={(e) => applyFontSize(e.target.value)} className="select">
                    {sizeOptions.map((size) => (<option key={size} value={size}>{size}</option>))}
                </select>
                {/* Font Family Select */}
                <select value={formatting.fontFamily} onChange={(e) => applyFontFamily(e.target.value)} className="select wide">
                    {fontOptions.map((font) => (<option key={font} value={font}>{font.replace(/['"]/g, "")}</option>))}
                </select>
                {/* Bold/Italic/Highlight/etc buttons */}
                <button className={`ghost-btn ${formatting.fontWeight === "bold" ? "active" : ""}`} onClick={toggleBold}><FontAwesomeIcon icon={faBold} /></button>
                <button className={`ghost-btn ${formatting.fontStyle === "italic" ? "active" : ""}`} onClick={toggleItalic}><FontAwesomeIcon icon={faItalic} /></button>
                <button className={`ghost-btn ${formatting.highlight ? "active" : ""}`} onClick={toggleHighlight}><FontAwesomeIcon icon={faHighlighter} /></button>
                <button className="ghost-btn" onClick={resetFormatting}><FontAwesomeIcon icon={faEraser} /></button>
                <button className="ghost-btn" onClick={cropWhitespace}><FontAwesomeIcon icon={faCrop} /></button>
                <label className="ghost-btn color-picker" title="Text color">
                    <FontAwesomeIcon icon={faPalette} />
                    <input type="color" value={formatting.color} onChange={(e) => setFormatting((prev) => ({ ...prev, color: e.target.value }))} />
                </label>
                <button className="ghost-btn" onClick={addBullet}><FontAwesomeIcon icon={faListUl} /></button>
                <button className="ghost-btn" onClick={addNumber}><FontAwesomeIcon icon={faListOl} /></button>
            </div>
            {/* Save Actions */}
            <div className="editor-actions">
              <button className="ghost-btn" onClick={handleSave} disabled={saving}>
                {saving ? "Saving…" : "Save"}
              </button>
              <button className="primary-btn" onClick={handleSave}>
                <FontAwesomeIcon icon={faPen} /> Update
              </button>
            </div>
          </div>

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
                onChange={(e) => updateDraftField("folder", e.target.value)}
              >
                {folderOptions.map((f) => (<option key={f.key} value={f.key}>{f.label}</option>))}
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
              placeholder="Start writing like in Google Docs — free type with your tools above."
            />
          </div>
        </div>
      )}
    </>
  );
}