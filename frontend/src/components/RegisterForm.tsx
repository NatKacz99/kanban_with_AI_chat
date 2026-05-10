import React from "react";

type RegisterFormProps = {
  username: string;
  password: string;
  error: string;
  onUsernameChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onSwitchToLogin: () => void;
};

export default function RegisterForm({
  username,
  password,
  error,
  onUsernameChange,
  onPasswordChange,
  onSubmit,
  onSwitchToLogin,
}: RegisterFormProps) {
  return (
    <main>
      <form className="auth-card" onSubmit={onSubmit}>
        <h1 className="auth-title">Create account</h1>
        <p className="auth-subtitle">Register to create your own board.</p>

        <label className="auth-field">
          Username
          <input
            className="auth-input"
            type="text"
            value={username}
            onChange={(e) => onUsernameChange(e.target.value)}
          />
        </label>

        <label className="auth-field">
          Password
          <input
            className="auth-input"
            type="password"
            value={password}
            onChange={(e) => onPasswordChange(e.target.value)}
          />
        </label>

        {error && <p className="auth-error">{error}</p>}

        <div className="auth-actions">
          <button className="auth-secondary" type="button" onClick={onSwitchToLogin}>
            Sign in
          </button>
          <button className="auth-button" type="submit">Create account</button>
        </div>
      </form>
    </main>
  );
}