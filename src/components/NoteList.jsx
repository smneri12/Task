import React from "react";
import NoteCard from "./NoteCard";

export default function NoteList({ notes = [], onOpen, onDelete }) {
  if (!Array.isArray(notes)) return <div className="card">No notes.</div>;

  const safeNotes = notes.filter(n => n && typeof n === "object");

  if (!safeNotes.length) {
    return <div className="card">No notes in this folder.</div>;
  }

  return (
    <div className="note-grid">
      {safeNotes.map((note) => (
        <NoteCard 
          key={note.id} 
          note={note} 
          onOpen={onOpen} 
          onDelete={onDelete} 
        />
      ))}
    </div>
  );
}
