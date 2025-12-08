// src/services/taskService.js (Using Firestore)
import { db } from "../firebase"; // Import your database instance
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  serverTimestamp 
} from "firebase/firestore";

const tasksCollection = collection(db, "tasks");

/**
 * Subscribes to tasks for a specific user (Realtime Listener).
 */
export const fetchTasks = (userId, callback) => {
  if (!userId) {
    callback([]);
    return () => {}; 
  }

  const q = query(
    tasksCollection, 
    where("userId", "==", userId), // CRITICAL: Only fetch user's own tasks
    orderBy("creationDate", "desc")
  );

  const unsubscribe = onSnapshot(q, (snapshot) => {
    const tasks = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
    callback(tasks);
  }, (error) => {
    console.error("Error fetching tasks:", error);
  });
  
  return unsubscribe; 
};

export const addTask = async (newTask, userId) => {
  if (!userId) throw new Error("User ID is required to add task.");

  await addDoc(tasksCollection, {
    ...newTask,
    userId: userId, // CRITICAL: Link the task to the user
    creationDate: serverTimestamp(), 
    done: false,
  });
};

export const updateTask = async (taskId, updatedFields) => {
  const taskDocRef = doc(db, "tasks", taskId);
  await updateDoc(taskDocRef, updatedFields);
};

export const deleteTask = async (taskId) => {
  const taskDocRef = doc(db, "tasks", taskId);
  await deleteDoc(taskDocRef);
};