import { v4 as uuid } from "uuid";

export const sampleNotes = [
  {
    id: uuid(),
    title: "Welcome to NoteIS",
    folder: "Inbox",
    content: "<p>Hi! This is your first Note. Use the editor to edit content.</p><p><strong>Features:</strong></p><ul><li>Create notes</li><li>Task checklists</li><li>Search</li></ul>",
    tasks: [
      { id: uuid(), text: "Try editing this note", done: false },
      { id: uuid(), text: "Create a new note", done: false }
    ],
    createdAt: Date.now()
  },
  {
    id: uuid(),
    title: "Study Plan - Week 1",
    folder: "School",
    content: "<p>Subjects: Database, Networking, Web Dev.</p>",
    tasks: [
      { id: uuid(), text: "Read chapter 3", done: true },
      { id: uuid(), text: "Finish lab", done: false }
    ],
    createdAt: Date.now() - 1000 * 60 * 60 * 24
  }
];
