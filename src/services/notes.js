// src/services/notes.js
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
  serverTimestamp,
} from "firebase/firestore";

// 1. FETCH: Get all notes for the logged-in user
export async function fetchNotes() {
  const user = auth.currentUser;
  if (!user) return [];

  try {
    const q = query(collection(db, "notes"), where("userId", "==", user.uid));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("Error fetching notes:", error);
    return [];
  }
}

// 2. CREATE: Add a new note (Real Version)
export async function createNote(note, userId) {
  if (!userId) {
    console.error("User ID missing.");
    return null;
  }

  return await addDoc(collection(db, "notes"), {
    ...note, // This saves the Title, Content, and Formatting
    userId: userId,
    createdAt: serverTimestamp(),
    isFavorite: false, // Keeps the boolean field that fixed the permission error
  });
}

// 3. UPDATE: Save changes to an existing note
export async function updateNoteFirestore(id, data) {
  if (!id) return;
  const ref = doc(db, "notes", id);
  await updateDoc(ref, data);
}

// 4. DELETE: Remove a note
export async function deleteNoteFirestore(id) {
  if (!id) return;
  const ref = doc(db, "notes", id);
  await deleteDoc(ref);
}