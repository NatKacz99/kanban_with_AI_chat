import {pool} from "./db.js";

export type BoardData = {
    columns: {id: string; title: string; cardIds: string[]}[];
    cards: Record<string, {id: string; title: string, details: string}>
};

const DEFAULT_COLUMNS = ["Backlog", "Discovery", "In Progress", "Review", "Done"];


export const getBoardIdForUser = async (userId: string) => {
    const res = await pool.query("SELECT id FROM boards WHERE user_id = $1", [userId]);
    return res.rows[0]?.id as string | undefined;
};

export const seedDefaultColumns = async (boardId: string) => {
    for (let i = 0; i < DEFAULT_COLUMNS.length; i++) {
        await pool.query(
            "INSERT INTO columns (id, board_id, title, position) VALUES (gen_random_uuid(), $1, $2, $3)",
            [boardId, DEFAULT_COLUMNS[i], i]
        );
    }
};

export const buildBoard = async (boardId: string): Promise<BoardData> => {
    const columnsResponse = await pool.query(
        "SELECT id, title FROM columns WHERE board_id = $1 ORDER BY position",
        [boardId]
    );
    const cardsResponse = await pool.query(
        `SELECT cards.id, cards.title, cards.details, cards.column_id
        FROM cards
        JOIN columns ON columns.id = cards.column_id
        WHERE columns.board_id = $1
        ORDER BY cards.position`,
        [boardId]
    );

    const cards: BoardData["cards"] = {};
    const cardsByColumn: Record<string, string[]> = {};

    for (const card of cardsResponse.rows) {
        cards[card.id] = {id: card.id, title: card.title, details: card.details ?? ""};
        if (!cardsByColumn[card.column_id]) cardsByColumn[card.column_id] = [];
        cardsByColumn[card.column_id].push(card.id);
    }

    return {
        columns: columnsResponse.rows.map((column: { id: string; title: string }) => ({
            id: column.id,
            title: column.title,
            cardIds: cardsByColumn[column.id] ?? [],
        })),
        cards,
    };
};

export const replaceBoard = async (boardId: string, payload: BoardData) => {
    await pool.query(
        "DELETE FROM cards WHERE column_id IN (SELECT id FROM columns WHERE board_id = $1)",
        [boardId]
    );
    await pool.query("DELETE FROM columns WHERE board_id = $1", [boardId]);

    for (let i = 0; i < payload.columns.length; i++) {
        const column = payload.columns[i];
        await pool.query(
            "INSERT INTO columns (id, board_id, title, position) VALUES ($1, $2, $3, $4)",
            [column.id, boardId, column.title, i]
        );
    }

    for (const column of payload.columns) {
        for (let i = 0; i < column.cardIds.length; i++) {
            const cardId = column.cardIds[i];
            const card = payload.cards[cardId];
            if (!card) throw new Error(`Missing card data for ${cardId}`);
            await pool.query(
                "INSERT into cards (id, column_id, title, details, position) VALUES ($1, $2, $3, $4, $5)",
                [card.id, column.id, card.title, card.details ?? "", i]
            );
        }
    }

    return buildBoard(boardId);
};
