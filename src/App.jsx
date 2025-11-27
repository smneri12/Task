// src/App.jsx
import React, { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase";

import LoginPage from "./pages/LoginPage";
import NotesPage from "./pages/NotesPage";
import TasksPage from "./pages/TasksPage"; 
import MainLayout from "./components/MainLayout"; 

export default function App() {
  const [user, setUser] = useState(undefined); 

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u || null);
    });
    return unsubscribe; 
  }, []);

  if (user === undefined) { 
    return (
      <div style={{textAlign:"center", paddingTop:"30vh", fontSize:20}}>
        Loading...
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Login Route */}
        <Route path="/login" element={user ? <Navigate to="/notes" /> : <LoginPage />} />

        {/* Protected Routes Group: Passes user object to the layout */}
        <Route element={user ? <MainLayout user={user} /> : <Navigate to="/login" />}>
            
            {/* Renders the production pages */}
            {/* 🟢 Ensures the user prop is passed to NotesPage */}
            <Route path="/notes" element={<NotesPage user={user} />} /> 
            <Route path="/tasks" element={<TasksPage user={user} />} />

        </Route>

        {/* Default redirect */}
        <Route path="*" element={<Navigate to={user ? "/notes" : "/login"} />} />
      </Routes>
    </BrowserRouter>
  );
}