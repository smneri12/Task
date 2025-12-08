// src/pages/Projects.jsx
import React, { useEffect, useMemo, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSearch,
  faPlus,
  faStar,
  faFolder,
  faCalendarAlt,
  faStickyNote,
  faChevronRight,
  faArchive,
  faTrash,
  faTimes,
} from "@fortawesome/free-solid-svg-icons";

import {
  fetchProjects,
  createProject,
  updateProject,
  deleteProject,
} from "../services/projects";
import { fetchNotes, updateNoteFirestore } from "../services/notes";
import {
  upsertProjectEvent,
  deleteProjectEvents,
} from "../services/calendar";

// ---- HELPER FUNCTIONS ----

function statusPillClass(status) {
  if (!status) return "pill";
  const key = status.toLowerCase().replace(/\s+/g, "");
  return `pill status-${key}`;
}

// Helper to safely get milliseconds from number or Timestamp
function getMillis(val) {
  if (!val) return null;
  // If it's a Firestore Timestamp (object with toDate)
  if (typeof val === "object" && typeof val.toDate === "function") {
    return val.toDate().getTime();
  }
  // If it's already a number
  if (typeof val === "number") {
    return val;
  }
  return null;
}

function formatDueDate(dueDate) {
  const ms = getMillis(dueDate);
  if (!ms) return "No due date";

  const d = new Date(ms);
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatUpdated(updatedAt, createdAt) {
  // Try updatedAt, fallback to createdAt
  const ms = getMillis(updatedAt) || getMillis(createdAt);

  if (!ms) return "just now";

  const d = new Date(ms);
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

// Build YYYY-MM-DD string for <input type="date"> using LOCAL time
function toDateInputValue(val) {
  const ms = getMillis(val);
  if (!ms) return "";
  const d = new Date(ms);

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function fromDateInputValue(value) {
  if (!value) return null;
  return new Date(value + "T00:00:00").getTime();
}

// Prefer updatedAt over createdAt when sorting notes
function noteTimestamp(note) {
  return getMillis(note?.updatedAt) || getMillis(note?.createdAt) || 0;
}

function truncate(text, maxLength = 80) {
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "…";
}

// ---- COMPONENT ----

export default function ProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notesLoading, setNotesLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");

  const [newProjectName, setNewProjectName] = useState("");
  const [creating, setCreating] = useState(false);

  const [selectedProject, setSelectedProject] = useState(null);
  const [deleting, setDeleting] = useState(false);

    const [statusMessage, setStatusMessage] = useState("");

  const showStatus = (text) => {
    setStatusMessage(text);
    setTimeout(() => setStatusMessage(""), 2000); // fades after 2s
  };

  // ---- initial load ----
  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const [projectData, noteData] = await Promise.all([
          fetchProjects(),
          fetchNotes(),
        ]);
        setProjects(projectData);
        setNotes(noteData);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
        setNotesLoading(false);
      }
    }
    load();
  }, []);

  // ---- derived counts + previews ----
  const notesByProject = useMemo(() => {
    const map = {};
    notes.forEach((n) => {
      if (!n.projectId) return;
      map[n.projectId] = (map[n.projectId] || 0) + 1;
    });
    return map;
  }, [notes]);

  // for each project, up to 2 latest linked notes
  const previewNotesByProject = useMemo(() => {
    const buckets = {};
    notes.forEach((n) => {
      if (!n.projectId) return;
      const arr = buckets[n.projectId] || [];
      arr.push(n);
      buckets[n.projectId] = arr;
    });

    Object.keys(buckets).forEach((projectId) => {
      buckets[projectId] = buckets[projectId]
        .slice()
        .sort((a, b) => noteTimestamp(b) - noteTimestamp(a))
        .slice(0, 2);
    });

    return buckets;
  }, [notes]);

  const filteredProjects = useMemo(() => {
    return projects
      .filter((p) => {
        if (statusFilter === "Active") return !p.archived && p.status !== "Done";
        if (statusFilter === "Done") return !p.archived && p.status === "Done";
        if (statusFilter === "Archived") return !!p.archived;
        return true;
      })
      .filter((p) => {
        if (categoryFilter === "All") return true;
        return p.category === categoryFilter;
      })
      .filter((p) => {
        if (!search.trim()) return true;
        return p.name.toLowerCase().includes(search.toLowerCase());
      })
      .sort((a, b) => {
        // pinned projects on top
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        return 0;
      });
  }, [projects, statusFilter, categoryFilter, search]);

  // ---- CRUD helpers ----
  async function handleCreateProject(e) {
    e.preventDefault();
    if (!newProjectName.trim()) return;
    try {
      setCreating(true);
      await createProject({ name: newProjectName.trim() });
      const projectData = await fetchProjects();
      setProjects(projectData);
      setNewProjectName("");
    } catch (e) {
      console.error(e);
    } finally {
      setCreating(false);
    }
  }

  /**
   * Generic field update for a project.
   * Keeps:
   *  - projects list
   *  - selectedProject detail panel
   *  - Firestore document
   *  - project calendar event (for due date / name)
   * all in sync.
   */
  async function handleProjectFieldChange(id, field, value) {
    const current = projects.find((p) => p.id === id) || {};
    const updatedProject = { ...current, [field]: value };

    setProjects((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    );

    setSelectedProject((prev) =>
      prev && prev.id === id ? { ...prev, [field]: value } : prev
    );

    try {
      await updateProject(id, { [field]: value });

      if ((field === "dueDate" || field === "name") && updatedProject.dueDate) {
        await upsertProjectEvent(updatedProject);
      }
    } catch (e) {
      console.error(e);
    }
  }

  async function handleTogglePinned(project) {
    await handleProjectFieldChange(project.id, "pinned", !project.pinned);
  }

  async function handleToggleArchived(project) {
    await handleProjectFieldChange(project.id, "archived", !project.archived);
  }

  async function handleDeleteProject(project) {
    if (
      !window.confirm(
        `Delete project "${project.name}"? This cannot be undone.`
      )
    )
      return;
    try {
      setDeleting(true);
      await deleteProject(project.id);
      await deleteProjectEvents(project.id);
      setProjects((prev) => prev.filter((p) => p.id !== project.id));
      setSelectedProject(null);
    } catch (e) {
      console.error(e);
    } finally {
      setDeleting(false);
    }
  }

  // ---- note linking ----
  const linkedNotes = useMemo(() => {
    if (!selectedProject) return [];
    return notes.filter((n) => n.projectId === selectedProject.id);
  }, [notes, selectedProject]);

  const unlinkedNotes = useMemo(() => {
    if (!selectedProject) return [];
    return notes.filter((n) => !n.projectId);
  }, [notes, selectedProject]);

  async function handleAttachNote(note) {
    if (!selectedProject) return;
    try {
      await updateNoteFirestore(note.id, { projectId: selectedProject.id });
      setNotes((prev) =>
        prev.map((n) =>
          n.id === note.id ? { ...n, projectId: selectedProject.id } : n
        )
      );
    } catch (e) {
      console.error(e);
    }
  }

  async function handleDetachNote(note) {
    try {
      await updateNoteFirestore(note.id, { projectId: null });
      setNotes((prev) =>
        prev.map((n) => (n.id === note.id ? { ...n, projectId: null } : n))
      );
    } catch (e) {
      console.error(e);
    }
  }

  return (
    <div>
      {/* HEADER */}
      <div className="notes-header">
        <h1>Projects</h1>
        <div className="header-actions">
          {/* search */}
          <div className="main-search">
            <FontAwesomeIcon icon={faSearch} />
            <input
              placeholder="Search projects…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* status filter */}
          <div className="folder-switch">
            <label>Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="All">All</option>
              <option value="Active">Active</option>
              <option value="Done">Done</option>
              <option value="Archived">Archived</option>
            </select>
          </div>

          {/* category filter */}
          <div className="folder-switch">
            <label>Category</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="All">All</option>
              <option value="School">School</option>
              <option value="Work">Work</option>
              <option value="Personal">Personal</option>
            </select>
          </div>
        </div>
      </div>

      {/* NEW PROJECT ROW */}
      <div className="new-project-row">
        <form onSubmit={handleCreateProject} className="new-project-inline">
          <input
            type="text"
            className="project-name-input"
            placeholder="Project name…"
            value={newProjectName}
            onChange={(e) => setNewProjectName(e.target.value)}
          />
          <button
            type="submit"
            className="new-doc"
            disabled={creating || !newProjectName.trim()}
          >
            <FontAwesomeIcon icon={faPlus} />
            <span>New project</span>
          </button>
        </form>
      </div>

<p className="status-text projects-status-line">
  {loading
    ? "Loading projects…"
    : filteredProjects.length
    ? `${filteredProjects.length} project(s)`
    : "No projects yet — create one to bundle multiple related notes into a folder."}
  {statusMessage && <> · {statusMessage}</>}
</p>


      {/* GRID */}
      <div className="projects-grid">
        {filteredProjects.map((project) => {
          const previews = previewNotesByProject[project.id] || [];
          return (
            <button
              key={project.id}
              type="button"
              className="project-card"
              onClick={() => setSelectedProject(project)}
            >
              <div className="project-card-header">
                <div>
                  <div className="project-title">{project.name}</div>
                  <div className="project-meta-row" style={{ marginTop: 4 }}>
                    <span className="pill">
                      <FontAwesomeIcon icon={faFolder} />{" "}
                      {project.category || "Personal"}
                    </span>
                    <span
                      className={statusPillClass(project.status || "Planning")}
                    >
                      {project.status || "Planning"}
                    </span>
                    {project.archived && (
                      <span className="pill">
                        <FontAwesomeIcon icon={faArchive} /> Archived
                      </span>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  className="icon-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleTogglePinned(project);
                  }}
                >
                  <FontAwesomeIcon
                    icon={faStar}
                    style={{ opacity: project.pinned ? 1 : 0.3 }}
                  />
                </button>
              </div>

<div className="project-meta-row">
  <span>
    <FontAwesomeIcon icon={faCalendarAlt} />{" "}
    {formatDueDate(project.dueDate)}
  </span>
  <span>
    <FontAwesomeIcon icon={faStickyNote} />{" "}
    {notesByProject[project.id] || 0} notes
  </span>
</div>

{project.description && (
  <div className="project-card-description">
    {truncate(project.description, 90)}
  </div>
)}

{/* Quick preview of linked notes */}
{previews.length > 0 && (
  <div className="project-card-notes">
    {previews.map((note) => (
      <div key={note.id} className="project-card-note-line">
        <span className="project-card-note-title">
          {note.title || "Untitled note"}
        </span>
        {note.content && (
          <span className="project-card-note-snippet">
            {" — "}
            {truncate(note.content, 70)}
          </span>
        )}
      </div>
    ))}
  </div>
)}


              <div className="project-footer-row">
                <span>
                  Updated {formatUpdated(project.updatedAt, project.createdAt)}
                </span>
                <FontAwesomeIcon icon={faChevronRight} />
              </div>
            </button>
          );
        })}
      </div>

      {/* DETAIL PANEL */}
      {selectedProject && (
        <div className="project-detail-panel">
          <div className="project-detail-header">
            <div style={{ flex: 1, minWidth: 0 }}>
              <input
                className="editor-title"
                style={{ fontSize: 22 }}
                value={selectedProject.name}
                onChange={(e) =>
                  handleProjectFieldChange(
                    selectedProject.id,
                    "name",
                    e.target.value
                  )
                }
              />
              <div className="project-meta-row" style={{ marginTop: 6 }}>
                <span className="pill">
                  <FontAwesomeIcon icon={faFolder} />{" "}
                  {selectedProject.category || "Personal"}
                </span>
                <span
                  className={statusPillClass(
                    selectedProject.status || "Planning"
                  )}
                >
                  {selectedProject.status || "Planning"}
                </span>
                {selectedProject.pinned && (
                  <span className="pill">
                    <FontAwesomeIcon icon={faStar} /> Pinned
                  </span>
                )}
                {selectedProject.archived && (
                  <span className="pill">
                    <FontAwesomeIcon icon={faArchive} /> Archived
                  </span>
                )}
              </div>
            </div>

            <div className="editor-actions">
              <button
                className="ghost-btn"
                type="button"
                onClick={() => handleTogglePinned(selectedProject)}
              >
                <FontAwesomeIcon icon={faStar} style={{ marginRight: 6 }} />
                {selectedProject.pinned ? "Unpin" : "Pin"}
              </button>

              <button
                className="ghost-btn"
                type="button"
                onClick={() => handleToggleArchived(selectedProject)}
              >
                <FontAwesomeIcon icon={faArchive} style={{ marginRight: 6 }} />
                {selectedProject.archived ? "Unarchive" : "Archive"}
              </button>

              <button
                className="ghost-btn"
                type="button"
                disabled={deleting}
                onClick={() => handleDeleteProject(selectedProject)}
              >
                <FontAwesomeIcon icon={faTrash} style={{ marginRight: 6 }} />
                Delete
              </button>

              {/* Big Save button just closes the panel (edits auto-save) */}
              <button
                className="primary-btn"
                type="button"
                  onClick={() => {
    showStatus("Project saved");
    setSelectedProject(null);
  }}

              >
                Save
              </button>

              {/* Small X button in the corner */}
              <button
                className="icon-btn"
                type="button"
                aria-label="Close"
                onClick={() => setSelectedProject(null)}
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
          </div>

          <div className="project-detail-body">
            {/* Overview */}
            <div className="project-section">
              <div className="project-section-header">
                <div className="project-section-title">Overview</div>
              </div>

              <label className="status-text">Category</label>
              <select
                className="select wide"
                value={selectedProject.category || "Personal"}
                onChange={(e) =>
                  handleProjectFieldChange(
                    selectedProject.id,
                    "category",
                    e.target.value
                  )
                }
              >
                <option value="School">School</option>
                <option value="Work">Work</option>
                <option value="Personal">Personal</option>
              </select>

              <label className="status-text">Status</label>
              <select
                className="select wide"
                value={selectedProject.status || "Planning"}
                onChange={(e) =>
                  handleProjectFieldChange(
                    selectedProject.id,
                    "status",
                    e.target.value
                  )
                }
              >
                <option value="Planning">Planning</option>
                <option value="In Progress">In Progress</option>
                <option value="On Hold">On Hold</option>
                <option value="Done">Done</option>
              </select>

              <label className="status-text">Due date</label>
              <input
                type="date"
                className="select wide"
                value={toDateInputValue(selectedProject.dueDate)}
                onChange={(e) =>
                  handleProjectFieldChange(
                    selectedProject.id,
                    "dueDate",
                    fromDateInputValue(e.target.value)
                  )
                }
              />

              <label className="status-text" style={{ marginTop: 8 }}>
                Description
              </label>
              <textarea
                className="editor-textarea"
                style={{ minHeight: 140 }}
                placeholder="What is this project about?"
                value={selectedProject.description || ""}
                onChange={(e) =>
                  handleProjectFieldChange(
                    selectedProject.id,
                    "description",
                    e.target.value
                  )
                }
              />
            </div>

            {/* Linked Notes */}
            <div className="project-section">
              <div className="project-section-header">
                <div className="project-section-title">
                  Linked notes ({linkedNotes.length})
                </div>
              </div>

              <p className="status-text" style={{ marginBottom: 8 }}>
                Attach notes from your Notes tab so everything for this project
                stays together. Unlinking a note here does not delete it — it
                just removes the connection.
              </p>

              <div className="project-notes-list">
                {linkedNotes.map((note) => (
                  <div key={note.id} className="project-note-item">
                    <div>
                      <div style={{ fontWeight: 600 }}>
                        {note.title || "Untitled note"}
                      </div>
                      <div className="status-text">
                        {note.folder ? `Folder: ${note.folder}` : "No folder"}
                      </div>
                    </div>
                    <button
                      type="button"
                      className="remove"
                      onClick={() => handleDetachNote(note)}
                    >
                      Unlink
                    </button>
                  </div>
                ))}
                {!linkedNotes.length && (
                  <div className="status-text">
                    No notes linked yet. Choose some from your workspace below.
                  </div>
                )}
              </div>

              <div style={{ marginTop: 12 }}>
                <div
                  className="project-section-title"
                  style={{ fontSize: 13, marginBottom: 6 }}
                >
                  Link existing notes from your workspace
                </div>
                <div className="project-notes-list">
                  {notesLoading && (
                    <div className="status-text">Loading notes…</div>
                  )}
                  {!notesLoading && unlinkedNotes.length === 0 && (
                    <div className="status-text">
                      All of your notes are already linked to projects.
                    </div>
                  )}
                  {!notesLoading &&
                    unlinkedNotes.slice(0, 8).map((note) => (
                      <div key={note.id} className="project-note-item">
                        <div>
                          <div style={{ fontWeight: 600 }}>
                            {note.title || "Untitled note"}
                          </div>
                          <div className="status-text">
                            {note.folder ? `Folder: ${note.folder}` : "No folder"}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleAttachNote(note)}
                        >
                          Link
                        </button>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
