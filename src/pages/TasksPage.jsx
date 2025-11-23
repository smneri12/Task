// src/pages/TasksPage.jsx
import React, { useState, useEffect } from "react";
import TaskList from "../components/TaskList"; 
import TaskDetail from "../components/TaskDetail";
import { fetchTasks, updateTask, deleteTask, addTask } from "../services/taskService"; 
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faCog } from "@fortawesome/free-solid-svg-icons";

export default function TasksPage({ user }) { 
  const [tasks, setTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load Tasks on Mount (Real-time listener)
  useEffect(() => {
    if (!user || !user.uid) {
        setLoading(false);
        return;
    }
    
    setLoading(true);
    // Pass the user's UID for fetching tasks
    const unsubscribe = fetchTasks(user.uid, (fetchedTasks) => {
      setTasks(fetchedTasks);
      setLoading(false);
      
      // Select the first task if none is selected, or handle cleanup
      if (!selectedTask && fetchedTasks.length > 0) {
          setSelectedTask(fetchedTasks[0]);
      } else if (selectedTask && !fetchedTasks.find(t => t.id === selectedTask.id)) {
          // If the selected task was just deleted, unselect it
          setSelectedTask(null);
      }
    });
    return () => unsubscribe(); // Cleanup the real-time listener
  }, [user]); 

  // Handler for saving/updating tasks (FIXED ASYNC CREATION)
  const handleTaskSave = async (id, updatedFields) => {
    if (!user || !user.uid) return;
    
    try {
        if (id === 'new') {
            // 🛑 CRITICAL FIX: Use await to ensure the task is saved to Firestore
            // before resetting the UI. This guarantees persistence.
            await addTask(updatedFields, user.uid); 
            
        } else {
            // Updating an existing task
            await updateTask(id, updatedFields);
        }
        
        // Only close the editor *after* the server operation is confirmed
        setSelectedTask(null); 
        
    } catch (error) {
        console.error("Task Save Failed! Check Firestore security rules or database connection:", error);
        alert(`ERROR: Failed to save task. See console for details: ${error.message}`);
    }
  };
  
  // Handler for deleting a task
  const handleTaskDelete = async (id) => {
      try {
          await deleteTask(id);
          setSelectedTask(null);
      } catch (error) {
          console.error("Task Delete Failed:", error);
      }
  };
  
  // Handlers for UI interaction
  const handleCancel = () => setSelectedTask(null);
  const handleNewTask = () => setSelectedTask({ id: 'new', title: '', description: '', dueDate: new Date().toISOString().slice(0, 10), tags: [], done: false });
  const handleTaskSelect = (task) => setSelectedTask(task);
  
  // --- Rendering Logic ---

  if (loading) {
    return (
      <div className="notes-main" style={{ textAlign: 'center', paddingTop: '100px' }}>
        <h1 style={{ color: '#264b5d' }}>Loading Tasks...</h1>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', gap: '40px', width: '100%' }}>
      
      {/* 1. Task List Column */}
      <div style={{ flex: 2 }}>
        <div className="notes-header" style={{ marginBottom: '20px' }}>
          <h1>Tasks</h1>
          <span className="icon-btn"><FontAwesomeIcon icon={faCog} /></span>
        </div>

        <button className="new-doc" onClick={handleNewTask} style={{ marginBottom: '20px' }}>
            <FontAwesomeIcon icon={faPlus} /> Add New Task
        </button>
        
        {tasks.length === 0 ? (
            <div className="empty" style={{paddingTop: '30px'}}>
                No tasks found. Click "Add New Task" to begin!
            </div>
        ) : (
            <TaskList 
                tasks={tasks} 
                onTaskSelect={handleTaskSelect} 
                selectedTaskId={selectedTask?.id}
            />
        )}
      </div>
      
      {/* 2. Details Panel Column */}
      {selectedTask && (
        <div style={{ flex: 1, paddingLeft: '40px', borderLeft: '1px solid #e5e7eb', minWidth: '300px' }}>
          <h2 className="header-title">Details</h2>
          <TaskDetail 
            key={selectedTask.id}
            task={selectedTask} 
            onSave={handleTaskSave}
            onDelete={handleTaskDelete}
            onCancel={handleCancel}
            isNew={selectedTask.id === 'new'}
          />
        </div>
      )}
    </div>
  );
}