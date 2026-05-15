'use client';

import LoginForm from "@/components/LoginForm";
import RegisterForm from "@/components/RegisterForm";
import { KanbanBoard } from "@/components/KanbanBoard";
import { login, register } from "@/lib/api";
import { useEffect, useState } from "react";

export default function Home() {
    const [isAuthenticated, setIsAuthenticated] = useState(() => {
      if (typeof window === "undefined") return false;
      return Boolean(localStorage.getItem("token"));
    });
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [mode, setMode] = useState<"login" | "register">("login");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { access_token } = await login(username, password);
      localStorage.setItem("token", access_token);
      setIsAuthenticated(true);
      setError("");
    } catch {
      setError("Invalid credentials");
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem("token");
    setUsername("");
    setPassword("");
    setError("");
    setMode("login");
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.trim().length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    try {
      await register(username, password);
      setError("");
      setMode("login");
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      if (message.includes("409")) {
        setError("Username already exists. Choose a different username.");
      } else {
        setError("Unable to create account");
      }
    }
  };

  if (!isAuthenticated) {
    return mode === "login" ? (
      <LoginForm
        username={username}
        password={password}
        error={error}
        onUsernameChange={setUsername}
        onPasswordChange={setPassword}
        onSubmit={handleLogin}
        onSwitchToRegister={() => {
          setError("");
          setMode("register");
        }}
      />
    ) : (
      <RegisterForm
        username={username}
        password={password}
        error={error}
        onUsernameChange={setUsername}
        onPasswordChange={setPassword}
        onSubmit={handleRegister}
        onSwitchToLogin={() => {
          setError("");
          setMode("login");
        }}
      />
    );
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
