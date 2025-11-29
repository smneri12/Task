// src/services/calendar.js
import { db, auth } from "../firebase";
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  serverTimestamp
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
  return snapshot.docs.map((doc) => {
    const data = doc.data();
    // Convert Firestore Timestamps back to JS Dates/Strings for FullCalendar
    return {
      id: doc.id,
      ...data,
      start: data.start?.toDate ? data.start.toDate() : data.start,
      end: data.end?.toDate ? data.end.toDate() : data.end,
    };
  });
}

// Create a new event (or a batch of recurring events)
export async function createEvent(eventData) {
  const user = auth.currentUser;
  if (!user) throw new Error("Not logged in");

  // If you are creating multiple events at once (recurring), handle them in a loop
  // For simplicity, this function handles one event object at a time.
  // You can call this in a loop from the UI for recurring events.
  
  return await addDoc(collection(db, COLLECTION), {
    userId: user.uid,
    title: eventData.title,
    start: eventData.start, // Pass JS Date object
    end: eventData.end,     // Pass JS Date object
    color: eventData.color || "#3788d8",
    location: eventData.location || "",
    notes: eventData.notes || "",
    createdAt: serverTimestamp(),
  });
}