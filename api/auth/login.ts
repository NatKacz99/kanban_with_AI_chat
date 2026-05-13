import type { VercelRequest, VercelResponse } from "@vercel/node";
import { pool } from "../_lib/db";
import { verifyPassword, createToken } from "../_lib/auth";

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== "POST") return res.status(405).end();

    try {
        const { username, password } = req.body || {};
        if (!username || !password) {
            return res.status(400).json({ detail: "Missing username or password" });
        }
        if (typeof username !== "string" || typeof password !== "string") {
            return res.status(400).json({ detail: "Invalid payload" });
        }

        const userResponse = await pool.query(
            "SELECT id, username, password_hash FROM users WHERE username = $1",
            [username]
        );
        const user = userResponse.rows[0];
        if (!user) {
            return res.status(401).json({ detail: "Invalid credentials" });
        }

        const passwordVerification = await verifyPassword(password, user.password_hash);
        if (!passwordVerification) {
            return res.status(401).json({ detail: "Invalid credentials" });
        }

        const token = await createToken(user.id, user.username);
        return res.status(200).json({ access_token: token });
    } catch {
        return res.status(500).json({ detail: "Server error" });
    }
}