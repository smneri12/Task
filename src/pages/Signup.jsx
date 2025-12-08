// src/pages/SignupPage.jsx
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth, db } from "../firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";


const SignupPage = () => {
  const [fullName, setFullName] = useState("");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm]   = useState("");

  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!fullName.trim()) {
      setError("Please enter your full name.");
      return;
    }

    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      // 1. Create user in Firebase Auth
      const cred = await createUserWithEmailAndPassword(auth, email, password);

      // 2. Save full name on the Firebase user profile
      await updateProfile(cred.user, { displayName: fullName });

      // 3. Redirect – App's onAuthStateChanged will also set `user`
      navigate("/notes");
    } catch (err) {
      console.error(err);
      // Clean up Firebase error message a bit
      const msg = (err.message || "")
        .replace("Firebase:", "")
        .replace(/\(auth\/.*\)\.?/, "")
        .trim();
      setError(msg || "Failed to create account.");
    } finally {
      setLoading(false);
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
          <Link to="/signup" className="active">
            SIGN UP
          </Link>
        </nav>
      </header>

      <main className="auth-main">
        <section className="auth-card">
          <h1 className="auth-title">Sign up</h1>

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="auth-field">
              <input
                type="text"
                placeholder="Full Name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>

            <div className="auth-field">
              <input
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="auth-field-row">
              <div className="auth-field half">
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <div className="auth-field half">
                <input
                  type="password"
                  placeholder="Confirm Password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                />
              </div>
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
              {loading ? "Creating..." : "Create Account"}
            </button>

            <p className="auth-switch">
              or <Link to="/login">Log in</Link>
            </p>
          </form>
        </section>
      </main>
    </div>
  );
};

export default SignupPage;
