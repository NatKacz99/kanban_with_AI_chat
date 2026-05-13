import type {VercelRequest, VercelResponse} from "@vercel/node";
import {verifyToken} from "../_lib/auth";
import {getBoardIdForUser, buildBoard} from "../_lib/board";
import AI_RESPONSE_SCHEMA from "../_lib/ai_schema";

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY!;
const MODEL = "openai/gpt-oss-120b:free";

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
        if (!boardId) return res.status(404).json({detail: "Board not found"});

        const board = await buildBoard(boardId);
        const {message, history} = req.body || {};
        if (!message) return res.status(400).json({detail: "Missing message"});

        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${OPENROUTER_API_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: MODEL,
                messages: [
                    {
                        role: "system",
                        content:
                            "Return JSON that matches the provided schema. Set board to null if no changes are needed."
                    },
                    {
                        role: "user",
                        content: `Board state:\n${JSON.stringify(board)}\n\nHistory:\n${JSON.stringify(
                            history || []
                        )}\n\nUser request:\n${message}`,
                    }
                ],
                response_format: {
                    type: "json_schema",
                    json_schema: {
                        name: "kanban_reply",
                        schema: AI_RESPONSE_SCHEMA,
                        strict: true
                    }
                },
            }),
        });

        if (!response.ok) {
            return res.status(500).json({detail: "AI request failed"});
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;
        if (!content) {
            return res.status(500).json({ detail: "Empty AI response" });
        }
        const parsed = typeof content === "string" ? JSON.parse(content) : content;
        
        return res.status(200).json(parsed);
  } catch {
    return res.status(401).json({ detail: "Invalid token" });
  }
}