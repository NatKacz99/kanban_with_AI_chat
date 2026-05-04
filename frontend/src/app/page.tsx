'use client';

import LoginForm from "@/components/LoginForm";
import { KanbanBoard } from "@/components/KanbanBoard";
import { useState } from "react";

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
     if (typeof window === "undefined") return false;
     return localStorage.getItem("auth") === "true";
  });
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === "user" && password === "password") {
      setIsAuthenticated(true);
      localStorage.setItem("auth", "true");
      setError("");
    } else {
      setError("Invalid credentials");
    }
  }

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem("auth");
    setUsername("");
    setPassword("");
    setError("");
  }

  if (!isAuthenticated) {
    return (
      <LoginForm
        username={username}
        password={password}
        error={error}
        onUsernameChange={setUsername}
        onPasswordChange={setPassword}
        onSubmit={handleLogin}
      />
    )
  }
  return (
    <main>
      <div style={{ width: "100%" }}>
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
          <button className="auth-button" type="button" onClick={handleLogout}>
            Logout
          </button>
        </div>
        <KanbanBoard />
      </div>
    </main>
  );
}
