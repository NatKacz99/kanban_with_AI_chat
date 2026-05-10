import React from "react";

type LoginFormProps = {
    username: string;
    password: string;
    error: string;
    onUsernameChange: (value: string) => void;
    onPasswordChange: (value: string) => void;
    onSubmit: (e: React.FormEvent) => void;
    onSwitchToRegister: () => void;
};

export default function LoginForm({
    username,
    password,
    error,
    onUsernameChange,
    onPasswordChange,
    onSubmit,
    onSwitchToRegister
} : LoginFormProps) {
    return (
        <main>
            <form className="auth-card" onSubmit={onSubmit}>
                <h1 className="auth-title">Sign in</h1>
                <p className="auth-subtitle">Sign in to access your board.</p>

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
                    <button className="auth-secondary" type="button" onClick={onSwitchToRegister}>Create account</button>
                    <button className="auth-button" type="submit">Sign in</button>
                </div>
            </form>
        </main>
    )
}