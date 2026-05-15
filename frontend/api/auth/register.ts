import type { VercelRequest, VercelResponse } from "@vercel/node";
import { pool } from "../_lib/db";
import { hashPassword } from "../_lib/auth";

const DEFAULT_COLUMNS = ["Backlog", "Discovery", "In Progress", "Review", "Done"];

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
        if (password.length < 8) {
            return res.status(400).json({ detail: "Password must be at least 8 characters" });
        }

        const existing = await pool.query("SELECT id FROM users WHERE username = $1", [username]);
        if (existing.rows.length > 0) {
            return res.status(409).json({ detail: "Username taken" });
        }

        const passwordHash = await hashPassword(password);

        const userResponse = await pool.query(
            "INSERT INTO users (id, username, password_hash) VALUES (gen_random_uuid(), $1, $2) RETURNING id",
            [username, passwordHash]
        );
        const userId = userResponse.rows[0].id;

        const boardResponse = await pool.query(
            "INSERT INTO boards (id, user_id, name) VALUES (gen_random_uuid(), $1, $2) RETURNING id",
            [userId, "Main Board"]
        );
        const boardId = boardResponse.rows[0].id;

        for (let i = 0; i < DEFAULT_COLUMNS.length; i++) {
            await pool.query(
                "INSERT INTO columns (id, board_id, title, position) VALUES (gen_random_uuid(), $1, $2, $3)",
                [boardId, DEFAULT_COLUMNS[i], i]
            );
        }

        return res.status(201).json({ ok: true });
    } catch {
        return res.status(500).json({ detail: "Server error" });
    }
}
