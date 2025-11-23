import React from "react";

export default function NoteCard({ note, onOpen, onDelete }) {
  if (!note) return null;               // <--- safety check
  
  const rawContent = note.content || ""; // <--- prevents undefined error
  const preview = rawContent.replace(/<\/?[^>]+(>|$)/g, "").slice(0, 120);

  return (
    <div className="note-card card" onClick={() => onOpen(note.id)}>
      <div>
        <div className="title">{note.title || "(Untitled)"}</div>
        <div className="meta">
          {note.folder || "No folder"} · 
          {note.createdAt ? new Date(note.createdAt).toLocaleDateString() : ""}
        </div>
      </div>

      <div
        style={{ marginTop: 10, fontSize: 13, color: "#333" }}
        dangerouslySetInnerHTML={{
          __html: rawContent ? rawContent.slice(0, 260) : "<i>(empty)</i>",
        }}
      />

      <div style={{display:'flex', justifyContent:'space-between', marginTop:8}}>
        <div style={{fontSize:12, color:'#999'}}>
          {note.tasks?.length || 0} tasks
        </div>

        <button
          className="btn ghost"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(note.id);
          }}
        >
          Delete
        </button>
      </div>
    </div>
  );
}
