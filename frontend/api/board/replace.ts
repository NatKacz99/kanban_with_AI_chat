import type { VercelRequest, VercelResponse } from "@vercel/node";
import { verifyToken } from "../_lib/auth";
import { getBoardIdForUser, replaceBoard } from "../_lib/board";

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

        const boardId = await getBoardIdForUser(userId);
        if (!boardId) {
            return res.status(404).json({detail: "Board not found"});
        }

        const updated = await replaceBoard(boardId, req.body);
        return res.status(200).json(updated);
    } catch {
        return res.status(401).json({detail: "Invalid token"});
    }
}
