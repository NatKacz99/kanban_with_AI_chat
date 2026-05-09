import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { KanbanBoard } from "@/components/KanbanBoard";
import { initialData, type BoardData } from "@/lib/kanban";
import {
  createCard,
  deleteCard,
  getBoard,
  moveCardApi,
  renameColumn,
} from "@/lib/api";

vi.mock("@/lib/api", () => ({
  getBoard: vi.fn(),
  renameColumn: vi.fn(),
  createCard: vi.fn(),
  deleteCard: vi.fn(),
  moveCardApi: vi.fn(),
}));

const cloneBoard = (data: BoardData) => structuredClone(data);

const getFirstColumn = async () => (await screen.findAllByTestId(/column-/i))[0];

describe("KanbanBoard", () => {
  it("renders five columns", async () => {
    vi.mocked(getBoard).mockResolvedValue(cloneBoard(initialData));
    render (<KanbanBoard />);
    expect(await screen.findAllByTestId(/column-/i)).toHaveLength(5);
  });

  it("renames a column", async () => {
    const base = cloneBoard(initialData);
    const updated = cloneBoard(initialData);
    updated.columns[0].title = "New Name";

    vi.mocked(getBoard).mockResolvedValue(base);
    vi.mocked(renameColumn).mockResolvedValue(updated);

    render(<KanbanBoard />);
    const column = await getFirstColumn();
    const input = within(column).getByLabelText("Column title");
    await userEvent.clear(input);
    await userEvent.type(input, "New Name");
    expect(await screen.findByDisplayValue("New Name")).toBeInTheDocument();
  });

  it("adds and removes a card", async () => {
    const base = cloneBoard(initialData);
    const added = cloneBoard(initialData);
    const removed = cloneBoard(initialData);

    const newCardId = "card-new";
    added.cards[newCardId] = {
      id: newCardId,
      title: "New card",
      details: "New details",
    };
    added.columns[0].cardIds.push(newCardId);
    delete removed.cards[newCardId as keyof typeof removed.cards];
    removed.columns[0].cardIds = removed.columns[0].cardIds.filter(
      (id) => id !== newCardId
    );

    vi.mocked(getBoard).mockResolvedValue(base);
    vi.mocked(createCard).mockResolvedValue(added);
    vi.mocked(deleteCard).mockResolvedValue(removed);
    vi.mocked(moveCardApi).mockResolvedValue(base);

    render(<KanbanBoard />);
    const column = await getFirstColumn();
    const addButton = within(column).getByRole("button", {
      name: /add a card/i,
    });
    await userEvent.click(addButton);

    const titleInput = within(column).getByPlaceholderText(/card title/i);
    await userEvent.type(titleInput, "New card");
    const detailsInput = within(column).getByPlaceholderText(/details/i);
    await userEvent.type(detailsInput, "Notes");

    await userEvent.click(
      within(column).getByRole("button", { name: /add card/i })
    );

    expect(await screen.findByText("New card")).toBeInTheDocument();

    const deleteButton = within(column).getByRole("button", {
      name: /delete new card/i,
    });
    await userEvent.click(deleteButton);

    expect(screen.queryByText("New card")).not.toBeInTheDocument();
  });
});
