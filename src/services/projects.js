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
  serverTimestamp // 🟢 Added import
} from "firebase/firestore";

const COLLECTION = "projects";

// Get all projects for logged-in user
export async function fetchProjects() {
  const user = auth.currentUser;
  if (!user) return [];

  const q = query(
    collection(db, COLLECTION),
    where("userId", "==", user.uid) // 🟢 FIX: Changed 'uid' to 'userId'
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

  const docRef = await addDoc(collection(db, COLLECTION), {
    userId: user.uid, // 🟢 FIX: Changed 'uid' to 'userId' to match Security Rules
    name: data.name || "Untitled project",
    category: data.category || "Personal",
    status: data.status || "Planning",
    dueDate: data.dueDate || null,
    description: data.description || "",
    pinned: data.pinned || false,
    archived: data.archived || false,
    createdAt: serverTimestamp(), // 🟢 FIX: Use Server Timestamp
    updatedAt: serverTimestamp(),
  });

  return docRef;
}

// Update a project
export async function updateProject(id, data) {
  const ref = doc(db, COLLECTION, id);
  await updateDoc(ref, {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

// Delete a project
export async function deleteProject(id) {
  const ref = doc(db, COLLECTION, id);
  await deleteDoc(ref);
}