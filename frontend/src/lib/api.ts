import type {BoardData} from "@/lib/kanban";

type RequestOptions = Omit<RequestInit, "body"> & { body?: object };

const request = async <T>(path: string, options: RequestOptions = {}): Promise<T> => {
    const {body, headers, ...rest} = options;
    const token = typeof window === "undefined" ? null : localStorage.getItem("token");
    const response = await fetch(`/api/${path}`, {
        ...rest,
        headers: {
            "Content-Type": "application/json",
            ...headers,
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
        throw new Error(`Request failed: ${response.status}`)
    }

    return response.json() as Promise<T>;
};

export const login = (username: string, password: string) =>
    request<{access_token: string}>("auth/login", {
        method: "POST",
        body: {username, password}
    })

export const register = (username: string, password: string) => 
    request("auth/register", {
        method: "POST",
        body: {username, password}
    })

export const getBoard = () => request<BoardData>("board");

export const renameColumn = (columnId: string, title: string) => 
    request<BoardData>(
        `columns/${columnId}`, {
            method: "PUT",
            body: { title },
        }
    );

export const createCard = (columnId: string, title: string, details: string) =>
    request<BoardData>("cards", {
        method: "POST",
        body: {columnId, title, details},
    });

export const deleteCard = (cardId: string) => 
    request<BoardData>(`cards/${cardId}`, {
        method: "DELETE",
    })

export const moveCardApi = (
    cardId: string,
    toColumnId: string,
    toPosition: number
) => 
    request<BoardData>(`cards/${cardId}`, {
        method: "POST",
        body: {toColumnId, toPosition},
    });

export type ChatMessage = {role: string; content: string};
export type AIChatResponse = {reply: string; board: BoardData | null};

export const sendAIChat = (message: string, history: ChatMessage[]) => 
    request<AIChatResponse>("ai/chat", {
        method: "POST",
        body: {message, history}
    });

export const replaceBoard = (board: BoardData) =>
    request<BoardData>("board/replace", {
        method: "POST",
        body: board
    });

