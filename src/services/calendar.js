// src/services/calendar.js
import { db, auth } from "../firebase";
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";

const COLLECTION = "events";

// Fetch events for the logged-in user
export async function fetchEvents() {
  const user = auth.currentUser;
  if (!user) return [];

  const q = query(
    collection(db, COLLECTION),
    where("userId", "==", user.uid)
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((docSnap) => {
    const data = docSnap.data();
    // Convert Firestore Timestamps back to JS Dates/Strings for FullCalendar
    return {
      id: docSnap.id,
      ...data,
      start: data.start?.toDate ? data.start.toDate() : data.start,
      end: data.end?.toDate ? data.end.toDate() : data.end,
    };
  });
}

// Create a new event (generic helper used by CalendarPage)
export async function createEvent(eventData) {
  const user = auth.currentUser;
  if (!user) throw new Error("Not logged in");

  return await addDoc(collection(db, COLLECTION), {
    userId: user.uid,
    title: eventData.title,
    start: eventData.start, // JS Date object
    end: eventData.end,     // JS Date object
    color: eventData.color || "#3788d8",
    location: eventData.location || "",
    notes: eventData.notes || "",
    createdAt: serverTimestamp(),
  });
}

/**
 * Create or update a single all-day calendar event
 * representing a project's due date.
 */
export async function upsertProjectEvent(project) {
  const user = auth.currentUser;
  if (!user || !project || !project.dueDate) return;

  // Handle both Firestore Timestamp and number (ms)
  const due = project.dueDate?.toDate
    ? project.dueDate.toDate()
    : new Date(project.dueDate);

  // Look for an existing event for this project
  const q = query(
    collection(db, COLLECTION),
    where("userId", "==", user.uid),
    where("projectId", "==", project.id)
  );
  const snap = await getDocs(q);

  if (snap.empty) {
    // No event yet → create one
    await addDoc(collection(db, COLLECTION), {
      userId: user.uid,
      projectId: project.id,
      title: project.name || "Project due",
      start: due,
      end: due,
      allDay: true,
      color: "#c7d2fe",
      location: "",
      notes: project.description || "",
      createdAt: serverTimestamp(),
    });
  } else {
    // Update the first matching event (should be only one)
    const docSnap = snap.docs[0];
    const ref = doc(db, COLLECTION, docSnap.id);
    await updateDoc(ref, {
      title: project.name || "Project due",
      start: due,
      end: due,
      allDay: true,
      projectId: project.id,
      notes: project.description || "",
    });
  }
}

/**
 * Delete all calendar events linked to a project.
 */
export async function deleteProjectEvents(projectId) {
  const user = auth.currentUser;
  if (!user || !projectId) return;

  const q = query(
    collection(db, COLLECTION),
    where("userId", "==", user.uid),
    where("projectId", "==", projectId)
  );

  const snap = await getDocs(q);
  const deletes = snap.docs.map((docSnap) =>
    deleteDoc(doc(db, COLLECTION, docSnap.id))
  );
  await Promise.all(deletes);
}
