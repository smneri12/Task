// src/services/projects.js
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

const COLLECTION = "projects";

// Get all projects for logged-in user
export async function fetchProjects() {
  const user = auth.currentUser;
  if (!user) return [];

  const q = query(
    collection(db, COLLECTION),
    where("uid", "==", user.uid)
    // ❌ no orderBy here so we don't require a Firestore index
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data(),
  }));
}

// Create a new project
export async function createProject(data) {
  const user = auth.currentUser;
  if (!user) throw new Error("Not logged in");

  const now = Date.now();

  const docRef = await addDoc(collection(db, COLLECTION), {
    uid: user.uid,
    name: data.name || "Untitled project",
    category: data.category || "Personal",   // School | Work | Personal
    status: data.status || "Planning",       // Planning | In Progress | On Hold | Done
    dueDate: data.dueDate || null,           // store as timestamp (ms) or null
    description: data.description || "",
    pinned: data.pinned || false,
    archived: data.archived || false,
    createdAt: now,
    updatedAt: now,
  });

  return docRef;
}

// Update a project
export async function updateProject(id, data) {
  const ref = doc(db, COLLECTION, id);
  await updateDoc(ref, {
    ...data,
    updatedAt: Date.now(),
  });
}

// Delete a project
export async function deleteProject(id) {
  const ref = doc(db, COLLECTION, id);
  await deleteDoc(ref);
}
