import type {BoardData} from "@/lib/kanban";

type RequestOptions = Omit<RequestInit, "body"> & { body?: object };

const request = async <T>(path: string, options: RequestOptions = {}): Promise<T> => {
    const {body, headers, ...rest} = options;
    const response = await fetch(`/api/${path}`, {
        ...rest,
        headers: {
            "Content-Type": "application/json",
            ...headers,
        },
        body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
        throw new Error(`Request failed: ${response.status}`)
    }

    return response.json() as Promise<T>;
};

export const getBoard = () => request<BoardData>("board");

export const renameColumn = (columnId: string, title: string) => 
    request<BoardData>(
        `/columns/${columnId}`, {
            method: "PUT",
            body: { title },
        }
    );

export const createCard = (columnId: string, title: string, details: string) =>
    request<BoardData>("/cards", {
        method: "POST",
        body: {columnId, title, details},
    });

export const deleteCard = (cardId: string) => 
    request<BoardData>(`/cards/${cardId}`, {
        method: "DELETE",
    })

export const moveCardApi = (
    cardId: string,
    toColumnId: string,
    toPosition: number
) => 
    request<BoardData>(`/cards/${cardId}/move`, {
        method: "POST",
        body: {toColumnId, toPosition},
    });