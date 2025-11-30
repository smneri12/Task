// src/pages/LoginPage.jsx
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  signInWithEmailAndPassword,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  sendPasswordResetEmail,
} from "firebase/auth";
import { auth } from "../firebase"; // adjust if your firebase file is somewhere else

const LoginPage = () => {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);

  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      setLoading(true);

      // choose persistence based on "Remember Me"
      await setPersistence(
        auth,
        remember ? browserLocalPersistence : browserSessionPersistence
      );

      // log in with Firebase
      await signInWithEmailAndPassword(auth, email, password);

      // App.jsx onAuthStateChanged will set `user`,
      // and your route logic will redirect /login -> /notes,
      // but we can also navigate manually:
      navigate("/notes");
    } catch (err) {
      console.error(err);
      const msg = (err.message || "")
        .replace("Firebase:", "")
        .replace(/\(auth\/.*\)\.?/, "")
        .trim();
      setError(msg || "Failed to log in.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    setError("");
    if (!email.trim()) {
      setError("Enter your email first to reset password.");
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setError("Password reset email sent.");
    } catch (err) {
      console.error(err);
      const msg = (err.message || "")
        .replace("Firebase:", "")
        .replace(/\(auth\/.*\)\.?/, "")
        .trim();
      setError(msg || "Failed to send reset email.");
    }
  };

  return (
    <div className="auth-page">
      <header className="auth-header">
        <div className="auth-logo">NoteIS</div>

        <nav className="auth-nav">
          <Link to="/">HOME</Link>
          <a href="#about">ABOUT US</a>
          <a href="#contact">CONTACT</a>
          <Link to="/login" className="active">
            LOG IN
          </Link>
        </nav>
      </header>

      <main className="auth-main">
        <section className="auth-card">
          <h1 className="auth-title">Log in</h1>

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="auth-field">
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="auth-field">
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="auth-row">
              <label className="auth-remember">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                />
                <span>Remember Me</span>
              </label>

              <button
                type="button"
                className="auth-text-button"
                onClick={handleForgotPassword}
              >
                Forgot Password?
              </button>
            </div>

            {error && (
              <p className="auth-error" style={{ marginTop: 4 }}>
                {error}
              </p>
            )}

            <button
              type="submit"
              className="auth-primary-btn"
              disabled={loading}
            >
              {loading ? "Logging in..." : "Log in"}
            </button>

            <p className="auth-switch">
              or <Link to="/signup">Sign up</Link>
            </p>
          </form>
        </section>
      </main>
    </div>
  );
};

export default LoginPage;
