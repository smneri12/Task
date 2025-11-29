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

// ---- small helpers ----
function statusPillClass(status) {
  if (!status) return "pill";
  const key = status.toLowerCase().replace(/\s+/g, "");
  return `pill status-${key}`;
}

function formatDueDate(dueDate) {
  if (!dueDate) return "No due date";
  const d = new Date(dueDate);
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatUpdated(updatedAt, createdAt) {
  const ms = updatedAt || createdAt;
  if (!ms) return "just now";
  const d = new Date(ms);
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function toDateInputValue(ms) {
  if (!ms) return "";
  const d = new Date(ms);
  return d.toISOString().slice(0, 10);
}

function fromDateInputValue(value) {
  if (!value) return null;
  return new Date(value + "T00:00:00").getTime();
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notesLoading, setNotesLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All"); // All | Active | Done | Archived
  const [categoryFilter, setCategoryFilter] = useState("All"); // All | School | Work | Personal

  const [newProjectName, setNewProjectName] = useState("");
  const [creating, setCreating] = useState(false);

  const [selectedProject, setSelectedProject] = useState(null);
  const [deleting, setDeleting] = useState(false);

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

  // ---- derived counts ----
  const notesByProject = useMemo(() => {
    const map = {};
    notes.forEach((n) => {
      if (!n.projectId) return;
      map[n.projectId] = (map[n.projectId] || 0) + 1;
    });
    return map;
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

  async function handleProjectFieldChange(id, field, value) {
    setProjects((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    );
    try {
      await updateProject(id, { [field]: value });
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
    if (!window.confirm(`Delete project "${project.name}"? This cannot be undone.`))
      return;
    try {
      setDeleting(true);
      await deleteProject(project.id);
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
      {/* HEADER (matches your notes header styling) */}
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

      {/* NEW PROJECT ROW (under title, above status text) */}
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
      </p>

      {/* GRID */}
      <div className="projects-grid">
        {filteredProjects.map((project) => (
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
                  <span className={statusPillClass(project.status || "Planning")}>
                    {project.status || "Planning"}
                  </span>
                  {project.pinned && (
                    <span className="pill">
                      <FontAwesomeIcon icon={faStar} /> Pinned
                    </span>
                  )}
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

            <div className="project-footer-row">
              <span>
                Updated {formatUpdated(project.updatedAt, project.createdAt)}
              </span>
              <FontAwesomeIcon icon={faChevronRight} />
            </div>
          </button>
        ))}
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
              <button
                className="primary-btn"
                type="button"
                onClick={() => setSelectedProject(null)}
              >
                <FontAwesomeIcon icon={faTimes} style={{ marginRight: 6 }} />
                Close
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
                  Notes in this project ({linkedNotes.length})
                </div>
              </div>

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
                      Remove
                    </button>
                  </div>
                ))}
                {!linkedNotes.length && (
                  <div className="status-text">
                    No notes linked yet. Add some below.
                  </div>
                )}
              </div>

              <div style={{ marginTop: 12 }}>
                <div
                  className="project-section-title"
                  style={{ fontSize: 13, marginBottom: 6 }}
                >
                  Add existing note to this project
                </div>
                <div className="project-notes-list">
                  {notesLoading && (
                    <div className="status-text">Loading notes…</div>
                  )}
                  {!notesLoading && unlinkedNotes.length === 0 && (
                    <div className="status-text">
                      All your notes are already linked to projects.
                    </div>
                  )}
                  {!notesLoading &&
                    unlinkedNotes.slice(0, 8).map((note) => (
                      <div key={note.id} className="project-note-item">
                        <div>
                          <div style={{ fontWeight: 600 }}>
                            {note.title || "Untitled note"}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleAttachNote(note)}
                        >
                          Add
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
