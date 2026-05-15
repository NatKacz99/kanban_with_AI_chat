import type { VercelRequest, VercelResponse } from "@vercel/node";
import { verifyToken } from "../_lib/auth";
import { getBoardIdForUser, buildBoard } from "../_lib/board";
import { pool } from "../_lib/db";

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== "PUT" && req.method !== "DELETE") return res.status(405).end();

    const auth = req.headers.authorization || "";
    if (!auth.startsWith("Bearer ")) {
        return res.status(401).json({detail: "Missing token"});
    }

    try {
        const token = auth.replace("Bearer ", "");
        const payload = await verifyToken(token);
        const userId = payload.sub as string;

        const columnId = req.query.id as string;
        if (!columnId) {
            return res.status(400).json({detail: "Missing column id"});
        }

        const boardId = await getBoardIdForUser(userId);
        if (!boardId) {
            return res.status(404).json({detail: "Board not found"});
        }

        if (req.method === "PUT") {
            const {title} = req.body || {};
            if (!title) {
                return res.status(400).json({detail: "Missing title"});
            }

            const result = await pool.query(
                "UPDATE columns SET title = $1 WHERE id = $2 AND board_id = $3",
                [title, columnId, boardId]
            );
            if (result.rowCount === 0) {
                return res.status(404).json({detail: "Column not found"});
            }
        }

        if (req.method === "DELETE") {
            await pool.query(
                "DELETE FROM cards WHERE column_id = $1 AND column_id IN (SELECT id FROM columns WHERE board_id = $2)",
                [columnId, boardId]
            );

            const result = await pool.query(
                "DELETE FROM columns WHERE id = $1 AND board_id = $2",
                [columnId, boardId]
            );
            if (result.rowCount === 0) {
                return res.status(404).json({detail: "Column not found"});
            }
        }

        const board = await buildBoard(boardId);
        return res.status(200).json(board);
    } catch {
        return res.status(401).json({detail: "Invalid token"});
    }
}
