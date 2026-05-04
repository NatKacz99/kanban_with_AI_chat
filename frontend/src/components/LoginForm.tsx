import React from "react";

type LoginFormProps = {
    username: string;
    password: string;
    error: string;
    onUsernameChange: (value: string) => void;
    onPasswordChange: (value: string) => void;
    onSubmit: (e: React.FormEvent) => void;
};

export default function LoginForm({
    username,
    password,
    error,
    onUsernameChange,
    onPasswordChange,
    onSubmit
} : LoginFormProps) {
    return (
        <form onSubmit={onSubmit}>
            <h1>Sign in</h1>

            <label>
                Username
                <input
                    type="text"
                    value={username}
                    onChange={(e) => onUsernameChange(e.target.value)}
                />
            </label>

            <label>
                Password
                <input
                    type="password"
                    value={password}
                    onChange={(e) => onPasswordChange(e.target.value)}
                />
            </label>

            {error && <p>{error}</p>}

            <button type="submit">Sign in</button>
        </form>
    )
}