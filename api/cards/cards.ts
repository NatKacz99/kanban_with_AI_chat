import type { VercelRequest, VercelResponse } from "@vercel/node";
import { verifyToken } from "../_lib/auth";
import { getBoardIdForUser, buildBoard } from "../_lib/board";
import { pool } from "../_lib/db";

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== "POST") return res.status(405).end();

    const auth = req.headers.authorization || "";
    if (!auth.startsWith("Bearer ")) {
        return res.status(401).json({detail: "Missing token"});
    }

    try {
        const token = auth.replace("Bearer ", "");
        const payload = await verifyToken(token);
        const userId = payload.sub as string;

        const { title, position, details, columnId } = req.body || {};
        if (!title || !columnId) {
            return res.status(400).json({ detail: "Missing title or columnId" });
        }
        if (typeof title !== "string" || typeof columnId !== "string") {
            return res.status(400).json({ detail: "Invalid payload" });
        }

        const boardId = await getBoardIdForUser(userId);
        if(!boardId) {
            return res.status(404).json({detail: "Board not found"});
        }

        const allowed = await pool.query(
            "SELECT 1 FROM columns WHERE id = $1 AND board_id = $2",
            [columnId, boardId]
        );
        if (allowed.rows.length === 0) {
            return res.status(404).json({ detail: "Column not found" });
        }

        let pos = position;
        if (pos === undefined || pos === null) {
            const row = await pool.query(
                "SELECT COALESCE(MAX(position), -1) as p FROM cards WHERE column_id = $1",
                [columnId]
            );
            pos = row.rows[0].p + 1;
        }

        await pool.query(
            "INSERT INTO cards (id, column_id, title, details, position) VALUES (gen_random_uuid(), $1, $2, $3, $4)",
            [columnId, title, details ?? "", pos]
        );

        const board = await buildBoard(boardId);
        return res.status(200).json(board);
    } catch {
        return res.status(401).json({ detail: "Invalid token" });
    }
}