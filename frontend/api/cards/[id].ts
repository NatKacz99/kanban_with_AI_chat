import type { VercelResponse, VercelRequest } from "@vercel/node";
import { verifyToken } from "../_lib/auth";
import { getBoardIdForUser, buildBoard } from "../_lib/board";
import { pool } from "../_lib/db";

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== "PUT" && req.method !== "DELETE" && req.method !== "POST") {
        return res.status(405).end();
    }

    const auth = req.headers.authorization || "";
    if (!auth.startsWith("Bearer ")) {
        return res.status(401).json({ detail: "Missing token" });
    }

    try {
        const token = auth.replace("Bearer ", "");
        const payload = await verifyToken(token);
        const userId = payload.sub as string;

        const cardId = req.query.id as string;
        if (!cardId) {
            return res.status(400).json({ detail: "Missing card id" });
        }

        const boardId = await getBoardIdForUser(userId);
        if (!boardId) {
            return res.status(404).json({ detail: "Board not found" });
        }

        if (req.method === "POST") {
            const { toColumnId, toPosition } = req.body || {};
            if (!toColumnId) {
                return res.status(400).json({ detail: "Missing toColumnId" });
            }

            const card = await pool.query(
                `SELECT cards.id, cards.column_id
                FROM cards
                JOIN columns ON columns.id = cards.column_id
                WHERE cards.id = $1 AND columns.board_id = $2`,
                [cardId, boardId]
            );

            if (card.rows.length === 0) {
                return res.status(404).json({ detail: "Card not found" });
            }

            const fromColumnId = card.rows[0].column_id;

            const allowed = await pool.query(
                "SELECT 1 FROM columns WHERE id = $1 AND board_id = $2",
                [toColumnId, boardId]
            );
            if (allowed.rows.length === 0) {
                return res.status(404).json({ detail: "Column not found" });
            }

            const fromCards = await pool.query(
                "SELECT id FROM cards WHERE column_id = $1 ORDER BY position",
                [fromColumnId]
            );
            const toCards = await pool.query(
                "SELECT id FROM cards WHERE column_id = $1 ORDER BY position",
                [toColumnId]
            );

            const fromIds = fromCards.rows
                .map((row: { id: string }) => row.id)
                .filter((id: string) => id !== cardId);
            const toIds = toCards.rows.map((row: { id: string }) => row.id);

            if (toPosition === undefined || toPosition < 0 || toPosition > toIds.length) {
                toIds.push(cardId);
            } else {
                toIds.splice(toPosition, 0, cardId);
            }

            await pool.query(
                "UPDATE cards SET column_id = $1 WHERE id = $2",
                [toColumnId, cardId]
            );

            for (let i = 0; i < fromIds.length; i++) {
                await pool.query("UPDATE cards SET position = $1 WHERE id = $2", [i, fromIds[i]]);
            }
            for (let i = 0; i < toIds.length; i++) {
                await pool.query("UPDATE cards SET position = $1 WHERE id = $2", [i, toIds[i]]);
            }
        }

        if (req.method === "PUT") {
            const { title, details } = req.body || {};
            if (!title || typeof title !== "string") {
                return res.status(400).json({ detail: "Missing title" });
            }

            const result = await pool.query(
                "UPDATE cards SET title = $1, details = $2, updated_at = NOW() WHERE id = $3 AND column_id IN (SELECT id FROM columns WHERE board_id = $4)",
                [title, details ?? "", cardId, boardId]
            );
            if (result.rowCount === 0) {
                return res.status(404).json({ detail: "Card not found" });
            }
        }

        if (req.method === "DELETE") {
            const result = await pool.query(
                "DELETE FROM cards WHERE id = $1 AND column_id IN (SELECT id FROM columns WHERE board_id = $2)",
                [cardId, boardId]
            );

            if (result.rowCount === 0) {
                return res.status(404).json({ detail: "Card not found" });
            }
        }

        const board = await buildBoard(boardId);
        return res.status(200).json(board);
    } catch {
        return res.status(401).json({ detail: "Invalid token" });
    }
}
