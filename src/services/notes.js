import { db, auth } from "../firebase";
import {
  collection,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";

// Get all notes for logged-in user
export async function fetchNotes() {
  const user = auth.currentUser;
  if (!user) return [];

  const q = query(collection(db, "notes"), where("uid", "==", user.uid));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
}

// Add a new note
export async function createNote(note) {
  const user = auth.currentUser;
  if (!user) return null;

  return await addDoc(collection(db, "notes"), {
    ...note,
    uid: user.uid,
    createdAt: Date.now(),
  });
}

// Update a note
export async function updateNoteFirestore(id, data) {
  const ref = doc(db, "notes", id);
  await updateDoc(ref, data);
}

// Delete a note
export async function deleteNoteFirestore(id) {
  const ref = doc(db, "notes", id);
  await deleteDoc(ref);
}
