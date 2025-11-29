// src/App.jsx
import React, { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase";

import LoginPage from "./pages/LoginPage";
import NotesPage from "./pages/NotesPage";
import TasksPage from "./pages/TasksPage";
import CalendarPage from "./pages/CalendarPage";
import MainLayout from "./components/MainLayout";
import ProjectsPage from "./pages/Projects";

export default function App() {
  const [user, setUser] = useState(undefined); // undefined = checking, null = logged out

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u || null);
    });
    return unsubscribe;
  }, []);

  if (user === undefined) {
    return (
      <div style={{ textAlign: "center", paddingTop: "30vh", fontSize: 20 }}>
        Loading...
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/notes" /> : <LoginPage />} />

        <Route element={user ? <MainLayout user={user} /> : <Navigate to="/login" />}>
          <Route path="/notes" element={<NotesPage user={user} />} />
          <Route path="/tasks" element={<TasksPage user={user} />} />
          <Route path="/calendar" element={<CalendarPage user={user} />} />
          <Route path="/projects" element={<ProjectsPage user={user} />} />
        </Route>

        <Route path="*" element={<Navigate to={user ? "/notes" : "/login"} />} />
      </Routes>
    </BrowserRouter>
  );
}
