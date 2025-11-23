import React, { useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

export default function NoteEditor({ note, setNote, allFolders, setAllFolders }) {
  useEffect(() => {
    if (note && note.folder && !allFolders.includes(note.folder)) {
      setAllFolders(prev => [...prev, note.folder]);
    }
  }, [note, allFolders, setAllFolders]);

  const editor = useEditor({
    extensions: [StarterKit],
    content: note?.content || "<p></p>",
    onUpdate: ({ editor }) => {
      setNote({ ...note, content: editor.getHTML() });
    },
  });

  if (!note) return <div className="card">Select or create a note to edit.</div>;

  return (
    <div className="card">
      <input
        className="input"
        placeholder="Note title..."
        value={note.title}
        onChange={(e) => setNote({ ...note, title: e.target.value })}
        style={{ marginBottom: 10 }}
      />

      <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
        <select
          value={note.folder}
          onChange={(e) => setNote({ ...note, folder: e.target.value })}
          style={{ padding: 8, borderRadius: 8, border: "1px solid #eee" }}
        >
          {allFolders.map(f => (
            <option key={f} value={f}>{f}</option>
          ))}
        </select>

        <input
          className="input"
          placeholder="Add new folder"
          onKeyDown={(e) => {
            if (e.key === "Enter" && e.target.value.trim()) {
              const v = e.target.value.trim();
              setAllFolders(prev =>
                prev.includes(v) ? prev : [...prev, v]
              );
              setNote({ ...note, folder: v });
              e.target.value = "";
            }
          }}
        />
      </div>

      <div className="tiptap-editor">
        <EditorContent editor={editor} />
      </div>

      <div style={{ marginTop: 12 }}>
        <strong>Tasks</strong>
        <TaskEditor note={note} setNote={setNote} />
      </div>
    </div>
  );
}

function TaskEditor({ note, setNote }) {
  const addTask = (text) => {
    setNote({
      ...note,
      tasks: [...(note.tasks || []), { id: Date.now().toString(), text, done: false }],
    });
  };

  const toggleTask = (id) => {
    setNote({
      ...note,
      tasks: note.tasks.map((t) =>
        t.id === id ? { ...t, done: !t.done } : t
      ),
    });
  };

  const removeTask = (id) => {
    setNote({
      ...note,
      tasks: note.tasks.filter((t) => t.id !== id),
    });
  };

  return (
    <div style={{ marginTop: 8 }}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const text = e.target.elements.task.value.trim();
          if (text) {
            addTask(text);
            e.target.reset();
          }
        }}
      >
        <input name="task" className="input" placeholder="Add a quick task..." />
      </form>

      <div style={{ marginTop: 8 }}>
        {(note.tasks || []).map((t) => (
          <div className={`task ${t.done ? "done" : ""}`} key={t.id}>
            <input
              type="checkbox"
              checked={t.done}
              onChange={() => toggleTask(t.id)}
            />
            <div style={{ flex: 1 }}>{t.text}</div>
            <button
              className="btn ghost"
              onClick={() => removeTask(t.id)}
              type="button"
            >
              x
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
